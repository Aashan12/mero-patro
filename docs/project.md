# Nepali Calendar Engine — Package Plan

**Package Name:** `mero-patro`
**Version:** 0.1.0 (Initial Development)  
**Date:** March 22, 2026  
**Organization:** Digital Events Pvt Ltd  
**Classification:** Internal — Development Reference

---

## 1. What Is This Package?

The Nepali Calendar Engine is a TypeScript package that provides the complete data backbone for building calendar interfaces that work with Nepal's Bikram Sambat (BS) calendar system alongside the Gregorian (AD) calendar.

This is **not** a simple date converter. It is a calendar engine — it generates the full data structure needed to render a calendar grid, enrich each date with cultural and astronomical context (tithi, paksha, festivals, auspicious classifications), and serve that data in a format that any frontend component (React, React Native, or plain HTML) can consume directly.

The package exists because no off-the-shelf calendar library understands the Nepali calendar system deeply enough for production use in event management. Existing open-source options handle basic BS↔AD conversion but lack tithi data, auspicious date classification, festival metadata, and the structured calendar grid output that a real application needs.

### 1.1 Why a Package and Not Part of the Main App?

The calendar logic is a self-contained domain with no dependency on bookings, users, venues, or any Application business logic. Extracting it into a standalone package provides three concrete advantages:

