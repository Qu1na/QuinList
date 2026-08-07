import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
} from '@/seo/config'

const DYNAMIC_JSONLD_ATTR = 'data-ql-seo-jsonld'

export type ApplySeoInput = {
  title: string
  description: string
  path?: string
  keywords?: string
  robots?: string
  ogType?: string
  image?: string
  imageAlt?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string, attrs?: Record<string, string>) {
  let el = document.head.querySelector(`link[rel="${CSS.escape(rel)}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
  }
}

function clearDynamicJsonLd() {
  document.head.querySelectorAll(`script[${DYNAMIC_JSONLD_ATTR}]`).forEach((n) => n.remove())
}

function injectJsonLd(blocks: Record<string, unknown>[]) {
  clearDynamicJsonLd()
  blocks.forEach((data, i) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(DYNAMIC_JSONLD_ATTR, String(i))
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  })
}

/** Aplica meta SEO completo al documento (SPA). */
export function applySeo(input: ApplySeoInput) {
  const url = absoluteUrl(input.path ?? '/')
  const title = input.title || DEFAULT_TITLE
  const description = input.description || DEFAULT_DESCRIPTION
  const image = input.image || DEFAULT_OG_IMAGE
  const keywords = input.keywords || DEFAULT_KEYWORDS
  const robots =
    input.robots ||
    'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  const ogType = input.ogType || 'website'
  const imageAlt = input.imageAlt || `${SITE_NAME} — software de gestión de proyectos`

  document.title = title
  document.documentElement.lang = 'es'

  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', keywords)
  upsertMeta('name', 'robots', robots)
  upsertMeta('name', 'googlebot', robots.includes('noindex') ? 'noindex, nofollow' : 'index, follow')
  upsertMeta('name', 'bingbot', robots.includes('noindex') ? 'noindex, nofollow' : 'index, follow')
  upsertMeta('name', 'author', 'MatuByte S.A.S.')
  upsertMeta('name', 'application-name', SITE_NAME)
  upsertMeta('name', 'theme-color', '#f4845f')
  upsertMeta('name', 'format-detection', 'telephone=no')
  upsertMeta('name', 'referrer', 'strict-origin-when-cross-origin')

  upsertLink('canonical', url)

  // Open Graph
  upsertMeta('property', 'og:type', ogType)
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', SITE_LOCALE)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:image:alt', imageAlt)
  upsertMeta('property', 'og:image:width', '512')
  upsertMeta('property', 'og:image:height', '512')

  // Twitter / X
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)
  upsertMeta('name', 'twitter:image:alt', imageAlt)

  const blocks = input.jsonLd
    ? Array.isArray(input.jsonLd)
      ? input.jsonLd
      : [input.jsonLd]
    : []

  if (blocks.length) injectJsonLd(blocks)
  else clearDynamicJsonLd()
}

export function clearSeoJsonLd() {
  clearDynamicJsonLd()
}
