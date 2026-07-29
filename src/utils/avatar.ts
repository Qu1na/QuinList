const AVATAR_COLORS = [
  '#6554c0',
  '#2d7eb8',
  '#f4845f',
  '#5bbce4',
  '#10b981',
  '#e56910',
  '#cd5a91',
  '#7c5cfc',
  '#0c66e4',
  '#d97706',
]

export function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

export function getInitials(name: string, email?: string): string {
  const source = name.trim() || email?.trim() || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function hasAvatarImage(url: string | null | undefined): boolean {
  return Boolean(url && url.trim().length > 0)
}
