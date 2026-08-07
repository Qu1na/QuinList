import {
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  keywordsFor,
} from '@/seo/config'
import {
  breadcrumbSchema,
  organizationSchema,
  webPageSchema,
} from '@/seo/schema'

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

const INDEX_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex, nofollow'

export const pageSeoByPath: Record<string, PageSeoDefinition> = {
  '/': {
    path: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    robots: INDEX_ROBOTS,
  },
  '/register': {
    path: '/register',
    title: 'Crear cuenta gratis | QuinList — Software de Gestión de Proyectos',
    description:
      'Crea tu cuenta en QuinList, el software de gestión de proyectos y task manager para empresas. Empieza gratis con tablero Kanban, workspace y colaboración en tiempo real.',
    keywords: keywordsFor('crear cuenta QuinList', 'registro software proyectos'),
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Crear cuenta', path: '/register' },
    ],
  },
  '/login': {
    path: '/login',
    title: 'Iniciar sesión | QuinList',
    description:
      'Accede a tu workspace QuinList para gestionar proyectos, tareas y equipos en tu plataforma de productividad.',
    keywords: keywordsFor('iniciar sesión QuinList'),
    robots: NOINDEX_ROBOTS,
  },
  '/ayuda': {
    path: '/ayuda',
    title: 'Centro de Ayuda | QuinList — Gestión de Proyectos y Kanban',
    description:
      'Centro de ayuda de QuinList: guías de gestión de proyectos, tablero Kanban, workspaces, administración de equipos y colaboración en tiempo real.',
    keywords: keywordsFor('ayuda QuinList', 'soporte project management'),
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Centro de ayuda', path: '/ayuda' },
    ],
  },
  '/privacidad': {
    path: '/privacidad',
    title: 'Política de Privacidad | QuinList',
    description:
      'Política de privacidad de QuinList, software SaaS de gestión de proyectos de MatuByte S.A.S. Cómo tratamos datos de cuentas y workspaces.',
    keywords: keywordsFor('privacidad QuinList'),
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Privacidad', path: '/privacidad' },
    ],
  },
  '/terminos': {
    path: '/terminos',
    title: 'Términos y Condiciones | QuinList',
    description:
      'Términos y condiciones de uso de QuinList, software de gestión de proyectos y colaboración para equipos de MatuByte S.A.S.',
    keywords: keywordsFor('términos QuinList'),
    robots: INDEX_ROBOTS,
    breadcrumbs: [
      { name: 'Inicio', path: '/' },
      { name: 'Términos', path: '/terminos' },
    ],
  },
}

export function resolvePageSeo(path: string): PageSeoDefinition {
  const normalized = path.split('?')[0]?.replace(/\/$/, '') || '/'
  const key = normalized === '' ? '/' : normalized
  const base = pageSeoByPath[key]

  if (base) {
    const jsonLd: Record<string, unknown>[] = [
      organizationSchema(),
      webPageSchema({
        title: base.title,
        description: base.description,
        path: base.path,
      }),
    ]
    if (base.breadcrumbs?.length) {
      jsonLd.push(breadcrumbSchema(base.breadcrumbs))
    }
    return {
      ...base,
      jsonLd: [...jsonLd, ...(base.jsonLd ?? [])],
      image: base.image ? absoluteUrl(base.image) : DEFAULT_OG_IMAGE,
    }
  }

  // Rutas privadas / app: no indexar
  if (key.startsWith('/app') || key.startsWith('/join') || key.startsWith('/share')) {
    return {
      path: key,
      title: `${SITE_NAME} — Workspace`,
      description: DEFAULT_DESCRIPTION,
      robots: NOINDEX_ROBOTS,
      image: DEFAULT_OG_IMAGE,
    }
  }

  return {
    path: key,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    robots: INDEX_ROBOTS,
    image: DEFAULT_OG_IMAGE,
    jsonLd: [
      organizationSchema(),
      webPageSchema({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: key }),
    ],
  }
}

export { CONTACT_EMAIL, INDEX_ROBOTS, NOINDEX_ROBOTS }
