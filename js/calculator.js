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
      maxReferenceKwp: 20,
      watts: 455,
      areaM2: 1.998,
      brand: "JA Solar",
      model: "JAM54D41-455/LB",
      series: "DEEP BLUE 4.0 Pro",
      name: "JA Solar 455 W",
      datasheet: "datasheets/ja-solar-455w.pdf",
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
    // Every trefazor need above the Deye monofazor ceiling (6.2 kW AC) uses Solis
    // EH3P, per hiSol's explicit rule: no Deye trefazor in the calculator. A single
    // unit covers 6.2–18 kW AC (confirmed steps below); above 18 kW, units are
    // paralleled — the datasheet confirms "Support max 6 units in parallel" —
    // using only the 15K/18K models, per hiSol's choice, up to the 50 kW handoff
    // to Solis GC.
    id: "solis-eh3p",
    brand: "Solis",
    modelFamily: "S6-EH3P(5-18)K02-NV-YD-L",
    modelTemplate: "S6-EH3P{kw}K02-NV-YD-L",
    phase: "trefazor",
    minAcKw: 6.2,
    maxAcKw: 50,
    steps: [5, 6, 8, 10, 12, 15, 18],
    combo: true,
    comboUnitKw: [15, 18],
    comboMaxUnits: 6,
    datasheet: "datasheets/solis-eh3p-15-18kw-parallel.pdf",
  },
  {
    id: "solis-trefazor-50-75",
    brand: "Solis",
    modelFamily: "S6-GC(50-75)K-LV",
    modelTemplate: "S6-GC{kw}K-LV",
    phase: "trefazor",
    minAcKw: 50,
    maxAcKw: 75,
    steps: [50, 60, 75],
    datasheet: "datasheets/solis-trefazor-50-75kw.pdf",
  },
  {
    id: "solis-trefazor-80-125",
    brand: "Solis",
    modelFamily: "S6-GC(80-125)K",
    modelTemplate: "S6-GC{kw}K",
    phase: "trefazor",
    minAcKw: 75,
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

  if (requestedKwp <= 50) {
    pricePerKwp = 37000;
  } else if (requestedKwp <= 99) {
    pricePerKwp = 35000;
    floorPrice = boundaryPrice(50, 37000);
  } else if (requestedKwp < 300) {
    pricePerKwp = 32000;
    floorPrice = boundaryPrice(99, 35000);
  } else {
    pricePerKwp = 30000;
    floorPrice = boundaryPrice(299, 32000);
  }

  // The floor keeps the price from ever dropping just because a system crossed
  // into a cheaper-per-kWp tier at a slightly larger size.
  return Math.round(Math.max(installedKwp * pricePerKwp, floorPrice) / 1000) * 1000;
}

// Find the smallest total AC power (kW) achievable by combining up to `maxUnits`
// inverters drawn from `unitKwOptions`, that still covers `targetKw`. Ties on total
// power are broken by fewer units. Used for the confirmed "6 units in parallel"
// Solis EH3P tier — exhaustive since the search space is tiny (<= a few dozen combos).
function bestParallelCombo(unitKwOptions, maxUnits, targetKw) {
  let best = null;
  for (let unitCount = 1; unitCount <= maxUnits; unitCount++) {
    // Distribute unitCount inverters across the available kW options (2 options: 15/18).
    for (let countA = 0; countA <= unitCount; countA++) {
      const countB = unitCount - countA;
      const totalKw = countA * unitKwOptions[0] + countB * unitKwOptions[1];
      if (totalKw < targetKw) continue;
      if (!best || totalKw < best.totalKw) {
        best = {
          totalKw,
          unitCount,
          breakdown: [
            { kw: unitKwOptions[0], count: countA },
            { kw: unitKwOptions[1], count: countB },
          ].filter((u) => u.count > 0),
        };
      }
    }
  }
  return best;
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

  // A single confirmed unit covers it — no need to parallel multiple inverters.
  const singleStepFits = tier.steps.some((kw) => kw >= derated);
  if (tier.combo && !singleStepFits) {
    const combo = bestParallelCombo(tier.comboUnitKw, tier.comboMaxUnits, derated);
    const units = combo.breakdown.map((u) => ({
      model: tier.modelTemplate.replace("{kw}", String(u.kw)),
      kw: u.kw,
      count: u.count,
    }));
    const model = units.map((u) => `${u.count}× ${u.model}`).join(" + ");
    return {
      isCustom: false,
      brand: tier.brand,
      model,
      modelFamily: tier.modelFamily,
      phase: tier.phase,
      acKw: combo.totalKw,
      datasheet: tier.datasheet,
      unitCount: combo.unitCount,
      units,
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
