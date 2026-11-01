/**
 * BS month length data and precomputed day-offset tables.
 *
 * Data source: https://github.com/subeshb1/Nepali-Date/blob/master/src/date-config.ts
 * BS 2084-2086 month starts were also checked against Hamro Patro calendar pages.
 * Coverage: BS 2000–2090 (AD 1943–2033)
 * TODO: source and append data for BS 2091–2100 before those years become operationally relevant.
 *
 * Performance design:
 * - Month lengths are stored in a flat Uint8Array (1 byte/month, cache-friendly, 1092 bytes total)
 * - yearDayOffsets[i]      = days from epoch to start of BS year (BS_DATA_YEAR_MIN + i)
 * - monthDayOffsets[i*12+m] = days from start of year i to start of month m
 * - Both are Int32Arrays precomputed at module load — enables O(1) bsToAd and O(log n) adToBs
 */
import rawData from './bs-month-lengths.json' with { type: 'json' }

export const BS_DATA_YEAR_MIN = 2000
export const BS_DATA_YEAR_MAX = 2090
const YEAR_COUNT = BS_DATA_YEAR_MAX - BS_DATA_YEAR_MIN + 1 // 91

// monthLengthTable[yearIdx * 12 + monthIdx] = days in that BS month
// Uint8Array: values 28–32 fit in 1 byte; 91 * 12 = 1092 bytes total
export const monthLengthTable = new Uint8Array(YEAR_COUNT * 12)

// yearDayOffsets[yearIdx] = cumulative days from epoch to first day of that BS year
// Length YEAR_COUNT + 1: last entry = total days covered by the dataset
export const yearDayOffsets = new Int32Array(YEAR_COUNT + 1)

// monthDayOffsets[yearIdx * 12 + monthIdx] = days from year start to month start
// monthDayOffsets[yi * 12 + 0] is always 0 (Baishakh 1 = day 0 of the year)
export const monthDayOffsets = new Int32Array(YEAR_COUNT * 12)

// Build all tables once at module load
;((): void => {
  const data = rawData as Record<string, number[]>
  for (let yi = 0; yi < YEAR_COUNT; yi++) {
    const year = BS_DATA_YEAR_MIN + yi
    const lengths = data[String(year)]
    if (lengths === undefined || lengths.length !== 12) {
      throw new Error(
        `[mero-patro] Missing or corrupt month length data for BS ${year}.`
      )
    }
    let monthCursor = 0
    for (let mi = 0; mi < 12; mi++) {
      const len = lengths[mi] as number
      monthLengthTable[yi * 12 + mi] = len
      monthDayOffsets[yi * 12 + mi] = monthCursor
      monthCursor += len
    }
    yearDayOffsets[yi + 1] = (yearDayOffsets[yi] as number) + monthCursor
  }
})()

/**
 * Returns the raw month lengths for a BS year as a plain number[].
 * For high-throughput paths use the TypedArrays directly.
 */
export function getMonthLengths(bsYear: number): number[] {
  if (!Number.isInteger(bsYear) || bsYear < BS_DATA_YEAR_MIN || bsYear > BS_DATA_YEAR_MAX) {
    throw new RangeError(
      `No month length data for BS year ${bsYear}. ` +
      `Supported range: ${BS_DATA_YEAR_MIN}–${BS_DATA_YEAR_MAX}.`
    )
  }
  const yi = bsYear - BS_DATA_YEAR_MIN
  return Array.from(monthLengthTable.subarray(yi * 12, yi * 12 + 12))
}

/**
 * Returns the number of days in a specific BS month. O(1).
 */
export function getMonthDayCount(bsYear: number, bsMonth: number): number {
  if (!Number.isInteger(bsYear) || bsYear < BS_DATA_YEAR_MIN || bsYear > BS_DATA_YEAR_MAX) {
    throw new RangeError(`No data for BS year ${bsYear}.`)
  }
  if (!Number.isInteger(bsMonth) || bsMonth < 1 || bsMonth > 12) {
    throw new RangeError(`Invalid BS month ${bsMonth}. Must be 1–12.`)
  }
  return monthLengthTable[(bsYear - BS_DATA_YEAR_MIN) * 12 + (bsMonth - 1)] as number
}
