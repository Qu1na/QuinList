export function generateIcsEvent(card: {
  title: string
  description: string
  dueDate: string
  id: string
}): string {
  const date = card.dueDate.replace(/-/g, '')
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QuinList//ES',
    'BEGIN:VEVENT',
    `UID:${card.id}@quinlist.app`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${date}`,
    `SUMMARY:${card.title}`,
    `DESCRIPTION:${card.description || card.title}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function googleCalendarUrl(card: {
  title: string
  description: string
  dueDate: string
}): string {
  const date = card.dueDate.replace(/-/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: card.title,
    details: card.description || card.title,
    dates: `${date}/${date}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function exportBoardToIcs(
  cards: { title: string; description: string; dueDate: string | null; id: string }[],
  boardTitle: string,
) {
  const withDates = cards.filter((c) => c.dueDate)
  if (withDates.length === 0) return false

  const events = withDates
    .map((card) => {
      const date = card.dueDate!.replace(/-/g, '')
      return [
        'BEGIN:VEVENT',
        `UID:${card.id}@quinlist.app`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:${card.title}`,
        `DESCRIPTION:${card.description || card.title}`,
        'END:VEVENT',
      ].join('\r\n')
    })
    .join('\r\n')

  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QuinList//ES', events, 'END:VCALENDAR'].join(
    '\r\n',
  )
  downloadIcs(content, `${boardTitle.replace(/\s+/g, '-').toLowerCase()}.ics`)
  return true
}
