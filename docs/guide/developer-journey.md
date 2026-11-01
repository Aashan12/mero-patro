# Developer Journey

This guide explains how developers interact with the codebase, what logic runs for each public API, and how data flows through the package end to end.

## 1. System mental model

The package is organized in four layers:

1. **Date conversion**: BS <-> AD conversion and formatting.
2. **Calendar grid**: month grid generation for UI consumption.
3. **Panchang**: precomputed lookup + live fallback computation.
4. **Events and classification**: festivals, public holidays, and auspiciousness.

Public APIs are exported from the root package import:

```ts
import {
  toBS, toAD, today, formatBS,
  getMonthCalendar, getMonthDays,
  getPanchang, ensurePanchangYear, preloadAllPanchang,
  getEventsForDate, getEventsForMonth, getAuspiciousDates, registerEvents,
  isAuspicious,
} from 'mero-patro'
```

## 2. Developer setup and first interaction

1. Install dependencies and build once.
2. Run tests/type checks.
3. Run a minimal API smoke script.

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run typecheck
pnpm run test
```

```ts
import { toBS, toAD, getMonthCalendar } from 'mero-patro'

const bs = toBS(new Date('2025-04-13'))
const ad = toAD({ year: 2082, month: 1, day: 1 })
const month = await getMonthCalendar(2082, 1)

console.log(bs)
console.log(ad.getUTCFullYear(), ad.getUTCMonth(), ad.getUTCDate())
console.log(month.days.length)
```

## 3. Step-by-step logic by primary API

### A) `toAD(bsDate)` (BS -> AD)

1. Validate BS input (range and valid day for month/year).
2. Use precomputed cumulative offsets:
   - start-of-year offset
   - start-of-month offset
   - plus `(day - 1)`
3. Add total days to BS epoch.
4. Return AD date at UTC midnight.

**Complexity:** O(1)  
**Important:** Always read with `getUTC*` getters.

### B) `toBS(adDate)` (AD -> BS)

1. Convert AD date to UTC day index from epoch.
2. Bounds-check supported range.
3. Binary search year offsets to find BS year.
4. Walk month offsets inside the year.
5. Compute BS day and return `{ year, month, day }`.

**Complexity:** O(log n) for year search + O(1) month walk.

### C) `getMonthCalendar(year, month, options?)`

1. Merge input options with defaults:
   - `includeAdjacentDays`
   - `enrichPanchang`
   - `enrichEvents`
2. If enrichment is enabled, preload panchang year.
3. Compute:
   - month day count
   - first day weekday
   - overflow days (previous and next month)
4. Build each day object with:
   - BS date
   - AD date
   - weekday labels
   - optional panchang
   - optional events
   - optional auspicious classification
5. Return stable calendar shape ready for UI.

### D) `getPanchang(date, options?)`

1. Normalize input to supported BS date.
2. Resolve observer coordinates (Kathmandu default).
3. Decide path:
   - **Fast path**: precomputed year and Kathmandu coordinates -> in-memory indexed lookup.
   - **Fallback path**: custom location or out-of-precomputed-year -> live astronomy computation.
4. Return structured `PanchangInfo` or `null` for unsupported ranges.

### E) `getEventsForDate(date)`

1. Normalize input to BS date.
2. Resolve base festival matches by rule:
   - fixed BS date
   - tithi-based
   - fixed AD date
3. Resolve government holidays for supported holiday years.
4. Merge festivals and holidays with de-dup logic.
5. Attach provenance metadata to each event.
6. Sort by public-holiday priority and type priority.

### F) `isAuspicious(date)` and `getAuspiciousDates(...)`

1. Load date events and panchang.
2. Apply precedence:
   - `inauspicious_period` -> inauspicious
   - `auspicious_date` or festival -> auspicious
   - special tithi checks -> contextual
   - otherwise neutral
3. Monthly APIs aggregate the per-day result.

## 4. Data contracts and invariants

### Date invariants

1. BS months are 1-indexed (1..12).
2. AD outputs are UTC midnight.
3. All weekday and date logic uses UTC-safe accessors.

### Panchang invariants

1. Precomputed years: BS 2080-2090.
2. Fallback coverage: BS 2000-2079 (live compute).
3. Out-of-supported-range requests return `null`.

### Event invariants

1. Every returned event has stable ID and type.
2. Government/public holiday mirroring is merged, not duplicated.
3. Provenance references are preserved for auditability.

## 5. Reliability and trust workflow for developers

Run this sequence before PR/release:

```bash
pnpm run typecheck
pnpm run test
pnpm run validate:panchang
pnpm run legal:check
pnpm run deps:check
pnpm run trust:check
pnpm audit --prod
pnpm run docs:build
```

Optional deeper astronomy cross-check:

```bash
pnpm run validate:cross -- --year 2082 --no-horizons
```

## 6. How to safely extend logic

### Add a new festival

1. Add record in festival data with method/type/category metadata.
2. Ensure source mapping/provenance metadata is complete.
3. Add or update tests for rule matching and collisions.
4. Run legal + trust checks.

### Add a new public holiday year

1. Add year dataset under public-holidays data.
2. Update event resolution logic for that year.
3. Add tests for mirrored and fixed-date holidays.
4. Re-run full validation pipeline.

### Extend panchang year coverage

1. Generate year data.
2. Validate against references.
3. Refresh integrity manifest.
4. Re-run trust and cross-validation checks.

## 7. Typical developer journeys

### Journey 1: Build a calendar UI

1. Call `await getMonthCalendar(year, month)`.
2. Render `days` in a 7-column grid.
3. Use `isCurrentMonth`, `isToday`, `events`, and `classification` for UX.

### Journey 2: Daily panchang service endpoint

1. Preload year at startup with `ensurePanchangYear`.
2. Resolve `getPanchang(bsDate, locationOptions)`.
3. Return panchang plus `getEventsForDate` payload.

### Journey 3: Search auspicious windows

1. Call `getAuspiciousDates(year, month, purposeCategory)`.
2. Filter and rank by domain-specific preferences.
3. Show provenance-aware event context in UI.

## 8. Practical debugging checklist

1. Off-by-one AD date -> check UTC getters usage.
2. Missing panchang -> confirm year is supported/preloaded.
3. Missing festival -> verify method, tithi/paksha/searchMonth alignment.
4. Duplicate holiday display -> inspect merged provenance references.
5. Slow repeated fallback calls -> reuse location params to benefit from cache.
