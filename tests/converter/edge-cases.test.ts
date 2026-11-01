import { describe, it, expect, vi } from 'vitest'
import { toBS, toAD, formatBS, today } from '../../src/converter/index.js'
import { getMonthLengths } from '../../src/data/bs-month-lengths.js'

function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

// ─── Roundtrip consistency ──────────────────────────────────────────────────

describe('roundtrip: toBS(toAD(date)) === original', () => {
  it('holds for every day in BS 2082 (365 days)', () => {
    const lengths = getMonthLengths(2082)
    for (let m = 1; m <= 12; m++) {
      const daysInMonth = lengths[m - 1] as number
      for (let d = 1; d <= daysInMonth; d++) {
        const original = { year: 2082, month: m, day: d }
        const roundtripped = toBS(toAD(original))
        expect(roundtripped, `BS 2082-${m}-${d}`).toEqual(original)
      }
    }
  })

  it('holds for every day in BS 2083 (365 days)', () => {
    const lengths = getMonthLengths(2083)
    for (let m = 1; m <= 12; m++) {
      const daysInMonth = lengths[m - 1] as number
      for (let d = 1; d <= daysInMonth; d++) {
        const original = { year: 2083, month: m, day: d }
        expect(toBS(toAD(original)), `BS 2083-${m}-${d}`).toEqual(original)
      }
    }
  })

  it('holds for Baishakh 1 across all supported years', () => {
    for (let year = 2000; year <= 2090; year++) {
      const original = { year, month: 1, day: 1 }
      expect(toBS(toAD(original)), `BS ${year}-01-01`).toEqual(original)
    }
  })
})

describe('roundtrip: toAD(toBS(date)) ≡ original', () => {
  const sampleDates = [
    utc(1943, 4, 14),  // epoch
    utc(2000, 1, 1),
    utc(2025, 4, 14),  // BS 2082 new year
    utc(2025, 12, 31), // Gregorian year end
    utc(2026, 1, 1),   // Gregorian new year
    utc(2026, 4, 14),  // BS 2083 new year
  ]

  for (const date of sampleDates) {
    it(`holds for ${date.toISOString().slice(0, 10)}`, () => {
      const roundtripped = toAD(toBS(date))
      expect(roundtripped.getUTCFullYear()).toBe(date.getUTCFullYear())
      expect(roundtripped.getUTCMonth()).toBe(date.getUTCMonth())
      expect(roundtripped.getUTCDate()).toBe(date.getUTCDate())
    })
  }
})

// ─── Validation errors ─────────────────────────────────────────────────────

describe('toAD — validation: RangeError on invalid input', () => {
  it('throws for year below 2000', () => {
    expect(() => toAD({ year: 1999, month: 1, day: 1 })).toThrowError(RangeError)
  })

  it('throws for year above 2090', () => {
    expect(() => toAD({ year: 2091, month: 1, day: 1 })).toThrowError(RangeError)
  })

  it('throws for month 0', () => {
    expect(() => toAD({ year: 2082, month: 0, day: 1 })).toThrowError(RangeError)
  })

  it('throws for month 13', () => {
    expect(() => toAD({ year: 2082, month: 13, day: 1 })).toThrowError(RangeError)
  })

  it('throws for day 0', () => {
    expect(() => toAD({ year: 2082, month: 1, day: 0 })).toThrowError(RangeError)
  })

  it('throws for day exceeding month length (BS 2082 Baishakh has 31 days, not 32)', () => {
    expect(() => toAD({ year: 2082, month: 1, day: 32 })).toThrowError(RangeError)
  })

  it('allows last valid day of BS 2082 Ashadh (32 days)', () => {
    expect(() => toAD({ year: 2082, month: 3, day: 32 })).not.toThrow()
  })

  it('throws for day 33 in Ashadh (max is 32)', () => {
    expect(() => toAD({ year: 2082, month: 3, day: 33 })).toThrowError(RangeError)
  })

  it('error message includes the actual month length', () => {
    expect(() => toAD({ year: 2082, month: 1, day: 32 }))
      .toThrowError(/31/)
  })
})

describe('toBS — validation: RangeError on out-of-range input', () => {
  it('throws for date exactly one day before epoch', () => {
    expect(() => toBS(utc(1943, 4, 13))).toThrowError(RangeError)
  })

  it('does NOT throw for the epoch itself', () => {
    expect(() => toBS(utc(1943, 4, 14))).not.toThrow()
  })
})

// ─── Chaitra variable length ───────────────────────────────────────────────

