import type { BSDate } from '../converter/types.js'
import type { ICSEventPair, ICSExportOptions } from './types.js'
import { bsToAd } from '../converter/bs-to-ad.js'
import { getEventsForDate } from '../events/event-engine.js'
import { getMonthDayCount } from '../data/bs-month-lengths.js'

function formatICSDate(adDate: Date): string {
  const y = String(adDate.getUTCFullYear())
  const m = String(adDate.getUTCMonth() + 1).padStart(2, '0')
  const d = String(adDate.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function escapeICSField(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Converts an array of event-date pairs to an RFC 5545 iCalendar (.ics) string format.
 */
export function exportToICS(
  pairs: ICSEventPair[],
  options?: ICSExportOptions
): string {
  const prodId = options?.prodId ?? '-//Nepali Calendar Engine//NONSGML v0.2.0//EN'
  const calName = options?.calName ?? 'Nepali Calendar Events'

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    `X-WR-CALNAME:${escapeICSField(calName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  for (const { event, bsDate } of pairs) {
    const adStart = bsToAd(bsDate)
    const adEnd = new Date(adStart.getTime() + 86_400_000)

    const startDateStr = formatICSDate(adStart)
    const endDateStr = formatICSDate(adEnd)

    const titleEn = event.name.en
    const titleNe = event.name.ne
    const summary = titleNe !== undefined ? `${titleEn} (${titleNe})` : titleEn
    const uid = `${event.id}-${bsDate.year}-${bsDate.month}-${bsDate.day}@mero-patro`

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${nowStamp}`)
    lines.push(`SUMMARY:${escapeICSField(summary)}`)
    if (event.description !== undefined) {
      const descText = event.description.ne !== undefined
        ? `${event.description.en} (${event.description.ne})`
        : event.description.en
      lines.push(`DESCRIPTION:${escapeICSField(descText)}`)
    }
    lines.push(`DTSTART;VALUE=DATE:${startDateStr}`)
    lines.push(`DTEND;VALUE=DATE:${endDateStr}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/**
 * Exports all events for a specific BS month as an iCalendar (.ics) string format.
 */
export function exportMonthToICS(
  bsYear: number,
  bsMonth: number,
  options?: ICSExportOptions
): string {
  const totalDays = getMonthDayCount(bsYear, bsMonth)
  const pairs: ICSEventPair[] = []

  for (let day = 1; day <= totalDays; day++) {
    const bsDate: BSDate = { year: bsYear, month: bsMonth, day }
    const events = getEventsForDate(bsDate)
    for (const event of events) {
      pairs.push({ event, bsDate })
    }
  }

  return exportToICS(pairs, {
    calName: `Nepali Calendar Events - BS ${bsYear}/${bsMonth}`,
    ...options,
  })
}
