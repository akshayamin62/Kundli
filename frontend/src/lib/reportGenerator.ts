import {
  ChartResponse,
  MatchResponse,
  ChartRequest,
  DashaResponse,
  MatchRequest,
} from "@/types/chart";
import { calculateVargaBulk, calculateDasha, calculateVarga } from "@/services/api";
import { formatHouseSystemLabel, formatZodiacLabel, normalizeChartRequest } from "@/lib/chartRequestNormalize";
import { formatTimezoneDisplay } from "@/lib/timezoneDisplay";
import { toMoonChart, getMoonJanmaFromChart } from "@/lib/chartTransforms";
import { formatNakshatraWithCharan } from "@/lib/nakshatra";
import { vargaChartLabel } from "@/lib/vargaMeta";
import { vargaRequestForPerson } from "@/lib/matchVargaRequest";
import { matchRequestFromResult, loadStoredMatchRequest } from "@/lib/editPrefill";
import { sortPlanetsForTable } from "@/lib/planetOrder";
import {
  chunkArray,
  downloadPdfFromHtml,
  REPORT_PDF_STYLES,
  reportKeepTogether,
  reportTableBlock,
} from "@/lib/pdfExport";

/** Inline colors only — sizing/centering from .report-badge in pdfExport REPORT_PDF_STYLES */
function reportBadge(
  text: string,
  colors: string,
  size: "sm" | "md" | "lg" = "sm",
  radius: "pill" | "pill-sm" = "pill",
): string {
  const classes = [
    "report-badge",
    radius === "pill-sm" ? "report-badge--pill-sm" : "report-badge--pill",
    size !== "sm" ? `report-badge--${size}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<span class="${classes}" style="${colors}"><span class="report-badge__text">${text}</span></span>`;
}

const TD = "padding:9px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;";

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

function buildChartSvgHtml(chart: ChartResponse, compact = false): string {
  const W = compact ? 540 : 900;
  const H = compact ? Math.round((W * 640) / 900) : 640;
  const s = W / 900;
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

  const svgH = compact ? H : "auto";
  let svg = `<svg width="100%" height="${svgH}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="font-family:Arial,sans-serif;max-width:100%;display:block;vertical-align:top;">`;
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
    svg += `<text x="${numX.toFixed(1)}" y="${numY.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#374151" font-size="${Math.round(16 * s)}" font-weight="700">${signNum}</text>`;

    if (isLagna) {
      const asc = chart.angles.ascendant;
      svg += `<text x="${x}" y="${y - 22 * s}" text-anchor="middle" fill="#6d28d9" font-size="${Math.round(18 * s)}" font-weight="700">Lag</text>`;
      svg += `<text x="${x}" y="${y - 6 * s}" text-anchor="middle" fill="#6d28d9" font-size="${Math.round(12 * s)}">${asc.degree}°${String(asc.minutes).padStart(2, "0")}′</text>`;
    }

    const lineHeight = 45 * s;
    const nRows = Math.ceil(housePlanets.length / 2);
    const HEADER_H = isLagna ? 46 * s : 0;
    const blockH = HEADER_H + nRows * lineHeight;
    const MARGIN = 8 * s;
    let blockTop = y - blockH / 2;
    blockTop = Math.max(MARGIN, Math.min(H - blockH - MARGIN, blockTop));
    const avail = (H - MARGIN) - (blockTop + HEADER_H);
    const effLH = nRows > 0 ? Math.min(lineHeight, Math.max(26 * s, avail / nRows)) : lineHeight;
    const planetStartY = blockTop + HEADER_H + Math.floor(effLH * 0.65);

    housePlanets.forEach((p, idx) => {
      const total = housePlanets.length;
      const col = total > 1 ? idx % 2 : 0;
      const row = total > 1 ? Math.floor(idx / 2) : idx;
      const colOff = total === 1 ? 0 : col === 0 ? -40 * s : 40 * s;
      const px = x + colOff;
      const py = planetStartY + row * effLH;
      const retMark = p.retrograde ? `<tspan fill="#dc2626">-</tspan>` : ``;
      const suffMark = p.suffix ? `<tspan fill="${p.color}">${p.suffix}</tspan>` : ``;
      const fsMain = Math.round(22 * s);
      const fsDeg = Math.round(15 * s);
      svg += `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle" fill="${p.color}" font-size="${fsMain}" font-weight="600">${p.label}${suffMark}${retMark}<tspan x="${px.toFixed(1)}" dy="${Math.round(18 * s)}" font-size="${fsDeg}" font-weight="400" fill="#374151">${p.degree}°${String(p.minutes).padStart(2, "0")}′</tspan></text>`;
    });
  }

  svg += `<rect width="${W}" height="${H}" fill="none" stroke="#6b7280" stroke-width="2"/>`;
  svg += `</svg>`;
  return svg;
}

