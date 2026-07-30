export interface RenderedMentionPart {
  type: 'text' | 'user' | 'entity'
  value: string
  kind?: string
  id?: string
}

const USER_TOKEN = /@\[user:[^:\]]+:[^\]]+\]/g
const ENTITY_TOKEN = /#\[([^:\]]+):([^:\]]+):([^\]]+)\]/g
const PLAIN_TEAM = /@equipo\b/gi

/** Convierte tokens de mención en segmentos para renderizado. */
export function parseMessageParts(text: string): RenderedMentionPart[] {
  if (!text) return []

  const parts: RenderedMentionPart[] = []
  let cursor = 0
  const combined = new RegExp(
    `${USER_TOKEN.source}|${ENTITY_TOKEN.source}|${PLAIN_TEAM.source}`,
    'gi',
  )

  let match: RegExpExecArray | null
  while ((match = combined.exec(text))) {
    if (match.index > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, match.index) })
    }

    const token = match[0]
    if (token.startsWith('@[user:')) {
      const label = token.match(/@\[user:[^:]+:([^\]]+)\]/)?.[1] ?? 'usuario'
      const id = token.match(/@\[user:([^:]+):/)?.[1]
      parts.push({ type: 'user', value: `@${label}`, id })
    } else if (token.startsWith('#[')) {
      const entityMatch = token.match(/#\[([^:]+):([^:]+):([^\]]+)\]/)
      const kind = entityMatch?.[1] ?? 'entity'
      const id = entityMatch?.[2]
      const label = entityMatch?.[3] ?? 'referencia'
      parts.push({ type: 'entity', value: `#${label}`, kind, id })
    } else {
      parts.push({ type: 'user', value: '@equipo' })
    }

    cursor = match.index + token.length
  }

  if (cursor < text.length) {
    parts.push({ type: 'text', value: text.slice(cursor) })
  }

  return parts.length ? parts : [{ type: 'text', value: text }]
}

/** Texto legible sin tokens internos. */
export function messagePreview(text: string): string {
  return text
    .replace(/@\[user:[^:]+:([^\]]+)\]/g, '@$1')
    .replace(/#\[([^:]+):[^:]+:([^\]]+)\]/g, '#$2')
}
