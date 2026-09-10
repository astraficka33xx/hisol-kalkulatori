import { calculateSystem, MONTH_NAMES } from "./calculator.js";
import { formatNumber, formatDecimal, formatYears } from "./format.js";
import { PRODUCT_CATALOG } from "./catalog.js";

const ROOF_LABELS = {
  sandwich: "Çati panel sandwich",
  terrace: "Terracë e sheshtë",
  tile: "Çati me tjegulla",
  ground: "Në tokë",
};

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

function buildSummaryText(result, name) {
  const forWhom = state.customer === "familjar" ? "shtëpinë time" : "biznesin tim";
  const placement = ROOF_LABELS[state.roof].toLowerCase();
  const sizingClause = state.method === "fatura"
    ? `me faturë mesatare rreth ${formatNumber(state.monthlyBill)} lekë/muaj dhe ${placement}`
    : `me ${placement} dhe fuqi të kërkuar rreth ${formatDecimal(state.desiredKwp)} kWp`;
  const equipmentClause = `${result.panelCount} panele ${result.panelBrand}${result.inverterIsCustom ? "" : ` + inverter ${result.inverterBrand}`}`;
  const priceClause = result.priceWithVat
    ? `me çmim orientues rreth ${formatNumber(result.priceWithVat)} lekë me TVSH`
    : "si projekt të personalizuar (kërkon çmim të veçantë)";

  const intro = name
    ? `Jam ${name}. Bëra një llogaritje te kalkulatori juaj dhe doja më tepër informacion.`
    : "Përshëndetje hiSol! Bëra një llogaritje te kalkulatori juaj dhe doja më tepër informacion.";

  const lines = [
    intro,
    "",
    `Për ${forWhom}, ${sizingClause}, më doli një sistem rreth ${formatDecimal(result.installedKwp)} kWp (${equipmentClause}), ${priceClause}.`,
    "",
    "A mund të më ndihmoni me një verifikim teknik dhe ofertë të saktë? Faleminderit!",
  ];
  return lines.join("\n");
}

function renderChart(result) {
  const chart = el("monthlyChart");
  const max = Math.max(...result.monthlyProduction, 1);
  chart.innerHTML = "";
  result.monthlyProduction.forEach((value, i) => {
    const col = document.createElement("div");
    col.className = "chart__col";
    const bar = document.createElement("div");
    bar.className = "chart__bar";
    bar.style.height = `${Math.max((value / max) * 100, 2)}%`;
    bar.title = `${MONTH_NAMES[i]}: ${formatNumber(value)} kWh`;
    const label = document.createElement("span");
    label.className = "chart__label";
    label.textContent = MONTH_NAMES[i];
    col.appendChild(bar);
    col.appendChild(label);
    chart.appendChild(col);
  });
}

function render() {
  const result = currentResult();

  el("resultPrice").textContent = result.priceWithVat
    ? `${formatNumber(result.priceWithVat)} lekë`
    : "Sipas projektit";
  el("resultPriceCaption").textContent = result.priceWithVat
    ? "Çmim reference, i instaluar"
    : "Kërkon llogaritje teknike të dedikuar";

  el("resSystem").textContent = `${formatDecimal(result.installedKwp)} kWp`;
  el("resPanelCount").textContent = `${result.panelCount} panele`;
  el("resPanelModel").textContent = `${result.panelBrand} ${result.panelModel}`;
  el("resPanelWatts").textContent = `${result.panelWatts} W`;
  el("resInverter").textContent = result.inverterIsCustom
    ? "Sipas projektit"
    : `${result.inverterBrand} ${result.inverterModel}`;
  el("resInverterPhase").textContent = result.inverterIsCustom
    ? "Ende pa u konfirmuar"
    : result.inverterPhase === "monofazor" ? "Monofazor" : "Trefazor";
  el("resInverterCount").textContent = result.inverterIsCustom ? "—" : `${result.inverterUnitCount}`;
  el("resInverterTotalKw").textContent = result.inverterIsCustom ? "—" : `~${formatDecimal(result.estimatedAcKw)} kW AC`;
  el("resArea").textContent = `~${formatNumber(result.areaM2)} m²`;
  el("resProduction").textContent = `~${formatNumber(result.annualProduction)} kWh/vit`;
  el("resProductionRange").textContent = `${formatNumber(result.productionLow)}–${formatNumber(result.productionHigh)} kWh/vit`;

  const savingsRow = el("savingsRow");
  if (result.savingsLow && result.savingsHigh) {
    savingsRow.hidden = false;
    el("resSavings").textContent = `${formatNumber(result.savingsLow)}–${formatNumber(result.savingsHigh)} lekë/vit`;
    el("resPayback").textContent = `${formatYears(result.paybackFast)}–${formatYears(result.paybackSlow)} vjet`;
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

el("copySummaryBtn").addEventListener("click", async () => {
  const { summary } = render();
  const btn = el("copySummaryBtn");
  try {
    await navigator.clipboard.writeText(summary);
    btn.textContent = "U kopjua";
  } catch {
    btn.textContent = "S'u kopjua";
  }
  window.setTimeout(() => {
    btn.textContent = "Kopjo";
  }, 2200);
});

el("copyLinkBtn").addEventListener("click", async () => {
  const btn = el("copyLinkBtn");
  try {
    await navigator.clipboard.writeText(window.location.origin);
    btn.textContent = "Linku u kopjua ✓";
  } catch {
    btn.textContent = "S'u kopjua linku";
  }
  window.setTimeout(() => {
    btn.textContent = "Kopjo linkun për miqtë";
  }, 2200);
});

// --- Offer request (WhatsApp) -------------------------------------------

const HISOL_WHATSAPP_NUMBER = "355684377766"; // +355 684 377 766, no leading +, no spaces

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
    offerError.textContent = "Ju lutem plotësoni emrin dhe numrin e telefonit.";
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
  pdfGenerateBtn.textContent = "Po përgatitet PDF-ja...";
  try {
    const { downloadQuotePdf } = await import("./pdf.js");
    const { result } = render();
    await downloadQuotePdf({
      clientName: el("pdfClientName").value,
      clientLocation: el("pdfClientLocation").value,
      customer: state.customer,
      roof: state.roof,
      result,
    });
    pdfDialog.close();
  } catch (err) {
    pdfError.textContent = err instanceof Error ? err.message : "PDF-ja nuk u përgatit. Ju lutem provoni përsëri.";
    pdfError.hidden = false;
  } finally {
    pdfGenerateBtn.disabled = false;
    pdfGenerateBtn.textContent = "Shkarko PDF-në e plotë";
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
  link.textContent = "Shkarko datasheet-in";
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

// --- Init ------------------------------------------------------------------

el("year").textContent = String(new Date().getFullYear());
render();
