# Getting Started

This guide is written for application developers integrating the package for the first time. It focuses on the shortest path to a correct integration, while also calling out the mistakes that most often cause calendar bugs.

## Before you begin

This package is best suited for:

- Backend services that need BS to AD conversion or panchang APIs.
- Frontend calendar UIs that need pre-shaped month data.
- Internal tools that need transparent festival and observance metadata.

This package is not a full consumer app. You are responsible for your own UI, storage, authentication, and product-specific business rules.

## Structured setup (application users)

1. Install Node.js 18+.
2. Add the package with your package manager.
3. Import only from the package root (`mero-patro`).
4. Run a smoke test (AD→BS and BS→AD).
5. Keep all AD date reads UTC-safe via `getUTC*`.

### Installation

```bash
# pnpm
pnpm add mero-patro

# npm
npm install mero-patro

# yarn
yarn add mero-patro
```

**Requirements:** Node.js 18+. The package ships both ESM and CommonJS bundles — no bundler config needed.

---

## Setup smoke test

```ts
import { toBS, toAD } from 'mero-patro'

const bs = toBS(new Date('2025-04-13'))
const ad = toAD({ year: 2082, month: 1, day: 1 })

console.log(bs)
console.log(ad.getUTCFullYear(), ad.getUTCMonth(), ad.getUTCDate())
```

Expected result:

- `bs` should be `{ year: 2081, month: 12, day: 30 }` if your input date is April 13, 2025 UTC.
- `ad` should represent `2025-04-14T00:00:00.000Z`.

If that basic round-trip does not behave as expected, stop there and fix the integration before building UI or business logic on top.

---

## Step 1 — Convert a date

### AD → BS

```ts
import { toBS } from 'mero-patro'

const bs = toBS(new Date('2025-04-13'))
console.log(bs)
// { year: 2081, month: 12, day: 29 }
//   ↑ Chaitra 29, BS 2081
```

### BS → AD

```ts
import { toAD } from 'mero-patro'

const ad = toAD({ year: 2082, month: 1, day: 1 })

// Always use UTC getters — the returned Date is UTC midnight
console.log(ad.getUTCFullYear()) // 2025
console.log(ad.getUTCMonth())    // 3  (0-indexed, so April)
console.log(ad.getUTCDate())     // 14
```

> **Important:** `toAD()` returns a `Date` at UTC midnight. Use `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` — not the local getters — to avoid timezone off-by-one errors.

### Today in BS

```ts
import { today } from 'mero-patro'

const todayBS = today()
console.log(todayBS)
// {
//   bs: { year, month, day },
//   ad: Date,
//   weekday: { en, ne },
//   monthName: { en, ne }
// }
```

### Format a BS date

```ts
import { formatBS } from 'mero-patro'

const formatted = formatBS({ year: 2082, month: 1, day: 15 })
console.log(formatted)
// '2082-01-15'

// With a custom template
const custom = formatBS({ year: 2082, month: 1, day: 15 }, 'DD MMMM YYYY')
console.log(custom)
// '15 Baishakh 2082'
```

---

## Step 2 — Get month info

```ts
import { getMonthDays } from 'mero-patro'

const days = getMonthDays(2082, 1)  // Baishakh of BS 2082
console.log(days)
// 31
```

Months are **1-indexed** — 1 = Baishakh, 12 = Chaitra. Month lengths vary per year; never hardcode 30 or 31.

---

## Step 3 — Render a full month calendar

`getMonthCalendar` is async because it loads panchang data for the year.

```ts
import { getMonthCalendar } from 'mero-patro'

const calendar = await getMonthCalendar(2082, 1)

console.log(calendar.monthName.en)   // 'Baishakh'
console.log(calendar.monthName.ne)   // 'बैशाख'
console.log(calendar.totalDays)      // 31
console.log(calendar.startWeekday)   // 0 = Sunday, 1 = Monday, ...
console.log(calendar.days.length)    // 35–42 (always full weeks)

// Each day in the grid:
const day = calendar.days[0]
console.log(day.bs)          // { year: 2082, month: 1, day: 1 }
console.log(day.ad)          // Date (UTC midnight)
console.log(day.isCurrentMonth) // true/false (false for overflow days)
console.log(day.isToday)     // true/false
console.log(day.weekday.en)  // 'Sunday'
console.log(day.weekday.ne)  // 'आइतवार'
```

