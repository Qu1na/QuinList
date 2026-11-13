/**
 * Analítica de conversión (Google Analytics 4), opcional.
 *
 * Se activa solo si existe VITE_GA_MEASUREMENT_ID en el .env (por ejemplo G-XXXXXXX).
 * El script se carga cuando el navegador está libre, para no afectar la velocidad (Core Web Vitals).
 *
 * Eventos que se envían:
 *  - page_view         en cada cambio de ruta
 *  - begin_sign_up     cuando alguien hace clic en un botón de “Empieza gratis” / “Quiero VIP” (plan)
 *  - generate_lead     cuando alguien hace clic en “Pedir una demo”
 */
type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: GtagFn
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
let loaded = false

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined' || !GA_ID) return
  window.dataLayer = window.dataLayer || []
  // GA4 necesita el objeto `arguments`, no un arreglo.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
  void args
}

/** Carga gtag.js cuando el hilo principal está libre. Llamar una vez al iniciar la app. */
export function initAnalytics() {
  if (typeof window === 'undefined' || !GA_ID || loaded) return
  loaded = true
  window.gtag = gtag as GtagFn
  gtag('js', new Date())
  gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })

  const load = () => {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
    document.head.appendChild(s)
  }
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
  if (document.readyState === 'complete') (idle ? idle(load) : setTimeout(load, 1500))
  else window.addEventListener('load', () => (idle ? idle(load) : setTimeout(load, 1500)), { once: true })
}

export function track(event: string, params: Record<string, unknown> = {}) {
  if (!GA_ID) return
  gtag('event', event, params)
}

export function trackPageView(path: string, title: string) {
  track('page_view', { page_path: path, page_title: title, page_location: window.location.href })
}
