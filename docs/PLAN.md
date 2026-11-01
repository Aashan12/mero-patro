# Project Plan — mero-patro

> **Branch:** `enhancement-overall`
> **Last updated:** 2026-03-27
> **Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Current State Snapshot

| Area | Status | Notes |
|---|---|---|
| Build (ESM + CJS) | ✅ Done | 188 KB minified, source maps included |
| TypeScript strict | ✅ Done | Zero type errors |
| Test suite | ✅ Done | 357/357 passing |
| Date conversion (Layer 1) | ✅ Done | O(1) BS→AD, O(log n) AD→BS |
| Calendar grid (Layer 2) | ✅ Done | `getMonthCalendar` with enrichment |
| Panchang data (Layer 3) | ✅ Done | BS 2080–2090 precomputed + fallback |
| Events & festivals (Layer 4) | ✅ Done | ~40 festivals, auspicious classifier |
| Interactive playground | ✅ Done | `tools/index.html` + `docs/public/playground/` |
| VitePress docs site | ✅ Done | Scaffold up, content thin |
| CI pipeline | ✅ Done | `.github/workflows/ci.yml` |
| npm publish | ❌ Not done | Package not yet on registry |

---

## Phase A — Documentation Foundation

**Goal:** A developer with zero prior knowledge can understand, install, and use the package confidently.
**Target audience:** Frontend/backend developers evaluating or integrating the package.

### A1 — Conceptual primer
- [x] Create `docs/guide/what-is-bs.md`
  - What Bikram Sambat is and why it differs from Gregorian
  - Variable month lengths (why Baishakh has 30–32 days)
  - The 57-year offset and why it's not exact
  - BS year range this package supports (2000–2090 / AD 1943–2043)
  - Why Nepal uses two calendars simultaneously

### A2 — Date conversion deep-dive
- [x] Create `docs/guide/date-conversion.md`
  - The epoch: BS 2000-01-01 = AD 1943-04-14 and why this anchor point exists
  - How month lengths are stored (`bs-month-lengths.json` structure)
  - The offset table approach — how cumulative day counts enable O(1) lookup
  - BS→AD algorithm walkthrough (step by step with a real example)
  - AD→BS algorithm walkthrough (binary search on year, linear walk on month)
  - Timezone safety: why everything is UTC internally
  - Edge cases: month boundaries, year boundaries, last day of last month
  - What happens outside the supported range (RangeError)
  - Data sourcing and cross-validation methodology

### A3 — Getting started rewrite
- [x] Rewrite `docs/guide/getting-started.md` (was 32 lines, now full guide)
  - Installation (npm / yarn / pnpm)
  - Step 1: Convert your first date (BS→AD and AD→BS with real output)
  - Step 2: Get today's date in BS
  - Step 3: Render a full month calendar
  - Step 4: Read panchang for a date
  - Step 5: Get events and festivals
  - Step 6: Find auspicious dates
  - TypeScript types reference
  - Common mistakes section (async panchang, month numbering 1-based, timezone)

### A4 — Calendar grid guide
- [x] Create `docs/guide/calendar-grid.md`
  - What `getMonthCalendar` returns (`CalendarMonth` structure)
  - What each `CalendarDay` contains (BS, AD, weekday, panchang, events, isToday)
  - Adjacent/overflow days — what they are and when to show them
  - Enrichment options (`includeAdjacentDays`, `enrichPanchang`, `enrichEvents`)
  - Week alignment: Sunday = 0, how the grid fills to 35–42 cells
  - Navigation: `nextMonth`, `prevMonth`, `monthRange`
  - Performance: async preloading strategy for fast rendering
  - React rendering example

