export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'tablero'
  )
}

export function uniqueSlug(title: string, existing: string[]): string {
  const base = slugify(title)
  let slug = base
  let i = 1
  while (existing.includes(slug)) {
    slug = `${base}-${i++}`
  }
  return slug
}
