import type { CalendarMonth, CalendarDay, CalendarOptions } from './types.js'
import type { BSDate } from '../converter/types.js'
import { bsToAd } from '../converter/bs-to-ad.js'
import { today } from '../converter/index.js'
import { BS_YEAR_MIN, BS_YEAR_MAX } from '../converter/utils.js'
import { getMonthDayCount } from '../data/bs-month-lengths.js'
import { getMonthName } from '../i18n/months.js'
import { getWeekdayName } from '../i18n/weekdays.js'
import { getPanchang, ensurePanchangYear } from '../panchang/panchang-lookup.js'
import { getEventsForDate } from '../events/event-engine.js'
import { isAuspicious } from '../events/classifier.js'

const DEFAULTS: Required<CalendarOptions> = {
  includeAdjacentDays: true,
  enrichPanchang: true,
  enrichEvents: true,
}

/**
 * Returns the number of days in a given BS month. O(1).
 */
export function getMonthDays(bsYear: number, bsMonth: number): number {
  return getMonthDayCount(bsYear, bsMonth)
}

function buildDay(
  bsDate: BSDate,
  isCurrentMonth: boolean,
  todayBs: BSDate | null,
  options: Required<CalendarOptions>
): CalendarDay {
  const ad = bsToAd(bsDate)
  const weekday = getWeekdayName(ad.getUTCDay())
  const isToday =
    todayBs !== null &&
    bsDate.year === todayBs.year &&
    bsDate.month === todayBs.month &&
    bsDate.day === todayBs.day

  return {
    bs: bsDate,
    ad,
    weekday,
    isToday,
    isCurrentMonth,
    panchang: options.enrichPanchang ? getPanchang(bsDate) : null,
    events: options.enrichEvents ? getEventsForDate(bsDate) : [],
    classification: options.enrichEvents ? isAuspicious(bsDate) : 'neutral',
  }
}

/**
 * Generates a complete calendar month data structure for a given BS year and month.
 * Suitable for direct consumption by any calendar UI component.
 * 
 * Note: This is an async function that automatically loads panchang data for the year.
 */
export async function getMonthCalendar(
  bsYear: number,
  bsMonth: number,
  options?: CalendarOptions
): Promise<CalendarMonth> {
  const opts: Required<CalendarOptions> = { ...DEFAULTS, ...options }

  // Auto-load panchang data for the year if enrichment is enabled
  if (opts.enrichPanchang || opts.enrichEvents) {
    await ensurePanchangYear(bsYear)
  }

  const totalDays = getMonthDays(bsYear, bsMonth)
  const monthName = getMonthName(bsMonth)
  const firstDayAd = bsToAd({ year: bsYear, month: bsMonth, day: 1 })
  const startWeekday = firstDayAd.getUTCDay() // 0 = Sunday, consistent with UTC-based dates

  let todayBs: BSDate | null = null
  try {
    todayBs = today().bs
  } catch (error) {
    if (!(error instanceof RangeError)) throw error
  }

  const days: CalendarDay[] = []

  // Overflow days from the previous month (to complete the first week row)
  if (opts.includeAdjacentDays && startWeekday > 0 && (bsMonth > 1 || bsYear > BS_YEAR_MIN)) {
    const prevMonth = bsMonth === 1 ? 12 : bsMonth - 1
    const prevYear = bsMonth === 1 ? bsYear - 1 : bsYear
    const prevMonthDays = getMonthDays(prevYear, prevMonth)

    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      days.push(buildDay({ year: prevYear, month: prevMonth, day }, false, todayBs, opts))
    }
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    days.push(buildDay({ year: bsYear, month: bsMonth, day }, true, todayBs, opts))
  }

  // Overflow days from the next month (to complete the last week row)
  if (opts.includeAdjacentDays && (bsMonth < 12 || bsYear < BS_YEAR_MAX)) {
    const currentLength = days.length
    const remainder = currentLength % 7
    if (remainder !== 0) {
      const nextDaysNeeded = 7 - remainder
      const nextMonth = bsMonth === 12 ? 1 : bsMonth + 1
      const nextYear = bsMonth === 12 ? bsYear + 1 : bsYear

      for (let day = 1; day <= nextDaysNeeded; day++) {
        days.push(buildDay({ year: nextYear, month: nextMonth, day }, false, todayBs, opts))
      }
    }
  }

  return {
    year: bsYear,
    month: bsMonth,
    monthName: { en: monthName.en, ne: monthName.ne },
    totalDays,
    startWeekday,
    days,
  }
}
