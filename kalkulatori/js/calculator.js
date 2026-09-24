// hiSol solar calculator — calculation engine.
// Ported 1:1 from the reference app (hisol-solar-calculator.anxhelo3.chatgpt.site).
// Do not change these numbers/formulas without checking with hiSol first —
// they encode the 2026 pricing tiers and production assumptions.

export const CONFIG = {
  minimumKwp: 3,
  maximumPricedKwp: 480,
  expectedYield: 1300, // kWh per kWp per year (mid estimate)
  lowYield: 1200,
  highYield: 1400,
  householdCoverage: 0.92,
  businessCoverage: 0.96,
  householdSelfConsumption: 0.45,
  businessSelfConsumption: 0.72,
  vat: 0.2,
  panels: {
    residential: {
      maxReferenceKwp: 7,
      watts: 455,
      areaM2: 1.998,
      brand: "JA Solar",
      model: "JAM54D40-455/LB",
      series: "DEEP BLUE 4.0 Pro",
      name: "JA Solar 455 W",
      datasheet: "datasheets/ja-solar-jam54d40-460w.pdf",
    },
    commercial: {
      watts: 730,
      areaM2: 3.105,
      brand: "Jinko Solar",
      model: "JKM730N-66HL5-BDV",
      series: "Tiger Neo",
      name: "Jinko Solar 730 W",
      datasheet: "datasheets/jinko-solar-730w.pdf",
    },
  },
  roofSpaceFactors: {
    sandwich: 1.12,
    terrace: 1.28,
    tile: 1.18,
    ground: 1.75,
  },
  // Relative monthly production share across the year (sums to ~100), used to
  // spread annual production into a monthly production chart.
  monthlyShare: [4.7, 5.7, 7.7, 9, 10.6, 11.3, 12, 11.4, 9.4, 7.6, 5.4, 4.4],
};

export const MONTH_NAMES = ["Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Kor", "Gsh", "Sht", "Tet", "Nën", "Dhj"];

// Confirmed hiSol inverter product scheme (brand/model/AC-power steps taken directly
// from manufacturer datasheets). Ordered by AC power range, low to high.
// hiSol rule (September 2026): Deye covers every installation up to 20 kWp installed
// (DC) — monofazor up to its own ceiling, trefazor above that; Solis takes over past
// 20 kWp installed. The 20 kWp (DC) cutoff is expressed here in AC terms via the same
// 1.12 derating used everywhere else, so it lines up with `derated` below.
const DEYE_TO_SOLIS_INSTALLED_KWP_CUTOFF = 20;
const DEYE_TO_SOLIS_AC_CUTOFF = DEYE_TO_SOLIS_INSTALLED_KWP_CUTOFF / 1.12;

export const INVERTER_TIERS = [
  {
    id: "deye-monofazor",
    brand: "Deye",
    modelFamily: "SUN-xK-G05P1-EU-AM2",
    modelTemplate: "SUN-{kw}K-G05P1-EU-AM2",
    phase: "monofazor",
    minAcKw: 0,
    maxAcKw: 6.2,
    steps: [3.6, 4, 4.2, 4.6, 5, 5.2, 6, 6.2],
    datasheet: "datasheets/deye-mono-3.6-6.2kw.pdf",
  },
  {
    // Fills the rest of the Deye zone (up to 20 kWp installed) with the trefazor
    // line, since its integer steps (7-15) cover the gap above the monofazor
    // ceiling with no missing sizes. The last step (15K) is also used, slightly
    // undersized, for the narrow 16.8-20 kWp band per hiSol's flat 20 kWp cutoff.
    id: "deye-trefazor",
    brand: "Deye",
    modelFamily: "SUN-xK-G06P3-EU-BM2-P1",
    modelTemplate: "SUN-{kw}K-G06P3-EU-BM2-P1",
    phase: "trefazor",
    minAcKw: 6.2,
    maxAcKw: DEYE_TO_SOLIS_AC_CUTOFF,
    steps: [7, 8, 9, 10, 12, 15],
    datasheet: "datasheets/deye-trefazor-3-15kw.pdf",
  },
  {
    id: "solis-gr3p",
    brand: "Solis",
    modelFamily: "S5-GR3P(12-25)K(21A)",
    modelTemplate: "S5-GR3P{kw}K(21A)",
    phase: "trefazor",
    minAcKw: DEYE_TO_SOLIS_AC_CUTOFF,
    maxAcKw: 25,
    steps: [20, 25],
    datasheet: "datasheets/solis-gr3p-12-25kw.pdf",
  },
  {
    id: "solis-gc3p-25-40",
    brand: "Solis",
    modelFamily: "S6-GC3P(25-40)K03-ND",
    modelTemplate: "S6-GC3P{kw}K03-ND",
    phase: "trefazor",
    minAcKw: 25,
    maxAcKw: 40,
    steps: [25, 30, 33, 36, 40],
    datasheet: "datasheets/solis-gc3p-25-40kw.pdf",
  },
  {
    id: "solis-gc3p-40-60",
    brand: "Solis",
    modelFamily: "S6-GC3P(40-60)K-ND",
    modelTemplate: "S6-GC3P{kw}K-ND",
    phase: "trefazor",
    minAcKw: 40,
    maxAcKw: 60,
    steps: [50, 60],
    datasheet: "datasheets/solis-gc3p-40-60kw.pdf",
  },
  {
    id: "solis-gc-80-125",
    brand: "Solis",
    modelFamily: "S6-GC(80-125)K",
    modelTemplate: "S6-GC{kw}K",
    phase: "trefazor",
    minAcKw: 60,
    maxAcKw: 125,
    steps: [80, 100, 110, 125],
    datasheet: "datasheets/solis-trefazor-80-125kw.pdf",
  },
];