The grid always starts on Sunday and includes overflow days from the previous and next months to fill complete weeks. See [Calendar Grid](./calendar-grid) for the full `CalendarDay` structure.

---

## Step 4 — Read panchang for a date

Panchang (पञ्चाङ्ग) is the Hindu almanac — it tells you the tithi (lunar day), paksha (moon phase), nakshatra (lunar mansion), yoga, and karana for any given day.

```ts
import { getPanchang, ensurePanchangYear } from 'mero-patro'

// Preload the year's data first (one-time async cost per year)
await ensurePanchangYear(2082)

// Then all lookups are synchronous
const p = getPanchang({ year: 2082, month: 1, day: 1 })

console.log(p?.tithi.name)       // 'Krishna Pratipada'
console.log(p?.tithi.nameNe)     // 'कृष्ण प्रतिपदा'
console.log(p?.tithi.number)     // 16  (1–30)
console.log(p?.paksha)           // 'krishna'
console.log(p?.pakshaName.en)    // 'Krishna Paksha'
console.log(p?.nakshatra?.name)  // 'Vishakha'
console.log(p?.tithiType)        // 'normal' | 'kshaya' | 'vriddhi'
```

`getPanchang` returns `null` if no data exists for the date (outside precomputed range without fallback). If you call `getMonthCalendar`, panchang is already preloaded for you.

For server applications, a good pattern is:

```ts
await ensurePanchangYear(2082)
// then handle many requests for that year without repeated setup work
```

---

## Step 5 — Get events and festivals

```ts
import { getEventsForDate, getEventsForMonth } from 'mero-patro'

// Events for a single day
const events = getEventsForDate({ year: 2082, month: 7, day: 15 })
// Returns CalendarEvent[]

events.forEach(e => {
  console.log(e.name.en)        // 'Vijaya Dashami (Dashain Day 10)'
  console.log(e.name.ne)        // 'विजया दशमी (दशैं १० गते)'
  console.log(e.isPublicHoliday) // true
  console.log(e.category)       // 'religious'
})

// All events in a month
const monthEvents = getEventsForMonth(2082, 7)
// Returns CalendarEvent[]
```

---

## Step 6 — Find auspicious dates

```ts
import { getAuspiciousDates, isAuspicious } from 'mero-patro'

// Get all auspicious dates in a month for a specific purpose
const weddingDays = getAuspiciousDates(2082, 2, 'wedding')
// Returns AuspiciousDay[]

weddingDays.forEach(d => {
  console.log(d.bs)              // { year: 2082, month: 2, day: 14 }
  console.log(d.classification)  // 'auspicious'
  console.log(d.events)          // CalendarEvent[] on that day
})

// Check a specific date
const verdict = isAuspicious({ year: 2082, month: 2, day: 14 })
console.log(verdict) // 'auspicious' | 'inauspicious' | 'neutral'
```

`isAuspicious()` returns the package's general classification for the day. If your product needs purpose-specific muhurat rules such as a wedding-only decision, treat the returned value as a baseline signal rather than a legal or religious final verdict.

---

## Step 7 — Query international observance metadata

For globally-recognized observance UX (labels, badges, source transparency), use the metadata APIs:

```ts
import {
  listInternationalObservances,
  getInternationalObservanceById,
  getInternationalObservancesByAdDate,
} from 'mero-patro'

const all = listInternationalObservances()
const worldHealth = getInternationalObservanceById('world-health-day')
const april7Observances = getInternationalObservancesByAdDate(4, 7)
```

These endpoints return curated informational observances (not legal/public-holiday declarations), including source/governance metadata.

---

## TypeScript types

All public types are exported from the root import:

