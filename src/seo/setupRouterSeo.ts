import type { Router } from 'vue-router'
import { applySeo } from '@/seo/applySeo'
import { resolvePageSeo } from '@/seo/pages'
import { trackPageView } from '@/lib/analytics'

/**
 * Aplica el SEO de cada ruta en el navegador. La misma función (resolvePageSeo)
 * genera el <head> del HTML prerenderizado, así que cliente y crawler ven lo mismo.
 */
export function setupRouterSeo(router: Router) {
  router.afterEach((to) => {
    const seo = resolvePageSeo(to.path)
    applySeo({
      title: seo.title,
      description: seo.description,
      path: seo.path,
      keywords: seo.keywords,
      robots: seo.robots,
      ogType: seo.ogType,
      image: seo.image,
      jsonLd: seo.jsonLd,
    })
    trackPageView(to.fullPath, seo.title)
  })
}