// Effective electricity rate (lek/kWh) used for consumption/savings estimates.
function electricityRate(customerType, monthlyBill) {
  if (customerType === "biznes") return 16.8;
  const householdTierThreshold = 10.2;
  return monthlyBill / householdTierThreshold <= 700 ? householdTierThreshold : 11.4;
}

// Estimate annual consumption (kWh) implied by an average monthly bill.
function annualConsumptionFromBill(customerType, monthlyBill) {
  return (monthlyBill / electricityRate(customerType, monthlyBill)) * 12;
}

// Price at a given requested-kWp tier boundary, using the given price/kWp,
// with the installed kWp rounded up to a whole number of panels for that boundary.
function boundaryPrice(kwpThreshold, pricePerKwp) {
  const watts = kwpThreshold <= CONFIG.panels.residential.maxReferenceKwp
    ? CONFIG.panels.residential.watts
    : CONFIG.panels.commercial.watts;
  const roundedInstalledKwp = (Math.ceil((kwpThreshold * 1000) / watts) * watts) / 1000;
  return Math.round((roundedInstalledKwp * pricePerKwp) / 1000) * 1000;
}

// Tiered system price including VAT. Returns null for custom/oversized projects
// (above maximumPricedKwp) that need a bespoke quote.
function calculatePriceWithVat(requestedKwp, installedKwp) {
  if (requestedKwp > CONFIG.maximumPricedKwp) return null;

  let pricePerKwp;
  let floorPrice = 0;

  if (requestedKwp <= 20) {
    pricePerKwp = 39000;
  } else if (requestedKwp <= 50) {
    pricePerKwp = 38000;
    floorPrice = boundaryPrice(20, 39000);
  } else if (requestedKwp <= 99) {
    pricePerKwp = 36000;
    floorPrice = boundaryPrice(50, 38000);
  } else if (requestedKwp < 300) {
    pricePerKwp = 33000;
    floorPrice = boundaryPrice(99, 36000);
  } else {
    pricePerKwp = 31000;
    floorPrice = boundaryPrice(299, 33000);
  }

  // The floor keeps the price from ever dropping just because a system crossed
  // into a cheaper-per-kWp tier at a slightly larger size.
  return Math.round(Math.max(installedKwp * pricePerKwp, floorPrice) / 1000) * 1000;
}

// Choose the confirmed inverter model whose AC range actually covers the DC/AC-derated
// load. Returns { isCustom: true } (no brand/model guessed) for loads above the
// largest confirmed tier (125 kW AC).
function selectInverter(installedKwp) {
  const derated = installedKwp / 1.12;

  const tier = INVERTER_TIERS.find((t) => derated >= t.minAcKw && derated <= t.maxAcKw);
  if (!tier) {
    return {
      isCustom: true, brand: null, model: null, modelFamily: null, phase: null,
      acKw: null, datasheet: null, unitCount: null, units: null,
    };
  }

  const acKw = tier.steps.find((kw) => kw >= derated) ?? tier.steps[tier.steps.length - 1];
  return {
    isCustom: false,
    brand: tier.brand,
    model: tier.modelTemplate.replace("{kw}", String(acKw)),
    modelFamily: tier.modelFamily,
    phase: tier.phase,
    acKw,
    datasheet: tier.datasheet,
    unitCount: 1,
    units: [{ model: tier.modelTemplate.replace("{kw}", String(acKw)), kw: acKw, count: 1 }],
  };
}

/**
 * Main sizing/pricing calculation.
 * @param {{customer: 'familjar'|'biznes', method: 'fatura'|'fuqia', roof: 'sandwich'|'terrace'|'tile'|'ground', monthlyBill?: number, desiredKwp?: number}} input
 */
