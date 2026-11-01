/**
 * BS ↔ AD Date Conversion Accuracy Tests
 * Validates against verified reference data from Hamro Patro & Drik Panchang
 */
import { describe, it, expect } from 'vitest'
import { toAD, toBS } from '../../src/converter/index.js'
import { getMonthDayCount } from '../../src/data/bs-month-lengths.js'

// Verified BS ↔ AD reference pairs from Hamro Patro / Nepal Government
const VERIFIED_CONVERSIONS = [
  { bs: { year: 2082, month: 1, day: 1 }, ad: '2025-04-14', note: 'Nepali New Year' },
  { bs: { year: 2082, month: 10, day: 1 }, ad: '2026-01-15', note: 'Magh 1 / Maghe Sankranti' },
  { bs: { year: 2082, month: 2, day: 15 }, ad: '2025-05-29', note: 'Republic Day' },
  { bs: { year: 2082, month: 11, day: 1 }, ad: '2026-02-13', note: 'Falgun 1' },
  { bs: { year: 2082, month: 12, day: 1 }, ad: '2026-03-15', note: 'Chaitra 1' },
]

function formatDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('Date Conversion Accuracy (Reference Comparison)', () => {
  describe('Key BS → AD conversions match Hamro Patro', () => {
    for (const entry of VERIFIED_CONVERSIONS) {
      it(`BS ${entry.bs.year}/${entry.bs.month}/${entry.bs.day} → AD ${entry.ad} (${entry.note})`, () => {
        const result = toAD(entry.bs)
        expect(formatDate(result)).toBe(entry.ad)
      })
    }
  })

  describe('AD → BS round-trip consistency', () => {
    it('round-trips correctly for all days of BS 2082', () => {
      let failures = 0
      const failureDetails: string[] = []

      for (let month = 1; month <= 12; month++) {
        let daysInMonth = 30
        try { daysInMonth = getMonthDayCount(2082, month) } catch { /* fallback */ }

        for (let day = 1; day <= daysInMonth; day++) {
          const bs = { year: 2082, month, day }
          const ad = toAD(bs)
          const bsBack = toBS(ad)

          if (bsBack.year !== bs.year || bsBack.month !== bs.month || bsBack.day !== bs.day) {
            failures++
            if (failureDetails.length < 5) {
              failureDetails.push(
                `BS ${bs.year}/${bs.month}/${bs.day} → AD ${formatDate(ad)} → BS ${bsBack.year}/${bsBack.month}/${bsBack.day}`
              )
            }
          }
        }
      }

      expect(failures).toBe(0)
    })
  })

  describe('Month-start dates are consecutive', () => {
    it('Baishakh 1 of 2082 falls on April 14, 2025', () => {
      const ad = toAD({ year: 2082, month: 1, day: 1 })
      expect(ad.getUTCFullYear()).toBe(2025)
      expect(ad.getUTCMonth()).toBe(3) // April (0-indexed)
      expect(ad.getUTCDate()).toBe(14)
    })

    it('Magh 1 of 2082 falls on January 15, 2026', () => {
      const ad = toAD({ year: 2082, month: 10, day: 1 })
      expect(ad.getUTCFullYear()).toBe(2026)
      expect(ad.getUTCMonth()).toBe(0) // January
      expect(ad.getUTCDate()).toBe(15)
    })
  })
})
