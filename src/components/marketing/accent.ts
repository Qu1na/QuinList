import type { Accent } from '@/seo/showcase'

/**
 * Acentos por solución, tomados de la paleta de la app (azul, cielo, coral) más tres
 * tonos de apoyo. Literales para que Tailwind los detecte.
 * tile: fondo + ícono · soft: fondo de sección · text: texto accesible (AA) · ring: borde · solid: color pleno.
 */
export const ACCENT: Record<Accent, { tile: string; soft: string; text: string; ring: string; solid: string }> = {
  coral: { tile: 'bg-[#fff1ea] text-[#c2410c]', soft: 'bg-[#fff8f5]', text: 'text-[#c2410c]', ring: 'ring-[#f4845f]/30', solid: 'bg-[#f4845f]' },
  sky: { tile: 'bg-[#e6f4fb] text-[#2a72a8]', soft: 'bg-[#f2f9fd]', text: 'text-[#2a72a8]', ring: 'ring-[#5bbce4]/35', solid: 'bg-[#5bbce4]' },
  emerald: { tile: 'bg-emerald-50 text-emerald-700', soft: 'bg-emerald-50/60', text: 'text-emerald-700', ring: 'ring-emerald-300/50', solid: 'bg-emerald-500' },
  violet: { tile: 'bg-violet-50 text-violet-700', soft: 'bg-violet-50/60', text: 'text-violet-700', ring: 'ring-violet-300/50', solid: 'bg-violet-500' },
  amber: { tile: 'bg-amber-50 text-amber-700', soft: 'bg-amber-50/60', text: 'text-amber-800', ring: 'ring-amber-300/50', solid: 'bg-amber-400' },
  rose: { tile: 'bg-rose-50 text-rose-700', soft: 'bg-rose-50/60', text: 'text-rose-700', ring: 'ring-rose-300/50', solid: 'bg-rose-400' },
}