### A5 — Panchang and events rewrite
- [x] Rewrite `docs/guide/panchang-and-events.md` (was 40 lines, now full guide)
  - What panchang is in plain language (not just field names)
  - Tithi explained: what it means, why it drifts from solar days
  - Kshaya (skipped) and Vriddhi (repeated) tithi — what causes them
  - Paksha: Shukla vs Krishna and when each starts
  - Nakshatra, Yoga, Karana: brief plain-language description of each
  - Data coverage: precomputed 2080–2090, fallback for other years
  - Location support: default Kathmandu, custom lat/lon
  - Event resolution: the 4 festival types and how each resolves a date
  - Auspicious classification: what the algorithm checks

### A6 — Update VitePress homepage and sidebar
- [x] Rewrite `docs/index.md` with user-type routing
  - "I want to convert a date" → getting-started
  - "I want to build a Nepali calendar app" → calendar-grid
  - "I want panchang / festival data" → panchang-and-events
  - "I want to understand the math" → date-conversion
  - "I want to see it live" → playground
  - Feature table with BS range, data coverage, bundle size
- [x] Update `docs/.vitepress/config.ts` sidebar with new pages grouped into sections

---

## Phase B — Framework Integration Guides

**Goal:** Developers on specific stacks can copy-paste a working integration.
**Target audience:** Next.js, NestJS, React Native developers.

### B1 — Next.js guide
- [ ] Create `docs/guide/nextjs.md`
  - Server component usage (no `await` needed for conversion, only for calendar)
  - Client component with `useEffect` for calendar grid
  - ISR pattern: generate static calendar pages per BS month
  - App Router vs Pages Router examples
  - Caching `getMonthCalendar` in Route Handlers

### B2 — NestJS guide
- [ ] Create `docs/guide/nestjs.md`
  - Creating a `CalendarService` that wraps the package
  - Calling `preloadAllPanchang()` in `OnModuleInit`
  - Singleton pattern so panchang cache is shared across requests
  - REST endpoint example: GET `/calendar/bs/:year/:month`

### B3 — React Native guide
- [ ] Create `docs/guide/react-native.md`
  - Bundle size note: astronomy-engine fallback is tree-shaken if unused
  - Metro bundler config (ESM support caveat)
  - AsyncStorage caching pattern for offline panchang
  - Example: rendering a month view in a FlatList

---

## Phase C — Reference & Advanced Docs

**Goal:** Power users and contributors have full depth on every feature.

### C1 — Festival system guide
- [ ] Create `docs/guide/festivals.md`
  - The 4 festival resolution methods: `fixed_bs_date`, `tithi_based`, `government_declared`, `fixed_ad_date`
  - How tithi-based festivals find their date each year
  - Kshaya handling: when a festival moves to the preceding day
  - How to add custom festivals with `registerEvents()`
  - Festival provenance: where each event's date came from
  - Current festival coverage list (with gaps noted)

### C2 — Auspicious dates guide
- [ ] Create `docs/guide/auspicious-dates.md`
  - What "auspicious" means algorithmically (tithi + nakshatra + weekday combinations)
  - The category system: `wedding`, `bratabandha`, `grihapravesh`, `religious`, etc.
  - How `isAuspicious()` works
  - How `getAuspiciousDates()` filters a month
  - Known inauspicious periods and how they're encoded

### C3 — Validation and trust guide
- [ ] Review and expand `docs/guide/validation-and-trust.md`
  - How panchang data is generated (astronomy-engine → JSON)
  - Cross-validation against Drik Panchang and Nepal Rashtriya Panchang
  - Data integrity manifest (SHA-256 hashes) and how to verify
  - How to run `pnpm validate:panchang` and `pnpm validate:cross`
  - What to do when a date seems wrong

### C4 — API reference cleanup
- [ ] Review auto-generated `docs/api/reference/` entries
  - Ensure every function has a description (not just type signature)
  - Add example snippets to the 5 most-used functions: `toBS`, `toAD`, `getMonthCalendar`, `getPanchang`, `getEventsForDate`

---

## Phase D — Data Coverage & Quality

**Goal:** The package covers upcoming BS years and has complete festival data.

