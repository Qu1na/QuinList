import type { Accent } from '@/seo/showcase'

/**
 * Acentos de marketing — neutros, sin pasteles “SaaS IA”.
 * Literales para Tailwind. No afectan el dashboard de la app.
 */
export const ACCENT: Record<Accent, { tile: string; soft: string; text: string; ring: string }> = {
  coral: { tile: 'bg-[#f0f1f2] text-[#101214]', soft: 'bg-[#f7f8fa]', text: 'text-[#1b4f72]', ring: 'ring-[#101214]/15' },
  sky: { tile: 'bg-[#f0f1f2] text-[#101214]', soft: 'bg-[#f7f8fa]', text: 'text-[#1b4f72]', ring: 'ring-[#101214]/15' },
  emerald: { tile: 'bg-[#f0f1f2] text-[#101214]', soft: 'bg-[#f7f8fa]', text: 'text-[#0f6b4c]', ring: 'ring-[#101214]/15' },
  violet: { tile: 'bg-[#f0f1f2] text-[#101214]', soft: 'bg-[#f7f8fa]', text: 'text-[#3d4a66]', ring: 'ring-[#101214]/15' },
  amber: { tile: 'bg-[#f0f1f2] text-[#101214]', soft: 'bg-[#f7f8fa]', text: 'text-[#5a4a2e]', ring: 'ring-[#101214]/15' },
  rose: { tile: 'bg-[#f0f1f2] text-[#101214]', soft: 'bg-[#f7f8fa]', text: 'text-[#5a3a3a]', ring: 'ring-[#101214]/15' },
}
