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

function t(lang, key, fallback) {
  if (lang !== "en") return fallback;
  const value = window.HiSolI18n && window.HiSolI18n.dictionary && key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), window.HiSolI18n.dictionary);
  return value != null ? value : fallback;
}

function hex(color) {
  const n = parseInt(color.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function sanitizeFilenamePart(text) {
  return text.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
}

function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export async function downloadQuotePdf({ clientName = "", clientLocation = "", customer, roof, result, lang = "sq" }) {
  const locale = lang === "en" ? "en-GB" : "sq-AL";
  const tt = (key, fallback) => t(lang, key, fallback);

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
    const logoBytes = await fetch("assets/hisol-logo-pdf.png").then((r) => r.arrayBuffer());
    const logo = await doc.embedPng(logoBytes);
    const logoW = 90;
    const logoH = (logo.height / logo.width) * logoW;
    page.drawImage(logo, { x: 40, y: y - 20 - logoH, width: logoW, height: logoH });
  } catch {
    /* logo optional */
  }
  text(tt("pdf.title", "OFERTË ORIENTUESE"), 385, 31, 14, true, white);
  text(new Intl.DateTimeFormat(locale).format(new Date()), 456, 58, 9, false, white);

  if (clientName.trim()) {
    text(tt("pdf.forClient", "Për klientin"), 40, 126, 8, true, muted);
    text(truncate(clientName.trim(), 34), 40, 140, 12, true);
  }
  if (clientLocation.trim()) {
    text(tt("pdf.location", "Vendndodhja"), 315, 126, 8, true, muted);
    text(truncate(clientLocation.trim(), 28), 315, 140, 12, true);
  }

  // System / investment summary
  rect(35, 168, 525, 88, hex("#edf0ff"));
  text(tt("pdf.suggestedSystem", "SISTEMI I SUGJERUAR"), 52, 184, 8.5, true, blue);
  text(`${formatDecimal(result.installedKwp, locale)} kWp`, 52, 201, 25, true);
  text(`${result.panelCount} ${lang === "en" ? "panels" : "panele"} • ${result.panelBrand} ${result.panelModel} (${result.panelWatts} W)`, 52, 232, 9.5, false, mutedDark);
  text(tt("pdf.indicativeInvestment", "INVESTIMI ORIENTUES"), 340, 184, 8.5, true, blue);
  text(result.priceWithVat ? `${formatNumber(result.priceWithVat, 0, locale)} LEKË` : tt("pdf.priceCustom", "SIPAS PROJEKTIT"), 340, 201, 20, true);
  text(result.priceWithVat ? tt("pdf.priceCaptionVat", "Çmim i instaluar, me TVSH") : tt("pdf.priceCaptionCustom", "Kërkon llogaritje teknike"), 340, 232, 9.5, false, mutedDark);

  // Configuration table
  text(tt("pdf.configuration", "KONFIGURIMI"), 40, 282, 10, true, blue);
  line(40, 300, 555, 300, border);
  text(tt("pdf.customerType", "Tipi i klientit"), 40, 316, 8, true, muted);
  text(customer === "familjar" ? tt("pdf.customerFamily", "Familjar") : tt("pdf.customerBusiness", "Biznes"), 40, 330, 10.5, true);
  text(tt("pdf.placement", "Vendosja"), 180, 316, 8, true, muted);
  text(tt(`pdf.roofLabels.${roof}`, ROOF_LABELS[roof]), 180, 330, 10.5, true);
  text(tt("pdf.inverter", "Inverteri"), 360, 316, 8, true, muted);
  if (result.inverterIsCustom) {
    text(tt("pdf.inverterCustom", "Sipas projektit"), 360, 330, 10.5, true);
    text(tt("pdf.inverterCustomNote", "Modeli konfirmohet në verifikimin teknik"), 360, 343, 7.8, false, muted);
  } else if (result.inverterUnitCount > 1) {
    const breakdown = result.inverterUnits.map((u) => `${u.count}×${u.kw}K`).join(" + ");
    const phaseLabel = result.inverterPhase === "monofazor" ? tt("pdf.phaseSingle", "Monofazor") : tt("pdf.phaseThree", "Trefazor");
    text(`${result.inverterUnitCount}× ${result.inverterBrand} EH3P (${phaseLabel})`, 360, 330, 9, true);
    text(`${breakdown} · ${lang === "en" ? "total" : "gjithsej"} ~${formatDecimal(result.estimatedAcKw, locale)} kW AC`, 360, 343, 7.8, false, muted);
  } else {
    text(`${result.inverterBrand} ${result.inverterModel}`, 360, 330, 9, true);
    text(`${result.inverterPhase === "monofazor" ? tt("pdf.phaseSingle", "Monofazor") : tt("pdf.phaseThree", "Trefazor")}, ~${formatDecimal(result.estimatedAcKw, locale)} kW AC`, 360, 343, 7.8, false, muted);
  }
  text(tt("pdf.approxArea", "Hapësira e përafërt"), 40, 360, 8, true, muted);
  text(`~${formatNumber(result.areaM2, 0, locale)} m²`, 40, 374, 10.5, true);
  text(tt("pdf.expectedProduction", "Prodhimi i pritshëm"), 180, 360, 8, true, muted);
  text(`~${formatNumber(result.annualProduction, 0, locale)} kWh/${lang === "en" ? "year" : "vit"}`, 180, 374, 10.5, true);
  text(tt("pdf.productionRange", "Intervali i prodhimit"), 360, 360, 8, true, muted);
  text(`${formatNumber(result.productionLow, 0, locale)}–${formatNumber(result.productionHigh, 0, locale)} kWh/${lang === "en" ? "year" : "vit"}`, 360, 374, 10.5, true);

  if (result.savingsLow && result.savingsHigh) {
    rect(35, 411, 525, 66, navy);
    text(tt("pdf.savings", "KURSIMI I MUNDSHËM"), 52, 426, 8.5, true, lime);
    text(`${formatNumber(result.savingsLow, 0, locale)}–${formatNumber(result.savingsHigh, 0, locale)} lekë/${lang === "en" ? "year" : "vit"}`, 52, 443, 16, true, white);
    text(tt("pdf.payback", "KTHIMI I INVESTIMIT"), 342, 426, 8.5, true, lime);
    text(`${formatYears(result.paybackFast, locale)}–${formatYears(result.paybackSlow, locale)} ${lang === "en" ? "years" : "vjet"}`, 342, 443, 16, true, white);
  }

  // Package included
  text(tt("pdf.packageTitle", "PAKETA STANDARDE PËRFSHIN"), 40, 504, 10, true, blue);
  line(40, 522, 555, 522, border);
  const packageItemsSq = [
    "Panelet dhe inverterin",
    "Strukturën mbajtëse standarde",
    "Kabllot DC/AC dhe konektorët",
    "Mbrojtjet elektrike DC/AC",
    "Tokëzimin dhe monitorimin",
    "Montimin dhe instalimin",
    "Projektimin teknik standard",
  ];
  const packageItems = lang === "en" ? tt("pdf.packageItems", packageItemsSq) : packageItemsSq;
  packageItems.forEach((label, i) => bullet(label, i % 2 === 0 ? 40 : 305, 540 + Math.floor(i / 2) * 26));

  rect(35, 654, 525, 62, bg);
  text(tt("pdf.notIncludedTitle", "NUK PËRFSHIHEN AUTOMATIKISHT"), 50, 668, 8.5, true, muted);
  text(tt("pdf.notIncludedBody1", "Bateria, përforcimi strukturor, punimet civile, transformatori, rritja e fuqisë"), 50, 687, 8.5, false, mutedDark);
  text(tt("pdf.notIncludedBody2", "dhe ndërhyrjet e jashtëzakonshme në rrjet."), 50, 701, 8.5, false, mutedDark);

  line(40, 746, 555, 746, border);
  text(tt("pdf.disclaimer1", "Kjo përllogaritje nuk është preventiv përfundimtar. Çmimi dhe konfigurimi konfirmohen pas"), 40, 760, 8, false, muted);
  text(tt("pdf.disclaimer2", "verifikimit teknik të objektit, strukturës, lidhjes elektrike dhe dokumentacionit."), 40, 774, 8, false, muted);
  text(
    result.inverterIsCustom
      ? tt("pdf.attachedPanelOnly", "Fleta teknike e panelit është bashkëngjitur në faqet vijuese.")
      : tt("pdf.attachedBoth", "Fletët teknike të panelit dhe inverterit janë bashkëngjitur në faqet vijuese."),
    40, 790, 8, false, muted
  );
  text(tt("pdf.email", "contact@hisolenergy.com"), 40, 805, 9, true, blue);
  text(tt("pdf.website", "hisolenergy.com"), 438, 805, 9, true, blue);

  // Append manufacturer datasheets (panel always; inverter only when a model is confirmed).
  const attachments = [
    { label: `${result.panelBrand} ${result.panelModel}`, path: result.panelDatasheet },
    ...(result.inverterIsCustom
      ? []
      : [{ label: `${result.inverterBrand} ${result.inverterModel}`, path: result.inverterDatasheet }]),
  ];
  for (const attachment of attachments) {
    const res = await fetch(attachment.path);
    if (!res.ok) throw new Error(tt("pdf.datasheetLoadError", `Datasheet-i ${attachment.label} nuk u ngarkua.`).replace("{label}", attachment.label));
    const sourceDoc = await PDFDocument.load(await res.arrayBuffer());
    const pages = await doc.copyPages(sourceDoc, sourceDoc.getPageIndices());
    pages.forEach((p) => doc.addPage(p));
  }

  doc.setTitle(`${tt("pdf.docTitle", "Ofertë orientuese hiSol")} - ${formatDecimal(result.installedKwp, locale)} kWp`);
  doc.setAuthor(tt("pdf.docAuthor", "hiSol Energy"));
  doc.setSubject(tt("pdf.docSubject", "Ofertë orientuese dhe fletë teknike të pajisjeve"));
  doc.setCreator(tt("pdf.docCreator", "hiSol Solar Calculator"));

  const bytes = await doc.save({ useObjectStreams: false });
  const filenamePrefix = tt("pdf.filenamePrefix", "hiSol Oferte");
  const cleanName = sanitizeFilenamePart(clientName.trim());
  const filename = `${filenamePrefix}${cleanName ? ` ${cleanName}` : ""} ${formatDecimal(result.installedKwp, locale).replace(",", ".")}kWp.pdf`;

  // On phones, a blob: URL doesn't actually download — the browser just opens it
  // as a page, and sharing that page from there drags along the raw blob: link
  // as text. Sharing the real File through the native share sheet avoids both:
  // one tap gets a clean PDF attachment (Save to Files, WhatsApp, AirDrop, ...).
  // Desktop Safari/Chrome also implement navigator.share (e.g. for AirDrop), but
  // there a direct download is what people expect, so this is gated to touch
  // devices (maxTouchPoints also flags iPadOS, which reports as "Macintosh").
  const isTouchDevice = navigator.maxTouchPoints > 1 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const file = new File([bytes], filename, { type: "application/pdf" });
  if (isTouchDevice && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
}
