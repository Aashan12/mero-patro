import { describe, it, expect, vi } from 'vitest'
import { getMonthCalendar, getMonthDays } from '../../src/calendar/month-grid.js'
import { nextMonth, prevMonth, monthRange } from '../../src/calendar/navigation.js'

// ─── getMonthDays ────────────────────────────────────────────────────────────

describe('getMonthDays', () => {
  it('BS 2082 Baishakh (month 1) has 31 days', async () => {
    expect(getMonthDays(2082, 1)).toBe(31)
  })

  it('BS 2082 Ashadh (month 3) has 32 days', async () => {
    expect(getMonthDays(2082, 3)).toBe(32)
  })

  it('BS 2082 Mangsir (month 8) has 29 days', async () => {
    expect(getMonthDays(2082, 8)).toBe(29)
  })

  it('BS 2082 Chaitra (month 12) has 30 days', async () => {
    expect(getMonthDays(2082, 12)).toBe(30)
  })

  it('throws RangeError for invalid month', async () => {
    expect(() => getMonthDays(2082, 0)).toThrowError(RangeError)
    expect(() => getMonthDays(2082, 13)).toThrowError(RangeError)
  })
})

describe('calendar range and Nepal today', () => {
  it('renders the first and last supported months without requesting unsupported adjacent years', async () => {
    const options = { enrichPanchang: false, enrichEvents: false }
    const first = await getMonthCalendar(2000, 1, options)
    const last = await getMonthCalendar(2090, 12, options)
    expect(first.days[0]?.bs).toEqual({ year: 2000, month: 1, day: 1 })
    expect(last.days[last.days.length - 1]?.bs.year).toBe(2090)
  })

  it('marks today at Nepal midnight', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2025-04-13T18:15:00Z'))
      const month = await getMonthCalendar(2082, 1, { enrichPanchang: false, enrichEvents: false })
      expect(month.days.filter(day => day.isToday).map(day => day.bs)).toEqual([
        { year: 2082, month: 1, day: 1 },
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('still renders supported months when the current date is outside coverage', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2040-01-01T00:00:00Z'))
      const month = await getMonthCalendar(2082, 1, { enrichPanchang: false, enrichEvents: false })
      expect(month.days.every(day => !day.isToday)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

// ─── getMonthCalendar — grid shape ───────────────────────────────────────────

describe('getMonthCalendar — grid shape', () => {
  it('total days array length is always a multiple of 7 (complete week rows)', async () => {
    // Test several months with different startWeekdays
    const months = [
      { year: 2082, month: 1 },  // Baishakh — starts Monday
      { year: 2082, month: 3 },  // Ashadh
      { year: 2082, month: 6 },  // Ashwin
      { year: 2082, month: 9 },  // Poush
      { year: 2082, month: 12 }, // Chaitra
      { year: 2083, month: 1 },  // new year
    ]
    for (const { year, month } of months) {
      const cal = await getMonthCalendar(year, month)
      expect(cal.days.length % 7, `BS ${year}/${month}`).toBe(0)
    }
  })

  it('grid has exactly 35 or 42 days (5 or 6 complete week rows)', async () => {
    for (let month = 1; month <= 12; month++) {
      const cal = await getMonthCalendar(2082, month)
      expect([35, 42], `BS 2082 month ${month}`).toContain(cal.days.length)
    }
  })

  it('without adjacent days, days.length equals totalDays exactly', async () => {
    const cal = await getMonthCalendar(2082, 1, { includeAdjacentDays: false })
    expect(cal.days.length).toBe(31)
    expect(cal.days.length).toBe(cal.totalDays)
  })

  it('totalDays field matches the actual month length', async () => {
    expect((await getMonthCalendar(2082, 1)).totalDays).toBe(31)
    expect((await getMonthCalendar(2082, 3)).totalDays).toBe(32)
    expect((await getMonthCalendar(2082, 8)).totalDays).toBe(29)
  })
})

// ─── getMonthCalendar — startWeekday ────────────────────────────────────────

describe('getMonthCalendar — startWeekday', () => {
  it('BS 2082 Baishakh starts on Monday (startWeekday = 1)', async () => {
    // Verified: BS 2082-01-01 = AD 2025-04-14 = Monday
    const cal = await getMonthCalendar(2082, 1)
    expect(cal.startWeekday).toBe(1)
  })

  it('BS 2083 Baishakh starts on Tuesday (startWeekday = 2)', async () => {
    // Verified: BS 2083-01-01 = AD 2026-04-14 = Tuesday
    const cal = await getMonthCalendar(2083, 1)
    expect(cal.startWeekday).toBe(2)
  })

  it('first overflow day count equals startWeekday', async () => {
    const cal = await getMonthCalendar(2082, 1) // startWeekday = 1
    // Count days from the start of the array that are not current month (pre-overflow)
    let preOverflowCount = 0
    for (const d of cal.days) {
      if (d.isCurrentMonth) break
      preOverflowCount++
    }
    expect(preOverflowCount).toBe(cal.startWeekday)
  })
})

// ─── getMonthCalendar — isCurrentMonth flag ──────────────────────────────────

describe('getMonthCalendar — isCurrentMonth', () => {
  it('all days with isCurrentMonth=true have the correct year and month', async () => {
    const cal = await getMonthCalendar(2082, 1)
    const currentDays = cal.days.filter(d => d.isCurrentMonth)
    for (const day of currentDays) {
      expect(day.bs.year).toBe(2082)
      expect(day.bs.month).toBe(1)
    }
  })

  it('overflow days have isCurrentMonth=false', async () => {
    const cal = await getMonthCalendar(2082, 1)
    const overflowDays = cal.days.filter(d => !d.isCurrentMonth)
    expect(overflowDays.length).toBeGreaterThan(0)
    for (const day of overflowDays) {
      // Either previous month or next month
      expect(day.bs.month === 12 || day.bs.month === 2).toBe(true)
    }
  })

  it('count of isCurrentMonth=true days matches totalDays', async () => {
    const cal = await getMonthCalendar(2082, 1)
    const currentCount = cal.days.filter(d => d.isCurrentMonth).length
    expect(currentCount).toBe(cal.totalDays)
  })

  it('without adjacent days, all days are isCurrentMonth=true', async () => {
    const cal = await getMonthCalendar(2082, 1, { includeAdjacentDays: false })
    expect(cal.days.every(d => d.isCurrentMonth)).toBe(true)
  })
})

// ─── getMonthCalendar — overflow day content ─────────────────────────────────

describe('getMonthCalendar — overflow day content', () => {
  it('pre-month overflow days come from the previous month in correct order', async () => {
    const cal = await getMonthCalendar(2082, 1) // starts Monday, so 1 overflow day before
    const preOverflow = cal.days.filter(d => !d.isCurrentMonth && d.bs.month === 12)
    // Should be the last day(s) of BS 2081 Chaitra (month 12)
    expect(preOverflow).toHaveLength(1)
    expect(preOverflow[0]?.bs.year).toBe(2081)
    expect(preOverflow[0]?.bs.month).toBe(12)
    // It should be the last day of Chaitra 2081
    expect(preOverflow[0]?.bs.day).toBe(getMonthDays(2081, 12))
  })

  it('post-month overflow days are the first days of the next month', async () => {
    const cal = await getMonthCalendar(2082, 1) // 31 current + 1 pre = 32, needs 3 more to reach 35
    const postOverflow = cal.days.filter(d => !d.isCurrentMonth && d.bs.month === 2)
    expect(postOverflow.length).toBeGreaterThan(0)
    // Should start at Jestha day 1
    expect(postOverflow[0]?.bs.day).toBe(1)
    // Days should be sequential
    for (let i = 0; i < postOverflow.length; i++) {
      expect(postOverflow[i]?.bs.day).toBe(i + 1)
    }
  })

  it('year boundary: BS 2082 Chaitra overflow days come from BS 2083 Baishakh', async () => {
    const cal = await getMonthCalendar(2082, 12)
    const postOverflow = cal.days.filter(d => !d.isCurrentMonth && d.bs.month !== 11)
    // Post-overflow should be from BS 2083 Baishakh (month 1)
    for (const d of postOverflow) {
      if (d.bs.month !== 11) { // not pre-overflow from month 11
        expect(d.bs.year).toBe(2083)
        expect(d.bs.month).toBe(1)
      }
    }
  })

  it('year boundary: BS 2083 Baishakh pre-overflow days come from BS 2082 Chaitra', async () => {
    const cal = await getMonthCalendar(2083, 1)
    const preOverflow = cal.days.filter(d => !d.isCurrentMonth && d.bs.month !== 2)
    for (const d of preOverflow) {
      expect(d.bs.year).toBe(2082)
      expect(d.bs.month).toBe(12)
    }
  })
})

// ─── getMonthCalendar — weekday correctness ───────────────────────────────────

describe('getMonthCalendar — weekday correctness', () => {
  it('consecutive days have consecutive weekdays (wrapping at Saturday → Sunday)', async () => {
    const cal = await getMonthCalendar(2082, 1)
    for (let i = 1; i < cal.days.length; i++) {
      const prev = cal.days[i - 1]!
      const curr = cal.days[i]!
      const expectedDay = (prev.weekday.en === 'Saturday') ? 'Sunday'
        : {
          Sunday: 'Monday', Monday: 'Tuesday', Tuesday: 'Wednesday',
          Wednesday: 'Thursday', Thursday: 'Friday', Friday: 'Saturday'
        }[prev.weekday.en]
      expect(curr.weekday.en, `day ${i}`).toBe(expectedDay)
    }
  })

  it('first day of BS 2082 Baishakh has weekday Monday', async () => {
    const cal = await getMonthCalendar(2082, 1)
    const firstCurrent = cal.days.find(d => d.isCurrentMonth)
    expect(firstCurrent?.weekday.en).toBe('Monday')
    expect(firstCurrent?.weekday.ne).toBe('सोमबार')
  })

  it('weekday Nepali names are populated', async () => {
    const cal = await getMonthCalendar(2082, 1, { includeAdjacentDays: false })
    for (const day of cal.days) {
      expect(day.weekday.ne.length).toBeGreaterThan(0)
    }
  })
})

// ─── getMonthCalendar — AD date correctness ───────────────────────────────────

describe('getMonthCalendar — AD date correctness', () => {
  it('BS 2082 Baishakh 1 maps to AD 2025-04-14', async () => {
    const cal = await getMonthCalendar(2082, 1, { includeAdjacentDays: false })
    const first = cal.days[0]!
    expect(first.ad.getUTCFullYear()).toBe(2025)
    expect(first.ad.getUTCMonth()).toBe(3) // April = index 3
    expect(first.ad.getUTCDate()).toBe(14)
  })

  it('consecutive days have AD dates exactly 1 day apart', async () => {
    const cal = await getMonthCalendar(2082, 1)
    for (let i = 1; i < cal.days.length; i++) {
      const prev = cal.days[i - 1]!
      const curr = cal.days[i]!
      expect(curr.ad.getTime() - prev.ad.getTime(), `day ${i}`).toBe(86_400_000)
    }
  })
})

// ─── getMonthCalendar — metadata ─────────────────────────────────────────────

describe('getMonthCalendar — metadata fields', () => {
  it('year and month fields match the input', async () => {
    const cal = await getMonthCalendar(2082, 6)
    expect(cal.year).toBe(2082)
    expect(cal.month).toBe(6)
  })

  it('monthName is populated in English and Nepali', async () => {
    const cal = await getMonthCalendar(2082, 1)
    expect(cal.monthName.en).toBe('Baishakh')
    expect(cal.monthName.ne).toBe('बैशाख')
  })

  it('monthName for Chaitra (month 12) is correct', async () => {
    const cal = await getMonthCalendar(2082, 12)
    expect(cal.monthName.en).toBe('Chaitra')
  })

  it('panchang is null for all days when enrichPanchang is false', async () => {
    const cal = await getMonthCalendar(2082, 1, { enrichPanchang: false })
    expect(cal.days.every(d => d.panchang === null)).toBe(true)
  })

  it('events is empty array for all days when enrichEvents is false', async () => {
    const cal = await getMonthCalendar(2082, 1, { enrichEvents: false })
    expect(cal.days.every(d => d.events.length === 0)).toBe(true)
  })

  it('classification is neutral for all days when enrichEvents is false', async () => {
    const cal = await getMonthCalendar(2082, 1, { enrichEvents: false })
    expect(cal.days.every(d => d.classification === 'neutral')).toBe(true)
  })
})

// ─── getMonthCalendar — isToday ──────────────────────────────────────────────

describe('getMonthCalendar — isToday', () => {
  it('at most one day has isToday=true across the whole grid', async () => {
    // Run for a few months to exercise the logic
    for (const month of [1, 3, 6, 9, 12]) {
      const cal = await getMonthCalendar(2082, month)
      const todayCount = cal.days.filter(d => d.isToday).length
      expect(todayCount, `BS 2082/${month}`).toBeLessThanOrEqual(1)
    }
  })
})

// ─── navigation helpers ───────────────────────────────────────────────────────

describe('nextMonth', () => {
  it('advances month within the same year', async () => {
    expect(nextMonth(2082, 1)).toEqual({ year: 2082, month: 2 })
    expect(nextMonth(2082, 11)).toEqual({ year: 2082, month: 12 })
  })

  it('wraps from Chaitra (12) to Baishakh (1) of next year', async () => {
    expect(nextMonth(2082, 12)).toEqual({ year: 2083, month: 1 })
  })
})

describe('prevMonth', () => {
  it('goes back within the same year', async () => {
    expect(prevMonth(2082, 12)).toEqual({ year: 2082, month: 11 })
    expect(prevMonth(2082, 2)).toEqual({ year: 2082, month: 1 })
  })

  it('wraps from Baishakh (1) to Chaitra (12) of previous year', async () => {
    expect(prevMonth(2082, 1)).toEqual({ year: 2081, month: 12 })
  })
})

describe('monthRange', () => {
  it('returns a single month when from === to', async () => {
    const result = monthRange({ year: 2082, month: 3, day: 1 }, { year: 2082, month: 3, day: 1 })
    expect(result).toEqual([{ year: 2082, month: 3 }])
  })

  it('returns all months in a year range', async () => {
    const result = monthRange(
      { year: 2082, month: 11, day: 1 },
      { year: 2083, month: 2, day: 1 }
    )
    expect(result).toEqual([
      { year: 2082, month: 11 },
      { year: 2082, month: 12 },
      { year: 2083, month: 1 },
      { year: 2083, month: 2 },
    ])
  })

  it('returns 12 months for a full BS year', async () => {
    const result = monthRange(
      { year: 2082, month: 1, day: 1 },
      { year: 2082, month: 12, day: 1 }
    )
    expect(result).toHaveLength(12)
  })
})