### D1 — Missing festivals
- [x] `kag-tihar` — present in festivals.ts (id: `tihar-day1`, Kartik Krishna tithi 28)
- [x] `kukur-tihar` — present (id: `tihar-day2`, Kartik Krishna tithi 29)
- [x] `mahashivaratri` — present (id: `mahashivaratri`, Falgun Krishna tithi 29)
- [x] `teej` — present (id: `teej`, Bhadra Shukla tithi 3)
- [x] `janai-purnima` — present (id: `janai-purnima`, Shrawan Shukla Purnima)
- [x] `krishna-janmastami` — present (id: `krishna-janmastami`, Bhadra Krishna tithi 23)
- [x] `ghode-jatra` — present (id: `ghode-jatra`, Chaitra Krishna Amavasya)
- [x] `chhath-parva` — present (id: `chhath-parva`, Kartik Shukla tithi 6)
- [x] All 357 tests pass including `festival-accuracy.test.ts` (39 tests)

### D2 — Public holidays for upcoming years
- [ ] Create `src/data/public-holidays/2083.ts` from official Nepal government list
- [ ] Create `src/data/public-holidays/2084.ts`
- [ ] Wire new files into event engine year-routing logic

### D3 — Panchang data extension
- [ ] Generate BS 2091 panchang data: `pnpm generate:panchang 2091`
- [ ] Validate against reference: `pnpm validate:panchang`
- [ ] Update integrity manifest: `pnpm trust:refresh-manifest`
- [ ] Consider extending to BS 2092–2095 for a 5-year forward buffer

---

## Phase E — Release Preparation

**Goal:** Publish v1.0.0 to npm as `mero-patro`.

### E1 — Package identity
- [x] Confirm final package name: `mero-patro`
- [x] Update `package.json` name field
- [ ] Write `CHANGELOG.md` entry for v1.0.0
- [ ] Update root `README.md` with install badge, npm link, coverage badge

### E2 — Pre-publish checklist
- [ ] `pnpm build` passes cleanly
- [ ] `pnpm test` — all tests green
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm lint` — zero warnings
- [ ] Bundle size check: both ESM and CJS under 500 KB
- [ ] `pnpm pack --dry-run` — verify what ships in the tarball
- [ ] Confirm `exports` field in `package.json` resolves correctly for ESM and CJS consumers
- [ ] Verify `types` field points to correct `.d.ts`

### E3 — CI / CD
- [ ] Confirm `ci.yml` runs on PR and push to main
- [ ] Add docs deploy workflow (`docs.yml` is present but needs review)
- [ ] Add npm publish workflow triggered on GitHub Release

### E4 — Publish
- [ ] `npm publish --access public` (or `pnpm publish`)
- [ ] Create GitHub Release with v1.0.0 tag
- [ ] Verify package is importable from a fresh project

---

## Phase F — Post-Launch Maintenance

**Goal:** Keep data fresh year over year without breaking changes.

- [ ] Document the annual maintenance workflow (already in `scripts/monthly-maintenance.ts`)
- [ ] Set a calendar reminder for Baishakh 1 (mid-April) to update public holidays for new BS year
- [ ] Set a calendar reminder 6 months before panchang data runs out (BS 2090) to generate 2091–2095
- [ ] Triage incoming issues for conversion accuracy reports from users

---

## Quick Reference — File Map

| Task type | Where to edit |
|---|---|
| Add a festival | `src/data/festivals.ts` |
| Add public holidays for a year | `src/data/public-holidays/<year>.ts` |
| Generate new panchang data | `pnpm generate:panchang <year>` |
| Update docs content | `docs/guide/*.md` |
| Update API reference | `pnpm docs:api` (auto-generated from JSDoc) |
| Run tests | `pnpm test` |
| Check accuracy | `pnpm accuracy:report` |
| Verify data integrity | `pnpm trust:check` |