describe('Chaitra variable length', () => {
  it('BS 2082 Chaitra has 30 days', () => {
    const lengths = getMonthLengths(2082)
    expect(lengths[11]).toBe(30)
    // day 30 is valid, day 31 is not
    expect(() => toAD({ year: 2082, month: 12, day: 30 })).not.toThrow()
    expect(() => toAD({ year: 2082, month: 12, day: 31 })).toThrowError(RangeError)
  })

  it('BS 2084 Chaitra has 30 days', () => {
    const lengths = getMonthLengths(2084)
    expect(lengths[11]).toBe(30)
    expect(() => toAD({ year: 2084, month: 12, day: 30 })).not.toThrow()
    expect(() => toAD({ year: 2084, month: 12, day: 31 })).toThrowError(RangeError)
  })
})

describe('independent published month starts', () => {
  const anchors = [
    { bs: { year: 2084, month: 3, day: 1 }, ad: '2027-06-15' },
    { bs: { year: 2084, month: 5, day: 1 }, ad: '2027-08-17' },
    { bs: { year: 2084, month: 10, day: 1 }, ad: '2028-01-14' },
    { bs: { year: 2085, month: 3, day: 1 }, ad: '2028-06-15' },
    { bs: { year: 2085, month: 6, day: 1 }, ad: '2028-09-16' },
    { bs: { year: 2086, month: 2, day: 1 }, ad: '2029-05-14' },
    { bs: { year: 2086, month: 10, day: 1 }, ad: '2030-01-14' },
  ]

  for (const { bs, ad } of anchors) {
    it(`BS ${bs.year}/${bs.month}/1 is AD ${ad}`, () => {
      expect(toAD(bs).toISOString().slice(0, 10)).toBe(ad)
      expect(toBS(utc(...ad.split('-').map(Number) as [number, number, number]))).toEqual(bs)
    })
  }
})

describe('invalid numeric dates', () => {
  it('rejects invalid Gregorian dates', () => {
    expect(() => toBS(new Date(NaN))).toThrowError(RangeError)
  })

  it('rejects fractional and non-finite BS parts', () => {
    expect(() => toAD({ year: 2084.5, month: 1, day: 1 })).toThrowError(RangeError)
    expect(() => toAD({ year: 2084, month: NaN, day: 1 })).toThrowError(RangeError)
    expect(() => toAD({ year: 2084, month: 1, day: 1.5 })).toThrowError(RangeError)
  })
})

describe('today in Nepal', () => {
  it('changes date at Nepal midnight, 18:15 UTC', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2025-04-13T18:14:59Z'))
      expect(today().bs).toEqual({ year: 2081, month: 12, day: 31 })

      vi.setSystemTime(new Date('2025-04-13T18:15:00Z'))
      const result = today()
      expect(result.bs).toEqual({ year: 2082, month: 1, day: 1 })
      expect(result.ad.toISOString()).toBe('2025-04-14T00:00:00.000Z')
      expect(result.weekday.en).toBe('Monday')
    } finally {
      vi.useRealTimers()
    }
  })
})

// ─── formatBS ──────────────────────────────────────────────────────────────

describe('formatBS', () => {
  it('default format "YYYY-MM-DD"', () => {
    expect(formatBS({ year: 2082, month: 1, day: 5 })).toBe('2082-01-05')
  })

  it('custom format with month name', () => {
    expect(formatBS({ year: 2082, month: 1, day: 5 }, 'DD MMMM YYYY')).toBe('05 Baishakh 2082')
  })

  it('formats Chaitra correctly', () => {
    expect(formatBS({ year: 2082, month: 12, day: 30 }, 'MMMM')).toBe('Chaitra')
  })

  it('pads single-digit month and day', () => {
    expect(formatBS({ year: 2082, month: 3, day: 7 })).toBe('2082-03-07')
  })

  it('does not pad four-digit year', () => {
    expect(formatBS({ year: 2082, month: 1, day: 1 }, 'YYYY')).toBe('2082')
  })

  it('passes through unknown tokens unchanged', () => {
    expect(formatBS({ year: 2082, month: 1, day: 1 }, 'YYYY/MM/DD')).toBe('2082/01/01')
  })
})

// ─── Data integrity: all years have valid month lengths ───────────────────

describe('data integrity', () => {
  it('all 91 supported years have exactly 12 month entries', () => {
    for (let year = 2000; year <= 2090; year++) {
      const lengths = getMonthLengths(year)
      expect(lengths, `BS ${year}`).toHaveLength(12)
    }
  })

  it('all month lengths are in the valid range 28–32', () => {
    for (let year = 2000; year <= 2090; year++) {
      const lengths = getMonthLengths(year)
      for (let m = 0; m < 12; m++) {
        const len = lengths[m] as number
        expect(len, `BS ${year} month ${m + 1}`).toBeGreaterThanOrEqual(28)
        expect(len, `BS ${year} month ${m + 1}`).toBeLessThanOrEqual(32)
      }
    }
  })

  it('all years have 365 or 366 days', () => {
    for (let year = 2000; year <= 2090; year++) {
      const lengths = getMonthLengths(year)
      const total = lengths.reduce((s, n) => s + n, 0)
      expect([365, 366], `BS ${year} total days`).toContain(total)
    }
  })
})