export function calculateSystem(input) {
  const { customer, method, roof } = input;
  const monthlyBill = Math.max(0, input.monthlyBill ?? 0);

  const annualConsumption = method === "fatura" && monthlyBill > 0
    ? annualConsumptionFromBill(customer, monthlyBill)
    : null;

  const coverage = customer === "familjar" ? CONFIG.householdCoverage : CONFIG.businessCoverage;
  const rawKwp = annualConsumption
    ? (annualConsumption * coverage) / CONFIG.expectedYield
    : Math.max(0, input.desiredKwp ?? 0);

  const minimumApplied = rawKwp < CONFIG.minimumKwp;
  const requestedKwp = Math.max(CONFIG.minimumKwp, rawKwp);

  const panelSet = roof === "tile" || requestedKwp <= CONFIG.panels.residential.maxReferenceKwp
    ? CONFIG.panels.residential
    : CONFIG.panels.commercial;

  const panelCount = Math.ceil((requestedKwp * 1000) / panelSet.watts);
  const installedKwp = (panelCount * panelSet.watts) / 1000;

  const annualProduction = installedKwp * CONFIG.expectedYield;
  const productionLow = installedKwp * CONFIG.lowYield;
  const productionHigh = installedKwp * CONFIG.highYield;

  const totalShare = CONFIG.monthlyShare.reduce((a, b) => a + b, 0);
  const monthlyProduction = CONFIG.monthlyShare.map((share) => (annualProduction * share) / totalShare);

  const inv = selectInverter(installedKwp);
  const estimatedAcKw = inv.acKw;
  const inverterBrand = inv.brand;
  const inverterModel = inv.model;
  const inverterPhase = inv.phase; // "monofazor" | "trefazor" | null
  const inverterDatasheet = inv.datasheet;
  const inverterIsCustom = inv.isCustom;
  const inverterUnitCount = inv.unitCount;
  const inverterUnits = inv.units;

  const inverter = inv.isCustom
    ? "Inverteri përcaktohet në projekt (ende pa model të konfirmuar për këtë fuqi)"
    : inv.unitCount > 1
      ? `${inv.unitCount} × inverterë ${inv.brand} (${inv.model}), ${inv.phase}, gjithsej rreth ${inv.acKw} kW AC`
      : `${inv.brand} ${inv.model} (${inv.phase}, rreth ${inv.acKw} kW AC)`;

  const priceWithVat = calculatePriceWithVat(requestedKwp, installedKwp);
  const priceWithoutVat = priceWithVat ? Math.round(priceWithVat / (1 + CONFIG.vat) / 1000) * 1000 : null;
  const effectiveRate = priceWithVat ? priceWithVat / installedKwp : null;
  const isCustom = priceWithVat === null;

  let savingsLow = null;
  let savingsHigh = null;
  let paybackFast = null;
  let paybackSlow = null;
  let householdRate = null;

  if (annualConsumption && priceWithVat) {
    const rate = electricityRate(customer, monthlyBill);
    householdRate = customer === "familjar" ? rate : null;
    const selfConsumptionFactor = customer === "familjar"
      ? CONFIG.householdSelfConsumption
      : CONFIG.businessSelfConsumption;

    const lowUsableKwh = Math.min(annualProduction * selfConsumptionFactor, annualConsumption);
    const highUsableKwh = Math.min(annualProduction, annualConsumption);

    savingsLow = lowUsableKwh * rate;
    savingsHigh = highUsableKwh * rate;
    if (savingsHigh > 0) paybackFast = priceWithVat / savingsHigh;
    if (savingsLow > 0) paybackSlow = priceWithVat / savingsLow;
  }

  const areaM2 = panelCount * panelSet.areaM2 * CONFIG.roofSpaceFactors[roof];

  return {
    requestedKwp,
    installedKwp,
    panelCount,
    panelName: panelSet.name,
    panelWatts: panelSet.watts,
    panelBrand: panelSet.brand,
    panelModel: panelSet.model,
    panelDatasheet: panelSet.datasheet,
    inverter,
    inverterBrand,
    inverterModel,
    inverterPhase,
    inverterDatasheet,
    inverterIsCustom,
    inverterUnitCount,
    inverterUnits,
    estimatedAcKw,
    areaM2,
    annualProduction,
    productionLow,
    productionHigh,
    monthlyProduction,
    annualConsumption,
    priceWithVat,
    priceWithoutVat,
    effectiveRate,
    savingsLow,
    savingsHigh,
    paybackFast,
    paybackSlow,
    isCustom,
    householdRate,
    minimumApplied,
  };
}
