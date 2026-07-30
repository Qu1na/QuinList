const BOGOTA = 'America/Bogota'

/** Hora estilo WhatsApp: 09:35 a. m. */
export function formatChatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: BOGOTA,
  })
}

/** Última conexión relativa */
export function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'En línea ahora'
  if (diff < 3600_000) {
    const m = Math.floor(diff / 60_000)
    return `Activo hace ${m} min`
  }
  if (diff < 86400_000) {
    const h = Math.floor(diff / 3600_000)
    return `Activo hace ${h} h`
  }
  return `Activo ${new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: BOGOTA,
  })}`
}