- **Reusability:** The same package serves the Application web app (Next.js), the mobile app (React Native), the NestJS backend (for server-side date operations), and potentially VenueOS in the future — all from a single source of truth.
- **Independent Versioning:** Calendar data (new year's tithi data, festival updates) can be released without touching the main application codebase.
- **Testability:** Date logic is notoriously bug-prone. An isolated package with focused test suites catches conversion edge cases before they reach the application layer.

### 1.2 What This Package Delivers

The package provides four capabilities, each building on the previous one:

**Layer 1 — Date Conversion Engine:** Accurate bidirectional conversion between Bikram Sambat and Gregorian dates, covering BS years 2000–2100 (AD 1943–2043). This is the foundation that every other layer depends on.

**Layer 2 — Calendar Grid Generator:** Given a BS year and month, produces the complete data array needed to render a monthly calendar view — including each day's BS date, AD equivalent, weekday names in both Nepali and English, and flags for today, current month, and adjacent month overflow days.

**Layer 3 — Panchang (Tithi & Lunar Data):** For any date within the supported range, returns the tithi (lunar day), paksha (Shukla/Krishna fortnight), and nakshatra where data is available. This is the data that makes a calendar a "Nepali Patro" rather than just a date grid.

**Layer 4 — Festival, Holiday & Auspicious Date Engine:** A curated, extensible dataset of Nepal's major festivals, government public holidays, auspicious dates (Shubha Vivah Muhurat, Bratabandha dates), and inauspicious periods (Pitru Paksha, Chaturmas). Each entry carries a classification (`auspicious`, `inauspicious`, or `neutral`) and categorical tags (`wedding`, `bratabandha`, `religious`, `national`, `cultural`).

### 1.3 What This Package Does NOT Do

These boundaries are intentional and must not creep during development:

- **No UI components.** No calendar grid, no date picker, no modals. The package outputs structured data; the consuming application renders it however it needs to.
- **No database access.** The package ships with static JSON datasets and provides a runtime injection API for external data. It never connects to PostgreSQL, Redis, or any data store.
- **No API endpoints.** No HTTP server, no REST routes, no GraphQL schema. The Application NestJS backend wraps the package's functions in its own API layer.
- **No booking or business logic.** Availability, pricing, hall management, user roles — none of this belongs here.
- **No real-time features.** No WebSocket connections, no event emitters, no polling. The package is a pure computation and data lookup library.
- **No admin CRUD.** The Application admin panel manages custom festivals and events through its own database; those entries are passed into the package via the runtime injection API.

---

## 2. Who Consumes This Package?

The package has four immediate consumers within the Application ecosystem:

| Consumer | Runtime | Usage |
|---|---|---|
| **Application Web (Next.js)** | Browser + Server | Calendar component data, date pickers, auspicious date display, search filters ("show venues available on auspicious dates in Falgun 2083") |
| **Application Backend (NestJS)** | Node.js Server | Server-side date validation, booking date enrichment, calendar API endpoints (`/calendar/month-summary`, `/calendar/day-detail`), report generation with BS dates |
| **Application Mobile (React Native)** | Mobile JS Runtime | Same as web — calendar views, date selection, festival notifications |
| **VenueOS (Future)** | Go Backend (via thin wrapper or API) | BS date display on venue websites, auspicious date badges. Can consume via a NestJS API endpoint initially; a Go port of the core converter is a future option if direct integration is needed |

---

## 3. The Data Problem — Where the Real Work Lives

The code for this package is straightforward TypeScript. The genuine challenge is **sourcing, structuring, and maintaining the data** that powers it. This section explains each data layer and the strategy for acquiring it.

### 3.1 BS Month Length Data (Solved Problem)

Bikram Sambat months do not have fixed lengths like Gregorian months. Each BS year has its own set of month lengths (ranging from 28 to 32 days), and these are determined astronomically and published by authoritative sources. This data has been compiled by the open-source community and is available in multiple libraries.

**Data Shape:** A lookup table mapping each BS year (2000–2100) to an array of 12 month lengths.

```
BS 2082: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30]  // 365 days
BS 2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31]  // 366 days
```

**Source Strategy:** Use established open-source reference data (nepali-date-converter, bikram-sambat-js, or equivalent). Cross-validate against at least two independent sources before shipping.

**Size:** ~100 years × 12 integers = approximately 5 KB of JSON. Negligible.

**Maintenance:** This data changes only when the Nepal government publishes corrections (extremely rare). Effectively static.

### 3.2 Tithi / Panchang Data (Hard Problem)

Tithi (the lunar day) is astronomically calculated based on the angular distance between the Sun and Moon. Each tithi's start and end time varies every cycle. There are 30 tithis in a lunar month (15 in Shukla Paksha, 15 in Krishna Paksha), and their mapping to solar calendar dates shifts continuously.

**Why this is hard:** You cannot derive tithi from a simple formula or lookup table based on the BS date alone. The options are:

1. **Runtime astronomical calculation** — Use an ephemeris library (like Swiss Ephemeris or Astronomy Engine) to compute the Sun-Moon angular difference for any given moment. Accurate but computationally expensive and adds a significant dependency.
2. **Pre-computed dataset** — Source tithi data for a defined year range from authoritative panchang publications and ship it as static JSON. Simpler, deterministic, but requires annual data updates.

**Chosen Strategy: Pre-computed dataset.** For an event management platform, we need deterministic results (two users looking at the same date must see the same tithi), and we don't need sub-second astronomical precision. Pre-computed data from reliable sources (Drik Panchang, Nepal Rashtriya Panchang, or established Nepali Patro publishers) gives us exactly what we need.

**Initial Coverage:** BS 2082–2087 (approximately AD 2025–2030). This covers the immediate operational window for Application V2 and its first 4–5 years of production use.

**Data Shape per Day:**
```json
{
  "bsDate": { "year": 2082, "month": 1, "day": 1 },
  "tithi": { "name": "Pratipada", "nameNe": "प्रतिपदा", "number": 1 },
  "paksha": "shukla",
  "nakshatra": { "name": "Ashwini", "nameNe": "अश्विनी" }
}
```

**Size Estimate:** ~365 days × 6 years × ~100 bytes per entry = approximately 200 KB of JSON. Manageable.

**Maintenance:** New year's data must be sourced and added annually before the start of each BS year. This becomes a recurring task on the team's calendar.

**Data Sourcing Plan:**
1. Primary: Nepal Rashtriya Panchang (government-published annual panchang)
2. Secondary validation: Drik Panchang (drikpanchang.com) for cross-referencing
3. Format: Manual transcription into structured JSON following the package's schema, reviewed by team before merging

### 3.3 Festival & Auspicious Date Data (Curated Problem)

Nepal has approximately 50+ recognized festivals, 20+ government public holidays, and a variable number of auspicious dates each year. Some are fixed in the BS calendar (Dashain always starts on Ashwin Shukla Pratipada), some are astronomically determined (certain Ekadashi dates), and some are government-declared annually.

**Data Categories:**

| Category | Examples | Determination Method |
|---|---|---|
| Fixed BS-date festivals | Dashain (Ashwin Shukla Pratipada to Purnima), Tihar, Maghe Sankranti | Same BS date every year — can be encoded as rules |
| Tithi-dependent festivals | Ekadashi, Shivaratri, Janai Purnima, Chhath | Depend on tithi data — resolved at runtime using panchang layer |
| Government-declared holidays | Democracy Day, Republic Day, various community holidays | Published annually by the government — must be updated each year |
| Auspicious dates (Muhurat) | Shubha Vivah Muhurat, Bratabandha dates | Published annually in panchangs, vary each year |
| Inauspicious periods | Pitru Paksha, Chaturmas, certain Ekadashi periods | Tithi-dependent — resolved using panchang layer |

**Chosen Strategy: Hybrid — Rules + Static Data + Runtime Injection**

- **Rule-based festivals** (fixed BS dates): Encoded directly in the package as logic. Dashain will always be computed from Ashwin Shukla Pratipada. No annual update needed.
- **Tithi-dependent festivals**: Resolved at runtime by querying the panchang layer. "Find the date where tithi = Chaturdashi in Magh Krishna Paksha" → that's Shivaratri. No annual update needed as long as tithi data exists.
- **Government holidays and Muhurat dates**: Shipped as static JSON data per fiscal year. Updated annually. Additionally, the `registerEvents()` API allows Application's admin panel to inject custom entries at runtime — this covers any events the base dataset misses.

**Initial Base Dataset Coverage:** BS 2082–2084 (3 fiscal years). Approximately 70–80 entries per year covering all major festivals, public holidays, and known auspicious date categories.

---

## 4. Package Architecture

### 4.1 Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript | All immediate consumers (Next.js, NestJS, React Native) are in the JS/TS ecosystem. Native import, zero overhead, shared types. |
| Build Target | ESM + CJS dual output | ESM for modern bundlers (Next.js, Vite), CJS for NestJS and older tooling. Use `tsup` for the dual build. |
| Package Manager | pnpm | Consistent with Application V2 project standards. |
| Testing | Vitest | Fast, TypeScript-native, compatible with the project ecosystem. |
| Data Format | JSON (embedded in package) | Static datasets ship as JSON files imported at build time. No runtime file I/O needed. |

### 4.2 Directory Structure

```
mero-patro/
├── src/
│   ├── converter/                  # Layer 1: BS ↔ AD conversion
│   │   ├── bs-to-ad.ts
│   │   ├── ad-to-bs.ts
│   │   ├── utils.ts                # Shared helpers (leap year, day-of-week, etc.)
│   │   └── types.ts                # BSDate, ADDate, DualDate
│   │
│   ├── calendar/                   # Layer 2: Calendar grid generation
│   │   ├── month-grid.ts           # getMonthCalendar() — the main grid builder
│   │   ├── navigation.ts           # Next/prev month, month range queries
│   │   └── types.ts                # CalendarDay, CalendarMonth
│   │
│   ├── panchang/                   # Layer 3: Tithi & lunar data
│   │   ├── panchang-lookup.ts      # getPanchang() — lookup from pre-computed data
│   │   └── types.ts                # PanchangInfo, Tithi, Paksha, Nakshatra
│   │
│   ├── events/                     # Layer 4: Festivals, holidays, auspicious dates
│   │   ├── event-engine.ts         # getEventsForDate(), getEventsForMonth()
│   │   ├── classifier.ts           # isAuspicious() — date classification logic
│   │   ├── rule-based-festivals.ts # Computed festivals (Dashain, Tihar, etc.)
│   │   └── types.ts                # CalendarEvent, AuspiciousClassification
│   │
│   ├── data/                       # Static datasets (JSON)
│   │   ├── bs-month-lengths.json   # BS 2000–2100 month length lookup
│   │   ├── panchang/               # Per-year tithi data
│   │   │   ├── 2082.json
│   │   │   ├── 2083.json
│   │   │   └── ...
│   │   ├── festivals.json          # Base festival definitions
│   │   └── public-holidays/        # Per-year government holidays
│   │       ├── 2082.json
│   │       └── ...
│   │
│   ├── i18n/                       # Localization data
│   │   ├── months.ts               # BS month names (Nepali + English + Romanized)
│   │   ├── weekdays.ts             # Weekday names (Nepali + English)
│   │   ├── tithi-names.ts          # All 30 tithi names (Nepali + English)
│   │   └── paksha-names.ts         # Shukla/Krishna names
│   │
│   └── index.ts                    # Public API — single entry point
│
├── tests/
│   ├── converter/
│   │   ├── bs-to-ad.test.ts
│   │   ├── ad-to-bs.test.ts
│   │   └── edge-cases.test.ts      # Year boundaries, month-end, leap handling
│   ├── calendar/
│   │   └── month-grid.test.ts
│   ├── panchang/
│   │   └── panchang-lookup.test.ts
│   └── events/
│       ├── event-engine.test.ts
│       └── classifier.test.ts
│
├── package.json
├── tsconfig.json
├── tsup.config.ts                  # Build configuration (ESM + CJS)
├── vitest.config.ts
├── .eslintrc.js
├── CHANGELOG.md
└── README.md
```

### 4.3 Public API Surface

The package exposes a single entry point (`index.ts`) with a clean, minimal API. Every function accepts either a `BSDate` object or a JavaScript `Date` (Gregorian), so consumers never need to pre-convert.

**Layer 1 — Conversion:**

```typescript
toBS(adDate: Date): BSDate
toAD(bsDate: BSDate): Date
today(): DualDate
formatBS(bsDate: BSDate, format?: string): string
// format tokens: YYYY (year), MM (month num), DD (day), MMMM (month name)
```

**Layer 2 — Calendar Grid:**

```typescript
getMonthCalendar(bsYear: number, bsMonth: number, options?: CalendarOptions): CalendarMonth
// Returns: { year, month, monthName, days: CalendarDay[], totalDays, startWeekday }
// options.includeAdjacentDays: boolean — include overflow days from prev/next month
// options.enrichPanchang: boolean — attach tithi data to each day (default: true)
// options.enrichEvents: boolean — attach festivals/holidays to each day (default: true)

getMonthDays(bsYear: number, bsMonth: number): number
// Returns: number of days in the given BS month
```

**Layer 3 — Panchang:**

```typescript
getPanchang(date: Date | BSDate): PanchangInfo | null
// Returns tithi, paksha, nakshatra for the given date
// Returns null if date is outside the pre-computed data range
```

**Layer 4 — Events & Classification:**

```typescript
getEventsForDate(date: Date | BSDate): CalendarEvent[]
getEventsForMonth(bsYear: number, bsMonth: number): CalendarEvent[]
getAuspiciousDates(bsYear: number, bsMonth: number, category?: EventCategory): AuspiciousDay[]
isAuspicious(date: Date | BSDate): 'auspicious' | 'inauspicious' | 'neutral'

// Runtime data injection — called once at app startup
registerEvents(events: CalendarEvent[]): void
// Merges provided events with the base dataset for the current runtime session
```

### 4.4 Core Types

```typescript
// --- Layer 1 Types ---

interface BSDate {
  year: number;       // e.g., 2082
  month: number;      // 1–12 (Baishakh = 1, Chaitra = 12)
  day: number;        // 1–32
}

interface DualDate {
  bs: BSDate;
  ad: Date;
  weekday: { en: string; ne: string };   // "Sunday" / "आइतबार"
  monthName: { en: string; ne: string }; // "Baishakh" / "बैशाख"
}

// --- Layer 2 Types ---

interface CalendarDay {
  bs: BSDate;
  ad: Date;
  weekday: { en: string; ne: string };
  isToday: boolean;
  isCurrentMonth: boolean;       // false for overflow days from adjacent months
  panchang: PanchangInfo | null; // null if data unavailable
  events: CalendarEvent[];       // empty array if no events
  classification: 'auspicious' | 'inauspicious' | 'neutral';
}

interface CalendarMonth {
  year: number;
  month: number;
  monthName: { en: string; ne: string };
  totalDays: number;
  startWeekday: number;          // 0 = Sunday, 6 = Saturday
  days: CalendarDay[];           // includes adjacent month overflow if requested
}

interface CalendarOptions {
  includeAdjacentDays?: boolean; // default: true
  enrichPanchang?: boolean;      // default: true
  enrichEvents?: boolean;        // default: true
}

// --- Layer 3 Types ---

interface PanchangInfo {
  tithi: {
    name: string;     // "Pratipada"
    nameNe: string;   // "प्रतिपदा"
    number: number;   // 1–30
  };
  paksha: 'shukla' | 'krishna';
  pakshaName: { en: string; ne: string };   // "Shukla Paksha" / "शुक्ल पक्ष"
  nakshatra?: {
    name: string;     // "Ashwini"
    nameNe: string;   // "अश्विनी"
  };
}

// --- Layer 4 Types ---

interface CalendarEvent {
  id: string;
  name: { en: string; ne: string };
  type: 'festival' | 'public_holiday' | 'auspicious_date'
      | 'inauspicious_period' | 'custom';
  category?: 'wedding' | 'bratabandha' | 'religious'
           | 'national' | 'cultural' | 'general';
  description?: { en: string; ne: string };
  isPublicHoliday: boolean;
}

type AuspiciousClassification = 'auspicious' | 'inauspicious' | 'neutral';

type EventCategory = CalendarEvent['category'];
```

---

## 5. Implementation Phases

Development is divided into four phases. Each phase produces a working, testable increment. Phase 1 is the foundation — nothing else works without it.

### Phase 1: Date Conversion Engine (Week 1–2)

**Goal:** Rock-solid BS ↔ AD conversion with comprehensive test coverage.

**Deliverables:**
- `toBS()`, `toAD()`, `today()`, `formatBS()` functions
- `getMonthDays()` for any BS year/month
- BS month length lookup table (BS 2000–2100)
- Localization data: month names, weekday names in English and Nepali
- Validation: reject invalid BS dates (month 13, day 33, years outside range)
- Test suite: minimum 50 test cases covering year boundaries, month transitions, known date pairs, edge cases (Chaitra 30 vs 31 depending on year), and roundtrip consistency (toBS(toAD(date)) === date)

**Critical Edge Cases to Test:**
- BS new year day (Baishakh 1) for multiple years
- Last day of each BS month across different years (month lengths vary)
- BS dates near Gregorian year boundary (December/January)
- Dates at the start and end of the supported range (BS 2000 and BS 2100)
- Today's date roundtrip consistency

**Data Source Task:** Acquire and validate the BS month length lookup table. Cross-reference at least two independent open-source sources. Commit as `bs-month-lengths.json`.

**Exit Criteria:** All conversion functions pass tests. Any BS date in the 2000–2100 range converts correctly in both directions.

### Phase 2: Calendar Grid Generator (Week 3)

**Goal:** Given a BS year and month, produce a complete calendar month data structure ready for UI rendering.

**Deliverables:**
- `getMonthCalendar()` function returning `CalendarMonth`
- Adjacent month overflow days (so the grid always shows complete weeks)
- Each `CalendarDay` populated with: BS date, AD date, weekday names, `isToday`, `isCurrentMonth`
- Month navigation helpers: next month, previous month
- Test suite: verify grid shape (always 35 or 42 days for complete week rows), correct weekday alignment, correct overflow day attribution

**Integration Point:** `getMonthCalendar()` calls Layer 1 functions internally. This phase validates that the conversion engine works correctly when called at scale (365+ conversions per month grid including adjacent days).

**Exit Criteria:** Calendar grid for any BS month in the supported range produces correct, renderable data. Manually verify against a physical Nepali calendar for 3 sample months.

### Phase 3: Panchang Integration (Week 4–5)

**Goal:** Enrich each calendar day with tithi, paksha, and nakshatra data.

**Deliverables:**
- Pre-computed panchang dataset for BS 2082–2087 (JSON files)
- `getPanchang()` function
- Integration with `getMonthCalendar()` — panchang data automatically attached when `enrichPanchang: true`
- Tithi name localization (all 30 tithis in English and Nepali)
- Graceful fallback: dates outside the pre-computed range return `null` for panchang, not an error
- Test suite: verify known tithis for specific dates, verify Purnima and Amavasya dates match published sources

**Data Sourcing Task (Parallel with Coding):**
This is the labor-intensive phase. The team must:
1. Source panchang data for BS 2082–2087 from Nepal Rashtriya Panchang and/or Drik Panchang
2. Transcribe into the package's JSON schema
3. Cross-validate a sample of 30 dates against independent sources
4. Commit reviewed data files

**Exit Criteria:** `getPanchang()` returns correct tithi for all dates in the pre-computed range. Purnima (tithi 15 Shukla) and Amavasya (tithi 15/30 Krishna) dates match published references.

### Phase 4: Festival, Holiday & Classification Engine (Week 6–7)

**Goal:** Complete the calendar intelligence layer with festivals, holidays, auspicious date tagging, and the runtime injection API.

**Deliverables:**
- Base festival dataset (JSON): ~40 major festivals with bilingual names, types, categories, descriptions
- Public holiday dataset for BS 2082–2084
- Rule-based festival resolver: Dashain, Tihar, and other festivals whose dates can be computed from tithi data
- `getEventsForDate()`, `getEventsForMonth()`, `getAuspiciousDates()`
- `isAuspicious()` classification function
- `registerEvents()` runtime injection API for admin-curated entries
- Integration with `getMonthCalendar()` — events and classification automatically attached when `enrichEvents: true`
- Test suite: verify Dashain dates for 3 years, verify Shivaratri resolves correctly from tithi, verify `registerEvents()` merges correctly with base data

**Data Sourcing Task (Parallel):**
1. Compile the base festival list with bilingual metadata
2. Map each festival to its determination method (fixed BS date, tithi-dependent, or government-declared)
3. Source public holiday lists for BS 2082–2084
4. Define the auspicious date categories relevant to event management (wedding, bratabandha, grihapravesh)

**Exit Criteria:** `getMonthCalendar()` with all enrichment options enabled returns complete, accurate calendar data for any month in BS 2082–2087. A frontend developer can render a full Nepali Patro from this data alone.

### Phase 5: Polish, Documentation & Publish (Week 8)

**Goal:** Production-ready package with documentation, optimized build, and npm publication.

**Deliverables:**
- README with quick-start guide, API reference, and integration examples for NestJS and Next.js
- CHANGELOG following conventional changelog format
- `tsup` build producing ESM + CJS outputs with type declarations
- Package size audit (target: under 500 KB including all datasets)
- Performance benchmark: `getMonthCalendar()` with full enrichment must complete in under 10ms
- npm publish as `mero-patro`

---

## 6. How This Package Integrates with Application V2

The package provides raw calendar intelligence. Application V2's application layer handles everything else. Here is how the two connect:

### 6.1 Frontend (Next.js) — Calendar Component

The Application calendar UI component calls `getMonthCalendar()` and maps the returned `CalendarDay[]` array to its visual grid. Each day cell renders:
- BS date (primary) and AD date (secondary) from the `CalendarDay` object
- Tithi badge from `panchang.tithi.nameNe`
- Festival/holiday indicators from the `events` array
- Auspicious/inauspicious color coding from the `classification` field

The component manages its own state (selected date, view mode, navigation) — the package just provides the data.

### 6.2 Backend (NestJS) — Calendar API Endpoints

The NestJS backend imports the package and wraps it in two API endpoints (as planned in our earlier calendar system architecture):

- `GET /calendar/month-summary` — calls `getMonthCalendar()` and merges with booking count data from PostgreSQL
- `GET /calendar/day-detail` — calls the package for cultural context, then enriches with bookings, inquiries, and operational data from the database

At application startup, the backend calls `registerEvents()` with any admin-curated festival/event entries stored in the `nepali_calendar_data` PostgreSQL table.

### 6.3 Mobile (React Native) — Same Data, Different Rendering

The React Native app imports the same package via npm and calls the same functions. Only the rendering layer differs (React Native components instead of DOM elements).

---

## 7. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Panchang data sourcing takes longer than expected | Phase 3 delayed | Medium | Start data sourcing in Phase 1 as a parallel task. Define the JSON schema early so data entry can begin before the code is ready. |
| Tithi data has errors | Users see incorrect panchang information | Medium | Mandatory cross-validation against two independent sources for every data file. Automated tests against known reference dates. |
| BS month length data has gaps beyond 2090 | Package fails for far-future dates | Low | The 2000–2100 range covers 75+ years of future dates. Log a clear error for out-of-range queries. Extend data when needed. |
| Package grows too large from embedded datasets | Increased bundle size for frontend consumers | Low | JSON datasets are compressible and tree-shakeable. Monitor total package size (target under 500 KB). Offer lazy-loading option for panchang data if needed. |
| Auspicious date classifications are disputed | Users disagree with the package's classification | Medium | Use the Nepal government's official panchang as the authority. The `registerEvents()` API allows overrides. Display only, never block bookings based on classification. |

---

## 8. Data Maintenance — Annual Process

Every BS new year (around mid-April AD), the following maintenance tasks must be completed:

1. **Source new year's panchang data** from Nepal Rashtriya Panchang. Transcribe into JSON following the established schema. Cross-validate 30+ dates.
2. **Update public holidays** from the government's published holiday list for the new fiscal year.
3. **Review auspicious date categories** — confirm Shubha Vivah Muhurat dates and other event-relevant dates for the new year.
4. **Publish a new package version** with the updated data files.
5. **Update Application's admin-curated events** in the database if any custom entries need adjustment.

This is a recurring process, not a one-time task. It should be added to the team's annual planning calendar around Chaitra (March–April).

---

## 9. Success Criteria

The package is considered production-ready when:

1. BS ↔ AD conversion passes 100% of test cases across the 2000–2100 range
2. `getMonthCalendar()` output for any month in BS 2082–2087 matches a physical Nepali calendar when manually verified
3. Panchang data (tithi, paksha) matches published panchang references for all pre-computed dates
4. Festival and holiday data covers all major Nepal festivals and government holidays for at least 3 fiscal years
5. A frontend developer can render a complete, culturally accurate Nepali Patro calendar using only this package's output — no additional data sources needed
6. Package size is under 500 KB
7. `getMonthCalendar()` with full enrichment completes in under 10ms
8. Zero runtime dependencies (only dev dependencies for build and test)

---

## 10. Next Steps

1. **Approve this plan** — confirm scope boundaries, data strategy, and timeline with the team
2. **Begin Phase 1** — set up the package repository, install tooling (TypeScript, tsup, Vitest, ESLint), and start implementing the BS ↔ AD conversion engine
3. **Begin data sourcing (parallel)** — acquire panchang data for BS 2082–2087 and compile the base festival dataset. This can proceed independently while code development is underway.
4. **Define the JSON schemas** for panchang and festival data files early — this unblocks data entry work from code implementation

---

*This document is maintained by the Application V2 development team. It will be updated as implementation progresses and decisions are refined.*
