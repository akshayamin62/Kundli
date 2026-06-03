/** Shared print/PDF styles — keep blocks intact; repeat table headers on new pages. */
export const REPORT_PDF_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: #fff;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .report-root {
    width: 800px;
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
  }
  .report-pdf-chunk {
    width: 800px;
    background: #fff;
    padding-bottom: 16px;
    margin-bottom: 4px;
  }
  .report-keep {
    page-break-inside: avoid !important;
    break-inside: avoid-page !important;
  }
  .report-page-break-before {
    page-break-before: always !important;
    break-before: page !important;
  }
  .report-table-block table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  .report-table-block td,
  .report-table-block th {
    vertical-align: middle !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .report-koot-valign td,
  .report-koot-valign th { vertical-align: middle !important; }
  .report-koot-valign .koot-cell-inner {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 40px;
  }
  .report-koot-valign .koot-cell-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
  }
  .report-cell-flex {
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.2;
    min-height: 22px;
  }
  .report-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    vertical-align: middle;
    white-space: nowrap;
    min-height: 26px;
    height: 26px;
    padding: 0 12px;
    font-size: 10px;
    font-weight: 600;
  }
  .report-badge__text {
    display: block;
    line-height: 1;
    transform: translateY(-6px);
    padding: 0;
    margin: 0;
  }
  .report-badge--md {
    min-height: 28px;
    height: 28px;
    padding: 0 11px;
    font-size: 13px;
    font-weight: 800;
  }
  .report-badge--md .report-badge__text {
    transform: translateY(-7px);
  }
  .report-badge--lg {
    min-height: 32px;
    height: 32px;
    padding: 0 12px;
    font-size: 16px;
    font-weight: 900;
  }
  .report-badge--lg .report-badge__text {
    transform: translateY(-8px);
  }
  .report-badge--pill {
    border-radius: 12px;
  }
  .report-badge--pill-sm {
    border-radius: 8px;
  }
  table { border-collapse: collapse; width: 100%; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  td, th { vertical-align: middle; }
  svg { max-width: 100%; height: auto; display: block; }
`;

/** Split array into chunks of n items. */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Wrap a full report block so it moves to the next page instead of splitting. */
export function reportKeepTogether(html: string): string {
  return `<div class="report-keep report-table-block" style="page-break-inside:avoid;break-inside:avoid-page;">${html}</div>`;
}

/** Wrap a table section (Ashtakoot, Graha Sthiti, etc.) with keep-together + fixed layout. */
export function reportTableBlock(html: string): string {
  return reportKeepTogether(html);
}

function waitForRender(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const PDF_MARGIN_MM = 8;
const PDF_SCALE = 1.5;
const MAX_CANVAS_H_PX = 12000;

type JsPDFInstance = {
  addPage: () => void;
  addImage: (img: string, format: string, x: number, y: number, w: number, h: number) => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  save: (filename: string) => void;
};

async function loadHtml2Canvas(): Promise<
  (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>
> {
  const mod = await import("html2canvas");
  return mod.default;
}

async function loadJsPDF(): Promise<new (opts: Record<string, unknown>) => JsPDFInstance> {
  const mod = await import("jspdf");
  return mod.jsPDF as new (opts: Record<string, unknown>) => JsPDFInstance;
}

function addCanvasToPdf(
  pdf: JsPDFInstance,
  canvas: HTMLCanvasElement,
  firstPage: { value: boolean },
): void {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - PDF_MARGIN_MM * 2;
  const contentH = pageH - PDF_MARGIN_MM * 2;
  const imgW = contentW;
  const imgH_mm = (canvas.height * imgW) / canvas.width;
  const totalPages = Math.max(1, Math.ceil(imgH_mm / contentH));

  for (let p = 0; p < totalPages; p++) {
    if (!firstPage.value) pdf.addPage();
    firstPage.value = false;

    const offsetMm = p * contentH;
    const sliceHmm = Math.min(contentH, imgH_mm - offsetMm);
    if (sliceHmm < 3) continue;
    const srcY = (offsetMm / imgH_mm) * canvas.height;
    const srcH = (sliceHmm / imgH_mm) * canvas.height;

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.max(1, Math.floor(srcH));
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      srcY,
      canvas.width,
      srcH,
      0,
      0,
      canvas.width,
      sliceCanvas.height,
    );

    const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", PDF_MARGIN_MM, PDF_MARGIN_MM, imgW, sliceHmm);
  }
}

async function renderChunksToPdf(
  doc: Document,
  filename: string,
): Promise<void> {
  const html2canvas = await loadHtml2Canvas();
  const JsPDF = await loadJsPDF();
  const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const firstPage = { value: true };

  const chunks = Array.from(doc.querySelectorAll(".report-pdf-chunk")) as HTMLElement[];
  const targets = chunks.length > 0 ? chunks : [doc.querySelector(".report-root") as HTMLElement];

  for (const el of targets) {
    if (!el) continue;
    const canvas = await html2canvas(el, {
      scale: PDF_SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: el.scrollWidth,
      height: Math.min(el.scrollHeight, MAX_CANVAS_H_PX),
      windowWidth: el.scrollWidth,
      scrollY: 0,
      scrollX: 0,
    });
    addCanvasToPdf(pdf, canvas, firstPage);
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/**
 * Renders HTML off-screen and downloads a PDF with chart graphics (SVG via canvas).
 * Long reports use .report-pdf-chunk sections to avoid blank pages / canvas limits.
 */
export async function downloadPdfFromHtml(html: string, filename: string): Promise<void> {
  if (typeof window === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:820px;min-height:200px;border:0;opacity:0;pointer-events:none;z-index:-1;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create PDF render frame");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await waitForRender(800);
  if (doc.fonts?.ready) {
    try {
      await doc.fonts.ready;
    } catch {
      /* ignore */
    }
  }
  await waitForRender(500);

  const root = doc.querySelector(".report-root") as HTMLElement | null;
  if (root) {
    iframe.style.height = `${Math.min(root.scrollHeight + 80, 32000)}px`;
  }

  try {
    await renderChunksToPdf(doc, filename);
  } finally {
    document.body.removeChild(iframe);
  }
}
