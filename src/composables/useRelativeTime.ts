import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useNow } from '@vueuse/core'
import { formatRelativeTime } from '@/utils/datetime'

/**
 * Etiqueta de tiempo relativo que se actualiza automáticamente.
 * Ej.: "Hace 5 minutos", "Ayer", "Hace 2 días"
 */
export function useRelativeTime(iso: MaybeRefOrGetter<string | null | undefined>) {
  const now = useNow({ interval: 30_000 })

  return computed(() => {
    const value = toValue(iso)
    if (!value) return ''
    return formatRelativeTime(value, now.value.getTime())
  })
}
