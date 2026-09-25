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
  rezidencial JA Solar JAM54D40-455/LB, 455 W (ndryshuar nga JAM54D41 në shtator 2026, po
  ai model 455 W/1.998 m², thjesht revizion i ri i JA Solar)
- Mbi 7 kWp (jo-tile) → paneli komercial Jinko Solar JKM730N-66HL5-BDV, 730 W

**Çmimi** (`calculatePriceWithVat`, me TVSH 20%, tiers sipas `requestedKwp`):
| Kufiri (kWp kërkuar) | Lek/kWp |
|---|---|
| ≤ 20 | 39,000 |
| 21–50 | 38,000 |
| 51–99 | 36,000 |
| 100–299 | 33,000 |
| ≥ 300 | 31,000 |

Ka një "floor" (`boundaryPrice`) që siguron çmimi të mos bjerë vetëm sepse sistemi kaloi
në një tier më të lirë pak mbi kufirin — çmimi minimal është ai i kufirit të mëparshëm.
Mbi `maximumPricedKwp` (480 kWp) çmimi kthehet `null` → "sipas projektit".

**Përzgjedhja e inverterit** (`INVERTER_TIERS`, `selectInverter`): fuqia DC pjesëtohet me
1.12 (derating) për të marrë kW AC, pastaj përputhet me tier-in përkatës — **gjithmonë 1
inverter i vetëm** (s'ka paralelizim/kombinim njësish). Rregulli i hiSol (shtator 2026,
zëvendëson skemën e mëparshme me Growatt): **Deye deri në 20 kWp instaluar, Solis mbi 20
kWp** — kufiri `DEYE_TO_SOLIS_INSTALLED_KWP_CUTOFF = 20` (shprehur në AC si `20 / 1.12`):
| Tier | Marka/modeli | Fazë | Range AC kW | Hapat |
|---|---|---|---|---|
| deye-monofazor | Deye SUN-{kw}K-G05P1-EU-AM2 | monofazor | 0–6.2 | 3.6, 4, 4.2, 4.6, 5, 5.2, 6, 6.2 |
| deye-trefazor | Deye SUN-{kw}K-G06P3-EU-BM2-P1 | trefazor | 6.2–17.86 (20 kWp) | 7, 8, 9, 10, 12, 15 |
| solis-gr3p | Solis S5-GR3P{kw}K(21A) | trefazor | 17.86–25 | 20, 25 |
| solis-gc3p-25-40 | Solis S6-GC3P{kw}K03-ND | trefazor | 25–40 | 25, 30, 33, 36, 40 |
| solis-gc3p-40-60 | Solis S6-GC3P{kw}K-ND | trefazor | 40–60 | 50, 60 |
| solis-gc-80-125 | Solis S6-GC{kw}K | trefazor | 60–125 | 80, 100, 110, 125 |

Modeli më i madh Deye trefazor (15K AC ≈ 16.8 kWp instaluar) përdoret **pak nën fuqi** për
intervalin e ngushtë 16.8–20 kWp, që kufiri i plotë prej 20 kWp instaluar të respektohet
saktësisht (konfirmuar shprehimisht nga hiSol). Modelet Solis monofazor/trefazor më të vegjël
që bien plotësisht brenda zonës Deye (S6-GR1P(8-10)K, S5-GR3P poshtë 20 kWp instaluar) **s'i
përdor kalkulatori** — mbeten vetëm si referencë te katalogu (`catalog.js`), jo në
`INVERTER_TIERS`. **Growatt (MOD 17-33, MID 36-60) u hoq krejtësisht** (kalkulator, katalog,
faqja kryesore, datasheet-et) në shtator 2026 — jo më as referencë.
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

- Versionohet me konstanten `VERSION` (aktualisht `"hisol-v14"`) — **duhet rritur çdo herë
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

