# mero-patro

A TypeScript package for Bikram Sambat (BS) date conversion, month-calendar generation, panchang lookup, and event resolution. It is designed as a developer-facing engine that other applications can build on top of, not as a full end-user app.

```bash
pnpm add mero-patro
```

---

## Start here

If you are evaluating the package for a new project, read in this order:

1. [Getting Started](./guide/getting-started) for the first successful integration.
2. [Limits and Guarantees](./guide/limits-and-guarantees) for supported ranges, accuracy boundaries, and what the package does not promise.
3. [Validation and Trust](./guide/validation-and-trust) for the release and verification model.
4. [API Reference](./api/reference/README) for full signatures and types.

---

## What do you want to do?

### "I want to convert dates between BS and AD"

```ts
import { toBS, toAD, today } from 'mero-patro'

toBS(new Date(Date.UTC(2025, 3, 14))) // → { year: 2082, month: 1, day: 1 }
toAD({ year: 2082, month: 1, day: 1 }).toISOString().slice(0, 10) // → '2025-04-14'
today() // → { bs, ad, weekday, monthName }
```

→ [Getting Started](./guide/getting-started) · [Conversion Algorithm](./guide/date-conversion)

---

### "I want to build a Nepali calendar UI"

```ts
import { getMonthCalendar } from 'mero-patro'

const cal = await getMonthCalendar(2082, 1)
// cal.days → 35–42 CalendarDay objects, each with BS date, AD date,
//            panchang, festivals, and auspicious classification
```

→ [Calendar Grid Guide](./guide/calendar-grid) · [Getting Started](./guide/getting-started)

---

### "I want panchang, festival, or auspicious-date data"

```ts
import { getPanchang, getEventsForDate, getAuspiciousDates } from 'mero-patro'

getPanchang({ year: 2082, month: 1, day: 1 })
// → { tithi: { number: 16, ... }, paksha: 'krishna', nakshatra: {...}, ... }

getEventsForDate({ year: 2082, month: 7, day: 15 })
// → [{ name: 'Vijaya Dashami', isPublicHoliday: true, ... }]

getAuspiciousDates(2082, 2, 'wedding')
// → [{ bs: {...}, classification: 'auspicious', events: [...] }, ...]
```

→ [Panchang and Events](./guide/panchang-and-events)

---

### "I want to understand the calendar system first"

→ [What is Bikram Sambat?](./guide/what-is-bs)

---

### "I want to understand reliability, limits, and release hygiene"

→ [Limits and Guarantees](./guide/limits-and-guarantees) · [Validation and Trust](./guide/validation-and-trust)

---

### "I want to explore the website"

→ [Documentation Guide](./guide/getting-started)  
→ [Interactive Playground](./guide/playground)

If you hit a playground 404, run `pnpm run build` and then `pnpm run docs:sync-playground-assets`.

---

## Feature overview

| Feature | Range / Notes |
|---|---|
| BS ↔ AD conversion | BS 2000–2090 · O(1) forward, O(log n) reverse |
| Calendar grid | Full month with overflow days, week alignment |
| Panchang (precomputed) | BS 2080–2090 · offline, O(1) lookup |
| Panchang (live fallback) | BS 2000–2079 · via astronomy-engine |
| Festivals | 40+ entries · fixed BS date, tithi-based, and fixed AD date |
| Public holidays | BS 2082 (more years in progress) |
| Auspicious dates | General classification plus monthly filtered results |
| Languages | English + Nepali (Devanagari) |
| Runtime model | Embedded data + deterministic computation, no runtime network fetches |

---

## All guides

- [What is Bikram Sambat?](./guide/what-is-bs) — the calendar system explained
- [Getting Started](./guide/getting-started) — install and first usage
- [Limits and Guarantees](./guide/limits-and-guarantees) — supported ranges, caveats, and integration boundaries
- [Date Conversion](./guide/date-conversion) — how the algorithms work
- [Calendar Grid](./guide/calendar-grid) — building month views
- [Panchang and Events](./guide/panchang-and-events) — tithi, festivals, auspicious dates
- [Developer Journey](./guide/developer-journey) — complete step-by-step logic and extension workflow
- [Validation and Trust](./guide/validation-and-trust) — data sources and verification
- [Interactive Playground](./guide/playground) — live browser explorer

## API Reference

- [All functions](./api/reference/README)

---

## Website experience

This docs site is the project website:

- **Landing page**: this page (`/`)
- **Documentation**: `/guide/*`
- **Interactive calendar playground**: `/playground/` (linked from the Playground guide page)

Use these local commands:

```bash
pnpm run site:dev
pnpm run site:preview
```
