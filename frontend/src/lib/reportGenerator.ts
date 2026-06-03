import {
  ChartResponse,
  MatchResponse,
  ChartRequest,
  DashaResponse,
  MatchRequest,
} from "@/types/chart";
import { calculateVargaBulk, calculateDasha, calculateVarga } from "@/services/api";
import { toMoonChart } from "@/lib/chartTransforms";
import { vargaChartLabel } from "@/lib/vargaMeta";
import { vargaRequestForPerson } from "@/lib/matchVargaRequest";
import { matchRequestFromResult, loadStoredMatchRequest } from "@/lib/editPrefill";

// ── Chart SVG builder (pure, no React) ───────────────────────────────────────
const R_SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const R_SIGN_TO_NUM: Record<string,number> = Object.fromEntries(R_SIGN_NAMES.map((s,i) => [s,i+1]));
const R_PLANET_SHORT: Record<string,string> = {
  Sun:"Sun",Moon:"Mon",Mars:"Mar",Mercury:"Mer",Jupiter:"Jup",
  Venus:"Ven",Saturn:"Sat","North Node":"Rah","South Node":"Ket",
};
const R_SWAKSHETRA: Record<string,string[]> = {
  Sun:["Leo"],Moon:["Cancer"],Mars:["Aries","Scorpio"],Mercury:["Gemini","Virgo"],
  Jupiter:["Sagittarius","Pisces"],Venus:["Taurus","Libra"],Saturn:["Capricorn","Aquarius"],
  "North Node":["Virgo"],"South Node":["Pisces"],
};
const R_UCHCHA: Record<string,string> = {
  Sun:"Aries",Moon:"Taurus",Mars:"Capricorn",Mercury:"Virgo",Jupiter:"Cancer",
  Venus:"Pisces",Saturn:"Libra","North Node":"Gemini","South Node":"Sagittarius",
};
const R_NEECHA: Record<string,string> = {
  Sun:"Libra",Moon:"Scorpio",Mars:"Cancer",Mercury:"Pisces",Jupiter:"Capricorn",
  Venus:"Virgo",Saturn:"Aries","North Node":"Sagittarius","South Node":"Gemini",
};

type RPt = [number, number];

function rGetDignityColor(name: string, sign: string): string {
  if (R_SWAKSHETRA[name]?.includes(sign)) return "#15803d";
  if (R_UCHCHA[name] === sign) return "#1d4ed8";
  if (R_NEECHA[name] === sign) return "#dc2626";
  return "#111827";
}

function rBuildPolygons(W: number, H: number): Record<number, RPt[]> {
  const cx=W/2, cy=H/2, dx=W/16, dy=H/16, d3x=15*W/16, d3y=15*H/16;
  const ix=(dx+cx)/2, iy=(dy+cy)/2, i3x=(d3x+cx)/2, i3y=(d3y+cy)/2;
  return {
    1:[[cx,dy],[i3x,iy],[cx,cy],[ix,iy]],  4:[[dx,cy],[ix,iy],[cx,cy],[ix,i3y]],
    7:[[cx,d3y],[ix,i3y],[cx,cy],[i3x,i3y]],10:[[d3x,cy],[i3x,i3y],[cx,cy],[i3x,iy]],
    2:[[0,0],[cx,0],[cx,dy],[ix,iy]],       3:[[0,0],[ix,iy],[dx,cy],[0,cy]],
    5:[[0,H],[0,cy],[dx,cy],[ix,i3y]],      6:[[0,H],[cx,H],[cx,d3y],[ix,i3y]],
    8:[[cx,H],[W,H],[i3x,i3y],[cx,d3y]],   9:[[W,H],[W,cy],[d3x,cy],[i3x,i3y]],
    11:[[W,0],[W,cy],[d3x,cy],[i3x,iy]],   12:[[cx,0],[W,0],[i3x,iy],[cx,dy]],
  };
}

function rBuildCentroids(W: number, H: number): Record<number, RPt> {
  const polys = rBuildPolygons(W, H);
  const out: Record<number, RPt> = {};
  for (const [k, pts] of Object.entries(polys)) {
    const n = pts.length;
    out[Number(k)] = [pts.reduce((s,p)=>s+p[0],0)/n, pts.reduce((s,p)=>s+p[1],0)/n];
  }
  return out;
}

