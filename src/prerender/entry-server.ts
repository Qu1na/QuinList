/**
 * Entrada SSR solo para el build: renderiza las páginas públicas a HTML estático.
 * No se carga en el navegador. La usa scripts/prerender.mjs.
 *
 * Solo incluye rutas públicas (sin auth ni MatuDB), por eso no arrastra la app privada.
 */
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import { notFoundRoute, PRERENDER_PATHS, publicRoutes } from '@/router/publicRoutes'
import { resolvePageSeo } from '@/seo/pages'
import { renderSeoHead } from '@/seo/headHtml'

export { PRERENDER_PATHS }
export { marketingPages, landingFaqs, PRODUCT, CONTENT_UPDATED } from '@/seo/marketing'
export { SITE_URL } from '@/seo/config'
export { showcaseByPath } from '@/seo/showcase'

export async function render(url: string) {
  const app = createSSRApp(App)
  app.use(createPinia())
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      ...publicRoutes,
      // Rutas que existen en la app pero no se prerenderizan: evitan avisos del router.
      { path: '/register', component: { render: () => null } },
      { path: '/login', component: { render: () => null } },
      notFoundRoute,
    ],
  })
  app.use(router)
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const seo = resolvePageSeo(url === '/404' ? '/__no-existe__' : url)
  return { html, head: renderSeoHead(seo), robots: seo.robots ?? '' }
}

/** Solo el <head> (para páginas que no se prerenderizan, como /register). */
export function headFor(url: string) {
  const seo = resolvePageSeo(url)
  return renderSeoHead(seo)
}
