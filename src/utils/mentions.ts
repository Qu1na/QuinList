export interface MentionUser {
  id: string
  name: string
  email?: string
}

const TEAM_ALIASES = ['equipo', 'team', 'todos', 'everyone', 'all']

/** Resuelve @menciones de usuarios y @equipo en el texto del mensaje. */
export function resolveMentionedUserIds(text: string, users: MentionUser[]): string[] {
  const mentioned = new Set<string>()
  let tokenMatch: RegExpExecArray | null
  const tokenRe = /@\[user:([^:\]]+):[^\]]*\]/g
  while ((tokenMatch = tokenRe.exec(text))) {
    if (tokenMatch[1]) mentioned.add(tokenMatch[1])
  }

  const lower = text.toLowerCase()

  if (TEAM_ALIASES.some((alias) => lower.includes(`@${alias}`))) {
    for (const user of users) mentioned.add(user.id)
  }

  for (const user of users) {
    const parts = user.name.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const firstName = parts[0]
    const fullSlug = parts.join('')
    const emailPrefix = user.email?.split('@')[0]?.toLowerCase()

    if (firstName && lower.includes(`@${firstName}`)) mentioned.add(user.id)
    if (fullSlug && lower.includes(`@${fullSlug}`)) mentioned.add(user.id)
    if (emailPrefix && lower.includes(`@${emailPrefix}`)) mentioned.add(user.id)
  }

  return [...mentioned]
}

/** Convierte #proyecto y #tablero en texto legible (referencias). */
export function formatChatReferences(
  text: string,
  context?: { projectName?: string; boardName?: string },
): string {
  let out = text
  if (context?.projectName) {
    out = out.replace(/#proyecto\b/gi, `«${context.projectName}»`)
  }
  if (context?.boardName) {
    out = out.replace(/#tablero\b/gi, `«${context.boardName}»`)
  }
  return out
}

export const MENTION_HINT = 'Usa @nombre o @equipo · #proyecto · #tablero'