function rGetInnerVertex(house: number, W: number, H: number): RPt {
  const cx=W/2, cy=H/2, dx=W/16, dy=H/16, d3x=15*W/16, d3y=15*H/16;
  const ix=(dx+cx)/2, iy=(dy+cy)/2, i3x=(d3x+cx)/2, i3y=(d3y+cy)/2;
  const v: Record<number,RPt> = {
    1:[cx,cy],2:[ix,iy],3:[ix,iy],4:[cx,cy],5:[ix,i3y],6:[ix,i3y],
    7:[cx,cy],8:[i3x,i3y],9:[i3x,i3y],10:[cx,cy],11:[i3x,iy],12:[i3x,iy],
  };
  return v[house]??[cx,cy];
}

function buildChartSvgHtml(chart: ChartResponse): string {
  const W = 900, H = 640;
  const h1 = chart.houses.find(h => h.number === 1);
  const lagnaSign = h1 ? (R_SIGN_TO_NUM[h1.sign] ?? 1) : 1;
  const signByHouse: Record<number,number> = {};
  for (const h of chart.houses) { const n = R_SIGN_TO_NUM[h.sign]; if (n) signByHouse[h.number] = n; }

  const houseToSignR = (house: number) => ((lagnaSign - 1 + house - 1) % 12) + 1;
  const signToHouseR = (sign: number) => ((sign - lagnaSign + 12) % 12) + 1;

  interface RPlanet { name:string; label:string; color:string; suffix:string; retrograde:boolean; house:number; degree:number; minutes:number; }

  const planets: RPlanet[] = chart.planets
    .filter(p => !["Uranus","Neptune","Pluto"].includes(p.name))
    .map(p => {
      const signNum = R_SIGN_TO_NUM[p.sign];
      if (!signNum) return null;
      const derivedHouse = Number.isInteger(p.house) ? p.house : signToHouseR(signNum);
      const color = rGetDignityColor(p.name, p.sign);
      const label = R_PLANET_SHORT[p.name] ?? p.name;
      let suffix = "";
      if (R_SWAKSHETRA[p.name]?.includes(p.sign)) suffix = "++";
      else if (R_UCHCHA[p.name] === p.sign) suffix = "+";
      else if (R_NEECHA[p.name] === p.sign) suffix = "↓";
      return { name:p.name, label, color, suffix, retrograde:!!p.retrograde, house:derivedHouse, degree:p.degree, minutes:p.minutes };
    }).filter((p): p is RPlanet => p !== null);

  const planetsByHouse: Record<number, RPlanet[]> = {};
  for (let h = 1; h <= 12; h++) planetsByHouse[h] = [];
  for (const p of planets) planetsByHouse[p.house].push(p);

  const polygons = rBuildPolygons(W, H);
  const centroids = rBuildCentroids(W, H);
  const diamondHouses = new Set([1,4,7,10]);

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="font-family:Arial,sans-serif;width:100%;height:auto;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="#ffffff"/>`;

  // Polygons
  for (let house = 1; house <= 12; house++) {
    const pts = polygons[house];
    const ptStr = pts.map(p => `${p[0]},${p[1]}`).join(" ");
    svg += `<polygon points="${ptStr}" fill="${house===1?"#ede9fe":"#ffffff"}" stroke="#6b7280" stroke-width="1.4"/>`;
  }

  // Text: sign numbers + planet labels
  for (let house = 1; house <= 12; house++) {
    const [x, y] = centroids[house];
    const signNum = signByHouse[house] ?? houseToSignR(house);
    const isLagna = house === 1;
    const housePlanets = planetsByHouse[house];
    const inDiamond = diamondHouses.has(house); void inDiamond;

    const [ivX, ivY] = rGetInnerVertex(house, W, H);
    const numX = ivX + (x - ivX) * 0.22;
    const numY = ivY + (y - ivY) * 0.22;
    svg += `<text x="${numX.toFixed(1)}" y="${numY.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#374151" font-size="16" font-weight="700">${signNum}</text>`;

    if (isLagna) {
      const asc = chart.angles.ascendant;
      svg += `<text x="${x}" y="${y-22}" text-anchor="middle" fill="#6d28d9" font-size="18" font-weight="700">Lag</text>`;
      svg += `<text x="${x}" y="${y-6}" text-anchor="middle" fill="#6d28d9" font-size="12">${asc.degree}°${String(asc.minutes).padStart(2,"0")}′</text>`;
    }

    const lineHeight = 45;
    const nRows = Math.ceil(housePlanets.length / 2);
    const HEADER_H = isLagna ? 46 : 0;
    const blockH = HEADER_H + nRows * lineHeight;
    const MARGIN = 8;
    let blockTop = y - blockH / 2;
    blockTop = Math.max(MARGIN, Math.min(H - blockH - MARGIN, blockTop));
    const avail = (H - MARGIN) - (blockTop + HEADER_H);
    const effLH = nRows > 0 ? Math.min(lineHeight, Math.max(26, avail / nRows)) : lineHeight;
    const planetStartY = blockTop + HEADER_H + Math.floor(effLH * 0.65);

    housePlanets.forEach((p, idx) => {
      const total = housePlanets.length;
      const col = total > 1 ? idx % 2 : 0;
      const row = total > 1 ? Math.floor(idx / 2) : idx;
      const colOff = total === 1 ? 0 : col === 0 ? -40 : 40;
      const px = x + colOff;
      const py = planetStartY + row * effLH;
      const retMark = p.retrograde ? `<tspan fill="#dc2626">-</tspan>` : ``;
      const suffMark = p.suffix ? `<tspan fill="${p.color}">${p.suffix}</tspan>` : ``;
      svg += `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle" fill="${p.color}" font-size="22" font-weight="600">${p.label}${suffMark}${retMark}<tspan x="${px.toFixed(1)}" dy="18" font-size="15" font-weight="400" fill="#374151">${p.degree}°${String(p.minutes).padStart(2,"0")}′</tspan></text>`;
    });
  }

  svg += `<rect width="${W}" height="${H}" fill="none" stroke="#6b7280" stroke-width="2"/>`;
  svg += `</svg>`;
  return svg;
}

