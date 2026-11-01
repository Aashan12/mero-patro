import type { BSDate } from './types.js'
import { BS_DATA_YEAR_MIN, BS_DATA_YEAR_MAX, getMonthDayCount } from '../data/bs-month-lengths.js'

// The effective supported range is bounded by available month-length data.
// Extend BS_DATA_YEAR_MAX in bs-month-lengths.json (and source the data) to expand coverage.
export const BS_YEAR_MIN = BS_DATA_YEAR_MIN // 2000
export const BS_YEAR_MAX = BS_DATA_YEAR_MAX // 2090

// BS 2000 Baishakh 1 expressed as UTC midnight milliseconds.
// This is the single reference point all conversions derive from.
// April 14, 1943 UTC — verified against multiple Nepali calendar sources.
export const BS_EPOCH_UTC_MS = Date.UTC(1943, 3, 14) // month is 0-indexed

export const MS_PER_DAY = 86_400_000

/**
 * Converts a UTC-millisecond timestamp to a calendar Date whose
 * getUTCFullYear / getUTCMonth / getUTCDate give the correct Gregorian date.
 *
 * All dates returned by this package use UTC midnight so that consumers
 * in any timezone see the same calendar date via the UTC getters.
 */
export function utcMsToDate(utcMs: number): Date {
  return new Date(utcMs)
}

/**
 * Extracts the UTC calendar date from any JS Date and returns
 * the number of whole days elapsed since the BS epoch.
 * Timezone-safe: always reads the UTC year/month/date components.
 */
export function adDateToDaysSinceEpoch(adDate: Date): number {
  if (!(adDate instanceof Date) || !Number.isFinite(adDate.getTime())) {
    throw new RangeError('Invalid Gregorian Date.')
  }
  const targetMs = Date.UTC(adDate.getUTCFullYear(), adDate.getUTCMonth(), adDate.getUTCDate())
  return Math.round((targetMs - BS_EPOCH_UTC_MS) / MS_PER_DAY)
}

/**
 * Validates a BSDate and throws a descriptive RangeError on any violation.
 * Checks year range, month range, and day range (including actual month length).
 */
export function validateBSDate(date: BSDate): void {
  if (date === null || typeof date !== 'object' ||
      !Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) {
    throw new RangeError('BS date must have integer year, month, and day values.')
  }
  if (date.year < BS_YEAR_MIN || date.year > BS_YEAR_MAX) {
    throw new RangeError(
      `BS year ${date.year} is outside the supported range (${BS_YEAR_MIN}–${BS_YEAR_MAX}).`
    )
  }
  if (date.month < 1 || date.month > 12) {
    throw new RangeError(
      `BS month ${date.month} is invalid. Must be 1–12.`
    )
  }
  const maxDay = getMonthDayCount(date.year, date.month)
  if (date.day < 1 || date.day > maxDay) {
    throw new RangeError(
      `BS day ${date.day} is invalid for ${date.year}/${date.month}. ` +
      `That month has ${maxDay} days (valid range: 1–${maxDay}).`
    )
  }
}
