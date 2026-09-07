/**
 * Google Identity Services (GIS) — Sign in with Google.
 * Uses the popup account chooser (not One Tap top-right prompt).
 * Requires VITE_GOOGLE_CLIENT_ID (OAuth 2.0 Web client ID).
 */

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'
const POPUP_TIMEOUT_MS = 90_000

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
    use_fedcm_for_prompt?: boolean
    itp_support?: boolean
  }) => void
  prompt: (momentListener?: (notification: unknown) => void) => void
  cancel: () => void
  disableAutoSelect: () => void
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
let gisInitialized = false
let credentialCallback: ((credential: string | null, error?: string) => void) | null = null

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

function ensureGisInitialized(clientId: string): GoogleAccountsId {
  const googleId = window.google?.accounts?.id
  if (!googleId) {
    throw new Error('Google Identity Services no está disponible')
  }

  if (!gisInitialized) {
    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        const cb = credentialCallback
        credentialCallback = null
        if (!cb) return
        if (response.credential) cb(response.credential)
        else cb(null, 'Google no devolvió la credencial de la cuenta')
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup',
      use_fedcm_for_prompt: false,
      itp_support: true,
    })
    gisInitialized = true
  }

  return googleId
}

/** Call from login/register mount so the first click feels instant. */
export function preloadGoogleAuth(): void {
  if (!isGoogleAuthConfigured()) return
  void loadGisScript()
    .then(() => {
      const clientId = getGoogleClientId()
      if (clientId) ensureGisInitialized(clientId)
    })
    .catch(() => {})
}

/**
 * Opens the standard Google account chooser popup (centered window),
 * not the One Tap bubble in the corner.
 */
export async function requestGoogleIdToken(): Promise<string> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new Error(
      'Falta VITE_GOOGLE_CLIENT_ID en .env. Crea un OAuth Client ID (Web) en Google Cloud Console.',
    )
  }

  await loadGisScript()
  const googleId = ensureGisInitialized(clientId)

  try {
    googleId.cancel()
    googleId.disableAutoSelect?.()
  } catch {
    /* ignore */
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false
    let host: HTMLDivElement | null = null
    let timeoutId = 0

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      try {
        googleId.cancel()
      } catch {
        /* ignore */
      }
      if (host?.parentNode) host.parentNode.removeChild(host)
      host = null
      if (credentialCallback) credentialCallback = null
    }

    const finish = (credential: string | null, error?: string) => {
      if (settled) return
      settled = true
      cleanup()
      if (credential) resolve(credential)
      else reject(new Error(error ?? 'Inicio de sesión con Google cancelado'))
    }

    credentialCallback = finish

    timeoutId = window.setTimeout(() => {
      finish(
        null,
        'Google tardó demasiado en responder. Cierra la ventana de Google si sigue abierta e inténtalo de nuevo.',
      )
    }, POPUP_TIMEOUT_MS)

    host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'width:280px',
      'height:44px',
      'opacity:0.02',
      'z-index:2147483646',
      'overflow:hidden',
      'pointer-events:auto',
    ].join(';')
    document.body.appendChild(host)

    googleId.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 280,
    })

    const tryClick = (attempt: number) => {
      if (settled) return
      const btn =
        (host!.querySelector('div[role="button"]') as HTMLElement | null) ||
        (host!.querySelector('iframe') as HTMLElement | null)

      if (btn) {
        btn.click()
        return
      }
      if (attempt < 8) {
        window.setTimeout(() => tryClick(attempt + 1), 40)
        return
      }
      finish(
        null,
        'No se pudo abrir la ventana de Google. Revisa el Client ID y que este origen esté autorizado en Google Cloud.',
      )
    }

    requestAnimationFrame(() => tryClick(0))
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
