import siteConfig from '@/seo/site.config.json'
import { getReviewsSummary } from '@/utils/reviews'

export const SITE_URL = siteConfig.siteUrl.replace(/\/$/, '')
export const SITE_NAME = siteConfig.siteName
export const SITE_LOCALE = siteConfig.locale
export const SITE_LANGUAGE = siteConfig.language
export const CONTACT_EMAIL = siteConfig.contactEmail
export const PUBLISHER = siteConfig.publisher
export const DEFAULT_OG_IMAGE = `${SITE_URL}${siteConfig.defaultOgImage}`
export const DEFAULT_KEYWORDS = siteConfig.keywords.join(', ')

export const DEFAULT_TITLE =
  'QuinList — Software de Gestión de Proyectos y Colaboración para Equipos'

export const DEFAULT_DESCRIPTION =
  'QuinList es software de gestión de proyectos y project management software para empresas. Tablero Kanban, gestión de tareas, workspace, colaboración en tiempo real y plataforma de productividad SaaS.'

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

export function getDefaultAggregateRating() {
  const summary = getReviewsSummary()
  return {
    '@type': 'AggregateRating' as const,
    ratingValue: summary.score,
    reviewCount: String(summary.count),
    bestRating: String(summary.bestRating),
    worstRating: String(summary.worstRating),
  }
}
