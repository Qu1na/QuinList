import {
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  LATAM_AREA_SERVED,
  LOGO_URL,
  PUBLISHER,
  SAME_AS,
  SITE_LANGUAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from '@/seo/config'
import { PRODUCT, type MarketingFaq, type MarketingPage } from '@/seo/marketing'

/*
 * Datos estructurados (schema.org) de QuinList.
 *
 * Importante: no publicamos AggregateRating ni Review propios. Google considera spam las
 * reseñas que el mismo sitio escribe sobre sí mismo (“self-serving reviews”) y puede
 * aplicar una acción manual. Cuando existan reseñas verificables (G2, Capterra, Google
 * Business Profile), se enlazan desde sameAs o se marcan con la fuente real.
 */

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`
const APP_ID = `${SITE_URL}/#software`

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: PUBLISHER.name,
    alternateName: 'MatuByte',
    url: PUBLISHER.url,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    email: CONTACT_EMAIL,
    address: { '@type': 'PostalAddress', addressCountry: 'CO' },
    areaServed: LATAM_AREA_SERVED,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT_EMAIL,
        availableLanguage: ['es'],
        areaServed: LATAM_AREA_SERVED,
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: CONTACT_EMAIL,
        availableLanguage: ['es'],
      },
    ],
    brand: { '@type': 'Brand', name: SITE_NAME, logo: LOGO_URL },
    sameAs: SAME_AS,
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE_NAME,
    alternateName: ['Quin List', 'QuinList App'],
    url: `${SITE_URL}/`,
    description: DEFAULT_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: { '@id': ORG_ID },
  }
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: SITE_NAME,
    alternateName: 'Quin List',
    description: PRODUCT.oneLiner,
    url: `${SITE_URL}/`,
    image: DEFAULT_OG_IMAGE,
    screenshot: DEFAULT_OG_IMAGE,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Software de gestión de proyectos',
    operatingSystem: 'Web, Windows, macOS, Linux, Android, iOS',
    browserRequirements: 'Requiere un navegador moderno con JavaScript',
    inLanguage: SITE_LANGUAGE,
    countriesSupported: 'CO, MX, PE, EC, CL, AR, BO, VE, PA, CR, GT, DO, UY, PY',
    areaServed: LATAM_AREA_SERVED,
    offers: [
      {
        '@type': 'Offer',
        name: 'Gratis',
        price: '0',
        priceCurrency: 'USD',
        description: '1 tablero Kanban y 1 proyecto, para siempre. Sin tarjeta ni equipo.',
        url: `${SITE_URL}/precios`,
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'VIP',
        price: String(PRODUCT.vipPriceUsd),
        priceCurrency: 'USD',
        description: 'Tableros y proyectos ilimitados, equipo con miembros ilimitados y asistente de IA. Suscripción mensual.',
        url: `${SITE_URL}/precios`,
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: String(PRODUCT.vipPriceUsd),
          priceCurrency: 'USD',
          billingDuration: 'P1M',
          unitText: 'mes',
        },
      },
    ],
    featureList: [
      'Tableros Kanban con arrastrar y soltar',
      'Gestión de proyectos con dashboard de avance',
      'Tareas en vista lista, Kanban y cronograma Gantt',
      'Hitos y entregables con flujo de aprobación',
      'Riesgos e incidencias con plan de mitigación',
      'Presupuesto, ingresos, egresos, libro mayor y flujo de caja por proyecto',
      'Rentabilidad del proyecto y moneda por proyecto (COP, USD, MXN, PEN, CLP, ARS, BRL, EUR, GBP)',
      'Chat de equipo con menciones y presencia',
      'Calendario, eventos y OKRs',
      'Centro de métricas y reportes',
      'Roles: Propietario, Administrador, Miembro y Observador',
      'Permisos por módulo e historial de actividad',
      'Enlace público de solo lectura para clientes',
      'Asistente de IA con contexto del espacio de trabajo',
      'Colaboración en tiempo real',
    ],
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  }
}

export function webPageSchema(options: {
  title?: string
  description?: string
  path?: string
  type?: string
  dateModified?: string
  extra?: Record<string, unknown>
}) {
  const url = absoluteUrl(options.path ?? '/')
  return {
    '@context': 'https://schema.org',
    '@type': options.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    name: options.title ?? DEFAULT_TITLE,
    description: options.description ?? DEFAULT_DESCRIPTION,
    url,
    inLanguage: SITE_LANGUAGE,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': APP_ID },
    publisher: { '@id': ORG_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
    ...(options.dateModified ? { dateModified: options.dateModified } : {}),
    ...(options.extra ?? {}),
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

export function faqPageSchema(faqs: MarketingFaq[], path = '/'): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}

export function articleSchema(page: MarketingPage) {
  const url = absoluteUrl(page.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: page.h1,
    description: page.description,
    url,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    image: DEFAULT_OG_IMAGE,
    inLanguage: SITE_LANGUAGE,
    datePublished: page.updated,
    dateModified: page.updated,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  }
}

export function howToSchema(page: MarketingPage) {
  const steps = page.sections.flatMap((s) => s.steps ?? [])
  if (!steps.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: page.h1,
    description: page.description,
    inLanguage: SITE_LANGUAGE,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.text,
    })),
  }
}

export function landingSchemas(faqs: MarketingFaq[]) {
  return [
    organizationSchema(),
    websiteSchema(),
    softwareApplicationSchema(),
    webPageSchema({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: '/' }),
    faqPageSchema(faqs, '/'),
  ]
}