**MOS bëj push/merge në `main` pa konfirmim të dyfishtë (2 herë) të përdoruesit** — çdo push
publikon direkt faqen live. Kërkesa "publikoje" konsiderohet konfirmimi i parë; Claude duhet
të pyesë shprehimisht një herë të dytë (p.sh. "Të konfirmoj edhe një herë: ta bashkoj (merge)
PR-në në main tani, që të shkojë live?") dhe të presë përgjigjen përpara se të bëjë merge.

## Mënyra e punës me Claude Code (workflow për sesionet e ardhshme)

Përdoruesi punon vetëm nga biseda te Claude (Claude Code Cloud), pa komanda teknike, njësoj
si nga kompjuteri i zyrës. Për **çdo kërkesë ndryshimi** në faqe ose kalkulator, Claude duhet
të ndjekë këtë procedurë, pa e kërkuar përdoruesi ta përsërisë:

**Rregull themelor — konfirmim i dyfishtë përpara çdo ndryshimi**: Claude **s'bën asnjë
ndryshim** (asnjë skedar i prekur në disk, asnjë commit) pa u konfirmuar **2 herë** nga
përdoruesi, pavarësisht sa e vogël/e qartë duket kërkesa:
1. Kur vjen një kërkesë ndryshimi, Claude përshkruan shkurt çka do të bëjë (skedarët/sjelljen
   e prekur) dhe **pyet për konfirmimin e parë** — s'fillon të editojë asgjë ende.
2. Pasi përdoruesi konfirmon herën e parë, Claude **pyet edhe një herë të dytë** (konfirmim i
   qartë, i veçantë nga i pari — jo i njëjti mesazh i rilexuar) përpara se të prekë realisht
   ndonjë skedar.
3. Vetëm pas konfirmimit të dytë Claude vazhdon me hapat e mëposhtëm (sinkronizim, ndryshim,
   testim, raportim).
Ky rregull vlen për çdo ndryshim — kod, tekst, dizajn, dokumentacion (edhe CLAUDE.md) — pa
përjashtim, edhe nëse kërkesa e mëparshme e përdoruesit dukej sikur e lejonte automatikisht.
Kontrollet/auditimet **read-only** (p.sh. "bëj kontroll total", review sigurie, verifikim i
faqes live) **nuk kërkojnë** këtë konfirmim — vetëm veprimet që prekin skedarë ose bëjnë commit.

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
- Bëj commit të ndryshimeve në branch-in e punës (këto commits lokale/në branch s'kanë nevojë
  për konfirmimin e dyfishtë të publikimit — vetëm push/merge në `main` e kërkon) dhe hape
  (ose përditëso) një Pull Request drejt `main`.
- Para se të bësh merge në `main`, kërko **konfirmimin e dytë** shprehimisht (shih rregullin
  te "Publikimi (deploy)" më sipër) — edhe nëse përdoruesi tha "publikoje", kjo llogaritet
  vetëm konfirmimi i parë.
- Nëse ke leje mjaftueshme në repo (`astraficka33xx/hisol-kalkulatori`), pas konfirmimit të
  dytë bashkoje (merge) PR-në vetë drejt `main` — kjo publikon faqen live nëpërmjet GitHub
  Pages.
- Nëse merge-i dështon për shkak lejesh/konfliktesh që s'i zgjidh dot vetë, mos e lër të
  papërfunduar në heshtje: trego saktësisht te GitHub ku duhet të klikojë përdoruesi (linku i
  PR-së dhe butoni "Merge pull request").
- Puna s'konsiderohet e mbyllur derisa të verifikohet që ndryshimi është shfaqur realisht në
  `hisolenergy.com` (p.sh. duke kontrolluar commit-in e fundit të publikuar në GitHub Pages
  ose vetë faqen live).

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

### Motori SQ/EN (`i18n.js`, shtator 2026) — buton i dyfishtë sipas gjerësisë së ekranit

I gjithë motori i përkthimit (fjalori anglisht i plotë, hook-ët te `app.js`/`pdf.js`,
`format.js` me `locale` parametër) **funksionon plotësisht**. Dizajni i butonit u vendos pas
disa iterimesh (u refuzuan: buton pill "EN"/"SQ", ikonë globi vetëm te header-i në çdo
gjerësi) — versioni final ka **2 elementë të ndarë**, secili me `data-lang-toggle`, që
shfaqen/fshihen me media query sipas gjerësisë (**kufiri: 859/860px**, i njëjtë në të tria
faqet, jo domosdoshmërisht i lidhur me breakpoint-e të tjera ekzistuese të faqes):
- **`.lang-toggle--icon`** (≥860px, "PC/laptop"): buton rrethor, vetëm ikonë globi, pa
  tekst — te `index.html`/`blog.html` në `nav`/`topbar` pranë "Kalkulatori"/"Kthehu te
  faqja"; te `kalkulatori/index.html` te `.topbar__actions`, para "Modelet tona".
- **`.lang-toggle--footer`** (<860px, celular): ikonë globi + tekst "EN"/"SQ" (span
  `data-lang-toggle-text`, i ngjyrës neutrale `var(--muted)`, jo lime), gjithmonë pranë "©
  2026 hiSol Energy" te footer-i i çdo faqeje.
- `i18n.js` përditëson `aria-label` te **të gjithë** elementët `[data-lang-toggle]`
  njëkohësisht dhe tekstin "EN"/"SQ" te **të gjithë** `[data-lang-toggle-text]` — kështu të
  dy instancat (desktop+mobile) mbeten gjithmonë në sinkron, edhe pse vetëm një shfaqet në
  një moment. **Mos vendos tekst direkt te `textContent` i vetë butonit `data-lang-toggle`**
  (do të fshinte SVG-në e globit) — përdor `<span data-lang-toggle-text>` brenda.

Zgjedhja ruhet në `localStorage` (`hisol-lang`) dhe vlen për të tria faqet (i njëjti origin).
**`calculator.js` s'është prekur fare** — vetëm teksti/etiketat ndryshojnë, jo
formulat/numrat.

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

## Ridizajnimi i planifikuar i `blog.html` (dizajni i konfirmuar, shtator 2026 — **ende PA u
implementuar**)

