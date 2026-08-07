import {
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  PUBLISHER,
  SITE_LANGUAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  getDefaultAggregateRating,
} from '@/seo/config'
import { buildReviewsJsonLd } from '@/utils/reviews'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    email: CONTACT_EMAIL,
    parentOrganization: {
      '@type': 'Organization',
      name: PUBLISHER.name,
      url: PUBLISHER.url,
      email: CONTACT_EMAIL,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT_EMAIL,
        availableLanguage: ['Spanish', 'es'],
      },
    ],
    sameAs: [
      PUBLISHER.url,
      'https://www.linkedin.com/company/matubyte',
      'https://x.com/matubyte',
      'https://www.instagram.com/matubyte',
    ],
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER.name,
      url: PUBLISHER.url,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/ayuda?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Project Management Software',
    operatingSystem: 'Web',
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Comenzar gratis',
    },
    aggregateRating: getDefaultAggregateRating(),
    featureList: [
      'Gestión de proyectos',
      'Gestión de tareas',
      'Tableros Kanban',
      'Organización por equipos',
      'Espacios de trabajo (workspace)',
      'Calendario',
      'Seguimiento del progreso',
      'Asignación de responsables',
      'Fechas límite y prioridades',
      'Comentarios y archivos adjuntos',
      'Colaboración en tiempo real',
      'Notificaciones',
      'Dashboard con métricas',
      'Roles y permisos',
      'Historial de actividades',
      'Búsqueda rápida',
      'Administración de equipos',
      'Project tracker',
      'Task manager',
    ],
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER.name,
      url: PUBLISHER.url,
      email: CONTACT_EMAIL,
    },
    inLanguage: SITE_LANGUAGE,
  }
}

export function webPageSchema(options: {
  title?: string
  description?: string
  path?: string
  type?: string
}) {
  const url = absoluteUrl(options.path ?? '/')
  return {
    '@context': 'https://schema.org',
    '@type': options.type ?? 'WebPage',
    name: options.title ?? DEFAULT_TITLE,
    description: options.description ?? DEFAULT_DESCRIPTION,
    url,
    inLanguage: SITE_LANGUAGE,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: DEFAULT_OG_IMAGE,
    },
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqPageSchema(
  faqs: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

export function landingSchemas(faqs: { q: string; a: string }[]) {
  return [
    organizationSchema(),
    websiteSchema(),
    softwareApplicationSchema(),
    webPageSchema({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: '/',
    }),
    breadcrumbSchema([{ name: 'Inicio', path: '/' }]),
    faqPageSchema(faqs),
    buildReviewsJsonLd(),
  ]
}
