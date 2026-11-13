import './assets/main.css'

import { createApp, createSSRApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setupRouterSeo } from '@/seo/setupRouterSeo'
import { mayHaveSession } from '@/lib/sessionHint'
import { initAnalytics } from '@/lib/analytics'

const container = document.getElementById('app')!

/**
 * Las páginas públicas llegan prerenderizadas (scripts/prerender.mjs marca el contenedor con
 * data-prerendered="/ruta"). En ese caso Vue *hidrata* el HTML existente en lugar de borrarlo y
 * volver a pintarlo: la página se ve al instante y Google mide un LCP rápido.
 */
function shouldHydrate(isAuthenticated: boolean) {
  const prerendered = container.dataset.prerendered
  if (!prerendered) return false
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  if (prerendered !== path) return false
  // La landing redirige a /app a quien ya inició sesión: no hay nada que hidratar.
  if (path === '/' && isAuthenticated) return false
  return true
}

async function bootstrap() {
  initAnalytics()
  const pinia = createPinia()
  setActivePinia(pinia)

  // Sin sesión guardada no se carga MatuDB: la página pública se hidrata de inmediato.
  let isAuthenticated = false
  if (mayHaveSession()) {
    const { useAuthStore } = await import('./stores/auth')
    const auth = useAuthStore()
    await auth.init()
    isAuthenticated = auth.isAuthenticated
  }

  const hydrate = shouldHydrate(isAuthenticated)
  const app = hydrate ? createSSRApp(App) : createApp(App)
  app.use(pinia)
  app.use(router)
  setupRouterSeo(router)

  // Para hidratar, los componentes de la ruta (carga diferida) deben estar listos.
  if (hydrate) await router.isReady()
  app.mount(container)

  if (!isAuthenticated) return

  // Datos de la app privada: se cargan aparte para no pesar en las páginas públicas.
  void (async () => {
    try {
      const [{ useQuinListStore }, { useNotificationStore }, { useProjectsStore }] = await Promise.all([
        import('./stores/quinlist'),
        import('./stores/notifications'),
        import('./stores/projects'),
      ])
      await useQuinListStore().init()
      await Promise.all([useNotificationStore().init(), useProjectsStore().init()])
    } catch (err) {
      console.error('[bootstrap] Error cargando datos:', err)
    }
  })()
}

bootstrap()
