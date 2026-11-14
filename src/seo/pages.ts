import {
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteUrl,
  keywordsFor,
} from '@/seo/config'
import {
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  howToSchema,
  landingSchemas,
  organizationSchema,
  softwareApplicationSchema,
  webPageSchema,
} from '@/seo/schema'
import { getMarketingPage, landingFaqs, pagesOfKind, type MarketingPage } from '@/seo/marketing'
import {
  BLOG_UPDATED,
  getPostByPath,
  getSegment,
  getSegmentByPath,
  postPath,
  postsOfSegment,
  segmentPath,
  sortedPosts,
  type BlogPost,
} from '@/seo/blog'

export type PageSeoDefinition = {
  path: string
  title: string
  description: string
  keywords?: string
  robots?: string
  ogType?: string
  image?: string
  breadcrumbs?: { name: string; path: string }[]
  jsonLd?: Record<string, unknown>[]
}

const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex, follow'

const KIND_LABEL: Record<MarketingPage['kind'], { name: string; path: string } | null> = {
  solucion: null,
  industria: null,
  comparativa: null,
  pais: { name: 'Software de gestión de proyectos', path: '/software-gestion-de-proyectos' },
  guia: null,
  precios: null,
}

export const pageSeoByPath: Record<string, PageSeoDefinition> = {
  '/register': {
    path: '/register',
    title: 'Crea tu cuenta gratis | QuinList',
    description:
      'Crea tu cuenta gratis en QuinList y organiza tus proyectos en minutos: Kanban, cronograma, presupuesto y equipo. Sin tarjeta de crédito.',
    keywords: keywordsFor('crear cuenta QuinList', 'registro software de proyectos gratis'),
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Crear cuenta', path: '/register' },
    ],
  },
  '/login': {
    path: '/login',
    title: 'Iniciar sesión | QuinList',
    description: 'Entra a tu espacio de trabajo de QuinList.',
    robots: NOINDEX_ROBOTS,
  },
  '/ayuda': {
    path: '/ayuda',
    title: 'Centro de ayuda | QuinList',
    description:
      'Guías y respuestas sobre QuinList: proyectos, tableros Kanban, espacios de trabajo, roles, permisos y colaboración en tiempo real.',
    keywords: keywordsFor('ayuda QuinList', 'soporte QuinList'),
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Centro de ayuda', path: '/ayuda' },
    ],
  },
  '/privacidad': {
    path: '/privacidad',
    title: 'Política de privacidad | QuinList',
    description:
      'Política de privacidad de QuinList, software de gestión de proyectos de MatuByte S.A.S. Cómo tratamos los datos de cuentas y espacios de trabajo.',
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Privacidad', path: '/privacidad' },
    ],
  },
  '/terminos': {
    path: '/terminos',
    title: 'Términos y condiciones | QuinList',
    description:
      'Términos y condiciones de uso de QuinList, software de gestión de proyectos de MatuByte S.A.S.',
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Términos', path: '/terminos' },
    ],
  },
}

function marketingSeo(page: MarketingPage): PageSeoDefinition {
  const crumbs = [{ name: 'Inicio', path: '/' }]
  const parent = KIND_LABEL[page.kind]
  if (parent) crumbs.push(parent)
  if (page.kind === 'guia') crumbs.push({ name: 'Guías', path: '/guias' })
  crumbs.push({ name: page.navLabel, path: page.path })
  // Quitar duplicados (el índice /guias es a la vez “Guías”).
  const breadcrumbs = crumbs.filter((c, i, arr) => arr.findIndex((x) => x.path === c.path) === i)

  const isArticle = page.kind === 'guia' && !page.hub
  const jsonLd: Record<string, unknown>[] = [
    organizationSchema(),
    webPageSchema({
      title: page.title,
      description: page.description,
      path: page.path,
      type: page.hub ? 'CollectionPage' : 'WebPage',
      dateModified: page.updated,
      extra: page.country
        ? { spatialCoverage: { '@type': 'Country', name: page.country.name } }
        : undefined,
    }),
    breadcrumbSchema(breadcrumbs),
  ]
  if (page.kind === 'precios' || page.kind === 'solucion') jsonLd.push(softwareApplicationSchema())
  if (isArticle) jsonLd.push(articleSchema(page))
  const howTo = isArticle ? howToSchema(page) : null
  if (howTo) jsonLd.push(howTo)
  if (page.faqs.length) jsonLd.push(faqPageSchema(page.faqs, page.path))
  if (page.hub) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: pagesOfKind(page.kind)
        .filter((p) => !p.hub)
        .map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.h1, url: absoluteUrl(p.path) })),
    })
  }

  return {
    path: page.path,
    title: page.title,
    description: page.description,
    keywords: keywordsFor(...page.keywords),
    robots: INDEX_ROBOTS,
    ogType: isArticle ? 'article' : 'website',
    breadcrumbs,
    jsonLd,
  }
}

/* ------------------------------- Blog ------------------------------- */

const ORG_REF = { '@id': `${absoluteUrl('/').replace(/\/$/, '')}/#organization` }

