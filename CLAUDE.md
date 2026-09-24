# hiSol — kalkulatori fotovoltaik & faqja hisolenergy.com

Faqe statike (HTML/CSS/JS vanilla, pa build-step, pa framework, pa `package.json`) për
`hisolenergy.com`. Remote i git-ut: `github.com/astraficka33xx/hisol-kalkulatori`, branch `main`.

## Struktura e projektit

```
index.html          Faqja kryesore (hero, shërbimet, "si funksionon", modelet, OG/Twitter meta tags)
blog.html            Blogu
i18n.js              Motori i përkthimit SQ/EN i përbashkët (shih poshtë)
CNAME                Domain-i custom i GitHub Pages: hisolenergy.com
kalkulatori/
  index.html          Aplikacioni i kalkulatorit (UI, dialogët: ofertë WhatsApp, PDF, modele, instalim)
  css/styles.css       Stilet e kalkulatorit (dark mode via media query, lime si theme-color aksent)
  js/
    app.js             Lidh UI-në me calculator.js: state, render(), dialogët, WhatsApp, PDF, install prompt
    calculator.js       Motori i llogaritjeve: çmimi, panelet, inverterët (shih poshtë)
    catalog.js          Katalogu i sheshtë i produkteve (dialogu "Modelet tona") — display-only,
                         NUK ndikon në logjikën e calculator.js
    pdf.js              Ndërton PDF-në e ofertës me pdf-lib (shih poshtë)
    format.js           Formatim numrash/datash sipas locale "sq-AL"
  vendor/pdf-lib.min.js  Libraria pdf-lib (embed lokal, jo CDN)
  datasheets/            PDF-të origjinale të prodhuesve (panele + inverterë), bashkëngjiten te oferta
  assets/                Logo, ikona app (favicon, apple-touch-icon, app-icon 180/192/512), OG image
  manifest.webmanifest    PWA manifest (emri "hiSol – Kalkulatori Solar", standalone, tema #1429c2)
  sw.js                   Service worker (cache-i i app-it, shih poshtë)
```

## Kalkulatori (`kalkulatori/js/calculator.js`)

Funksioni kryesor `calculateSystem({ customer, method, roof, monthlyBill, desiredKwp })`.
Komenti në krye të skedarit thotë shprehimisht: **mos i ndrysho formulat/numrat pa e
konfirmuar me hiSol** — janë tarifat/çmimet e vitit 2026 dhe supozimet e prodhimit.

**Hyrjet:**
- `customer`: `"familjar"` | `"biznes"`
- `method`: `"fatura"` (nga fatura mujore) | `"fuqia"` (fuqi e kërkuar direkt në kWp)
- `roof`: `"sandwich"` | `"terrace"` | `"tile"` | `"ground"` — përdoret vetëm për faktorin e hapësirës (m²)

**Përzgjedhja e panelit** (`CONFIG.panels`):
- Instalime deri **7 kWp referencë** (ose çdo çati `tile`, pavarësisht madhësisë) → paneli
  rezidencial JA Solar JAM54D41-455/LB, 455 W
- Mbi 7 kWp (jo-tile) → paneli komercial Jinko Solar JKM730N-66HL5-BDV, 730 W

**Çmimi** (`calculatePriceWithVat`, me TVSH 20%, tiers sipas `requestedKwp`):
| Kufiri (kWp kërkuar) | Lek/kWp |
|---|---|
| ≤ 50 | 37,000 |
| 51–99 | 35,000 |
| 100–299 | 32,000 |
| ≥ 300 | 30,000 |

Ka një "floor" (`boundaryPrice`) që siguron çmimi të mos bjerë vetëm sepse sistemi kaloi
në një tier më të lirë pak mbi kufirin — çmimi minimal është ai i kufirit të mëparshëm.
Mbi `maximumPricedKwp` (480 kWp) çmimi kthehet `null` → "sipas projektit".