function reportHtmlDocument(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>${REPORT_PDF_STYLES}</style>
</head>
<body>
  <div class="report-root" style="background:#fff;padding:0;">
    ${body}
  </div>
</body>
</html>`;
}

function sectionHeader(title: string): string {
  return `
    <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;gap:10px;">
      <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">${title}</p>
    </div>`;
}

function chartBlockHtml(label: string, chart: ChartResponse, compact = false): string {
  const chartBox = compact
    ? `<div style="border:1px solid #e2e8f0;border-radius:8px;background:#fafafa;padding:6px 6px 10px 6px;line-height:0;overflow:visible;">${buildChartSvgHtml(chart, true)}</div>`
    : `<div style="border:1px solid #e2e8f0;border-radius:8px;background:#fafafa;padding:8px;">${buildChartSvgHtml(chart, false)}</div>`;
  return `
    <div style="margin-bottom:4px;">
      <p style="font-size:10px;font-weight:700;color:#334155;margin-bottom:6px;">${label}</p>
      ${chartBox}
    </div>`;
}

function twoColumnChartGridHtml(items: { label: string; chart: ChartResponse }[]): string {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:16px;">
      ${items.map((item) => chartBlockHtml(item.label, item.chart)).join("")}
    </div>`;
}

/** Divisional charts: 6 charts (3 rows × 2 cols) per PDF chunk/page. */
function divisionalChartsSectionHtml(items: { label: string; chart: ChartResponse }[]): string {
  const pages = chunkArray(items, 6);
  return pages
    .map((pageItems, pageIdx) => {
      const title =
        pageIdx === 0
          ? sectionHeader("Moon Chart & All D-Charts (D1–D60)")
          : `<div style="background:#1e1b4b;padding:10px 20px;">
              <p style="color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">D-Charts (continued)</p>
            </div>`;
      return `
        <div class="report-pdf-chunk" style="padding:0 0 8px;">
          <div style="border-radius:14px;border:1px solid #e2e8f0;">
            ${title}
            ${twoColumnChartGridHtml(pageItems)}
          </div>
        </div>`;
    })
    .join("");
}

function boyGirlChartRowHtml(
  subsection: string,
  boyName: string,
  boyChart: ChartResponse,
  girlName: string,
  girlChart: ChartResponse,
  compact = false,
): string {
  return `
    <div style="padding:0 16px 14px;">
      <p style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">${subsection}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start;">
        ${chartBlockHtml(boyName, boyChart, compact)}
        ${chartBlockHtml(girlName, girlChart, compact)}
      </div>
    </div>`;
}

