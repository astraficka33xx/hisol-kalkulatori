// Shared SQ/EN language toggle for the whole site (hisolenergy.com + kalkulatori/).
// Static HTML text stays Albanian at the source (single source of truth); this file
// only holds the English overrides and swaps them in/out on top of the original text,
// which it caches on first run so switching back to "sq" is a lossless restore.
// Numbers/formulas are never touched here — this only ever changes display text.
(function () {
  var STORAGE_KEY = "hisol-lang";

  var en = {
    nav: {
      services: "Services",
      howItWorks: "How does it work?",
      models: "Models",
      blog: "Blog",
      calculator: "Calculator",
      contact: "Contact",
    },
    home: {
      heroEyebrow: "Solar energy",
      heroH1: "Produce energy,<br/>save on your <em>bill</em>.",
      heroLead1: "Solar panels for your home and business.",
      heroLead2: "High quality at affordable prices.",
      heroLead3: "With our calculator you get a clear system assessment and an indicative price in a few minutes, without wasting time waiting for phone calls or initial visits.",
      ctaCalc: "Calculate for free →",
      ctaWhatsapp: "Request an offer on WhatsApp",
      trust1: "Warranty up to 30 years",
      trust2: "Brands certified to European standards",
      trust3: "Response within 24 hours",
      sunLabel: "Live sun",
      sunLoc: "Tirana · 41.33°N",
      sunSentence1: "1 kWp of solar produces",
      sunSentence2: "today.",
      trustTitle1: "Certified equipment",
      trustBody1: "Panels from JA Solar, Jinko, Trina and LONGi; Deye and Solis inverters, matched to system power.",
      trustTitle2: "Price from the first minute",
      trustBody2: "The calculator immediately gives you the system power, equipment and an indicative price, no unnecessary phone calls.",
      trustTitle3: "Verified offer",
      trustBody3: "The final price is confirmed after a quick inspection of your property.",
      factsLabel: "Did you know?",
      fact1Title: "Panels produce energy even on cloudy days",
      fact1Body: "Even when the sky is overcast, panels keep producing energy. Output is lower than on sunny days, but it doesn't stop.",
      fact2Title: "High heat doesn't mean higher output",
      fact2Body: "Panels need light, not extreme temperatures. On sunny days with normal temperatures they work better than in extreme summer heat.",
      fact3Title: "Panels need very little maintenance",
      fact3Body: "Panels have no moving parts and usually don't need frequent servicing. In most cases an occasional clean, especially when there's a lot of dust, is enough.",
      moreFacts: "See more facts →",
      processLabel: "Process",
      processTitle: "From calculation to installation.",
      step1Title: "Calculate online",
      step1Body: "Enter your average bill or the power you want. The calculator immediately gives you the system, panels, inverter and an indicative price.",
      step2Title: "We inspect your property",
      step2Body: "We check the roof, electrical connection and structure, and finalize the offer together with you.",
      step3Title: "We install and monitor",
      step3Body: "Mounting, cabling and final connection by our team, plus monitoring and warranty per the equipment manufacturer's terms.",
      servicesLabel: "What we offer",
      service1Title: "Solar installation",
      service1Body: "Panels and inverters selected for the actual power needed, from residential systems to three-phase commercial installations.",
      service2Title: "Free technical assessment",
      service2Body: "We check your property, electrical connection and structure before finalizing the offer.",
      service3Title: "Support after installation",
      service3Body: "Monitoring and warranty per the manufacturer's terms, up to 30 years for panel output.",
      modelsLabel: "Our models",
      modelsTitle: "The world's most trusted panels and inverters.",
      modelsLead: "The full catalog of panels and inverters we use, each model with its own datasheet.",
      tabAll: "All",
      tabPanels: "Panels",
      tabInverters: "Inverters",
      datasheet: "Datasheet →",
      calcCtaTitle: "How much would your system cost?",
      calcCtaBody: "Enter your average bill or the power you want, and the calculator immediately gives you the system size, panels, inverter and an indicative price — no obligation.",
      calcOpen: "Open the calculator →",
      calcWhatsapp: "Write to us on WhatsApp",
      footerTagline1: "Solar panels for your home and business.",
      footerTagline2: "High quality at affordable prices.",
      footerPage: "Page",
      footerContact: "Contact",
      footerCalculator: "Calculator",
      footerDisclaimer: "Estimates are indicative, based on 2026 tariffs and approximate production for Albania.",
    },
    sun: {
      loading: "Loading…",
      beforeSunrise: "Before sunrise",
      afterSunset: "After sunset",
      noteFallback: "Estimate, not a real measurement.",
      noteReal: "Estimate from today's real irradiance.",
    },
    blog: {
      backHome: "← Back to home",
      title: "Solar energy.",
      conclusionTitle: "Conclusion",
      conclusionP1: "Solar energy isn't as complicated as it looks. With the right panels, a well-matched inverter and a good installation, a photovoltaic system can significantly cut your bill and run for many years.",
      conclusionP2: "The hiSol calculator gives you a first estimate. The final offer is confirmed after checking the property, the roof and the electrical connection.",
      brandsTitle: "Brands we work with",
      faqLabel: "Frequently asked questions",
      faqTitle: "What you should know before deciding.",
      ctaTitle: "How much would it cost for you?",
      ctaBody: "The calculator answers in under a minute, with no obligation.",
      ctaButton: "Calculate for free →",
      copyright: "© 2026 hiSol Energy",
      facts: [
        { h: "Panels still produce on cloudy days", p1: "Even when the sky is overcast, panels keep producing energy. Output is lower than on a sunny day, but production doesn't stop.", p2: "Thick clouds reduce output noticeably, while a day with light cloud can still give a decent amount of energy. That's why calculations are based on expected output across the whole year, not just fully sunny days." },
        { h: "Panels don't produce energy only at midday", p1: "Production starts in the early morning hours, rises through the day and gradually drops in the afternoon. Output usually peaks around midday, but the system works for several hours throughout the day.", p2: "This is especially useful for businesses that use energy during working hours." },
        { h: "kWp and kWh aren't the same thing", p1: "<strong>kWp</strong> shows the system's installed power. For example, a 6 kWp system has a certain production capacity under the best conditions.", p2: "<strong>kWh</strong> shows the amount of energy the system produces over a period, such as a day, month or year.", p3: "A simple way to understand it: kWp is the engine's power, while kWh is the work the engine has done over a period." },
        { h: "How much space does a system need?", p1: "In general, each 1 kWp needs about 4–4.5 m² of free roof space. This figure can vary depending on the panel's power and dimensions, as well as the mounting method.", p2: "For a residential system, usually a few dozen square meters of free roof are needed. Before installation, obstructions, chimneys, structures and areas that could cast shade are also checked." },
        { h: "Orientation and shading have a big impact on output", p1: "A roof with good sun orientation usually produces more energy. Just as important is avoiding shade from trees, buildings, chimneys or other objects.", p2: "Even a small shadow on a few panels can affect the output of the whole string. That's why a site inspection is necessary before the final offer." },
        { h: "Extreme heat doesn't help panels", p1: "Many people think the hotter the day, the more panels produce. In reality, panels mainly need light.", p2: "On a sunny day with normal temperature they can work better than on a very hot summer day. That's why bright but not overly hot days are often very good for production." },
        { h: "Panels have no moving parts", p1: "Panels have no motors, belts or rotating parts. This makes them simple to maintain and they usually don't need frequent servicing.", p2: "In most cases, occasional checks and cleaning when dust or dirt builds up are enough." },
        { h: "Panels don't stop working after a few years", p1: "Panels don't \"expire\" after a few years. Manufacturers guarantee power retention, usually up to 25 or 30 years, depending on the model and datasheet.", p2: "Over time, power decreases gradually, not suddenly. Even after many years the panel keeps producing energy, just at a slightly lower capacity." },
        { h: "What does the inverter do?", p1: "Panels produce energy as direct current. The inverter converts it into energy that can be used by home or business appliances.", p2: "It also monitors the system and helps energy be used safely and in a controlled way. That's why the inverter is just as important as the panels themselves." },
        { h: "What happens when the power grid goes down?", p1: "A standard grid-connected system temporarily stops when the electrical grid is interrupted. This is for safety, so that power doesn't feed back into the line while it's being repaired.", p2: "If you want power during outages too, a hybrid system with a battery is needed, and the appliances to keep active are usually defined in advance." },
        { h: "A solar battery stores energy for later", p1: "Panels produce more during the day, while some consumption may happen in the evening or at night. The battery stores the energy produced and uses it when the panels aren't producing.", p2: "Battery capacity is chosen based on the appliances you want to power and how long you need backup for." },
        { h: "Production varies by season", p1: "In summer there are usually more sunny hours, while in winter days are shorter and the weather can be cloudier. This means output isn't the same every month.", p2: "What matters is the expected output across the whole year, not just the result of one day or one month." },
        { h: "Some panels also produce from the back side", p1: "Bifacial panels can capture light from the back side too. This can bring extra output when the panel is placed above a surface that reflects light.", p2: "The benefit depends on the mounting method, the color of the surface and the space around the panel. That's why they don't give the same result on every roof." },
        { h: "Why are many panels black?", p1: "The black look comes from the cells and protective layers of the panel. Many people prefer it because it looks more modern and blends better with roofs.", p2: "Color, however, isn't the only thing that determines quality. More important are the model, power, performance, warranty and the manufacturer's datasheet." },
        { h: "What does payback period mean?", p1: "The payback period is the time it takes for the savings from solar energy to cover the system's initial cost.", p2: "This period depends on expected consumption, the price of energy, system size, how energy is used and grid conditions. After this period, the system keeps lowering your bill for as long as it runs." },
        { h: "The system should match your consumption", p1: "A bigger system isn't always the best solution. Size should match the energy you expect to consume, the roof space available and how energy is used during the day.", p2: "A household and a business may need different systems, even when the monthly bill amount looks the same." },
        { h: "Albania has very good conditions for solar energy", p1: "Albania has many sunny days throughout the year and good conditions for producing solar energy. That said, final output also depends on the city, orientation, tilt, shading and maintenance.", p2: "That's exactly why the calculator gives an initial estimate, while the final offer is set after a technical inspection." },
        { h: "Why is monitoring important?", p1: "With the monitoring app you can see how much energy the system is producing, how much it's using and whether there's any issue.", p2: "This helps you understand the system better and spot any change in output more quickly." }
      ],
      brands: [
        { h: "JA Solar", p1: "JA Solar is one of the largest and most experienced manufacturers in the solar panel industry, with modules installed in many countries around the world. The DEEP BLUE series uses modern manufacturing technology that increases energy output and reduces losses, backed by a long track record of reliability." },
        { h: "Jinko Solar", p1: "Jinko Solar is one of the world's best-known photovoltaic panel manufacturers and one of the main brands we use on hiSol projects. Tiger Neo series panels use modern N-type TOPCon technology, which helps increase output and maintain performance even at high temperatures.", p2: "They're suitable for residential and business systems, especially higher-power installations. Jinko Solar offers good yield, consistent quality and warranty per the relevant model." },
        { h: "Trina Solar", p1: "One of the pioneers of the solar industry, with powerful Vertex series modules and a well-known name in the market.", p2: "It's a suitable choice for projects that call for modern technology and long service life.", p3: "Trina Solar is one of the best-known brands in the photovoltaic industry." },
        { h: "LONGi", p1: "The world's largest manufacturer of monocrystalline wafers. The Hi-MO X series uses back-contact cells, which give higher efficiency and a cleaner look." },
        { h: "Deye", p1: "A well-known inverter brand, especially popular for hybrid and grid-tied residential systems, with a very good price-to-performance ratio." },
        { h: "Solis", p1: "One of the best-selling inverter brands in the world, with a range covering everything from residential systems to three-phase commercial and industrial installations." }
      ],
      faq: [
        { q: "Is the calculator's price final?", a: "No. The price is indicative, based on the calculated power. The final price is confirmed after a technical inspection of the property, structure and electrical connection." },
        { q: "What warranty do the panels have?", a: "Up to 30 years' warranty on power retention, per each model's manufacturer terms." },
        { q: "What does the standard installation include?", a: "The panels and inverter, the mounting structure, DC/AC cabling, electrical protection, grounding, monitoring and mounting. Battery, apps and a bidirectional meter aren't included automatically." },
        { q: "How long does an offer take?", a: "The calculator gives an instant estimate. After contact on WhatsApp, hiSol replies within 24 hours with next steps." },
        { q: "Why do we recommend Jinko and JA Solar?", a: "Jinko Solar and JA Solar are two of the largest and most technologically advanced manufacturers in the world, with millions of modules installed globally. Both invest continuously in the latest solar cell technology, which translates into higher output, strong performance even in Albania's summer heat, and consistent quality over the years. For this combination of quality and technology, hiSol has chosen them as its main brands for its installations." }
      ]
    },
    calc: {
      modelsBtn: "Our models",
      installBtn: "Add hiSol to your phone",
      copyLinkBtn: "Copy link for friends",
      copyLinkCopied: "Link copied ✓",
      copyLinkFailed: "Link copy failed",
      heroEyebrow: "HISOL SOLAR CALCULATOR",
      heroH1: "From your bill to the right system.",
      heroLead: "Get a clear assessment of the power, panels, production and investment. The final offer is confirmed after a technical inspection.",
      forWhomLabel: "Who is this for?",
      customerFamily: "Household",
      customerBusiness: "Business",
      methodLabel: "How would you like to calculate?",
      methodBill: "From my bill",
      methodPower: "From power",
      billLabel: "Average monthly bill",
      billUnit: "lekë / month",
      billSuffix: "LEKË",
      billHint: "Use your 12-month average and only the energy value, without late fees or penalties.",
      kwpLabel: "Requested power",
      roofLabel: "Where will the panels go?",
      roofSandwich: "Sandwich panel roof",
      roofTerrace: "Flat terrace",
      roofTile: "Tile roof",
      roofGround: "Ground-mounted",
      roofHint: "The structure type affects the space needed and the final offer; here the price stays indicative.",
      resultLabel: "INDICATIVE RESULT",
      resultBadge: "INCL. VAT",
      resultPriceCaption: "Indicative installed price",
      resultPriceCaptionCustom: "Requires a dedicated technical assessment",
      rowSystemPower: "Total system power",
      rowPanelCount: "Number of panels",
      rowPanel: "Panel",
      rowPanelWatts: "Panel power",
      rowInverter: "Inverter",
      rowInverterPhase: "Inverter phase",
      rowInverterCount: "Number of inverters",
      rowInverterTotalKw: "Total inverter power",
      rowArea: "Approximate area",
      rowProduction: "Expected production",
      rowProductionRange: "Production range",
      rowSavings: "Potential savings",
      rowPayback: "Payback period",
      minimumNote: "The result has been raised to the commercial minimum of 3 kWp.",
      explainTitle: "How were the savings calculated?",
      explainBody: "The low scenario values only directly-used energy. The high scenario is the theoretical ceiling. Credit for exported energy isn't promised as guaranteed savings.",
      offerBtn: "Request an exact offer",
      pdfBtn: "Download the offer PDF",
      copyBtn: "Copy",
      copyBtnCopied: "Copied",
      copyBtnFailed: "Copy failed",
      chartLabel: "PRODUCTION OVER THE YEAR",
      chartTitle: "Month by month",
      chartAriaLabel: "Monthly production",
      chartNote: "Production varies by city, orientation, tilt, shading and temperature. The final range is set in the project.",
      packageLabel: "STANDARD PACKAGE",
      packageTitle: "What's included",
      packageItems: [
        "Panels and inverter",
        "Standard mounting structure",
        "DC/AC cables and connectors",
        "DC/AC electrical protection",
        "Grounding and monitoring",
        "Mounting and installation",
        "Standard technical design"
      ],
      notIncludedTitle: "Not included automatically",
      notIncludedBody: "Battery, structural reinforcement, civil works, transformer, power upgrades and out-of-scope grid interventions.",
      equipmentBody: "<strong>Equipment</strong> — We use panels from leading international brands such as Jinko, Trina, JA Solar and LONGi, plus Deye inverters for small systems and Solis for larger three-phase systems. In the calculator: JA Solar 455 W is used up to 7 kWp. For systems above 7 kWp, Jinko panels are used automatically, regardless of roof type.",
      warrantyBody: "<strong>Warranty</strong> — Our panels come with a warranty of up to 30 years on power retention, per the manufacturer's terms and the relevant datasheet; the full product warranty is detailed separately in the offer.",
      finalOfferBody: "<strong>Final offer</strong> — Set after verifying the property, electrical connection and structure.",
      disclaimer: "Calculations are indicative, based on 2026 tariffs and typical production for Albania. An on-grid system doesn't power the property during a grid outage without a hybrid solution and battery.",
      footer: "hiSol Energy · contact@hisolenergy.com",
      installTitle: "Keep hiSol on your screen",
      installBody: "Open the calculator from the icon on your phone. Internet is required.",
      installNowBtn: "Install hiSol",
      installIphone: "<strong>iPhone:</strong> Open the link in Safari → Share → Add to Home Screen.",
      installAndroid: "<strong>Android:</strong> Open in Chrome → ⋮ menu → Install app or Add to Home screen.",
      installWarn: "If you opened this inside WhatsApp or Instagram, open it in a browser first.",
      closeBtn: "Close",
      offerTitle: "Request an exact offer",
      offerBody: "Leave your contact — WhatsApp will open with a ready-made message to hiSol, ready to send.",
      offerNameLabel: "Full name",
      offerPhoneLabel: "Phone number",
      offerError: "Please fill in your name and phone number.",
      cancelBtn: "Cancel",
      offerSubmitBtn: "Send on WhatsApp",
      pdfTitle: "Download the offer PDF",
      pdfBody: "Includes the system summary and the technical datasheets of the selected panel and inverter.",
      pdfClientNameLabel: "Client name (optional)",
      pdfClientLocationLabel: "Location (optional)",
      pdfGenerateBtn: "Download the full PDF",
      pdfGenerating: "Preparing PDF…",
      pdfError: "The PDF could not be prepared. Please try again.",
      modelsTitle: "Models we work with",
      modelsBody: "The full catalog of panels and inverters. The final price and configuration are confirmed after a technical inspection.",
      datasheetLink: "Download datasheet",
      priceCustom: "Custom quote",
      inverterCustom: "Determined in the project",
      inverterCustomNote: "Model confirmed during the technical inspection",
      phaseUnconfirmed: "Not yet confirmed",
      phaseSingle: "Single-phase",
      phaseThree: "Three-phase",
      whatsappGreetingNamed: "Hello, my name is {name}. I ran a calculation on your calculator and would like more information.",
      whatsappGreetingAnon: "Hello hiSol! I ran a calculation on your calculator and would like more information.",
      whatsappForWhomHome: "my home",
      whatsappForWhomBusiness: "my business",
      whatsappBillClause: "with an average bill of about {bill} lekë/month and {placement}",
      whatsappPowerClause: "with {placement} and a requested power of about {kwp} kWp",
      whatsappBody: "For {forWhom}, {sizingClause}, I got a system of about {installed} kWp ({equipment}), {priceClause}.",
      whatsappEquipment: "{count} {brand} panels",
      whatsappEquipmentWithInverter: "{count} {brand} panels + {invBrand} inverter",
      whatsappPriceWithVat: "with an indicative price of about {price} lekë including VAT",
      whatsappPriceCustom: "as a custom project (requires a separate quote)",
      whatsappClosing: "Could you help me with a technical check and an exact quote? Thank you!",
    },
    pdf: {
      title: "INDICATIVE OFFER",
      forClient: "For the client",
      location: "Location",
      suggestedSystem: "SUGGESTED SYSTEM",
      indicativeInvestment: "INDICATIVE INVESTMENT",
      priceCaptionVat: "Installed price, incl. VAT",
      priceCaptionCustom: "Requires a dedicated technical assessment",
      priceCustom: "PER PROJECT",
      configuration: "CONFIGURATION",
      customerType: "Client type",
      customerFamily: "Household",
      customerBusiness: "Business",
      placement: "Placement",
      inverter: "Inverter",
      inverterCustom: "Per project",
      inverterCustomNote: "Model confirmed during the technical inspection",
      phaseSingle: "Single-phase",
      phaseThree: "Three-phase",
      approxArea: "Approximate area",
      expectedProduction: "Expected production",
      productionRange: "Production range",
      savings: "POTENTIAL SAVINGS",
      payback: "PAYBACK PERIOD",
      packageTitle: "STANDARD PACKAGE INCLUDES",
      packageItems: [
        "Panels and inverter",
        "Standard mounting structure",
        "DC/AC cables and connectors",
        "DC/AC electrical protection",
        "Grounding and monitoring",
        "Mounting and installation",
        "Standard technical design"
      ],
      notIncludedTitle: "NOT INCLUDED AUTOMATICALLY",
      notIncludedBody1: "Battery, structural reinforcement, civil works, transformer, power upgrades",
      notIncludedBody2: "and out-of-scope grid interventions.",
      disclaimer1: "This estimate is not a final quote. Price and configuration are confirmed after a",
      disclaimer2: "technical inspection of the property, structure, electrical connection and documentation.",
      attachedPanelOnly: "The panel's datasheet is attached on the following pages.",
      attachedBoth: "The panel and inverter datasheets are attached on the following pages.",
      email: "contact@hisolenergy.com",
      website: "hisolenergy.com",
      roofLabels: {
        sandwich: "Sandwich panel roof",
        terrace: "Flat terrace",
        tile: "Tile roof",
        ground: "Ground installation",
      },
      docTitle: "hiSol indicative offer",
      docAuthor: "hiSol Energy",
      docSubject: "Indicative offer and equipment datasheets",
      docCreator: "hiSol Solar Calculator",
      filenamePrefix: "hiSol-Offer",
      datasheetLoadError: "The {label} datasheet could not be loaded.",
    },
  };

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "sq";
  }

  function resolve(obj, path) {
    return path.split(".").reduce(function (acc, part) {
      return acc && typeof acc === "object" ? acc[part] : undefined;
    }, obj);
  }

  function applyToElement(el, lang) {
    var key = el.getAttribute("data-i18n");
    if (!key) return;
    var isHtml = el.hasAttribute("data-i18n-html");
    if (el.dataset.i18nOriginal === undefined) {
      el.dataset.i18nOriginal = isHtml ? el.innerHTML : el.textContent;
    }
    if (lang === "sq") {
      if (isHtml) el.innerHTML = el.dataset.i18nOriginal;
      else el.textContent = el.dataset.i18nOriginal;
      return;
    }
    var value = resolve(en, key);
    if (value == null) return;
    if (isHtml) el.innerHTML = value;
    else el.textContent = value;
  }

  function applyToPlaceholder(el, lang) {
    var key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    if (el.dataset.i18nPlaceholderOriginal === undefined) {
      el.dataset.i18nPlaceholderOriginal = el.getAttribute("placeholder") || "";
    }
    if (lang === "sq") {
      el.setAttribute("placeholder", el.dataset.i18nPlaceholderOriginal);
      return;
    }
    var value = resolve(en, key);
    if (value != null) el.setAttribute("placeholder", value);
  }

  function applyToAriaLabel(el, lang) {
    var key = el.getAttribute("data-i18n-aria-label");
    if (!key) return;
    if (el.dataset.i18nAriaLabelOriginal === undefined) {
      el.dataset.i18nAriaLabelOriginal = el.getAttribute("aria-label") || "";
    }
    if (lang === "sq") {
      el.setAttribute("aria-label", el.dataset.i18nAriaLabelOriginal);
      return;
    }
    var value = resolve(en, key);
    if (value != null) el.setAttribute("aria-label", value);
  }

  function apply(lang) {
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "sq");
    document.querySelectorAll("[data-i18n]").forEach(function (el) { applyToElement(el, lang); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) { applyToPlaceholder(el, lang); });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) { applyToAriaLabel(el, lang); });
    document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
      btn.textContent = lang === "en" ? "SQ" : "EN";
      btn.setAttribute("aria-label", lang === "en" ? "Kalo në shqip" : "Switch to English");
    });
    window.dispatchEvent(new CustomEvent("hisol:langchange", { detail: { lang: lang } }));
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang === "en" ? "en" : "sq");
    apply(getLang());
  }

  function t(key) {
    var lang = getLang();
    if (lang === "sq") return null;
    return resolve(en, key);
  }

  function wireToggles() {
    document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(getLang() === "en" ? "sq" : "en");
      });
    });
  }

  window.HiSolI18n = { getLang: getLang, setLang: setLang, apply: apply, t: t, dictionary: en };

  function init() {
    wireToggles();
    apply(getLang());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