```ts
import type {
  BSDate,          // { year: number; month: number; day: number }
  DualDate,        // { bs: BSDate; ad: Date; weekday: {...}; monthName: {...} }
  CalendarDay,     // Full day object from getMonthCalendar
  CalendarMonth,   // Full month object from getMonthCalendar
  CalendarOptions, // Options for getMonthCalendar
  CalendarEvent,   // Festival/holiday/event
  PanchangInfo,    // Tithi, paksha, nakshatra, yoga, karana
  AuspiciousDay,   // Date + classification + events
  AuspiciousClassification, // 'auspicious' | 'inauspicious' | 'neutral'
  EventType,       // 'festival' | 'public_holiday' | 'auspicious_date' | ...
  EventCategory,   // 'wedding' | 'bratabandha' | 'religious' | ...
} from 'mero-patro'
```

When in doubt, prefer importing types from the root package instead of deep module paths. That keeps your code aligned with the supported public API.

---

## Common mistakes

### Month is 1-indexed, not 0-indexed

```ts
// Wrong — this is what you'd do for JavaScript's Date
new Date(2025, 3, 14)  // month 3 = April (0-indexed)

// Correct for this package
toAD({ year: 2082, month: 1, day: 1 })  // month 1 = Baishakh (1-indexed)
```

BS months are domain months, not JavaScript month indexes.

### Use UTC getters on the returned Date

```ts
const ad = toAD({ year: 2082, month: 1, day: 1 })

// Wrong — gives wrong date if your timezone is UTC-5 or UTC+5:45
ad.getFullYear()  // may be 2025 or 2024 depending on timezone

// Correct
ad.getUTCFullYear()  // always 2025
ad.getUTCMonth()     // always 3 (April, 0-indexed)
ad.getUTCDate()      // always 14
```

### Await getMonthCalendar

```ts
// Wrong — returns a Promise, not a CalendarMonth
const cal = getMonthCalendar(2082, 1)
cal.days  // undefined

// Correct
const cal = await getMonthCalendar(2082, 1)
cal.days  // CalendarDay[]
```

### Call ensurePanchangYear before getPanchang in a loop

```ts
// Inefficient — loads data on every call
for (const month of months) {
  const p = getPanchang({ year: 2082, month, day: 1 })
}

// Correct — load once, then query synchronously
await ensurePanchangYear(2082)
for (const month of months) {
  const p = getPanchang({ year: 2082, month, day: 1 })
}
```

---

## Integration checklist for production apps

Before shipping your integration:

1. Use UTC-safe handling when reading AD `Date` values from conversion APIs.
2. Keep BS month/day validation on user input (month 1–12, day per month/year).
3. Distinguish **informational observances** (`fixed_ad_date`) from government public holidays.
4. Preload panchang year(s) for high-throughput date queries.
5. Surface fallbacks explicitly when APIs return `null` (out-of-range or unavailable data).
6. Document your own product policy for disputed or annually changing public holidays.

## Suggested integration patterns

### Backend API

- Preload the current BS year during service startup.
- Convert incoming dates to a normalized internal shape.
- Return both BS and AD when possible so clients do not reimplement conversion rules.

### Frontend calendar UI

- Use `getMonthCalendar()` as the main source for a month screen.
- Render `isCurrentMonth`, `isToday`, `events`, and `classification` directly.
- Do not rebuild tithi or holiday logic in the UI.

### Batch/reporting jobs

- Call `ensurePanchangYear()` once per target year.
- Reuse the same process to benefit from in-memory caches.
- Log unsupported dates explicitly instead of silently dropping them.

## Troubleshooting quick reference

| Symptom | Most likely cause | Fix |
|---|---|---|
| Off-by-one AD day | Local timezone getters used | Use `getUTC*` getters |
| `getPanchang` returns `null` | Year not loaded or unsupported range | Call `ensurePanchangYear`, verify range |
| Unexpected missing festival | Tithi-based date and year mismatch | Preload year, check `searchMonth` + tithi context |
| Duplicate holiday confusion | Festival mirrored with government holiday record | Use `provenance.reference` and `isPublicHoliday` fields |

---

## Next steps

- [What is BS?](./what-is-bs) — understand the calendar system
- [Date Conversion](./date-conversion) — how the algorithms work
- [Calendar Grid](./calendar-grid) — full CalendarDay structure
- [Panchang and Events](./panchang-and-events) — panchang data, festivals, auspicious dates
- [Limits and Guarantees](./limits-and-guarantees) — supported ranges, trust boundaries, and caveats
- [API Reference](../api/reference/README) — complete function signatures