function matchReportFooterInnerHtml(): string {
  return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;margin-top:14px;border-top:1px solid #e2e8f0;background:#f8fafc;border-radius:10px;">
        <p style="font-size:10px;color:#94a3b8;">Generated by Astrogyan · Swiss Ephemeris · Lahiri Ayanamsa · Ashtakoot Parashari System</p>
        <p style="font-size:10px;color:#94a3b8;">${new Date().toLocaleString("en-IN")}</p>
      </div>`;
}

function matchChartsAndFooterPageHtml(
  boyName: string,
  girlName: string,
  boyChart: ChartResponse,
  girlChart: ChartResponse,
  boyMoon: ChartResponse,
  girlMoon: ChartResponse,
  boyD9: ChartResponse,
  girlD9: ChartResponse,
): string {
  return `
    <div class="report-pdf-chunk">
      <div style="border-radius:14px;border:1px solid #e2e8f0;padding-bottom:8px;">
        ${sectionHeader("Charts — Birth, Moon & D9")}
        ${boyGirlChartRowHtml("Birth Chart", boyName, boyChart, girlName, girlChart, true)}
        ${boyGirlChartRowHtml("Moon Chart", boyName, boyMoon, girlName, girlMoon, true)}
        ${boyGirlChartRowHtml("D9 Chart (Navamsa)", boyName, boyD9, girlName, girlD9, true)}
      </div>
    </div>
    `;
}

function buildPlanetTableRows(chart: ChartResponse): string {
  return sortPlanetsForTable(
    chart.planets.filter((p) => !["Uranus", "Neptune", "Pluto"].includes(p.name)),
  )
    .map((p, idx) => {
      const retro = p.retrograde;
      return `
    <tr style="background:${idx % 2 === 0 ? "#fff" : "#f8fafc"};">
      <td style="${TD}">
        <div class="report-cell-flex">
          <span style="font-size:17px;line-height:1;display:inline-flex;align-items:center;flex-shrink:0;">${p.symbol}</span>
          <strong style="font-size:12px;color:#0f172a;line-height:1.2;">${p.name}</strong>
        </div>
      </td>
      <td style="${TD}font-size:12px;font-weight:600;color:#1e1b4b;">${p.sign}</td>
      <td style="${TD}font-size:11px;color:#64748b;font-family:monospace;">${p.degree}°${String(p.minutes).padStart(2, "0")}'${String(p.seconds).padStart(2, "0")}"</td>
      <td style="${TD}text-align:center;">
        ${reportBadge(String(p.house), "background:#eef2ff;color:#3730a3;font-weight:700;border:1px solid #c7d2fe;min-width:28px;")}
      </td>
      <td style="${TD}text-align:center;">
        ${reportBadge(retro ? "- Retro" : "Direct", `background:${retro ? "#fef2f2" : "#f0fdf4"};color:${retro ? "#dc2626" : "#16a34a"};font-weight:700;border:1px solid ${retro ? "#fecaca" : "#bbf7d0"};`)}
      </td>
    </tr>`;
    })
    .join("");
}

function buildGrahaSthitiTableHtml(chart: ChartResponse): string {
  return reportTableBlock(`
      <div style="border-radius:14px;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;gap:10px;">
          <span style="color:white;font-size:16px;line-height:1;">✦</span>
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;line-height:1.2;">Graha Sthiti · Planet Positions</p>
        </div>
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
          <thead style="display:table-header-group;">
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              <th style="${TD}text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:22%;">Planet</th>
              <th style="${TD}text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:18%;">Sign (Rashi)</th>
              <th style="${TD}text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:28%;">Degree</th>
              <th style="${TD}text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:12%;">House</th>
              <th style="${TD}text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:20%;">Status</th>
            </tr>
          </thead>
          <tbody>${buildPlanetTableRows(chart)}</tbody>
        </table>
      </div>`);
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
    <div style="border-radius:14px;border:1px solid #e2e8f0;">
      ${sectionHeader("Vimshottari Dasha")}
      <div style="padding:12px 16px;background:#eef2ff;border-bottom:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#3730a3;font-weight:600;">
          Birth Nakshatra: <strong>${dasha.nakshatra_name}</strong> · Lord: <strong>${dasha.nakshatra_lord}</strong>
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead style="display:table-header-group;">
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
    <div style="border-radius:14px;border:1px solid #e2e8f0;margin-bottom:18px;">
      ${sectionHeader("Sadsatkut Kostkaani")}
      <div style="padding:16px 20px;">
        ${cards}
      </div>
    </div>`;
}

