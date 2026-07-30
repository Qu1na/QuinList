import type { ProjectNote, NoteAttachmentStyle } from '@/types/projects'

export interface NotePaletteEntry {
  id: string
  label: string
  color: string
  style: NoteAttachmentStyle
  curled?: boolean
}

export const NOTE_PALETTES: NotePaletteEntry[] = [
  { id: 'peach', label: 'Durazno', color: '#f5d0b5', style: 'pin-red', curled: true },
  { id: 'sky', label: 'Celeste', color: '#b8d9f0', style: 'tape-beige' },
  { id: 'cream', label: 'Crema', color: '#faf8f0', style: 'tape-blue' },
  { id: 'mint', label: 'Menta', color: '#e3f4e8', style: 'tape-green' },
  { id: 'yellow', label: 'Amarillo', color: '#fef08a', style: 'pin-single', curled: true },
  { id: 'pink', label: 'Rosa', color: '#fbcfe8', style: 'tape-beige' },
  { id: 'orange', label: 'Naranja', color: '#fdba74', style: 'pin-single' },
  { id: 'sage', label: 'Verde', color: '#d9f99d', style: 'tape-beige' },
]

export function paletteForNote(note: Pick<ProjectNote, 'color' | 'style'>) {
  return (
    NOTE_PALETTES.find((p) => p.color === note.color && p.style === note.style) ??
    NOTE_PALETTES.find((p) => p.color === note.color) ??
    NOTE_PALETTES[4]!
  )
}

export function defaultPaletteForIndex(index: number): NotePaletteEntry {
  return NOTE_PALETTES[index % NOTE_PALETTES.length]!
}

export function randomPalette(): NotePaletteEntry {
  return NOTE_PALETTES[Math.floor(Math.random() * NOTE_PALETTES.length)]!
}

export function noteRotation(note: ProjectNote): number {
  if (note.rotation !== 0) return note.rotation
  const hash = note.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return ((hash % 7) - 3) * 0.8
}
