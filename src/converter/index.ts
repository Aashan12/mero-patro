import type { BSDate, DualDate } from './types.js'
import { bsToAd } from './bs-to-ad.js'
import { adToBs } from './ad-to-bs.js'
import { getWeekdayName } from '../i18n/weekdays.js'
import { getMonthName } from '../i18n/months.js'
import { formatBS, type FormatBSOptions } from '../formatter/index.js'

export { bsToAd as toAD, adToBs as toBS, formatBS, type FormatBSOptions }
export type { BSDate, DualDate }

/**
 * Returns the current Nepal calendar date as both BS and AD with weekday and month name.
 * The AD Date is a UTC-midnight calendar-date carrier, like toAD() output.
 */
export function today(): DualDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date())
  const getPart = (type: string): number => Number(parts.find(part => part.type === type)?.value)
  const ad = new Date(Date.UTC(getPart('year'), getPart('month') - 1, getPart('day')))
  const bs = adToBs(ad)
  return {
    bs,
    ad,
    weekday: getWeekdayName(ad.getUTCDay()),
    monthName: getMonthName(bs.month),
  }
}
