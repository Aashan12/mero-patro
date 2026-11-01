import type { BSDate } from './types.js'
import { BS_YEAR_MIN, BS_YEAR_MAX, adDateToDaysSinceEpoch } from './utils.js'
import {
  yearDayOffsets,
  monthDayOffsets,
  monthLengthTable,
  BS_DATA_YEAR_MIN,
  BS_DATA_YEAR_MAX,
} from '../data/bs-month-lengths.js'

/**
 * Converts a JavaScript Date (Gregorian/AD) to a Bikram Sambat date.
 *
 * The conversion reads UTC date components from the input Date. Construct
 * calendar-date inputs at UTC midnight to avoid local timezone shifts.
 *
 * Complexity: O(log n) — binary search over yearDayOffsets to find the year,
 * then O(1) month lookup. n = 91 (years in dataset).
 *
 * Throws RangeError for dates outside the supported range.
 */
export function adToBs(adDate: Date): BSDate {
  const days = adDateToDaysSinceEpoch(adDate)

  if (days < 0) {
    throw new RangeError(
      `${utcDateString(adDate)} is before BS ${BS_YEAR_MIN} Baishakh 1 (AD 1943-04-14).`
    )
  }

  const lastYearIdx = BS_DATA_YEAR_MAX - BS_DATA_YEAR_MIN
  const totalDays = yearDayOffsets[lastYearIdx + 1] as number
  if (days >= totalDays) {
    throw new RangeError(
      `${utcDateString(adDate)} exceeds the supported range (BS ${BS_YEAR_MAX}). ` +
      `Extend bs-month-lengths.json to cover additional years.`
    )
  }

  // Binary search: find the largest yi where yearDayOffsets[yi] <= days
  let lo = 0
  let hi = lastYearIdx

  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    if ((yearDayOffsets[mid] as number) <= days) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  const yi = lo
  const year = BS_DATA_YEAR_MIN + yi
  const dayInYear = days - (yearDayOffsets[yi] as number)

  // Walk months: at most 11 comparisons (12 months max)
  let mi = 0
  while (
    mi < 11 &&
    (monthDayOffsets[yi * 12 + mi + 1] as number) <= dayInYear
  ) {
    mi++
  }

  const day = dayInYear - (monthDayOffsets[yi * 12 + mi] as number) + 1

  // Internal invariant check — should never fire with correct data
  const monthLen = monthLengthTable[yi * 12 + mi] as number
  /* istanbul ignore next */
  if (day < 1 || day > monthLen) {
    throw new Error(
      `[mero-patro] Internal error: computed day ${day} out of range ` +
      `for BS ${year}/${mi + 1} (length ${monthLen}). Please report this bug.`
    )
  }

  return { year, month: mi + 1, day }
}

function utcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
