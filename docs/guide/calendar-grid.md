# Calendar Grid

`getMonthCalendar` is the primary function for building Nepali calendar UIs. It returns a complete grid of days for a BS month, with each day pre-populated with panchang, events, and metadata.

For most applications, this is the highest-level API you should start with. It gives you a UI-ready month model so you do not need to stitch together conversion, panchang, and event calls yourself.

## Basic usage

```ts
import { getMonthCalendar } from 'mero-patro'

const calendar = await getMonthCalendar(2082, 1)  // Baishakh, BS 2082
```

The function is **async** because it loads panchang data for the year on first call. Subsequent calls for the same year are fast — the data is cached in memory.

If you do not need panchang or events, you can disable those enrichments and use the function as a lightweight month-grid generator.

## CalendarMonth structure

```ts
interface CalendarMonth {
  year: number               // BS year, e.g. 2082
  month: number              // BS month (1–12)
  monthName: {
    en: string               // 'Baishakh'
    ne: string               // 'बैशाख'
  }
  totalDays: number          // Actual days in this BS month (29–32)
  startWeekday: number       // Weekday of the 1st (0 = Sunday, 6 = Saturday)
  days: CalendarDay[]        // complete weeks except at supported-range boundaries
}
```

The `days` array is intentionally flat. Many applications render it directly into a 7-column grid by iterating in order and breaking rows every 7 cells.

## CalendarDay structure

Every element in `calendar.days` is a `CalendarDay`:

```ts
interface CalendarDay {
  bs: BSDate                          // { year, month, day }
  ad: Date                            // UTC midnight of the corresponding AD date
  weekday: { en: string; ne: string } // e.g. { en: 'Sunday', ne: 'आइतवार' }
  isToday: boolean                    // true if this day is today (per system clock)
  isCurrentMonth: boolean             // false for overflow days from adjacent months
  panchang: PanchangInfo | null       // tithi, paksha, nakshatra, yoga, karana
  events: CalendarEvent[]             // festivals, public holidays, custom events
  classification: AuspiciousClassification  // 'auspicious' | 'inauspicious' | 'neutral'
}
```

## The grid layout

With adjacent days enabled, months inside the supported BS 2000–2090 range start on Sunday and contain complete weeks (usually 35 or 42 cells). The first and last supported months omit adjacent days outside the dataset, so those two grids can have partial edge weeks.

When the 1st of the month falls mid-week, the grid is padded with the **preceding month's trailing days**. Similarly, after the last day of the month, the grid is padded with the **next month's leading days**. These padding days have `isCurrentMonth: false`.

```
Example: Baishakh 2082 (startWeekday = 0)

Sun Mon Tue Wed Thu Fri Sat
 1   2   3   4   5   6   7     ← isCurrentMonth: true
 8   9  10  11  12  13  14
15  16  17  18  19  20  21
22  23  24  25  26  27  28
29  30  31  [1] [2] [3] [4]    ← last 4 are Jestha 1–4, isCurrentMonth: false
```

If instead Baishakh 1 fell on Thursday (`startWeekday = 4`):

```
Sun Mon Tue Wed Thu Fri Sat
[28][29][30][ 1]  1   2   3    ← first 3 are Chaitra 28–30, isCurrentMonth: false
 4   5   6   7   8   9  10
...
```

This layout matches what physical Nepali calendars and most calendar UIs display.

## When to use this API

Use `getMonthCalendar()` when you need:

- A month view in React, Vue, Angular, React Native, or server-rendered HTML.
- A compact per-day object that already includes BS date, AD date, labels, and event context.
- A predictable 35-42 cell grid without writing your own padding logic.

Do not use it if you only need a single date conversion or just the month length. In those cases, `toAD()`, `toBS()`, or `getMonthDays()` are simpler.

## Options

All three options default to `true`. Pass `false` to skip enrichment you don't need:

```ts
const calendar = await getMonthCalendar(2082, 1, {
  includeAdjacentDays: true,  // include overflow padding days (default: true)
  enrichPanchang: true,       // populate day.panchang (default: true)
  enrichEvents: true,         // populate day.events (default: true)
})
```

Recommended defaults by use case:

- Public calendar UI: keep all defaults enabled.
- Fast admin/month picker: disable `enrichPanchang` and `enrichEvents`.
- SSR page generation: preload year data before calling this repeatedly.

Disabling `enrichPanchang` and `enrichEvents` is useful for rendering a bare date grid when you only need BS/AD dates and weekdays.

```ts
// Lightweight grid — no panchang, no events
const cal = await getMonthCalendar(2082, 1, {
  enrichPanchang: false,
  enrichEvents: false,
})
// cal.days[0].panchang  → null
// cal.days[0].events    → []
```

## Preloading for performance

If you render multiple months (e.g. a year view or month navigation), preload panchang data before rendering:

```ts
import { preloadAllPanchang, getMonthCalendar } from 'mero-patro'

// Load all available panchang years once at app startup
await preloadAllPanchang()

// All subsequent getMonthCalendar calls are fully synchronous (internally)
const jan = await getMonthCalendar(2082, 1)
const feb = await getMonthCalendar(2082, 2)
// Both return instantly after preload
```

Or preload a single year if you only need one:

```ts
import { ensurePanchangYear } from 'mero-patro'

await ensurePanchangYear(2082)
// All months of 2082 are now cached
```

## Navigation helpers

```ts
import { nextMonth, prevMonth, monthRange } from 'mero-patro'

nextMonth(2082, 12)  // → { year: 2083, month: 1 }
prevMonth(2082, 1)   // → { year: 2081, month: 12 }

// Get a range of months (useful for week/year views)
monthRange(
  { year: 2082, month: 1, day: 1 },
  { year: 2082, month: 3, day: 1 }
)
// → [{ year: 2082, month: 1 }, { year: 2082, month: 2 }, { year: 2082, month: 3 }]
```

## Rendering example (React)

```tsx
import { useEffect, useState } from 'react'
import { getMonthCalendar, CalendarMonth } from 'mero-patro'

function NepaliCalendar({ year, month }: { year: number; month: number }) {
  const [cal, setCal] = useState<CalendarMonth | null>(null)

  useEffect(() => {
    getMonthCalendar(year, month).then(setCal)
  }, [year, month])

  if (!cal) return <div>Loading...</div>

  return (
    <div>
      <h2>{cal.monthName.en} {cal.year}</h2>
      <div className="grid grid-cols-7">
        {cal.days.map((day, i) => (
          <div
            key={i}
            className={[
              !day.isCurrentMonth && 'opacity-40',
              day.isToday && 'font-bold ring-2',
              day.classification === 'auspicious' && 'text-green-700',
            ].filter(Boolean).join(' ')}
          >
            <span>{day.bs.day}</span>
            {day.events.length > 0 && (
              <span className="text-xs">{day.events[0].name.en}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Getting just the day count

If you only need the number of days in a month without building the full grid:

```ts
import { getMonthDays } from 'mero-patro'

getMonthDays(2082, 1)   // 31
getMonthDays(2082, 2)   // 32
getMonthDays(2082, 12)  // 30
```

`getMonthDays` is synchronous and O(1).

## Practical integration advice

- Treat `calendar.days` as your source of truth for a month screen.
- Use the provided `ad` value for tooltips, dual-date displays, or API responses.
- Use `isCurrentMonth` to dim overflow cells instead of filtering them out.
- Use `classification` as a display hint, not as a substitute for domain-specific muhurat rules.