function postListSchema(posts: BlogPost[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(postPath(p)),
      name: p.h1,
    })),
  }
}

function blogSeo(key: string): PageSeoDefinition | null {
  if (key === '/blog') {
    const title = 'Blog de QuinList: gestión de proyectos y equipos'
    const description =
      'Guías prácticas sobre gestión de proyectos, finanzas, equipos y herramientas para empresas de Latinoamérica. Ideas para trabajar sin caos.'
    const breadcrumbs = [
      { name: 'Inicio', path: '/' },
      { name: 'Blog', path: '/blog' },
    ]
    return {
      path: key,
      title,
      description,
      keywords: keywordsFor('blog de gestión de proyectos', 'consejos de gestión de proyectos'),
      robots: INDEX_ROBOTS,
      breadcrumbs,
      jsonLd: [
        organizationSchema(),
        webPageSchema({ title, description, path: key, type: 'CollectionPage', dateModified: BLOG_UPDATED }),
        {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': `${absoluteUrl('/blog')}#blog`,
          name: 'Blog de QuinList',
          url: absoluteUrl('/blog'),
          inLanguage: 'es',
          publisher: ORG_REF,
        },
        breadcrumbSchema(breadcrumbs),
        postListSchema(sortedPosts),
      ],
    }
  }

  const segment = getSegmentByPath(key)
  if (segment) {
    const title = `${segment.name} | Blog QuinList`
    const description = `${segment.description} Artículos prácticos del blog de QuinList.`
    const breadcrumbs = [
      { name: 'Inicio', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: segment.name, path: segmentPath(segment) },
    ]
    return {
      path: key,
      title,
      description,
      keywords: keywordsFor(segment.name.toLowerCase(), `blog de ${segment.name.toLowerCase()}`),
      robots: INDEX_ROBOTS,
      breadcrumbs,
      jsonLd: [
        organizationSchema(),
        webPageSchema({ title, description, path: key, type: 'CollectionPage', dateModified: BLOG_UPDATED }),
        breadcrumbSchema(breadcrumbs),
        postListSchema(postsOfSegment(segment.slug)),
      ],
    }
  }

  const post = getPostByPath(key)
  if (post) {
    const seg = getSegment(post.segment)!
    const url = absoluteUrl(key)
    const breadcrumbs = [
      { name: 'Inicio', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: seg.name, path: segmentPath(seg) },
      { name: post.title, path: key },
    ]
    const jsonLd: Record<string, unknown>[] = [
      organizationSchema(),
      webPageSchema({ title: post.title, description: post.description, path: key, dateModified: post.updated }),
      breadcrumbSchema(breadcrumbs),
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: post.h1,
        description: post.description,
        url,
        mainEntityOfPage: { '@id': `${url}#webpage` },
        image: DEFAULT_OG_IMAGE,
        inLanguage: 'es',
        datePublished: post.published,
        dateModified: post.updated,
        articleSection: seg.name,
        keywords: post.keywords.join(', '),
        isPartOf: { '@id': `${absoluteUrl('/blog')}#blog` },
        author: ORG_REF,
        publisher: ORG_REF,
      },
    ]
    if (post.faqs.length) jsonLd.push(faqPageSchema(post.faqs, key))
    return {
      path: key,
      title: post.title,
      description: post.description,
      keywords: keywordsFor(...post.keywords),
      robots: INDEX_ROBOTS,
      ogType: 'article',
      breadcrumbs,
      jsonLd,
    }
  }
  return null
}

export function resolvePageSeo(path: string): PageSeoDefinition {
  const normalized = path.split('?')[0]?.replace(/\/$/, '') || '/'
  const key = normalized === '' ? '/' : normalized

  if (key === '/') {
    return {
      path: '/',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
      robots: INDEX_ROBOTS,
      image: DEFAULT_OG_IMAGE,
      jsonLd: landingSchemas(landingFaqs),
    }
  }

  const blog = blogSeo(key)
  if (blog) return { ...blog, image: DEFAULT_OG_IMAGE }

  const marketing = getMarketingPage(key)
  if (marketing) return { ...marketingSeo(marketing), image: DEFAULT_OG_IMAGE }

  const base = pageSeoByPath[key]
  if (base) {
    const jsonLd: Record<string, unknown>[] = [
      organizationSchema(),
      webPageSchema({ title: base.title, description: base.description, path: base.path }),
    ]
    if (base.breadcrumbs?.length) jsonLd.push(breadcrumbSchema(base.breadcrumbs))
    return {
      ...base,
      jsonLd: [...jsonLd, ...(base.jsonLd ?? [])],
      image: base.image ? absoluteUrl(base.image) : DEFAULT_OG_IMAGE,
    }
  }

  // App privada, enlaces de invitación, compartidos y rutas desconocidas: no indexar.
  return {
    path: key,
    title: key.startsWith('/app') ? `${SITE_NAME}: espacio de trabajo` : `Página no encontrada | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    robots: NOINDEX_ROBOTS,
    image: DEFAULT_OG_IMAGE,
  }
}

export { CONTACT_EMAIL, INDEX_ROBOTS, NOINDEX_ROBOTS }
