# Mero Patro

[![npm version](https://img.shields.io/npm/v/mero-patro)](https://www.npmjs.com/package/mero-patro)
[![npm downloads](https://img.shields.io/npm/dm/mero-patro)](https://www.npmjs.com/package/mero-patro)
[![license](https://img.shields.io/npm/l/mero-patro)](./LICENSE)

`mero-patro` is a TypeScript package for Bikram Sambat (BS) calendar operations, including BS/AD conversion, calendar grid generation, panchang lookup, festival/holiday classification, BS date math, Nepal working day calculations, Devanagari string parsing, and iCalendar (.ics) exports.

## Quick Glance

- BS ↔ AD date conversion
- Monthly calendar grid generation
- BS date arithmetic (`addDays`, `subtractDays`, `addMonths`, `addYears`, `diffInDays`, `isBetween`)
- Nepal business & working days engine (`isWorkingDay`, `addWorkingDays`, `getWorkingDaysCount`)
- Devanagari string parsing (`parseBS`) and token-based formatting (`formatBS` with Devanagari digits)
- iCalendar (.ics) exporter (`exportMonthToICS`, `exportToICS`)
- Panchang data (tithi, paksha, nakshatra, yoga, karana, tithiType)
- Location-aware panchang for any observer coordinates (Kathmandu default)
- Kshaya (skipped) and Vriddhi (repeated) tithi detection
- Festival and public holiday resolution
- International observances (fixed AD dates, e.g. World Health Day, Valentine's Day)
- Auspicious/inauspicious date classification
- English and Nepali labels

## Installation

```bash
pnpm add mero-patro
```

## Structured setup (application users)

1. Install Node.js 18+.
2. Install the package with your package manager (`pnpm`, `npm`, or `yarn`).
3. Import from the root package export (`mero-patro`) only.
4. Validate your runtime wiring with a minimal conversion smoke test.
5. For date outputs from `toAD()`, always use UTC getters (`getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`).

```ts
import { toBS, toAD } from 'mero-patro'

const bs = toBS(new Date('2025-04-13'))
const ad = toAD({ year: 2082, month: 1, day: 1 })

console.log(bs, ad.getUTCFullYear(), ad.getUTCMonth(), ad.getUTCDate())
```

## Quick Start

```ts
import {
  toBS,
  toAD,
  getMonthCalendar,
  getPanchang,
  getEventsForDate,
  addDays,
  isWorkingDay,
  parseBS,
  exportMonthToICS,
} from 'mero-patro'

const bsDate = toBS(new Date('2025-04-14T00:00:00Z'))
const adDate = toAD({ year: 2082, month: 1, day: 1 })

const month = await getMonthCalendar(2082, 1)
const events = getEventsForDate({ year: 2082, month: 7, day: 15 })

// Date Math & Working Days
const nextWeek = addDays({ year: 2082, month: 1, day: 1 }, 7)
const isWorkDay = isWorkingDay({ year: 2082, month: 1, day: 2 })

// Devanagari Parsing
const parsed = parseBS('२०८२-०१-०१')

// Export month events to iCalendar (.ics)
const icsData = exportMonthToICS(2082, 1)

console.log({ bsDate, adDate, days: month.days.length, events: events.length, parsed })
```

## BS Date Math & Nepal Working Days

```ts
import {
  addDays,
  subtractDays,
  diffInDays,
  isWorkingDay,
  addWorkingDays,
  getWorkingDaysCount,
} from 'mero-patro'

const start = { year: 2082, month: 1, day: 2 }

// Add / Subtract Days
const futureDate = addDays(start, 10)
const pastDate = subtractDays(start, 5)
const totalDays = diffInDays(start, futureDate) // 10

// Nepal Working Days (defaults to Saturday weekend + Nepal public holidays off)
const canWork = isWorkingDay(start) // true
const deadline = addWorkingDays(start, 5) // Skips Saturdays and holidays
const workingCount = getWorkingDaysCount(start, futureDate)
```

## Date Formatting & Devanagari Parsing

```ts
import { formatBS, parseBS } from 'mero-patro'

// Parse ASCII or Devanagari strings
const bs1 = parseBS('2082-01-01')
const bs2 = parseBS('२०८२-०१-०१') // Devanagari input

// Rich token formatting with Devanagari locale
const formattedEn = formatBS(bs1, 'dddd, MMMM D, YYYY') // "Monday, Baishakh 1, 2082"
const formattedNe = formatBS(bs1, 'dddd, MMMM D, YYYY', { locale: 'ne' }) // "सोमबार, बैशाख १, २०८२"
```

## iCalendar (.ics) Export

```ts
import { exportMonthToICS, exportToICS } from 'mero-patro'

// Export full month of events to .ics format string (compatible with Google/Apple Calendar)
const monthICS = exportMonthToICS(2082, 1)

// Or export specific custom event pairs
const customICS = exportToICS([
  {
    event: { id: 'evt-1', name: { en: 'Meeting', ne: 'बैठक' }, type: 'custom', isPublicHoliday: false },
    bsDate: { year: 2082, month: 1, day: 5 },
  },
])
```

### International observance metadata APIs

```ts
import {
  listInternationalObservances,
  getInternationalObservanceById,
  getInternationalObservancesByAdDate,
} from 'mero-patro'

const all = listInternationalObservances()
const worldHealth = getInternationalObservanceById('world-health-day')
const onApr7 = getInternationalObservancesByAdDate(4, 7)
```

These APIs return curated observance metadata (source tier, review cadence, and confidence) to help downstream apps build transparent UX and filtering.

## Panchang

Panchang data is computed from planetary positions at sunrise (astronomy-engine, validated against NASA JPL Horizons). All five classical elements are available for any BS date.

### Basic lookup

```ts
import { getPanchang, ensurePanchangYear } from 'mero-patro'

// Pre-load data for a year (async, call once before bulk queries)
await ensurePanchangYear(2082)

const p = getPanchang({ year: 2082, month: 1, day: 1 })
// p.tithi      → { number: 16, name: 'Pratipada', nameNe: 'प्रतिपदा' }
// p.paksha     → 'krishna'
// p.nakshatra  → { name: 'Anuradha', nameNe: 'अनुराधा' }
// p.yoga       → { number: 18, name: 'Variyan', nameNe: 'वरीयान्' }
// p.karana     → { number: 3, name: 'Kaulava', nameNe: 'कौलव', inauspicious: false }
// p.tithiType  → 'normal' | 'kshaya' | 'vriddhi'
```

### Kshaya and Vriddhi tithis

`tithiType` classifies edge cases in the lunar calendar:

| Value | Meaning |
|---|---|
| `'normal'` | Standard day — one tithi at sunrise (the vast majority of days) |
| `'kshaya'` | The *next* tithi completes entirely within this solar day without appearing at sunrise. Its religious observances (fasting etc.) fall on this day. |
| `'vriddhi'` | This tithi also appeared at yesterday's sunrise — it spans two consecutive days. |

```ts
const p = getPanchang({ year: 2082, month: 9, day: 4 })
// p.tithiType → 'kshaya'  (Amavasya is kshaya here — Poush 2082)
```

### Location-aware queries

By default, all panchang is computed for Kathmandu (27.7172°N, 85.3240°E, 1400m, NST). For other locations, pass `options`:

```ts
// Pokhara, Nepal
const p = getPanchang({ year: 2082, month: 1, day: 1 }, {
  lat: 28.2096,
  lon: 83.9856,
})
```

Sunrise shifts slightly by location; on most days the tithi is identical to Kathmandu. Differences appear on lunar boundary days.

### Coverage

| Year range | Source |
|---|---|
| BS 2080–2090 | Precomputed JSON (astronomy-engine, 3-engine cross-validated, fast O(1) lookup) |
| BS 2000–2079 | Live computation via fallback (astronomy-engine, results LRU-cached per session) |
| BS < 2000 or > 2090 | Returns `null` |

## Development

```bash
# Install exact locked dependencies
pnpm install --frozen-lockfile

# Library watcher (builds package files only; no URL/server)
pnpm dev

# Local docs + playground web server (prints URL, usually http://localhost:5173)
pnpm site:dev

# Production-like local preview (prints URL, usually http://localhost:4173)
pnpm site:preview

pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm trust:check
```

Core CI gates now run on pull requests and pushes to `main`:
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run validate:panchang` (lightweight, offline, no Horizons/network dependency)
- `pnpm run legal:check` (license + dataset provenance/source-map policy)
- `pnpm run deps:check` (lockfile integrity + dependency hygiene, offline)

## Data maintenance and validation

```bash
# Generate panchang data with astronomy-engine v2 generator
pnpm generate:panchang -- --year 2082

# Validate generated data against curated reference dates
pnpm validate:panchang

# Cross-validate against independent astronomy engines
pnpm validate:cross -- --year 2082 --no-horizons

# Verify dependency + generated-data trust signals (offline)
pnpm trust:check

# Refresh generated-data integrity manifest after intentional data updates
pnpm trust:refresh-manifest

# Run monthly maintenance workflow locally
pnpm maintenance:monthly
```

## Documentation

All detailed docs are under [`docs/`](./docs/):

- [`SECURITY.md`](./SECURITY.md) - security policy, reporting expectations, and trust model
- [`docs/README.md`](./docs/README.md) - documentation index
- [`docs/PROJECT-ANALYSIS.md`](./docs/PROJECT-ANALYSIS.md) - deep project analysis
- [`docs/TESTING-GUIDE.md`](./docs/TESTING-GUIDE.md) - testing guide
- [`docs/CREDITS.md`](./docs/CREDITS.md) - credits and sources
- [`docs/project.md`](./docs/project.md) - original project plan/reference
