import siteConfig from '@/seo/site.config.json'

export const SITE_URL = siteConfig.siteUrl.replace(/\/$/, '')
export const SITE_NAME = siteConfig.siteName
export const SITE_LOCALE = siteConfig.locale
export const SITE_LANGUAGE = siteConfig.language
export const SITE_HREFLANG = siteConfig.hreflang
export const CONTACT_EMAIL = siteConfig.contactEmail
export const PUBLISHER = siteConfig.publisher
export const DEFAULT_OG_IMAGE = `${SITE_URL}${siteConfig.defaultOgImage}`
export const DEFAULT_OG_IMAGE_WIDTH = String(siteConfig.defaultOgImageWidth)
export const DEFAULT_OG_IMAGE_HEIGHT = String(siteConfig.defaultOgImageHeight)
export const LOGO_URL = `${SITE_URL}/image/logo/logo-512.png`
export const DEFAULT_KEYWORDS = siteConfig.keywords.join(', ')

export const DEFAULT_TITLE = 'QuinList: software de gestión de proyectos para empresas'

export const DEFAULT_DESCRIPTION =
  'Deja el Excel, los cuadernos y el WhatsApp. QuinList reúne Kanban, Gantt, presupuesto, chat e IA para equipos de Latinoamérica. Empieza gratis.'

export const SAME_AS = [
  PUBLISHER.url,
  'https://www.linkedin.com/company/matubyte',
  'https://x.com/matubyte',
  'https://www.instagram.com/matubyte',
]

export const LATAM_AREA_SERVED = [
  'Colombia',
  'México',
  'Perú',
  'Ecuador',
  'Chile',
  'Argentina',
  'Bolivia',
  'Venezuela',
  'Panamá',
  'Costa Rica',
  'Guatemala',
  'República Dominicana',
  'Uruguay',
  'Paraguay',
]

export type PublicRouteConfig = {
  path: string
  name: string
  changefreq: string
  priority: number
  index: boolean
}

export const publicRoutes = siteConfig.routes as PublicRouteConfig[]

export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized === '/' ? '/' : normalized}`
}

export function keywordsFor(...extra: string[]): string {
  return [...extra, ...siteConfig.keywords].filter(Boolean).join(', ')
}
