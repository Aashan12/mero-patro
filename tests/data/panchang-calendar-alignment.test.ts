import { describe, expect, it } from 'vitest'
import { PANCHANG_DATA } from '../../src/data/panchang/all-years.js'
import { getMonthLengths } from '../../src/data/bs-month-lengths.js'

describe('embedded panchang follows the BS calendar table', () => {
  it('has exactly one entry for every supported day in its covered years', () => {
    for (let year = 2080; year <= 2090; year++) {
      const entries = PANCHANG_DATA[year]
      expect(entries, `BS ${year} panchang`).toBeDefined()
      const actual = entries!.map(({ m, d }) => `${m}/${d}`)
      const expected = getMonthLengths(year).flatMap((length, index) =>
        Array.from({ length }, (_, day) => `${index + 1}/${day + 1}`)
      )
      expect(actual, `BS ${year} panchang dates`).toEqual(expected)
    }
  })
})