hiSol ka dërguar 11 artikuj të gjatë (docx, ~700-900 fjalë secili, me nën-tituj H2/H3 dhe
lista) për të zëvendësuar 18 "fact"-et e shkurtëra aktuale të `blog.html`. Dizajni është
**konfirmuar** (pas disa iterimesh mbi një demo HTML që u dërgua te hiSol) si më poshtë, por
**mos e zbato ende** — hiSol ka thënë shprehimisht të presësh derisa të dërgojë tekstin e
korrigjuar/final të 11 artikujve përpara se të prekësh `blog.html`.

**Arkitektura** (nga një mockup i dërguar nga hiSol): **një faqe e vetme** me hash-routing në
JS të sheshtë (`location.hash`, `#a0`, `#a1`, ... `#a10`) — jo faqe të veçanta statike, jo
build-step. Të dhënat e artikujve (titull, kategori, kohë-leximi, ekstrakt, HTML e plotë)
ruhen si një array JS (`const B = [...]`) brenda `blog.html`. Dy funksione: `list()` (rendon
listën e kartave-teaser) dhe `article(i)` (rendon artikullin e plotë); `route()` lexon
`location.hash` dhe thërret njërin ose tjetrin; `hashchange` listener e rithërret `route()`.

**Pamja e konfirmuar** (stilizim me `--ink`/`--lime`/`--surface`/`--shadow-sm` ekzistuese të
`blog.html`, jo ngjyrat vendmbajtëse të mockup-it origjinal):
- Titulli i faqes mbetet thjesht `<h1>Energjia diellore.</h1>` — **pa** eyebrow "hiSol Mëso"
  sipër dhe **pa** nëntitull poshtë (u hoqën shprehimisht, hiSol deshi maksimalisht të
  thjeshtë).
- Lista: karta si `.fact` (sfond `--surface`, `border-radius: 20px`, `box-shadow: var(--shadow-sm)`),
  por çdo kartë klikohet drejt te `#a{i}` dhe tregon vetëm titull + ekstrakt + "X min lexim" —
  **pa** etiketë kategorie (fusha `c` e të dhënave ekziston, por s'shfaqet aktualisht, sipas
  kërkesës së hiSol për thjeshtësi).
- Artikulli: link "← Blog" **i lehtë, jo bold** (`font-weight: 400`, `color: var(--muted)`) —
  kjo ishte korrigjim i qëllimshëm nga hiSol pas parë demo-s (fillimisht e bëra bold, gabim);
  poshtë tij titulli, `hiSol Energy · X min lexim`, vijë poshtë me `border-bottom: 3px solid var(--lime)`,
  pastaj korpi i artikullit brenda një karte të bardhë (`.article-body`), dhe në fund kartelë
  CTA drejt kalkulatorit (të njëjtin stil `.cta-block` që ekziston tashmë te `blog.html`).
- Karta e brand-eve dhe seksioni FAQ (ekzistues, poshtë "fact"-eve tani) **mbeten të
  pandryshuar**, poshtë listës së re të blogut.
- **Anglishtja**: përmbajtja e 11 artikujve mbetet vetëm shqip për fazën e parë (jo praktike
  të përkthehen ~8000 fjalë menjëherë) — pjesa tjetër e faqes (header/footer/FAQ) mbetet
  dygjuhëshe si më parë.

Demo i plotë (HTML funksional, i dërguar te hiSol dhe i konfirmuar) ndodhet në historikun e
bisedës — kërko "hiSol-blog-demo-v2.html" nëse duhet referencë e saktë e kodit.
