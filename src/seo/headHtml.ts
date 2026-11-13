import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_TITLE,
  SITE_HREFLANG,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
} from '@/seo/config'
import type { PageSeoDefinition } from '@/seo/pages'

const JSONLD_ATTR = 'data-ql-seo-jsonld'

function esc(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

/** JSON dentro de <script>: evita que un "</script>" en el texto cierre la etiqueta. */
function safeJson(data: unknown) {
  return JSON.stringify(data).replaceAll('<', '\\u003c')
}

/** Genera el bloque <head> SEO de una página para el HTML estático (prerender). */
export function renderSeoHead(seo: PageSeoDefinition): string {
  const url = absoluteUrl(seo.path)
  const title = seo.title || DEFAULT_TITLE
  const description = seo.description || DEFAULT_DESCRIPTION
  const robots = seo.robots || 'index, follow'
  const image = seo.image || DEFAULT_OG_IMAGE
  const indexable = !robots.includes('noindex')
  const imageAlt = `${SITE_NAME}: software de gestión de proyectos para empresas`

  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="keywords" content="${esc(seo.keywords || DEFAULT_KEYWORDS)}">`,
    `<meta name="robots" content="${esc(robots)}">`,
    `<meta name="googlebot" content="${esc(robots)}">`,
    `<meta name="bingbot" content="${esc(robots)}">`,
    `<meta name="author" content="MatuByte S.A.S.">`,
    ...(indexable
      ? [
          `<link rel="canonical" href="${esc(url)}">`,
          `<link rel="alternate" hreflang="${SITE_HREFLANG}" href="${esc(url)}">`,
          `<link rel="alternate" hreflang="x-default" href="${esc(url)}">`,
        ]
      : []),
    `<meta property="og:type" content="${esc(seo.ogType || 'website')}">`,
    `<meta property="og:locale" content="${SITE_LOCALE}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="${DEFAULT_OG_IMAGE_WIDTH}">`,
    `<meta property="og:image:height" content="${DEFAULT_OG_IMAGE_HEIGHT}">`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    `<meta name="twitter:image:alt" content="${esc(imageAlt)}">`,
    ...(seo.jsonLd ?? []).map(
      (block, i) =>
        `<script type="application/ld+json" ${JSONLD_ATTR}="${i}">${safeJson(block)}</script>`,
    ),
  ]
  return lines.map((l) => `    ${l}`).join('\n')
}
