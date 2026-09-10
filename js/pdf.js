// Builds the downloadable "Ofertë orientuese" PDF: a one-page summary drawn
// with pdf-lib, followed by the manufacturer datasheet pages for the selected
// panel and inverter (same content/approach as the reference app).
import { formatNumber, formatDecimal, formatYears } from "./format.js";

const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

const ROOF_LABELS = {
  sandwich: "Çati panel sandwich",
  terrace: "Terracë e sheshtë",
  tile: "Çati me tjegulla",
  ground: "Instalim në tokë",
};

function hex(color) {
  const n = parseInt(color.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export async function downloadQuotePdf({ clientName = "", clientLocation = "", customer, roof, result }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width } = page.getSize();

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const navy = hex("#0d1747");
  const blue = hex("#1429c2");
  const muted = hex("#66708d");
  const mutedDark = hex("#4a5578");
  const border = hex("#dfe4f0");
  const lime = hex("#c5ef78");
  const bg = hex("#f6f7fb");
  const white = rgb(1, 1, 1);
  const panelText = hex("#253052");
  let y = 841.89;

  function text(str, x, top, size = 10, isBold = false, color = navy) {
    page.drawText(str, { x, y: y - top - size, size, font: isBold ? bold : regular, color });
  }
  function rect(x, top, w, h, color) {
    page.drawRectangle({ x, y: y - top - h, width: w, height: h, color });
  }
  function line(x1, top1, x2, top2, color = border, w = 1) {
    page.drawLine({ start: { x: x1, y: y - top1 }, end: { x: x2, y: y - top2 }, thickness: w, color });
  }
  function bullet(label, x, top) {
    rect(x, top + 3, 5, 5, lime);
    text(label, x + 12, top, 9.2, false, panelText);
  }

  // Header banner
  rect(0, 0, width, 110, blue);
  line(35, 108, 560, 108, border);
  try {
    const logoBytes = await fetch("/assets/hisol-logo-pdf.png").then((r) => r.arrayBuffer());
    const logo = await doc.embedPng(logoBytes);
    const logoW = 90;
    const logoH = (logo.height / logo.width) * logoW;
    page.drawImage(logo, { x: 40, y: y - 20 - logoH, width: logoW, height: logoH });
  } catch {
    /* logo optional */
  }
  text("OFERTË ORIENTUESE", 385, 31, 14, true, white);
  text(new Intl.DateTimeFormat("sq-AL").format(new Date()), 456, 58, 9, false, white);

  if (clientName.trim()) {
    text("Për klientin", 40, 126, 8, true, muted);
    text(truncate(clientName.trim(), 34), 40, 140, 12, true);
  }
  if (clientLocation.trim()) {
    text("Vendndodhja", 315, 126, 8, true, muted);
    text(truncate(clientLocation.trim(), 28), 315, 140, 12, true);
  }

  // System / investment summary
  rect(35, 168, 525, 88, hex("#edf0ff"));
  text("SISTEMI I SUGJERUAR", 52, 184, 8.5, true, blue);
  text(`${formatDecimal(result.installedKwp)} kWp`, 52, 201, 25, true);
  text(`${result.panelCount} panele • ${result.panelBrand} ${result.panelModel} (${result.panelWatts} W)`, 52, 232, 9.5, false, mutedDark);
  text("INVESTIMI ORIENTUES", 340, 184, 8.5, true, blue);
  text(result.priceWithVat ? `${formatNumber(result.priceWithVat)} LEKË` : "SIPAS PROJEKTIT", 340, 201, 20, true);
  text(result.priceWithVat ? "Çmim i instaluar, me TVSH" : "Kërkon llogaritje teknike", 340, 232, 9.5, false, mutedDark);

  // Configuration table
  text("KONFIGURIMI", 40, 282, 10, true, blue);
  line(40, 300, 555, 300, border);
  text("Tipi i klientit", 40, 316, 8, true, muted);
  text(customer === "familjar" ? "Familjar" : "Biznes", 40, 330, 10.5, true);
  text("Vendosja", 180, 316, 8, true, muted);
  text(ROOF_LABELS[roof], 180, 330, 10.5, true);
  text("Inverteri", 360, 316, 8, true, muted);
  if (result.inverterIsCustom) {
    text("Sipas projektit", 360, 330, 10.5, true);
    text("Modeli konfirmohet në verifikimin teknik", 360, 343, 7.8, false, muted);
  } else if (result.inverterUnitCount > 1) {
    const breakdown = result.inverterUnits.map((u) => `${u.count}×${u.kw}K`).join(" + ");
    text(`${result.inverterUnitCount}× ${result.inverterBrand} EH3P (Trefazor)`, 360, 330, 9, true);
    text(`${breakdown} · gjithsej ~${formatDecimal(result.estimatedAcKw)} kW AC`, 360, 343, 7.8, false, muted);
  } else {
    text(`${result.inverterBrand} ${result.inverterModel}`, 360, 330, 9, true);
    text(`${result.inverterPhase === "monofazor" ? "Monofazor" : "Trefazor"}, ~${formatDecimal(result.estimatedAcKw)} kW AC`, 360, 343, 7.8, false, muted);
  }
  text("Hapësira e përafërt", 40, 360, 8, true, muted);
  text(`~${formatNumber(result.areaM2)} m²`, 40, 374, 10.5, true);
  text("Prodhimi i pritshëm", 180, 360, 8, true, muted);
  text(`~${formatNumber(result.annualProduction)} kWh/vit`, 180, 374, 10.5, true);
  text("Intervali i prodhimit", 360, 360, 8, true, muted);
  text(`${formatNumber(result.productionLow)}–${formatNumber(result.productionHigh)} kWh/vit`, 360, 374, 10.5, true);

  if (result.savingsLow && result.savingsHigh) {
    rect(35, 411, 525, 66, navy);
    text("KURSIMI I MUNDSHËM", 52, 426, 8.5, true, lime);
    text(`${formatNumber(result.savingsLow)}–${formatNumber(result.savingsHigh)} lekë/vit`, 52, 443, 16, true, white);
    text("KTHIMI I INVESTIMIT", 342, 426, 8.5, true, lime);
    text(`${formatYears(result.paybackFast)}–${formatYears(result.paybackSlow)} vjet`, 342, 443, 16, true, white);
  }

  // Package included
  text("PAKETA STANDARDE PËRFSHIN", 40, 504, 10, true, blue);
  line(40, 522, 555, 522, border);
  [
    "Panelet dhe inverterin",
    "Strukturën mbajtëse standarde",
    "Kabllot DC/AC dhe konektorët",
    "Mbrojtjet elektrike DC/AC",
    "Tokëzimin dhe monitorimin",
    "Montimin dhe instalimin",
    "Projektimin teknik standard",
  ].forEach((label, i) => bullet(label, i % 2 === 0 ? 40 : 305, 540 + Math.floor(i / 2) * 26));

  rect(35, 654, 525, 62, bg);
  text("NUK PËRFSHIHEN AUTOMATIKISHT", 50, 668, 8.5, true, muted);
  text("Bateria, përforcimi strukturor, punimet civile, transformatori, rritja e fuqisë", 50, 687, 8.5, false, mutedDark);
  text("dhe ndërhyrjet e jashtëzakonshme në rrjet.", 50, 701, 8.5, false, mutedDark);

  line(40, 746, 555, 746, border);
  text("Kjo përllogaritje nuk është preventiv përfundimtar. Çmimi dhe konfigurimi konfirmohen pas", 40, 760, 8, false, muted);
  text("verifikimit teknik të objektit, strukturës, lidhjes elektrike dhe dokumentacionit.", 40, 774, 8, false, muted);
  text(
    result.inverterIsCustom
      ? "Fleta teknike e panelit është bashkëngjitur në faqet vijuese."
      : "Fletët teknike të panelit dhe inverterit janë bashkëngjitur në faqet vijuese.",
    40, 790, 8, false, muted
  );
  text("contact@hisolenergy.com", 40, 805, 9, true, blue);
  text("hisolenergy.com", 438, 805, 9, true, blue);

  // Append manufacturer datasheets (panel always; inverter only when a model is confirmed).
  const attachments = [
    { label: `${result.panelBrand} ${result.panelModel}`, path: result.panelDatasheet },
    ...(result.inverterIsCustom
      ? []
      : [{ label: `${result.inverterBrand} ${result.inverterModel}`, path: result.inverterDatasheet }]),
  ];
  for (const attachment of attachments) {
    const res = await fetch(attachment.path);
    if (!res.ok) throw new Error(`Datasheet-i ${attachment.label} nuk u ngarkua.`);
    const sourceDoc = await PDFDocument.load(await res.arrayBuffer());
    const pages = await doc.copyPages(sourceDoc, sourceDoc.getPageIndices());
    pages.forEach((p) => doc.addPage(p));
  }

  doc.setTitle(`Ofertë orientuese hiSol - ${formatDecimal(result.installedKwp)} kWp`);
  doc.setAuthor("hiSol Energy");
  doc.setSubject("Ofertë orientuese dhe fletë teknike të pajisjeve");
  doc.setCreator("hiSol Solar Calculator");

  const bytes = await doc.save({ useObjectStreams: false });
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const filename = `hiSol-Oferte${clientName.trim() ? `-${slugify(clientName.trim())}` : ""}-${formatDecimal(result.installedKwp).replace(",", ".")}kWp.pdf`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
}
