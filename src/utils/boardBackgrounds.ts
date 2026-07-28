export interface BoardBackground {
  id: string
  label: string
  /** Ruta local en public/backgrounds */
  image: string
}

const bg = (id: string, ext = 'jpg') => `/backgrounds/${id}.${ext}`

/** Fondos con fotos relajantes y tecnológicas (servidas localmente) */
export const BOARD_BACKGROUNDS: BoardBackground[] = [
  { id: 'ocean', label: 'Océano', image: bg('ocean') },
  { id: 'aurora', label: 'Aurora', image: bg('aurora') },
  { id: 'mountains', label: 'Montañas', image: bg('mountains') },
  { id: 'forest', label: 'Bosque', image: bg('forest') },
  { id: 'nebula', label: 'Nebulosa', image: bg('nebula') },
  { id: 'circuit', label: 'Circuitos', image: bg('circuit') },
  { id: 'workspace', label: 'Workspace', image: bg('workspace') },
  { id: 'minimal', label: 'Minimal', image: bg('minimal') },
  { id: 'citynight', label: 'Ciudad nocturna', image: bg('citynight') },
  { id: 'ui', label: 'Atardecer', image: bg('ui', 'webp') },
  { id: 'ui12', label: 'Ciudad sakura', image: bg('ui12') },
  { id: 'ui13', label: 'Noche estrellada', image: bg('ui13', 'avif') },
]

/** Compatibilidad con fondos antiguos (gradientes) */
const LEGACY_IDS: Record<string, string> = {
  sunset: 'mountains',
  lavender: 'nebula',
  midnight: 'circuit',
  peach: 'aurora',
}

export type BoardBackgroundId = (typeof BOARD_BACKGROUNDS)[number]['id']

export function getBoardBackground(id?: string): BoardBackground {
  const resolved = id ? (LEGACY_IDS[id] ?? id) : 'ocean'
  return BOARD_BACKGROUNDS.find((b) => b.id === resolved) ?? BOARD_BACKGROUNDS[0]!
}

export function getBoardBackgroundStyle(
  id?: string,
  options?: { fixed?: boolean; overlay?: number },
): Record<string, string> {
  const bg = getBoardBackground(id)
  const overlay = options?.overlay ?? 0.38

  const style: Record<string, string> = {
    backgroundImage: `linear-gradient(rgba(9, 30, 66, ${overlay}), rgba(9, 30, 66, ${overlay + 0.12})), url("${bg.image}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }

  if (options?.fixed !== false) {
    style.backgroundAttachment = 'fixed'
  }

  return style
}

export function getBoardBackgroundThumbStyle(id?: string): Record<string, string> {
  const bg = getBoardBackground(id)
  return {
    backgroundImage: `linear-gradient(rgba(9, 30, 66, 0.2), rgba(9, 30, 66, 0.45)), url("${bg.image}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}
