import { calculateSystem, MONTH_NAMES } from "./calculator.js";
import { formatNumber, formatDecimal, formatYears } from "./format.js";
import { PRODUCT_CATALOG } from "./catalog.js";

const ROOF_LABELS = {
  sandwich: "Çati panel sandwich",
  terrace: "Terracë e sheshtë",
  tile: "Çati me tjegulla",
  ground: "Në tokë",
};

const EN_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Thin i18n helpers — Albanian text always stays the source/default (calculator.js
// and this file's own literals are never changed), English is an optional overlay
// provided by ../i18n.js when it's present and the visitor has switched to EN.
function isEn() {
  return Boolean(window.HiSolI18n && window.HiSolI18n.getLang() === "en");
}
function t(key, fallback) {
  const value = window.HiSolI18n && window.HiSolI18n.t(key);
  return value != null ? value : fallback;
}
function numLocale() {
  return isEn() ? "en-GB" : "sq-AL";
}
function fmtNumber(value) {
  return formatNumber(value, 0, numLocale());
}
function fmtDecimal(value) {
  return formatDecimal(value, numLocale());
}
function fmtYears(value) {
  return formatYears(value, numLocale());
}

const state = {
  customer: "familjar",
  method: "fatura",
  monthlyBill: 12000,
  desiredKwp: 10,
  roof: "sandwich",
};

const el = (id) => document.getElementById(id);

const form = el("calcForm");
const billField = el("billField");
const kwpField = el("kwpField");
const monthlyBillInput = el("monthlyBill");
const monthlyBillRange = el("monthlyBillRange");
const desiredKwpInput = el("desiredKwp");
const desiredKwpRange = el("desiredKwpRange");
const roofSelect = el("roof");

function currentResult() {
  return calculateSystem({
    customer: state.customer,
    method: state.method,
    roof: state.roof,
    monthlyBill: state.monthlyBill,
    desiredKwp: state.desiredKwp,
  });
}

function placementText() {
  if (isEn()) {
    const key = { sandwich: "calc.roofSandwich", terrace: "calc.roofTerrace", tile: "calc.roofTile", ground: "calc.roofGround" }[state.roof];
    return t(key, ROOF_LABELS[state.roof]).toLowerCase();
  }
  return ROOF_LABELS[state.roof].toLowerCase();
}

function buildSummaryText(result, name) {
  const placement = placementText();

  if (isEn()) {
    const forWhom = state.customer === "familjar" ? t("calc.whatsappForWhomHome", "my home") : t("calc.whatsappForWhomBusiness", "my business");
    const sizingClause = state.method === "fatura"
      ? t("calc.whatsappBillClause", "with an average bill of about {bill} lekë/month and {placement}").replace("{bill}", fmtNumber(state.monthlyBill)).replace("{placement}", placement)
      : t("calc.whatsappPowerClause", "with {placement} and a requested power of about {kwp} kWp").replace("{placement}", placement).replace("{kwp}", fmtDecimal(state.desiredKwp));
    const equipmentClause = result.inverterIsCustom
      ? t("calc.whatsappEquipment", "{count} {brand} panels").replace("{count}", result.panelCount).replace("{brand}", result.panelBrand)
      : t("calc.whatsappEquipmentWithInverter", "{count} {brand} panels + {invBrand} inverter").replace("{count}", result.panelCount).replace("{brand}", result.panelBrand).replace("{invBrand}", result.inverterBrand);
    const priceClause = result.priceWithVat
      ? t("calc.whatsappPriceWithVat", "with an indicative price of about {price} lekë including VAT").replace("{price}", fmtNumber(result.priceWithVat))
      : t("calc.whatsappPriceCustom", "as a custom project (requires a separate quote)");

    const intro = name
      ? t("calc.whatsappGreetingNamed", "Hello, my name is {name}. I ran a calculation on your calculator and would like more information.").replace("{name}", name)
      : t("calc.whatsappGreetingAnon", "Hello hiSol! I ran a calculation on your calculator and would like more information.");

    const body = t("calc.whatsappBody", "For {forWhom}, {sizingClause}, I got a system of about {installed} kWp ({equipment}), {priceClause}.")
      .replace("{forWhom}", forWhom)
      .replace("{sizingClause}", sizingClause)
      .replace("{installed}", fmtDecimal(result.installedKwp))
      .replace("{equipment}", equipmentClause)
      .replace("{priceClause}", priceClause);

    const lines = [intro, "", body, "", t("calc.whatsappClosing", "Could you help me with a technical check and an exact quote? Thank you!")];
    return lines.join("\n");
  }

  const forWhom = state.customer === "familjar" ? "shtëpinë time" : "biznesin tim";
  const sizingClause = state.method === "fatura"
    ? `me faturë mesatare rreth ${fmtNumber(state.monthlyBill)} lekë/muaj dhe ${placement}`
    : `me ${placement} dhe fuqi të kërkuar rreth ${fmtDecimal(state.desiredKwp)} kWp`;
  const equipmentClause = `${result.panelCount} panele ${result.panelBrand}${result.inverterIsCustom ? "" : ` + inverter ${result.inverterBrand}`}`;
  const priceClause = result.priceWithVat
    ? `me çmim orientues rreth ${fmtNumber(result.priceWithVat)} lekë me TVSH`
    : "si projekt të personalizuar (kërkon çmim të veçantë)";

  const intro = name
    ? `Përshëndetje, quhem ${name}. Bëra një llogaritje te kalkulatori juaj dhe doja më tepër informacion.`
    : "Përshëndetje hiSol! Bëra një llogaritje te kalkulatori juaj dhe doja më tepër informacion.";

  const lines = [
    intro,
    "",
    `Për ${forWhom}, ${sizingClause}, më doli një sistem rreth ${fmtDecimal(result.installedKwp)} kWp (${equipmentClause}), ${priceClause}.`,
    "",
    "A mund të më ndihmoni me një verifikim teknik dhe ofertë të saktë? Faleminderit!",
  ];
  return lines.join("\n").replace(/ë/g, "e").replace(/Ë/g, "E");
}

function renderChart(result) {
  const chart = el("monthlyChart");
  const max = Math.max(...result.monthlyProduction, 1);
  const months = isEn() ? EN_MONTH_NAMES : MONTH_NAMES;
  chart.innerHTML = "";
  result.monthlyProduction.forEach((value, i) => {
    const col = document.createElement("div");
    col.className = "chart__col";
    const bar = document.createElement("div");
    bar.className = "chart__bar";
    bar.style.height = `${Math.max((value / max) * 100, 2)}%`;
    bar.title = `${months[i]}: ${fmtNumber(value)} kWh`;
    const label = document.createElement("span");
    label.className = "chart__label";
    label.textContent = months[i];
    col.appendChild(bar);
    col.appendChild(label);
    chart.appendChild(col);
  });
}

function render() {
  const result = currentResult();
  const en = isEn();

  el("resultPrice").textContent = result.priceWithVat
    ? `${fmtNumber(result.priceWithVat)} lekë`
    : t("calc.priceCustom", "Sipas projektit");
  el("resultPriceCaption").textContent = result.priceWithVat
    ? t("calc.resultPriceCaption", "Çmim reference, i instaluar")
    : t("calc.resultPriceCaptionCustom", "Kërkon llogaritje teknike të dedikuar");

  el("resSystem").textContent = `${fmtDecimal(result.installedKwp)} kWp`;
  el("resPanelCount").textContent = en ? `${result.panelCount} panels` : `${result.panelCount} panele`;
  el("resPanelModel").textContent = `${result.panelBrand} ${result.panelModel}`;
  el("resPanelWatts").textContent = `${result.panelWatts} W`;
  el("resInverter").textContent = result.inverterIsCustom
    ? t("calc.inverterCustom", "Sipas projektit")
    : `${result.inverterBrand} ${result.inverterModel}`;
  el("resInverterPhase").textContent = result.inverterIsCustom
    ? t("calc.phaseUnconfirmed", "Ende pa u konfirmuar")
    : result.inverterPhase === "monofazor" ? t("calc.phaseSingle", "Monofazor") : t("calc.phaseThree", "Trefazor");
  el("resInverterCount").textContent = result.inverterIsCustom ? "—" : `${result.inverterUnitCount}`;
  el("resInverterTotalKw").textContent = result.inverterIsCustom ? "—" : `~${fmtDecimal(result.estimatedAcKw)} kW AC`;
  el("resArea").textContent = `~${fmtNumber(result.areaM2)} m²`;
  el("resProduction").textContent = en ? `~${fmtNumber(result.annualProduction)} kWh/year` : `~${fmtNumber(result.annualProduction)} kWh/vit`;
  el("resProductionRange").textContent = en
    ? `${fmtNumber(result.productionLow)}–${fmtNumber(result.productionHigh)} kWh/year`
    : `${fmtNumber(result.productionLow)}–${fmtNumber(result.productionHigh)} kWh/vit`;

  const savingsRow = el("savingsRow");
  if (result.savingsLow && result.savingsHigh) {
    savingsRow.hidden = false;
    el("resSavings").textContent = en
      ? `${fmtNumber(result.savingsLow)}–${fmtNumber(result.savingsHigh)} lekë/year`
      : `${fmtNumber(result.savingsLow)}–${fmtNumber(result.savingsHigh)} lekë/vit`;
    el("resPayback").textContent = en
      ? `${fmtYears(result.paybackFast)}–${fmtYears(result.paybackSlow)} years`
      : `${fmtYears(result.paybackFast)}–${fmtYears(result.paybackSlow)} vjet`;
  } else {
    savingsRow.hidden = true;
  }

  el("minimumNote").hidden = !result.minimumApplied;

  const summary = buildSummaryText(result);

  renderChart(result);

  return { result, summary };
}

// --- Form interactions -----------------------------------------------------

form.addEventListener("change", (e) => {
  const target = e.target;
  if (target.name === "customer") state.customer = target.value;
  if (target.name === "method") {
    state.method = target.value;
    billField.hidden = state.method !== "fatura";
    kwpField.hidden = state.method !== "fuqia";
  }
  if (target === roofSelect) state.roof = target.value;
  render();
});

function syncPair(numberInput, rangeInput, key, formatter = (v) => v) {
  numberInput.addEventListener("input", () => {
    const value = Number(numberInput.value) || 0;
    state[key] = value;
    rangeInput.value = String(value);
    render();
  });
  rangeInput.addEventListener("input", () => {
    const value = Number(rangeInput.value) || 0;
    state[key] = value;
    numberInput.value = formatter(value);
    render();
  });
}

syncPair(monthlyBillInput, monthlyBillRange, "monthlyBill");
syncPair(desiredKwpInput, desiredKwpRange, "desiredKwp");

// --- Copy summary ------------------------------------------------------

function resetActionButtonLabels() {
  el("copySummaryBtn").textContent = t("calc.copyBtn", "Kopjo");
  el("copyLinkBtn").textContent = t("calc.copyLinkBtn", "Kopjo linkun për miqtë");
  if (!pdfGenerateBtn.disabled) pdfGenerateBtn.textContent = t("calc.pdfGenerateBtn", "Shkarko PDF-në e plotë");
}

el("copySummaryBtn").addEventListener("click", async () => {
  const { summary } = render();
  const btn = el("copySummaryBtn");
  try {
    await navigator.clipboard.writeText(summary);
    btn.textContent = t("calc.copyBtnCopied", "U kopjua");
  } catch {
    btn.textContent = t("calc.copyBtnFailed", "S'u kopjua");
  }
  window.setTimeout(() => {
    btn.textContent = t("calc.copyBtn", "Kopjo");
  }, 2200);
});

el("copyLinkBtn").addEventListener("click", async () => {
  const btn = el("copyLinkBtn");
  try {
    await navigator.clipboard.writeText(window.location.origin);
    btn.textContent = t("calc.copyLinkCopied", "Linku u kopjua ✓");
  } catch {
    btn.textContent = t("calc.copyLinkFailed", "S'u kopjua linku");
  }
  window.setTimeout(() => {
    btn.textContent = t("calc.copyLinkBtn", "Kopjo linkun për miqtë");
  }, 2200);
});

// --- Offer request (WhatsApp) -------------------------------------------

const HISOL_WHATSAPP_NUMBER = "355698787999"; // +355 69 878 7999, no leading +, no spaces

const offerDialog = el("offerDialog");
const offerBtn = el("offerBtn");
const offerSubmitBtn = el("offerSubmitBtn");
const offerError = el("offerError");
const offerNameInput = el("offerName");
const offerPhoneInput = el("offerPhone");

offerBtn.addEventListener("click", () => {
  offerError.hidden = true;
  offerDialog.showModal();
});

offerSubmitBtn.addEventListener("click", () => {
  const name = offerNameInput.value.trim();
  const phone = offerPhoneInput.value.trim();
  if (!name || !phone) {
    offerError.textContent = t("calc.offerError", "Ju lutem plotësoni emrin dhe numrin e telefonit.");
    offerError.hidden = false;
    return;
  }
  offerError.hidden = true;

  const { result } = render();
  const message = buildSummaryText(result, name);
  const waUrl = `https://wa.me/${HISOL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank", "noopener");
  offerDialog.close();
  offerNameInput.value = "";
  offerPhoneInput.value = "";
});

// --- PDF dialog --------------------------------------------------------

const pdfDialog = el("pdfDialog");
const pdfBtn = el("pdfBtn");
const pdfGenerateBtn = el("pdfGenerateBtn");
const pdfError = el("pdfError");

pdfBtn.addEventListener("click", () => {
  pdfError.hidden = true;
  pdfDialog.showModal();
});

pdfGenerateBtn.addEventListener("click", async () => {
  pdfError.hidden = true;
  pdfGenerateBtn.disabled = true;
  pdfGenerateBtn.textContent = t("calc.pdfGenerating", "Po përgatitet PDF-ja...");
  try {
    const { downloadQuotePdf } = await import("./pdf.js");
    const { result } = render();
    await downloadQuotePdf({
      clientName: el("pdfClientName").value,
      clientLocation: el("pdfClientLocation").value,
      customer: state.customer,
      roof: state.roof,
      result,
      lang: isEn() ? "en" : "sq",
    });
    pdfDialog.close();
  } catch (err) {
    pdfError.textContent = err instanceof Error ? err.message : t("calc.pdfError", "PDF-ja nuk u përgatit. Ju lutem provoni përsëri.");
    pdfError.hidden = false;
  } finally {
    pdfGenerateBtn.disabled = false;
    pdfGenerateBtn.textContent = t("calc.pdfGenerateBtn", "Shkarko PDF-në e plotë");
  }
});

// --- Install app ---------------------------------------------------------

const installDialog = el("installDialog");
const installBtn = el("installBtn");
const installNowBtn = el("installNowBtn");
let deferredInstallPrompt = null;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

if (!isStandalone()) {
  installBtn.hidden = false;
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installNowBtn.hidden = false;
});

window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  deferredInstallPrompt = null;
});

installBtn.addEventListener("click", () => {
  installNowBtn.hidden = !deferredInstallPrompt;
  installDialog.showModal();
});

installNowBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installNowBtn.hidden = true;
});

document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
  btn.addEventListener("click", () => btn.closest("dialog")?.close());
});

// --- Our models catalog ----------------------------------------------------
// Flat, uniform product catalog — no grouping by usage or power tier (see catalog.js).

function catalogCard({ brand, model, power, datasheet }) {
  const card = document.createElement("div");
  card.className = "catalog-card";

  const brandEl = document.createElement("p");
  brandEl.className = "catalog-card__brand";
  brandEl.textContent = brand;

  const modelEl = document.createElement("p");
  modelEl.className = "catalog-card__model";
  modelEl.textContent = model;

  const powerEl = document.createElement("span");
  powerEl.className = "catalog-card__power";
  powerEl.textContent = power;

  card.append(brandEl, modelEl, powerEl);

  const link = document.createElement("a");
  link.className = "catalog-card__link";
  link.href = datasheet;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = t("calc.datasheetLink", "Shkarko datasheet-in");
  card.appendChild(link);

  return card;
}

function renderModelsCatalog() {
  const container = el("modelsContent");
  container.innerHTML = "";
  PRODUCT_CATALOG.forEach((product) => container.appendChild(catalogCard(product)));
}

const modelsDialog = el("modelsDialog");
el("modelsBtn").addEventListener("click", () => {
  renderModelsCatalog();
  modelsDialog.showModal();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

window.addEventListener("hisol:langchange", () => {
  resetActionButtonLabels();
  render();
  if (modelsDialog.open) renderModelsCatalog();
});

// --- Init ------------------------------------------------------------------

el("year").textContent = String(new Date().getFullYear());
render();