function openAndPrint(html: string) {
  const w = window.open("", "_blank", "width=960,height=780");
  if (!w) {
    alert("Please allow popups to download the report.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
}

function sectionHeader(title: string): string {
  return `
    <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;gap:10px;">
      <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">${title}</p>
    </div>`;
}

function chartBlockHtml(label: string, chart: ChartResponse): string {
  return `
    <div style="break-inside:avoid;page-break-inside:avoid;">
      <p style="font-size:10px;font-weight:700;color:#334155;margin-bottom:6px;">${label}</p>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fafafa;">${buildChartSvgHtml(chart)}</div>
    </div>`;
}

function twoColumnChartGridHtml(items: { label: string; chart: ChartResponse }[]): string {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:16px;">
      ${items.map((item) => chartBlockHtml(item.label, item.chart)).join("")}
    </div>`;
}

function boyGirlChartRowHtml(
  subsection: string,
  boyName: string,
  boyChart: ChartResponse,
  girlName: string,
  girlChart: ChartResponse,
): string {
  return `
    <div style="padding:0 16px 16px;">
      <p style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">${subsection}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${chartBlockHtml(boyName, boyChart)}
        ${chartBlockHtml(girlName, girlChart)}
      </div>
    </div>`;
}

function fmtDashaDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function buildDashaTableHtml(dasha: DashaResponse): string {
  const today = new Date().toISOString().slice(0, 10);
  const rows = dasha.periods.map((row, i) => {
    const isActive = row.start_date <= today && today < row.end_date;
    const isPast = row.end_date < today;
    const bg = isActive ? "#fefce8" : i % 2 === 0 ? "#fff" : "#f8fafc";
    const opacity = isPast && !isActive ? "opacity:0.65;" : "";
    return `
      <tr style="background:${bg};${opacity}">
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;font-weight:700;color:#1e1b4b;">${row.md}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;font-weight:600;color:#334155;">${row.ad}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#475569;">${row.pd}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:10px;font-family:monospace;color:#64748b;">${fmtDashaDate(row.start_date)}${isActive ? " ●" : ""}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-size:10px;font-family:monospace;color:#64748b;">${fmtDashaDate(row.end_date)}</td>
      </tr>`;
  }).join("");

  return `
    <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      ${sectionHeader("Vimshottari Dasha")}
      <div style="padding:12px 16px;background:#eef2ff;border-bottom:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#3730a3;font-weight:600;">
          Birth Nakshatra: <strong>${dasha.nakshatra_name}</strong> · Lord: <strong>${dasha.nakshatra_lord}</strong>
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:8px 12px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;">MD</th>
            <th style="padding:8px 12px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;">AD</th>
            <th style="padding:8px 12px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;">PD</th>
            <th style="padding:8px 12px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;">Start</th>
            <th style="padding:8px 12px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;">End</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildSadsatkutHtml(sk: NonNullable<MatchResponse["sadsatkut"]>): string {
  type SkKey = keyof typeof sk;
  const groups: {
    label: string;
    items: { key: SkKey; title: string; desc: string; auspicious: boolean }[];
  }[] = [
    {
      label: "Shadashtak",
      items: [
        { key: "priti_shadashtak", title: "Priti Shadashtak", desc: "mutual love & attraction", auspicious: true },
        { key: "mrityu_shadashtak", title: "Mrityu Shadashtak", desc: "tension & obstacles", auspicious: false },
      ],
    },
    {
      label: "Dvadashatak",
      items: [
        { key: "shubh_dvadashatak", title: "Shubh Dvadashatak", desc: "prosperity & support", auspicious: true },
        { key: "ashubh_dvadashatak", title: "Ashubh Dvadashatak", desc: "financial stress", auspicious: false },
      ],
    },
    {
      label: "Navpancham",
      items: [
        { key: "shubh_navpancham", title: "Shubh Navpancham", desc: "fortune & children", auspicious: true },
        { key: "nashtan_navpancham", title: "Nashtan Navpancham", desc: "misfortune", auspicious: false },
      ],
    },
  ];

  const cards = groups.map(({ label, items }) => {
    const inner = items.map(({ key, title, desc, auspicious }) => {
      const present = sk[key] as boolean;
      const active = present && auspicious;
      const warn = present && !auspicious;
      const bg = active ? "#ecfdf5" : warn ? "#fef2f2" : "#f8fafc";
      const border = active ? "#a7f3d0" : warn ? "#fecaca" : "#e2e8f0";
      const titleCol = active ? "#065f46" : warn ? "#991b1b" : "#94a3b8";
      return `
        <div style="border-radius:10px;padding:12px 14px;background:${bg};border:1px solid ${border};">
          <p style="font-size:12px;font-weight:800;color:${titleCol};margin-bottom:4px;">${title} · ${present ? "Present" : "Absent"}</p>
          <p style="font-size:10px;color:#64748b;">${desc}</p>
        </div>`;
    }).join("");
    return `
      <div style="margin-bottom:14px;">
        <p style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${label}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${inner}</div>
      </div>`;
  }).join("");

  return `
    <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      ${sectionHeader("Sadsatkut Kostkaani")}
      <div style="padding:16px 20px;">
        <p style="font-size:11px;color:#64748b;margin-bottom:14px;">Six-fold sign compatibility groups (Rashi distance: ${sk.distance})</p>
        ${cards}
      </div>
    </div>`;
}

// ── Kundali Report ────────────────────────────────────────────────────────────
export async function downloadKundliReport(chart: ChartResponse, req: ChartRequest) {
  const m = chart.meta;
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const planetRows = chart.planets.map((p, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#fff" : "#f8fafc"};">
      <td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:16px;margin-right:6px;">${p.symbol}</span>
        <strong style="font-size:12px;color:#0f172a;">${p.name}</strong>
      </td>
      <td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#1e1b4b;">${p.sign}</td>
      <td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b;font-family:monospace;">${p.degree}°${String(p.minutes).padStart(2,"0")}'${String(p.seconds).padStart(2,"0")}"</td>
      <td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;">
        <span style="background:#eef2ff;color:#3730a3;font-size:10px;font-weight:700;padding:3px 9px;border-radius:12px;border:1px solid #c7d2fe;">${p.house}</span>
      </td>
      <td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;">
        <span style="background:${p.retrograde ? "#fef2f2" : "#f0fdf4"};color:${p.retrograde ? "#dc2626" : "#16a34a"};font-size:10px;font-weight:700;padding:3px 9px;border-radius:12px;border:1px solid ${p.retrograde ? "#fecaca" : "#bbf7d0"};">${p.retrograde ? "- Retro" : "Direct"}</span>
      </td>
    </tr>
  `).join("");

  const chartSvg = buildChartSvgHtml(chart);

  let divisionalSection = "";
  let dashaSection = "";
  try {
    const moonChart = toMoonChart(chart);
    const ns = Array.from({ length: 59 }, (_, i) => i + 2);
    const [vargaBulk, dasha] = await Promise.all([
      calculateVargaBulk({ ...req, save_history: false }, ns),
      calculateDasha({ ...req, years_ahead: 120, save_history: false }),
    ]);
    const gridItems: { label: string; chart: ChartResponse }[] = [
      { label: "Moon Chart", chart: moonChart },
      { label: vargaChartLabel(1), chart },
    ];
    for (let n = 2; n <= 60; n++) {
      const v = vargaBulk[n];
      if (v) gridItems.push({ label: vargaChartLabel(n), chart: v });
    }
    divisionalSection = `
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        ${sectionHeader("Moon Chart & All D-Charts (D1–D60)")}
        ${twoColumnChartGridHtml(gridItems)}
      </div>`;
    dashaSection = buildDashaTableHtml(dasha);
  } catch (e) {
    alert(e instanceof Error ? e.message : "Failed to generate report data");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Janma Kundli – ${m.birth_place}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f1f5f9;color:#0f172a;min-height:100vh}
    @page{size:A4;margin:10mm}
    @media print{.no-print{display:none!important};body{background:#fff};.page-card{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
  <!-- Print bar -->
  <div class="no-print" style="background:linear-gradient(90deg,#1e1b4b,#312e81);padding:12px 24px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    <button onclick="window.print()" style="background:#6366f1;color:white;border:none;padding:10px 22px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:background 0.2s;" onmouseover="this.style.background='#4f46e5'" onmouseout="this.style.background='#6366f1'">
      ⬇&nbsp; Download / Print PDF
    </button>
    <span style="color:rgba(255,255,255,0.55);font-size:11px;">Choose "Save as PDF" in the print dialog</span>
  </div>

  <div class="page-card" style="max-width:800px;margin:24px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#0f0c2e 0%,#1e1b4b 45%,#312e81 75%,#4338ca 100%);padding:32px 36px;color:white;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;">
        <div>
          <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;opacity:0.55;margin-bottom:8px;">Astrogyan · Vedic Astrology Report</p>
          <h1 style="font-size:30px;font-weight:900;letter-spacing:-0.5px;line-height:1;">Janma Kundli</h1>
          <p style="font-size:13px;opacity:0.7;margin-top:6px;">Birth Chart · ${m.birth_place}</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:10px;opacity:0.5;">${today}</p>
          <p style="font-size:10px;opacity:0.4;margin-top:3px;">JD ${m.julian_day.toFixed(4)}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${[
          ["Date of Birth", m.birth_date],
          ["Time of Birth", m.birth_time],
          ["Birth Place", m.birth_place],
          ["Coordinates", `${m.latitude.toFixed(3)}°, ${m.longitude.toFixed(3)}°`],
          ["Timezone", `${m.timezone} (${m.utc_offset})`],
          ["System", `${m.house_system} · ${m.zodiac}`],
        ].map(([l, v]) => `
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:11px 14px;backdrop-filter:blur(4px);">
            <p style="font-size:8px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.55;margin-bottom:4px;">${l}</p>
            <p style="font-size:12px;font-weight:700;line-height:1.2;">${v}</p>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- LAGNA BAR -->
    <div style="background:linear-gradient(90deg,#eef2ff,#f5f3ff);border-left:5px solid #4338ca;padding:14px 24px;display:flex;gap:48px;align-items:center;">
      <div>
        <p style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;">Lagna (Ascendant)</p>
        <p style="font-size:18px;font-weight:900;color:#1e1b4b;">${chart.angles.ascendant.sign} <span style="font-size:12px;font-weight:500;color:#64748b;">${chart.angles.ascendant.formatted}</span></p>
      </div>
      <div>
        <p style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;">Midheaven (MC)</p>
        <p style="font-size:18px;font-weight:900;color:#1e1b4b;">${chart.angles.midheaven.sign} <span style="font-size:12px;font-weight:500;color:#64748b;">${chart.angles.midheaven.formatted}</span></p>
      </div>
      <div>
        <p style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;">Descendant</p>
        <p style="font-size:18px;font-weight:900;color:#1e1b4b;">${chart.angles.descendant.sign}</p>
      </div>
    </div>

    <div style="padding:24px 28px;display:flex;flex-direction:column;gap:22px;">

      <!-- CHART -->
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;gap:10px;">
          <span style="color:white;font-size:16px;">◈</span>
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">Janma Kundli · Birth Chart</p>
        </div>
        <div style="padding:16px;background:#fafafa;">${chartSvg}</div>
      </div>

      <!-- PLANETS -->
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;gap:10px;">
          <span style="color:white;font-size:16px;">✦</span>
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">Graha Sthiti · Planet Positions</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              <th style="padding:9px 14px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Planet</th>
              <th style="padding:9px 14px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Sign (Rashi)</th>
              <th style="padding:9px 14px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Degree</th>
              <th style="padding:9px 14px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">House</th>
              <th style="padding:9px 14px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Status</th>
            </tr>
          </thead>
          <tbody>${planetRows}</tbody>
        </table>
      </div>

      ${divisionalSection}

      ${dashaSection}

      <!-- FOOTER -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid #e2e8f0;">
        <p style="font-size:10px;color:#94a3b8;">Generated by Astrogyan · Swiss Ephemeris · Lahiri Ayanamsa · Ashtakoot Parashari System</p>
        <p style="font-size:10px;color:#94a3b8;">${new Date().toLocaleString("en-IN")}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  openAndPrint(html);
}

// ── Match (Kundli Milan) Report ───────────────────────────────────────────────
export async function downloadMatchReport(data: MatchResponse, matchReq?: MatchRequest) {
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const pct = data.percentage;
  const r = 60;
  const circ = 2 * Math.PI * r;
  const scoreOffset = circ * (1 - data.total_score / 36);
  const gaugeColor =
    pct >= 83 ? "#10b981" :
    pct >= 67 ? "#22c55e" :
    pct >= 50 ? "#f59e0b" :
    pct >= 33 ? "#f97316" : "#ef4444";

  const gradeBg =
    pct >= 83 ? "#d1fae5" :
    pct >= 67 ? "#dcfce7" :
    pct >= 50 ? "#fef3c7" :
    pct >= 33 ? "#ffedd5" : "#fee2e2";

  const gradeColor =
    pct >= 83 ? "#065f46" :
    pct >= 67 ? "#14532d" :
    pct >= 50 ? "#78350f" :
    pct >= 33 ? "#7c2d12" : "#7f1d1d";

  const stars = Math.round((data.total_score / 36) * 5);
  const starsHtml = [1,2,3,4,5].map(i =>
    `<span style="font-size:18px;color:${i <= stars ? "#fbbf24" : "#e2e8f0"};">★</span>`
  ).join("");

  const kootRows = data.koots.map(k => {
    const kPct = k.score / k.max_score;
    const barW = Math.round(kPct * 100);
    const barColor = kPct >= 1 ? "#10b981" : kPct >= 0.5 ? "#f59e0b" : "#ef4444";
    const scoreBg = kPct >= 1 ? "#d1fae5" : kPct >= 0.5 ? "#fef3c7" : "#fee2e2";
    const scoreCol = kPct >= 1 ? "#065f46" : kPct >= 0.5 ? "#78350f" : "#7f1d1d";
    return `
      <tr>
        <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;">
          <p style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:2px;">${k.name}</p>
          <p style="font-size:10px;color:#94a3b8;">${k.description.split(".")[0]}</p>
        </td>
        <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${scoreBg};color:${scoreCol};font-size:13px;font-weight:800;padding:3px 10px;border-radius:12px;">${k.score}/${k.max_score}</span>
        </td>
        <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;width:30%;">
          <div style="height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${barW}%;background:${barColor};border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;">
          <span style="background:#eef2ff;color:#3730a3;font-size:10px;font-weight:600;padding:3px 8px;border-radius:8px;">${k.boy_value}</span>
        </td>
        <td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;text-align:center;">
          <span style="background:#fff1f2;color:#9f1239;font-size:10px;font-weight:600;padding:3px 8px;border-radius:8px;">${k.girl_value}</span>
        </td>
      </tr>
    `;
  }).join("");

  const req = matchReq ?? loadStoredMatchRequest() ?? matchRequestFromResult(data);
  const boyName = data.boy_name || "Groom";
  const girlName = data.girl_name || "Bride";

  let chartsSection = "";
  let sadsatkutSection = "";
  try {
    const boyMoon = toMoonChart(data.boy_chart);
    const girlMoon = toMoonChart(data.girl_chart);
    const [boyD9, girlD9] = await Promise.all([
      calculateVarga(vargaRequestForPerson(data.boy_chart, req.boy, 9)),
      calculateVarga(vargaRequestForPerson(data.girl_chart, req.girl, 9)),
    ]);
    chartsSection = `
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        ${sectionHeader("Charts — Birth, Moon & D9")}
        ${boyGirlChartRowHtml("Birth Chart", boyName, data.boy_chart, girlName, data.girl_chart)}
        ${boyGirlChartRowHtml("Moon Chart", boyName, boyMoon, girlName, girlMoon)}
        ${boyGirlChartRowHtml("D9 Chart (Navamsa)", boyName, boyD9, girlName, girlD9)}
      </div>`;
    if (data.sadsatkut) {
      sadsatkutSection = buildSadsatkutHtml(data.sadsatkut);
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "Failed to generate match report data");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Kundli Milan – ${data.boy_name} & ${data.girl_name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f1f5f9;color:#0f172a;min-height:100vh}
    @page{size:A4;margin:10mm}
    @media print{.no-print{display:none!important};body{background:#fff};.page-card{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
  <!-- Print bar -->
  <div class="no-print" style="background:linear-gradient(90deg,#4c0519,#881337,#1e1b4b);padding:12px 24px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    <button onclick="window.print()" style="background:#e11d48;color:white;border:none;padding:10px 22px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;" onmouseover="this.style.background='#be123c'" onmouseout="this.style.background='#e11d48'">
      ⬇&nbsp; Download / Print PDF
    </button>
    <span style="color:rgba(255,255,255,0.55);font-size:11px;">Choose "Save as PDF" in the print dialog</span>
  </div>

  <div class="page-card" style="max-width:820px;margin:24px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

    <!-- HERO HEADER -->
    <div style="background:linear-gradient(135deg,#0f0c2e 0%,#1e1b4b 30%,#4c0519 70%,#7f1d1d 100%);padding:36px 40px;color:white;position:relative;overflow:hidden;">
      <!-- decorative circles -->
      <div style="position:absolute;top:-60px;left:-60px;width:200px;height:200px;background:rgba(99,102,241,0.15);border-radius:50%;"></div>
      <div style="position:absolute;bottom:-80px;right:-40px;width:240px;height:240px;background:rgba(225,29,72,0.12);border-radius:50%;"></div>

      <div style="position:relative;z-index:1;">
        <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;opacity:0.5;margin-bottom:8px;text-align:center;">Astrogyan · Vedic Astrology Report</p>
        <h1 style="font-size:28px;font-weight:900;letter-spacing:-0.5px;text-align:center;margin-bottom:6px;">Kundli Milan</h1>
        <p style="font-size:12px;opacity:0.6;text-align:center;margin-bottom:32px;">Ashtakoot Guna Compatibility Report · ${today}</p>

        <!-- Three columns -->
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;max-width:580px;margin:0 auto;">
          <!-- Boy -->
          <div style="text-align:center;">
            <div style="width:64px;height:64px;background:rgba(99,102,241,0.25);border:2px solid rgba(165,180,252,0.5);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:26px;font-weight:900;color:#c7d2fe;">${(data.boy_name||"B")[0].toUpperCase()}</div>
            <p style="font-size:16px;font-weight:800;color:white;margin-bottom:3px;">${data.boy_name || "Var"}</p>
            <p style="font-size:11px;color:#a5b4fc;margin-bottom:2px;">${data.boy_moon_sign}</p>
            <p style="font-size:10px;color:rgba(165,180,252,0.6);">${data.boy_nakshatra}</p>
            <p style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px;letter-spacing:1px;">♂ GROOM</p>
          </div>

          <!-- Score Circle -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <svg width="148" height="148" viewBox="0 0 148 148">
              <circle cx="74" cy="74" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="12"/>
              <circle cx="74" cy="74" r="${r}" fill="none" stroke="${gaugeColor}" stroke-width="12"
                stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${scoreOffset.toFixed(2)}"
                stroke-linecap="round" transform="rotate(-90 74 74)"/>
              <text x="74" y="70" text-anchor="middle" fill="white" font-size="32" font-weight="900" font-family="system-ui">${data.total_score}</text>
              <text x="74" y="89" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="12" font-family="system-ui">/ 36</text>
            </svg>
            <div style="display:flex;gap:2px;">${starsHtml}</div>
            <span style="background:${gradeBg};color:${gradeColor};font-size:11px;font-weight:800;padding:4px 14px;border-radius:20px;">${data.grade}</span>
          </div>

          <!-- Girl -->
          <div style="text-align:center;">
            <div style="width:64px;height:64px;background:rgba(225,29,72,0.25);border:2px solid rgba(253,164,175,0.5);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:26px;font-weight:900;color:#fda4af;">${(data.girl_name||"G")[0].toUpperCase()}</div>
            <p style="font-size:16px;font-weight:800;color:white;margin-bottom:3px;">${data.girl_name || "Vadhu"}</p>
            <p style="font-size:11px;color:#fda4af;margin-bottom:2px;">${data.girl_moon_sign}</p>
            <p style="font-size:10px;color:rgba(253,164,175,0.6);">${data.girl_nakshatra}</p>
            <p style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px;letter-spacing:1px;">♀ BRIDE</p>
          </div>
        </div>

        <!-- Compatibility bar -->
        <div style="max-width:300px;margin:20px auto 0;">
          <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${gaugeColor};border-radius:3px;"></div>
          </div>
          <p style="text-align:center;font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;">${pct}% Compatibility · "${data.recommendation}"</p>
        </div>
      </div>
    </div>

    <div style="padding:24px 28px;display:flex;flex-direction:column;gap:22px;">

      <!-- BIRTH DETAILS COMPARISON -->
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;">
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">Birth Details Comparison</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              <th style="padding:9px 16px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:25%;">Detail</th>
              <th style="padding:9px 16px;text-align:left;font-size:9px;color:#3730a3;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:37.5%;">${data.boy_name || "Groom"}</th>
              <th style="padding:9px 16px;text-align:left;font-size:9px;color:#9f1239;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:37.5%;">${data.girl_name || "Bride"}</th>
            </tr>
          </thead>
          <tbody>
            ${[
              ["Date of Birth", data.boy_chart.meta.birth_date, data.girl_chart.meta.birth_date],
              ["Time of Birth", data.boy_chart.meta.birth_time, data.girl_chart.meta.birth_time],
              ["Birth Place", data.boy_chart.meta.birth_place, data.girl_chart.meta.birth_place],
              ["Moon Sign", data.boy_moon_sign, data.girl_moon_sign],
              ["Nakshatra", data.boy_nakshatra, data.girl_nakshatra],
              ["Nak. Lord", data.boy_nakshatra_lord, data.girl_nakshatra_lord],
              ["Mangal Dosha", data.boy_mangal_dosha ? "⚠ Present" : "✓ Absent", data.girl_mangal_dosha ? "⚠ Present" : "✓ Absent"],
            ].map(([l, bv, gv], i) => `
              <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
                <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b;font-weight:600;">${l}</td>
                <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#1e1b4b;">${bv}</td>
                <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#881337;">${gv}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- ASHTAKOOT TABLE -->
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;justify-content:space-between;">
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">Ashtakoot Guna Matching</p>
          <span style="background:${gradeBg};color:${gradeColor};font-size:12px;font-weight:800;padding:3px 12px;border-radius:12px;">${data.total_score}/36 · ${data.grade}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              <th style="padding:9px 16px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Koot</th>
              <th style="padding:9px 16px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Score</th>
              <th style="padding:9px 16px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:25%;">Progress</th>
              <th style="padding:9px 16px;text-align:center;font-size:9px;color:#3730a3;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${data.boy_name||"Groom"}</th>
              <th style="padding:9px 16px;text-align:center;font-size:9px;color:#9f1239;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${data.girl_name||"Bride"}</th>
            </tr>
          </thead>
          <tbody>${kootRows}</tbody>
          <tfoot>
            <tr style="background:linear-gradient(90deg,#eef2ff,#fdf2f8);border-top:2px solid #e2e8f0;">
              <td style="padding:12px 16px;font-size:13px;font-weight:800;color:#1e1b4b;">Total</td>
              <td style="padding:12px 16px;"><span style="background:${gradeBg};color:${gradeColor};font-size:16px;font-weight:900;padding:4px 12px;border-radius:12px;">${data.total_score}/36</span></td>
              <td colspan="3" style="padding:12px 16px;text-align:right;font-size:12px;color:#64748b;font-style:italic;">${data.recommendation}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${sadsatkutSection}

      <!-- MANGAL DOSHA -->
      <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;">
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">Mangal Dosha (Kuja Dosha)</p>
        </div>
        <div style="padding:16px 20px;display:flex;gap:14px;">
          ${[
            { name: data.boy_name || "Groom", has: data.boy_mangal_dosha },
            { name: data.girl_name || "Bride", has: data.girl_mangal_dosha },
          ].map(({ name, has }) => `
            <div style="flex:1;border-radius:10px;padding:12px 16px;background:${has ? "#fef2f2" : "#f0fdf4"};border:1px solid ${has ? "#fecaca" : "#bbf7d0"};display:flex;align-items:center;gap:10px;">
              <span style="font-size:20px;">${has ? "⚠" : "✓"}</span>
              <div>
                <p style="font-size:12px;font-weight:700;color:#0f172a;">${name}</p>
                <p style="font-size:11px;color:${has ? "#dc2626" : "#16a34a"};font-weight:600;">${has ? "Mangal Dosha Present" : "No Mangal Dosha"}</p>
              </div>
            </div>
          `).join("")}
        </div>
        ${data.mangal_dosha_cancelled ? `
          <div style="margin:0 20px 16px;border-radius:10px;padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;gap:8px;">
            <span style="color:#16a34a;font-size:14px;">✓</span>
            <p style="font-size:11px;color:#15803d;font-weight:600;">Dosha cancelled — both partners have Mangal Dosha.</p>
          </div>
        ` : ""}
      </div>

      ${chartsSection}

      <!-- FOOTER -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid #e2e8f0;">
        <p style="font-size:10px;color:#94a3b8;">Generated by Astrogyan · Swiss Ephemeris · Lahiri Ayanamsa · Ashtakoot Parashari System</p>
        <p style="font-size:10px;color:#94a3b8;">${new Date().toLocaleString("en-IN")}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  openAndPrint(html);
}
