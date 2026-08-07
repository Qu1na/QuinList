import type { Router } from 'vue-router'
import { applySeo } from '@/seo/applySeo'
import { resolvePageSeo } from '@/seo/pages'

/**
 * Aplica SEO automáticamente en cada navegación según la ruta.
 * Las vistas pueden enriquecer el head con usePageSeo (JSON-LD extra).
 */
export function setupRouterSeo(router: Router) {
  router.afterEach((to) => {
    // Landing gestiona su propio schema enriquecido
    if (to.name === 'landing') return

    const seo = resolvePageSeo(to.path)
    applySeo({
      title: seo.title,
      description: seo.description,
      path: seo.path,
      keywords: seo.keywords,
      robots: seo.robots,
      image: seo.image,
      jsonLd: seo.jsonLd,
    })
  })
}
