# Panchang and Events

This guide covers the most domain-specific part of the package: daily almanac data, festival resolution, observance metadata, and general auspicious-date classification.

If you are building a simple calendar UI, you can often consume these fields through `getMonthCalendar()` without calling every low-level API yourself.

## What is panchang?

Panchang (पञ्चाङ्ग) literally means "five limbs" — the five elements of the Hindu almanac that describe the celestial state of a day. These are used to determine festival dates, auspicious timings, and religious observances across Nepal.

| Element | What it means |
|---|---|
| **Tithi** | The lunar day — how far the moon has traveled from the sun (in 12° increments). Completes approximately every 24 hours but drifts relative to the solar day. |
| **Paksha** | Which half of the lunar month — Shukla (waxing, new moon to full moon) or Krishna (waning, full moon to new moon). |
| **Nakshatra** | The lunar mansion — which of the 27 star clusters the moon occupies. |
| **Yoga** | The sum of the sun's and moon's longitudes divided into 27 equal parts. Used for timing of auspicious activities. |
| **Karana** | Half a tithi. There are 11 karanas; some are considered inauspicious (Vishti/Bhadra). |

All five elements are computed at **sunrise** at Kathmandu (27.7172°N, 85.3240°E). This is the standard for Nepali panchang.

## Data coverage

| BS year range | Source |
|---|---|
| 2080–2090 | Precomputed JSON, loaded lazily per year |
| 2000–2079 | Live computation via astronomy-engine at runtime |
| Outside 2000–2090 | Returns `null` |

Precomputed data is faster and works offline. The live fallback is accurate but adds ~5–10 ms per unique date.

In practice, this means:

- Use precomputed years when possible for high-throughput APIs.
- Preload the year you serve most often.
- Expect custom-location requests to be more expensive than Kathmandu defaults.

## Loading panchang data

```ts
import { ensurePanchangYear, getPanchang } from 'mero-patro'

// Load the year's data once (async, subsequent calls are cached)
await ensurePanchangYear(2082)

// All queries for that year are now synchronous
const p = getPanchang({ year: 2082, month: 1, day: 1 })
```

To preload all available years at once (e.g. at app startup):

```ts
import { preloadAllPanchang } from 'mero-patro'

await preloadAllPanchang()
```

## The PanchangInfo object

```ts
interface PanchangInfo {
  tithi: {
    name: string    // 'Krishna Pratipada'
    nameNe: string  // 'कृष्ण प्रतिपदा'
    number: number  // 1–30 (1–15 = Shukla, 16–30 = Krishna; 30 = Amavasya)
  }
  paksha: 'shukla' | 'krishna'
  pakshaName: { en: string; ne: string }
  nakshatra?: { name: string; nameNe: string }
  yoga?: { name: string; nameNe: string; number: number }  // 1–27
  karana?: {
    name: string
    nameNe: string
    number: number        // 1–11
    inauspicious: boolean // true for Vishti (Bhadra) karana
  }
  tithiType: 'normal' | 'kshaya' | 'vriddhi'
}
```

## Tithi numbering

Tithi numbers run 1–30 across both pakshas:

| Number | Paksha | Name |
|---|---|---|
| 1 | Shukla | Pratipada |
| 2–14 | Shukla | Dwitiya … Chaturdashi |
| 15 | Shukla | Purnima (full moon) |
| 16 | Krishna | Pratipada |
| 17–29 | Krishna | Dwitiya … Trayodashi |
| 30 | Krishna | Amavasya (new moon) |

## Kshaya and Vriddhi tithis

Because tithi length (~24 hours) and solar day length (exactly 24 hours) are slightly different, the two can drift:

- **Kshaya (क्षय)** — A tithi completes entirely within one solar day without being present at sunrise. It is "skipped" in the calendar but its religious observance still falls on that day. `tithiType: 'kshaya'`

- **Vriddhi (वृद्धि)** — A tithi is present at two consecutive sunrises — it "spans" two solar days. `tithiType: 'vriddhi'`

These edge cases matter for festival scheduling. For example, if Ekadashi (tithi 11) is kshaya, the fasting observance happens on the kshaya day even though Ekadashi technically didn't begin that morning.

## Custom location support

By default panchang is computed for Kathmandu. Pass custom coordinates to query for other locations:

```ts
const p = getPanchang(
  { year: 2082, month: 1, day: 1 },
  { lat: 28.2096, lon: 83.9856 }  // Pokhara
)
```

Custom-location queries always use the live computation fallback (no precomputed JSON for custom locations).

That is the right tradeoff for correctness, but you should avoid calling it repeatedly with many unique coordinates unless you actually need observer-specific sunrise behavior.

---

## Events and festivals

### Getting events for a date

```ts
import { getEventsForDate } from 'mero-patro'

const events = getEventsForDate({ year: 2082, month: 7, day: 15 })
// Returns CalendarEvent[]
```

Each `CalendarEvent`:

```ts
interface CalendarEvent {
  id: string                 // 'vijaya-dashami'
  name: { en: string; ne: string }
  type: EventType            // 'festival' | 'public_holiday' | 'auspicious_date' | ...
  category: EventCategory    // 'religious' | 'national' | 'cultural' | 'wedding' | ...
  isPublicHoliday: boolean
  description?: { en: string; ne: string }
}
```