**Përzgjedhja e inverterit** (`INVERTER_TIERS`, `selectInverter`): fuqia DC pjesëtohet me
1.12 (derating) për të marrë kW AC, pastaj përputhet me tier-in përkatës — **gjithmonë 1
inverter i vetëm** (s'ka më paralelizim/kombinim njësish, hequr kur u shtua Growatt):
| Tier | Marka/modeli | Fazë | Range AC kW | Hapat |
|---|---|---|---|---|
| deye-monofazor | Deye SUN-{kw}K-G05P1-EU-AM2 | monofazor | 0–6.2 | 3.6, 4, 4.2, 4.6, 5, 5.2, 6, 6.2 |
| solis-eh3p | Solis S6-EH3P{kw}K02-NV-YD-L | trefazor | 6.2–18 | 5, 6, 8, 10, 12, 15, 18 |
| growatt-mod-17-33 | Growatt MOD {kw}KTL3-X3 | trefazor | 18–33 | 20, 25, 30, 33 |
| growatt-mid-36-60 | Growatt MID {kw}KTL3-X3 | trefazor | 33–60 | 36, 40, 50, 60 |
| solis-trefazor-50-75 | Solis S6-GC{kw}K-LV | trefazor | 60–75 | 75 |
| solis-trefazor-80-125 | Solis S6-GC{kw}K | trefazor | 75–125 | 80, 100, 110, 125 |

Rregull eksplicit në kod: **asnjë Deye trefazor** në kalkulator — çdo nevojë trefazore mbi
tavanin e Deye monofazor (6.2 kW AC) kalon te Solis EH3P, e mbi 18 kW AC te Growatt (zgjedhje
e konfirmuar nga hiSol, shtator 2026, për të shmangur paralelizimin e disa Solis EH3P).
Mbi 125 kW AC → `isCustom: true` (s'ka model të supozuar, thjesht "përcaktohet në projekt").

**Kursimet/payback**: llogariten vetëm kur `method === "fatura"` dhe ka çmim (jo custom).
Tarifa e energjisë: biznes fiks 16.8 lek/kWh; familjar 10.2 ose 11.4 lek/kWh sipas nivelit
të faturës (pragu 700 lekë ekuivalent). Auto-konsumi: 45% familjar, 72% biznes.

## Katalogu i produkteve (`catalog.js`)

Listë e sheshtë, vetëm për shfaqje në dialogun "Modelet tona" — **nuk ndikon** te
llogaritjet. Çdo entry duhet të ketë datasheet-in përkatës nën `kalkulatori/datasheets/`.

## Gjenerimi i PDF-ve (`kalkulatori/js/pdf.js`)

`downloadQuotePdf({ clientName, clientLocation, customer, roof, result })` ndërton me
**pdf-lib** (vendor lokal, jo CDN):
1. Faqe A4 njëshe me: header me logo + datë, të dhënat e klientit (opsionale), sistemi i
   sugjeruar + investimi, tabela e konfigurimit, kursimi/payback (nëse llogaritet), paketa
   standarde e përfshirë, çfarë nuk përfshihet, kushtet/kontaktet.
2. Bashkëngjit datasheet-in e panelit (gjithmonë) dhe të inverterit (vetëm nëse modeli nuk
   është "custom") duke kopjuar faqet e PDF-ve origjinale nga `datasheets/`.
3. Shkarkimi: krijon blob URL, klikon `<a download>` me emrin
   `hiSol-Oferte[-<klienti-slug>]-<kWp>kWp.pdf`.

Trigger-i në UI: butoni "Shkarko ofertën PDF" → dialog për emër/vendndodhje opsionale →
"Shkarko PDF-në e plotë" (`app.js`, `pdfGenerateBtn`). **U testua manualisht dhe funksionon.**

## PWA / Service worker (`kalkulatori/sw.js`)

- Versionohet me konstanten `VERSION` (aktualisht `"hisol-v5"`) — **duhet rritur çdo herë
  që ndryshon një asset i precache-uar** (lista `PRECACHE_URLS`: HTML/CSS/JS/vendor/manifest/
  ikonat), përndryshe klientët mbeten me cache të vjetër. Historiku i git-ut e konfirmon këtë
  praktikë (commits "Bump service worker version" pas ndryshimeve të tjera).
- Navigimet: network-first me fallback te `index.html` nga cache kur offline.
- Gjithçka tjetër (assets, datasheets, vendor): cache-first, popullohet runtime cache.
- Instalimi si app: `app.js` dëgjon `beforeinstallprompt`/`appinstalled` dhe menaxhon
  dialogun "Shto hiSol në celular".

## Widget "Dielli live" (`index.html`)

Kartë në faqen kryesore që shfaq pozicionin e diellit (lindje/perëndim, llogaritur
astronomikisht nga gjerësia gjeografike e Tiranës) dhe një vlerësim të kWh/kWp të prodhuar
"sot". Që nga shtatori 2026, kjo është **varësia e parë e jashtme (API)** e faqes — më parë
gjithçka ishte plotësisht statike:
- Në `load` dhe çdo 15 min, bën `fetch` te **Open-Meteo** (falas, pa çelës, CORS i hapur) për
  rrezatimin diellor orë-për-orë të Tiranës (`shortwave_radiation`), dhe e shndërron në
  kWh/kWp me një faktor performance (`0.8`).
- **Fallback i domosdoshëm**: nëse `fetch`-i dështon (offline, API poshtë, bllokuar nga
  rrjeti) kthehet automatikisht te modeli astronomik i vjetër (mesatarja vjetore 1300
  kWh/kWp/vit e shpërndarë si kurbë kosinusi gjatë ditës) — widget-i s'thyhet kurrë, thjesht
  humbet saktësinë e motit real. Teksti i notës (`#sunNote`) ndryshon sipas burimit aktual.
- Pozicioni i diellit në hark (SVG) dhe ora rifreskohen çdo 30s pavarësisht nga API-ja (nuk
  varen prej saj).

## Publikimi (deploy)

S'ka workflow CI/CD (`.github/workflows` nuk ekziston) dhe s'ka build-step apo bundler.
Prania e `CNAME` (domain custom `hisolenergy.com`) tregon se faqja publikohet me
**GitHub Pages**; historiku i git-ut tregon commits direkt në `main` që reflektohen si
publikime (p.sh. "Bump service worker version" pas ndryshimeve në cache). D.m.th. deploy =
`git push` në `main` — s'ka hap ndërmjetës të verifikuar në repo. *(Konfirmo në GitHub repo
settings → Pages nëse do siguri të plotë mbi branch-in burimor.)*

**MOS bëj push në `main` pa konfirmim eksplicit të përdoruesit** — çdo push publikon direkt
faqen live.

## Mënyra e punës me Claude Code (workflow për sesionet e ardhshme)

Përdoruesi punon vetëm nga biseda te Claude (Claude Code Cloud), pa komanda teknike, njësoj
si nga kompjuteri i zyrës. Për **çdo kërkesë ndryshimi** në faqe ose kalkulator, Claude duhet
të ndjekë këtë procedurë, pa e kërkuar përdoruesi ta përsërisë:

1. **Sinkronizim**: `git fetch origin main` dhe konfirmo se branch-i i punës është i azhurnuar
   me `origin/main` (ose bazohu mbi versionin më të fundit të tij) përpara se të fillosh.
2. **Ndryshim i fokusuar**: bëj vetëm atë që kërkohet, pa prekur pjesë të tjera të kodit/UI-së
   që nuk lidhen me kërkesën.
3. **Testim**: verifiko manualisht (p.sh. me server lokal/browser për UI, ose kontroll logjik
   për `calculator.js`/`pdf.js`) që ndryshimi funksionon dhe që funksionalitetet ekzistuese
   (kalkulimi, PDF, WhatsApp, instalimi PWA, etj.) nuk janë prishur.
4. **Raportim i shkurtër**: pas çdo ndryshimi, trego shkurtimisht çfarë u ndryshua (skedarët/
   pjesët prekura), pa detaje teknike të panevojshme.

**Publikimi (kur përdoruesi e kërkon shprehimisht):**
- Bëj commit të ndryshimeve në branch-in e punës dhe hape (ose përditëso) një Pull Request
  drejt `main`.
- Nëse ke leje mjaftueshme në repo (`astraficka33xx/hisol-kalkulatori`), bashkoje (merge) PR-në
  vetë drejt `main` — kjo publikon faqen live nëpërmjet GitHub Pages.
- Nëse merge-i dështon për shkak lejesh/konfliktesh që s'i zgjidh dot vetë, mos e lër të
  papërfunduar në heshtje: trego saktësisht te GitHub ku duhet të klikojë përdoruesi (linku i
  PR-së dhe butoni "Merge pull request").
- Puna s'konsiderohet e mbyllur derisa të verifikohet që ndryshimi është shfaqur realisht në
  `hisolenergy.com` (p.sh. duke kontrolluar commit-in e fundit të publikuar në GitHub Pages
  ose vetë faqen live).
- Rregulli ekzistues mbetet në fuqi: **asnjë push/merge në `main` pa konfirmim eksplicit** —
  kërkesa e përdoruesit "publikoje" në atë moment shërben si konfirmim.

## Stili i commit-eve (nga `git log`)

Titull i shkurtër, mënyra urdhërore, në anglisht, pa prefiks tipi (jo Conventional
Commits), pa referenca ticket-esh. Shembuj nga historiku: "Update default WhatsApp message
text", "Bump service worker version", "Fix Albanian diacritics (e with breve) in OG image
text", "Add Open Graph and Twitter Card meta tags".

## Gjuha dhe lokalizimi

**Shqipja mbetet gjithmonë burimi i vërtetë (source of truth)** — çdo tekst statik në HTML
është shqip, i shkruar direkt në markup; anglishtja është vetëm një "overlay" i shtuar nga
`i18n.js` sipër tij. Mesazhi i WhatsApp-it (`buildSummaryText` te `app.js`) hiqet qëllimisht
nga diakritikat (`ë`→`e`, `Ë`→`E`) **vetëm kur gjuha aktuale është shqip**; për anglisht
diakritika s'ka kuptim, kështu që hiqet ai hap.

### Toggle SQ/EN (`i18n.js`, shtator 2026)

Buton "EN"/"SQ" (`data-lang-toggle`) në krye të `index.html`, `blog.html` dhe
`kalkulatori/index.html`. Zgjedhja ruhet në `localStorage` (`hisol-lang`) dhe vlen për të
tria faqet (i njëjti origin). **`calculator.js` s'është prekur fare** — vetëm teksti/etiketat
ndryshojnë, jo formulat/numrat.

**Si funksionon** (`i18n.js`, skript i sheshtë — jo modul — i ngarkuar nga të tria faqet,
`../i18n.js` nga brenda `kalkulatori/`):
- Çdo element me `data-i18n="kyçi"` përkthehet: `i18n.js` **cache-on tekstin origjinal shqip**
  (`el.dataset.i18nOriginal`) herën e parë që e prek, pastaj kur gjuha është `en` vendos
  vlerën përkatëse nga fjalori i brendshëm `en`; kur gjuha kthehet `sq`, thjesht **rikthen**
  tekstin e cache-uar — s'ka fjalor të veçantë shqip për ta mbajtur në sinkron.
- `data-i18n-html` mbi të njëjtin element: përdor `innerHTML` në vend të `textContent` (për
  tekst me `<strong>`/`<em>`/`<br>` brenda). **Kujdes**: mos vendos `data-i18n` (as html as
  jo) mbi një element që ka BRENDA vetes një tjetër element me `data-i18n` — i pari
  (prindi) e fshin të dytin kur bën `innerHTML =`. Nëse duhet `<strong>` brenda një fjalie
  të përkthyer, përfshije `<strong>...</strong>` direkt te vlera EN e fjalisë, jo si element
  i veçantë me `data-i18n` të vetin.
- `data-i18n-placeholder` / `data-i18n-aria-label`: njësoj, por për atributin `placeholder`
  a `aria-label` në vend të tekstit të dukshëm.
- Tekst i përzier me ikona SVG brenda së njëjtës fjali (p.sh. hero lead me një `<svg>` diell
  në mes): **ndaje në `<span data-i18n>` të veçantë** për çdo pjesë tekst-only, lëre SVG-në
  jashtë çdo span-i të përkthyer.
- `window.HiSolI18n` global: `getLang()`, `setLang(lang)`, `t(key)` (kthen `null` kur gjuha
  është `sq` — përdoret nga `app.js`/`pdf.js` për tekst që gjenerohet nga JS, jo nga HTML
  statik), `dictionary` (objekti i plotë `en`, lexohet direkt nga `pdf.js`).
- Ngjarja `hisol:langchange` hidhet në `window` sa herë ndërrohet gjuha — `app.js` e dëgjon
  për të rikthirë `render()` (rezultatet, grafiku, mesazhi WhatsApp) dhe etiketat e butonave.

**Tekst i gjeneruar nga JS** (jo në HTML, s'e prek `i18n.js` automatikisht):
- `kalkulatori/js/app.js`: `render()`, `buildSummaryText()` (mesazhi WhatsApp — version i
  plotë i veçantë anglisht, jo thjesht fjalë-për-fjalë), gjendjet e butonave (Kopjo/Copied),
  emrat e muajve në grafik (`EN_MONTH_NAMES`, pasi `MONTH_NAMES` nga `calculator.js` mbetet
  shqip pa u prekur). Përdor helper-in lokal `t(key, fallback)`.
- `kalkulatori/js/pdf.js`: PDF-ja pranon `lang` (`"sq"` default | `"en"`, kalon nga `app.js`
  sipas `HiSolI18n.getLang()`), lexon `window.HiSolI18n.dictionary.pdf.*` direkt (jo DOM,
  pasi PDF-ja nuk ka HTML). Data e PDF-së formatohet `en-GB` (DD/MM/YYYY) në anglisht, `sq-AL`
  në shqip.
- `kalkulatori/js/format.js`: `formatNumber`/`formatDecimal`/`formatYears` pranojnë tani një
  parametër opsional `locale` (default `"sq-AL"`, i pandryshuar) — `app.js`/`pdf.js` kalojnë
  `"en-GB"` kur gjuha është anglisht, që numrat të shfaqen si "12,000" jo "12.000".
- `index.html` (widget-i "Dielli live", skripti inline): `sunPhase`/`sunNote` kontrollojnë
  `window.HiSolI18n.getLang()` direkt (jo `t()`, s'importon module) dhe dëgjojnë
  `hisol:langchange` për rifreskim të menjëhershëm.

**Kur shton tekst të ri statik**: shto `data-i18n="namespace.kyçiRiNjohshëm"` te elementi
HTML (shqip mbetet vlera default e elementit), pastaj shto çelësin+vlerën anglisht te
`i18n.js` → `en.<namespace>.<kyçi>`. Namespaces ekzistuese: `nav`, `home` (faqja kryesore),
`sun`, `blog`, `calc` (kalkulatori), `pdf`.

**Testim i domosdoshëm pas çdo ndryshimi këtu**: hap faqen, shtyp toggle-in EN→SQ→EN disa
herë, dhe kontrollo (a) teksti anglisht del saktë, (b) kthimi në shqip **rikthen ekzaktësisht**
tekstin origjinal (asnjë humbje/prishje HTML-je), (c) asnjë gabim konsole.
