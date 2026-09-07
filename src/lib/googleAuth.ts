/**
 * Google Identity Services (GIS) — Sign in with Google.
 * Requires VITE_GOOGLE_CLIENT_ID (OAuth 2.0 Web client ID).
 */

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'

export function isGoogleAuthConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())
}

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
}

type CredentialResponse = { credential?: string; select_by?: string }

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: CredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    context?: string
    ux_mode?: 'popup' | 'redirect'
  }) => void
  prompt: (momentListener?: (notification: {
    isNotDisplayed: () => boolean
    isSkippedMoment: () => boolean
    isDismissedMoment: () => boolean
    getNotDisplayedReason: () => string
    getSkippedReason: () => string
    getDismissedReason: () => string
  }) => void) => void
  cancel: () => void
  renderButton: (
    parent: HTMLElement,
    options: Record<string, string | number | boolean>,
  ) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

let scriptPromise: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Auth solo está disponible en el navegador'))
  }
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('No se pudo cargar Google Identity Services')),
      )
      if (window.google?.accounts?.id) resolve()
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('No se pudo cargar Google Identity Services'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Opens Google account picker and resolves with the ID token (JWT).
 * Uses One Tap / FedCM prompt; falls back to a temporary rendered button click if prompt is blocked.
 */
export async function requestGoogleIdToken(): Promise<string> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new Error(
      'Falta VITE_GOOGLE_CLIENT_ID en .env. Crea un OAuth Client ID (Web) en Google Cloud Console.',
    )
  }

  await loadGisScript()
  const googleId = window.google?.accounts?.id
  if (!googleId) {
    throw new Error('Google Identity Services no está disponible')
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false
    const finish = (credential: string | null, error?: string) => {
      if (settled) return
      settled = true
      try {
        googleId.cancel()
      } catch {
        /* ignore */
      }
      cleanupFallback()
      if (credential) resolve(credential)
      else reject(new Error(error ?? 'Inicio de sesión con Google cancelado'))
    }

    let fallbackHost: HTMLDivElement | null = null
    const cleanupFallback = () => {
      if (fallbackHost?.parentNode) fallbackHost.parentNode.removeChild(fallbackHost)
      fallbackHost = null
    }

    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) finish(response.credential)
        else finish(null, 'Google no devolvió credencial')
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup',
    })

    googleId.prompt((notification) => {
      if (settled) return
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Prompt blocked (FedCM / cookies) — show temporary GIS button and click it.
        fallbackHost = document.createElement('div')
        fallbackHost.setAttribute('aria-hidden', 'true')
        fallbackHost.style.cssText =
          'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
        document.body.appendChild(fallbackHost)
        googleId.renderButton(fallbackHost, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 280,
        })
        const btn = fallbackHost.querySelector('div[role="button"]') as HTMLElement | null
        if (btn) {
          btn.click()
        } else {
          const reason =
            notification.getNotDisplayedReason?.() ||
            notification.getSkippedReason?.() ||
            'prompt_blocked'
          finish(
            null,
            `No se pudo abrir Google (${reason}). Revisa el Client ID y los orígenes autorizados (http://localhost:5173).`,
          )
        }
      }
    })
  })
}

/** Decode Google ID token payload (unverified — MatuDB must verify server-side). */
export function peekGoogleIdToken(credential: string): {
  email?: string
  name?: string
  picture?: string
  sub?: string
} {
  try {
    const payload = credential.split('.')[1]
    if (!payload) return {}
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as {
      email?: string
      name?: string
      picture?: string
      sub?: string
    }
  } catch {
    return {}
  }
}