function mangalDoshaIconSvg(has: boolean): string {
  if (has) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <path fill="#ef4444" d="M12 2L1 21h22L12 2zm0 4.5L19.2 19H4.8L12 6.5z"/>
      <rect x="11" y="10" width="2" height="5" rx="0.5" fill="#ef4444"/>
      <circle cx="12" cy="17" r="1.1" fill="#ef4444"/>
    </svg>`;
  }
  return `<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#10b981" stroke-width="2"/>
    <path fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M8 12.5l2.5 2.5L16 9"/>
  </svg>`;
}

function mangalDoshaPersonCard(name: string, has: boolean): string {
  const bg = has ? "#fef2f2" : "#f0fdf4";
  const border = has ? "#fecaca" : "#bbf7d0";
  const iconBg = has ? "#fee2e2" : "#d1fae5";
  const statusCol = has ? "#dc2626" : "#16a34a";
  const status = has ? "Mangal Dosha Present" : "No Mangal Dosha";
  return `
    <div style="flex:1;border-radius:12px;padding:14px 16px;background:${bg};border:1px solid ${border};display:flex;align-items:center;gap:12px;min-width:0;">
      <div style="width:36px;height:36px;min-width:36px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;line-height:0;">
        ${mangalDoshaIconSvg(has)}
      </div>
      <div style="min-width:0;">
        <p style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.25;margin:0;">${name}</p>
        <p style="font-size:11px;color:${statusCol};font-weight:600;line-height:1.25;margin:4px 0 0 0;">${status}</p>
      </div>
    </div>`;
}

function buildMangalDoshaHtml(data: MatchResponse): string {
  return `
    <div style="border-radius:14px;border:1px solid #e2e8f0;">
      ${sectionHeader("Mangal Dosha")}
      <div style="padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${mangalDoshaPersonCard(data.boy_name || "Groom", data.boy_mangal_dosha)}
        ${mangalDoshaPersonCard(data.girl_name || "Bride", data.girl_mangal_dosha)}
      </div>
      ${
        data.mangal_dosha_cancelled
          ? `
          <div style="margin:0 20px 16px;border-radius:12px;padding:10px 16px;background:#ecfdf5;border:1px solid #bbf7d0;display:flex;align-items:center;gap:10px;">
            <span style="width:8px;height:8px;min-width:8px;border-radius:50%;background:#10b981;display:inline-block;"></span>
            <p style="font-size:11px;color:#15803d;font-weight:600;margin:0;">Dosha cancelled — both partners have Mangal Dosha.</p>
          </div>`
          : ""
      }
      ${
        data.mangal_dosha_note
          ? `<p style="font-size:10px;color:#94a3b8;margin:0 16px 14px;padding:0 4px;line-height:1.4;">${data.mangal_dosha_note}</p>`
          : ""
      }
    </div>`;
}

function buildSadsatkutMangalPageHtml(
  sk: NonNullable<MatchResponse["sadsatkut"]>,
  data: MatchResponse,
): string {
  return `
    <div class="report-pdf-chunk">
      ${buildSadsatkutHtml(sk)}
      ${buildMangalDoshaHtml(data)}
    </div>`;
}

// ── Kundali Report ────────────────────────────────────────────────────────────
export async function downloadKundliReport(chart: ChartResponse, req: ChartRequest) {
  const safeReq = normalizeChartRequest(req);
  const m = chart.meta;
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const chartSvg = buildChartSvgHtml(chart);

  let divisionalSection = "";
  let dashaSection = "";
  try {
    const moonChart = toMoonChart(chart);
    const ns = Array.from({ length: 59 }, (_, i) => i + 2);
    const [vargaBulk, dasha] = await Promise.all([
      calculateVargaBulk({ ...safeReq, save_history: false }, ns),
      calculateDasha({ ...safeReq, years_ahead: 120, save_history: false }),
    ]);
    const gridItems: { label: string; chart: ChartResponse }[] = [
      { label: "Moon Chart", chart: moonChart },
      { label: vargaChartLabel(1), chart },
    ];
    for (let n = 2; n <= 60; n++) {
      const v = vargaBulk[n];
      if (v) gridItems.push({ label: vargaChartLabel(n), chart: v });
    }
    divisionalSection = divisionalChartsSectionHtml(gridItems);
    dashaSection = `<div class="report-pdf-chunk">${buildDashaTableHtml(dasha)}</div>`;
  } catch (e) {
    alert(e instanceof Error ? e.message : "Failed to generate report data");
    return;
  }

  const safeName = (req.name || "Kundli").replace(/[^\w\s-]/g, "").trim() || "Kundli";
  const body = `
  <div class="report-pdf-chunk" style="border-radius:20px;border:1px solid #e2e8f0;">

    <!-- HEADER -->
    <div style="background:#1e1b4b;padding:28px 32px;color:white;">
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
          ["Timezone", `${formatTimezoneDisplay(m.timezone, {
            utcOffset: m.utc_offset,
            latitude: m.latitude,
            longitude: m.longitude,
          })} (${m.utc_offset})`],
          ["System", `${formatHouseSystemLabel(m.house_system)} · ${formatZodiacLabel(m.zodiac)}`],
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

      ${reportKeepTogether(`
      <div style="border-radius:14px;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;gap:10px;">
          <span style="color:white;font-size:16px;line-height:1;">◈</span>
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;line-height:1.2;">Janma Kundli · Birth Chart</p>
        </div>
        <div style="padding:16px;background:#fafafa;">${chartSvg}</div>
      </div>`)}

      ${buildGrahaSthitiTableHtml(chart)}

      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 28px;border-top:1px solid #e2e8f0;">
        <p style="font-size:10px;color:#94a3b8;">Generated by Astrogyan · Swiss Ephemeris · Lahiri Ayanamsa</p>
        <p style="font-size:10px;color:#94a3b8;">${new Date().toLocaleString("en-IN")}</p>
      </div>
    </div>
  </div>

  ${divisionalSection}

  ${dashaSection}`;

  const html = reportHtmlDocument(`Janma Kundli – ${m.birth_place}`, body);
  await downloadPdfFromHtml(html, `Janma-Kundli-${safeName}.pdf`);
}

// ── Match (Kundli Milan) Report ───────────────────────────────────────────────
export async function downloadMatchReport(data: MatchResponse, matchReq?: MatchRequest) {
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const boyJanma = getMoonJanmaFromChart(data.boy_chart);
  const girlJanma = getMoonJanmaFromChart(data.girl_chart);
  const boyNakLabel = boyJanma
    ? formatNakshatraWithCharan(boyJanma.nakshatra, boyJanma.nakshatra_charan, "en")
    : data.boy_nakshatra;
  const girlNakLabel = girlJanma
    ? formatNakshatraWithCharan(girlJanma.nakshatra, girlJanma.nakshatra_charan, "en")
    : data.girl_nakshatra;

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

  const kootTd = "padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle;";
  const kootRows = data.koots.map(k => {
    const kPct = k.score / k.max_score;
    const barW = Math.round(kPct * 100);
    const barColor = kPct >= 1 ? "#10b981" : kPct >= 0.5 ? "#f59e0b" : "#ef4444";
    const scoreBg = kPct >= 1 ? "#d1fae5" : kPct >= 0.5 ? "#fef3c7" : "#fee2e2";
    const scoreCol = kPct >= 1 ? "#065f46" : kPct >= 0.5 ? "#78350f" : "#7f1d1d";
    return `
      <tr>
        <td style="${kootTd}">
          <div class="koot-cell-inner">
            <div>
              <p style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:2px;line-height:1.2;">${k.name}</p>
              <p style="font-size:10px;color:#94a3b8;line-height:1.2;">${k.description.split(".")[0]}</p>
            </div>
          </div>
        </td>
        <td style="${kootTd}text-align:center;">
          ${reportBadge(`${k.score}/${k.max_score}`, `background:${scoreBg};color:${scoreCol};`, "md")}
        </td>
        <td style="${kootTd}">
          <div class="koot-cell-inner">
            <div style="width:100%;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${barW}%;background:${barColor};border-radius:4px;"></div>
            </div>
          </div>
        </td>
        <td style="${kootTd}text-align:center;">
          ${reportBadge(k.boy_value, "background:#eef2ff;color:#3730a3;", "sm", "pill-sm")}
        </td>
        <td style="${kootTd}text-align:center;">
          ${reportBadge(k.girl_value, "background:#fff1f2;color:#9f1239;", "sm", "pill-sm")}
        </td>
      </tr>
    `;
  }).join("");

  function buildAshtakootChunkHtml(): string {
    return `
    <div class="report-pdf-chunk">
      <div style="border-radius:14px;border:1px solid #e2e8f0;">
        <div style="background:#1e1b4b;padding:13px 20px;display:flex;align-items:center;justify-content:space-between;">
          <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;line-height:1.2;">Ashtakoot Guna Matching</p>
          ${reportBadge(`${data.total_score}/36 · ${data.grade}`, `background:${gradeBg};color:${gradeColor};font-size:12px;`, "md")}
        </div>
        <table class="report-koot-valign" style="width:100%;border-collapse:collapse;table-layout:fixed;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              <th style="${kootTd}text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:24%;">Koot</th>
              <th style="${kootTd}text-align:center;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:12%;">Score</th>
              <th style="${kootTd}text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:18%;">Progress</th>
              <th style="${kootTd}text-align:center;font-size:9px;color:#3730a3;font-weight:700;text-transform:uppercase;width:23%;">${data.boy_name || "Groom"}</th>
              <th style="${kootTd}text-align:center;font-size:9px;color:#9f1239;font-weight:700;text-transform:uppercase;width:23%;">${data.girl_name || "Bride"}</th>
            </tr>
          </thead>
          <tbody>${kootRows}</tbody>
          <tfoot>
            <tr style="background:linear-gradient(90deg,#eef2ff,#fdf2f8);border-top:2px solid #e2e8f0;">
              <td style="${kootTd}font-size:13px;font-weight:800;color:#1e1b4b;">Total</td>
              <td style="${kootTd}text-align:center;">
                ${reportBadge(`${data.total_score}/36`, `background:${gradeBg};color:${gradeColor};`, "lg")}
              </td>
              <td colspan="3" style="${kootTd}text-align:right;font-size:12px;color:#64748b;font-style:italic;">${data.recommendation}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`;
  }

  const req = matchReq ?? loadStoredMatchRequest() ?? matchRequestFromResult(data);
  const boyName = data.boy_name || "Groom";
  const girlName = data.girl_name || "Bride";

  let chartsSection = "";
  let sadsatkutMangalSection = "";
  try {
    const boyMoon = toMoonChart(data.boy_chart);
    const girlMoon = toMoonChart(data.girl_chart);
    const [boyD9, girlD9] = await Promise.all([
      calculateVarga(vargaRequestForPerson(data.boy_chart, req.boy, 9)),
      calculateVarga(vargaRequestForPerson(data.girl_chart, req.girl, 9)),
    ]);
    chartsSection = matchChartsAndFooterPageHtml(
      boyName,
      girlName,
      data.boy_chart,
      data.girl_chart,
      boyMoon,
      girlMoon,
      boyD9,
      girlD9,
    );
    if (data.sadsatkut) {
      sadsatkutMangalSection = buildSadsatkutMangalPageHtml(data.sadsatkut, data);
    } else {
      sadsatkutMangalSection = `<div class="report-pdf-chunk">${buildMangalDoshaHtml(data)}</div>`;
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "Failed to generate match report data");
    return;
  }

  const pdfName = `Kundli-Milan-${(data.boy_name || "Boy").replace(/[^\w\s-]/g, "")}-${(data.girl_name || "Girl").replace(/[^\w\s-]/g, "")}`.replace(/\s+/g, "-");
  const body = `
  <div class="report-pdf-chunk">
    <div style="border-radius:20px;border:1px solid #e2e8f0;margin-bottom:18px;">
    <div style="background:#1e1b4b;padding:28px 32px;color:white;">
        <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;opacity:0.75;margin-bottom:8px;text-align:center;">Astrogyan · Vedic Astrology Report</p>
        <h1 style="font-size:26px;font-weight:900;letter-spacing:-0.5px;text-align:center;margin-bottom:6px;color:#fff;">Kundli Milan</h1>
        <p style="font-size:12px;opacity:0.8;text-align:center;margin-bottom:24px;color:#e2e8f0;">Ashtakoot Guna Compatibility Report · ${today}</p>

        <!-- Three columns -->
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;max-width:580px;margin:0 auto;">
          <!-- Boy -->
          <div style="text-align:center;">
            <div style="width:64px;height:64px;background:rgba(99,102,241,0.25);border:2px solid rgba(165,180,252,0.5);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:26px;font-weight:900;color:#c7d2fe;">${(data.boy_name||"B")[0].toUpperCase()}</div>
            <p style="font-size:16px;font-weight:800;color:white;margin-bottom:3px;">${data.boy_name || "Var"}</p>
            <p style="font-size:11px;color:#a5b4fc;margin-bottom:2px;">${data.boy_moon_sign}</p>
            <p style="font-size:10px;color:rgba(165,180,252,0.6);">${boyNakLabel}</p>
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
            ${reportBadge(data.grade, `background:${gradeBg};color:${gradeColor};font-size:11px;`, "sm", "pill")}
          </div>

          <!-- Girl -->
          <div style="text-align:center;">
            <div style="width:64px;height:64px;background:rgba(225,29,72,0.25);border:2px solid rgba(253,164,175,0.5);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:26px;font-weight:900;color:#fda4af;">${(data.girl_name||"G")[0].toUpperCase()}</div>
            <p style="font-size:16px;font-weight:800;color:white;margin-bottom:3px;">${data.girl_name || "Vadhu"}</p>
            <p style="font-size:11px;color:#fda4af;margin-bottom:2px;">${data.girl_moon_sign}</p>
            <p style="font-size:10px;color:rgba(253,164,175,0.6);">${girlNakLabel}</p>
            <p style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px;letter-spacing:1px;">♀ BRIDE</p>
          </div>
        </div>

        <!-- Compatibility bar -->
        <div style="max-width:300px;margin:20px auto 0;">
          <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${gaugeColor};border-radius:3px;"></div>
          </div>
          <p style="text-align:center;font-size:10px;color:rgba(255,255,255,0.65);margin-top:6px;">${pct}% Compatibility · "${data.recommendation}"</p>
        </div>
    </div>
    </div>

    <div style="border-radius:14px;border:1px solid #e2e8f0;">
      <div style="background:#1e1b4b;padding:13px 20px;">
        <p style="color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">Birth Details Comparison</p>
      </div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:9px 16px;text-align:left;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;width:25%;">Detail</th>
            <th style="padding:9px 16px;text-align:left;font-size:9px;color:#3730a3;font-weight:700;text-transform:uppercase;width:37.5%;">${data.boy_name || "Groom"}</th>
            <th style="padding:9px 16px;text-align:left;font-size:9px;color:#9f1239;font-weight:700;text-transform:uppercase;width:37.5%;">${data.girl_name || "Bride"}</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ["Date of Birth", data.boy_chart.meta.birth_date, data.girl_chart.meta.birth_date],
            ["Time of Birth", data.boy_chart.meta.birth_time, data.girl_chart.meta.birth_time],
            ["Birth Place", data.boy_chart.meta.birth_place, data.girl_chart.meta.birth_place],
            ["Moon Sign", data.boy_moon_sign, data.girl_moon_sign],
            ["Nakshatra", boyNakLabel, girlNakLabel],
            ["Nak. Lord", data.boy_nakshatra_lord, data.girl_nakshatra_lord],
            ["Mangal Dosha", data.boy_mangal_dosha ? "Present" : "Absent", data.girl_mangal_dosha ? "Present" : "Absent"],
          ].map(([l, bv, gv], i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
              <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b;font-weight:600;vertical-align:middle;">${l}</td>
              <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#1e1b4b;vertical-align:middle;">${bv}</td>
              <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#881337;vertical-align:middle;">${gv}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>

  ${buildAshtakootChunkHtml()}

  ${sadsatkutMangalSection}

  ${chartsSection}`;

  const html = reportHtmlDocument(
    `Kundli Milan – ${data.boy_name} & ${data.girl_name}`,
    body,
  );
  await downloadPdfFromHtml(html, `${pdfName}.pdf`);
}