Some events also include provenance metadata in runtime results so applications can explain where the event came from and whether it mirrors a government holiday or a curated festival rule.

### Getting all events in a month

```ts
import { getEventsForMonth } from 'mero-patro'

const all = getEventsForMonth(2082, 7)  // all events in Kartik 2082
```

### The four festival types

Festivals are resolved differently depending on how their date is determined:

| Type | Example | How resolved |
|---|---|---|
| `fixed_bs_date` | Maghe Sankranti (Magh 1) | Always the same BS date every year |
| `tithi_based` | Dashain (Ashwin Shukla Pratipada) | Looks up which BS date has that tithi in panchang |
| `government_declared` | Constitution Day | Fixed BS date, published by Nepal government |
| `fixed_ad_date` | International Women's Day (Mar 8) | Converted from the fixed Gregorian date |

Tithi-based resolution requires panchang data. If panchang for the year is not loaded, tithi-based festivals are skipped for that year.

For best results, preload the target year before doing festival-heavy month or range queries.

### International observances included

The engine includes curated fixed Gregorian observances (informational, non-public-holiday), such as:

- Valentine's Day (Feb 14)
- International Day of Sport for Development and Peace (Apr 6)
- World Health Day (Apr 7)
- World Teachers' Day (Oct 5)
- International Day of Peace (Sep 21)
- International Day of Education (Jan 24)
- International Youth Day (Aug 12)
- World Diabetes Day (Nov 14)
- World AIDS Day (Dec 1)

These are mapped via `fixed_ad_date`, so matching is deterministic and does not depend on panchang loading.

### Observance metadata for app integration

For observance-focused UIs and filters, you can query curated metadata directly:

```ts
import {
  listInternationalObservances,
  getInternationalObservanceById,
  getInternationalObservancesByAdDate,
} from 'mero-patro'

const all = listInternationalObservances()
const worldHealth = getInternationalObservanceById('world-health-day')
const april7 = getInternationalObservancesByAdDate(4, 7)
```

Metadata includes source authority, authority tier, review cadence, last-reviewed date, and a derived confidence label (`high`/`medium`/`baseline`).

### Important scope boundary

- International observances in this package are **curated informational records**.
- They are intentionally not treated as legal/compliance declarations or Nepal government holidays.
- For policy-sensitive workflows, always combine package output with your organization’s legal/compliance review process.

### Adding custom events

Use `registerEvents` to inject events at runtime — useful for organization-specific holidays or admin-curated data:

```ts
import { registerEvents } from 'mero-patro'

registerEvents([
  {
    id: 'company-anniversary',
    name: { en: 'Company Anniversary', ne: 'कम्पनी वार्षिकोत्सव' },
    type: 'custom',
    category: 'general',
    isPublicHoliday: false,
  }
])
```

Custom events registered this way appear in `getEventsForDate` and `getEventsForMonth` results.

> Note: the current `registerEvents()` pathway stores custom events but does not yet include built-in date filtering logic for them. If you need production-grade custom event scheduling, add explicit date metadata and filtering in your integration layer (or extend engine support).

That means `registerEvents()` is best treated today as an extension hook for controlled integrations, not as a full custom-calendar subsystem.

---

## Auspicious dates

### What "auspicious" means

The auspicious classification combines:

- Which tithi is active (certain tithis are auspicious or inauspicious by tradition)
- The nakshatra (some are favorable for specific activities like weddings)
- The karana (Vishti/Bhadra karana is inauspicious)
- Whether any inauspicious festivals or periods fall on that day

The categories map to specific life events in Nepali tradition:

| Category | Purpose |
|---|---|
| `wedding` | Marriage ceremonies (Vivah) |
| `bratabandha` | Sacred thread ceremony |
| `grihapravesh` | Entering a new home |
| `religious` | General religious observances |
| `general` | Any auspicious activity |

### Finding auspicious dates in a month

```ts
import { getAuspiciousDates } from 'mero-patro'

const days = getAuspiciousDates(2082, 2, 'wedding')

days.forEach(d => {
  console.log(`${d.bs.year}/${d.bs.month}/${d.bs.day} — ${d.classification}`)
  // 2082/2/8 — auspicious
  // 2082/2/14 — auspicious
})
```

### Checking a specific date

```ts
import { isAuspicious } from 'mero-patro'

const result = isAuspicious({ year: 2082, month: 2, day: 14 })
// 'auspicious' | 'inauspicious' | 'neutral'
```

If you need purpose-specific classification such as wedding-focused logic, add a domain policy layer in your application. The package's general classification is useful as a signal, but not as a full religious authority.

### Using panchang for fine-grained timing

Once you have a date classified as auspicious, use panchang to see the specific tithi and nakshatra:

```ts
await ensurePanchangYear(2082)
const p = getPanchang({ year: 2082, month: 2, day: 14 })

console.log(p?.tithi.name)       // 'Shukla Tritiya'
console.log(p?.nakshatra?.name)  // 'Rohini'  (highly auspicious for weddings)
console.log(p?.karana?.inauspicious)  // false
```
