import { createClient, type AuthUser, type MatuDBClient } from '@devjuanes/matuclient'

const SESSION_KEY = 'matudb_session'

interface StoredSession {
  access_token?: string
  expires_at?: number
  user?: AuthUser
  token_type?: string
  [k: string]: unknown
}

export interface MatuOAuthResult {
  user: AuthUser
  token: string
}

let client: MatuDBClient | null = null

export function isMatuConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_MATUDB_URL &&
      import.meta.env.VITE_MATUDB_PROJECT_ID &&
      import.meta.env.VITE_MATUDB_API_KEY,
  )
}

export function getMatuUrl(): string {
  return (import.meta.env.VITE_MATUDB_URL ?? '').replace(/\/$/, '')
}

export function getMatuProjectId(): string {
  return import.meta.env.VITE_MATUDB_PROJECT_ID ?? ''
}

export function getMatuApiKey(): string {
  return import.meta.env.VITE_MATUDB_API_KEY ?? ''
}

function getStoredAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed.access_token) return null
    if (parsed.expires_at && Date.now() / 1000 >= parsed.expires_at) return null
    return parsed.access_token
  } catch {
    return null
  }
}

export function formatMatuNetworkError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    const url = getMatuUrl()
    return `No se pudo conectar a MatuDB (${url}). Verifica que VITE_MATUDB_URL sea correcto, que el servidor esté en línea y que CORS permita ${window.location.origin}.`
  }

  if (message.includes('ERR_NAME_NOT_RESOLVED') || message.includes('getaddrinfo')) {
    return `El dominio de MatuDB no existe o no resuelve en DNS. Revisa VITE_MATUDB_URL en tu archivo .env (usa http://matudb.com:3001 o http://localhost:3001).`
  }

  return message
}

export function getMatuClient(): MatuDBClient {
  if (!isMatuConfigured()) {
    throw new Error('MatuDB no está configurado. Revisa las variables VITE_MATUDB_* en .env')
  }
  if (!client) {
    const matu = createClient({
      url: getMatuUrl(),
      projectId: import.meta.env.VITE_MATUDB_PROJECT_ID,
      apiKey: import.meta.env.VITE_MATUDB_API_KEY,
      schema: import.meta.env.VITE_MATUDB_SCHEMA || undefined,
    })
    patchMatuClient(matu)
    client = matu
  }
  return client
}

export function resetMatuClient() {
  client = null
}

/** Force a fresh MatuDB client (clears stale JWT/header patch state). */
export function refreshMatuClient(): MatuDBClient {
  resetMatuClient()
  return getMatuClient()
}

/**
 * Exchange a Google ID token for a MatuDB session.
 * Tries common MatuDB OAuth routes / body shapes (server must verify the JWT).
 */
export async function signInWithGoogleCredential(
  credential: string,
): Promise<{ data: MatuOAuthResult | null; error: string | null }> {
  if (!isMatuConfigured()) {
    return { data: null, error: 'MatuDB no está configurado' }
  }

  const projectId = getMatuProjectId()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || ''
  const base = `${getMatuUrl()}/api/projects/${projectId}/auth`
  const headers = {
    'Content-Type': 'application/json',
    apikey: getMatuApiKey(),
  }

  const body = {
    provider: 'google',
    credential,
    id_token: credential,
    idToken: credential,
    token: credential,
    client_id: clientId,
    clientId,
  }

  const paths = [`${base}/oauth/google`, `${base}/google`, `${base}/oauth`]

  let lastStatus = 0
  let lastMessage = ''

  try {
    for (const url of paths) {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      const json = (await res.json().catch(() => ({}))) as {
        message?: string
        error?: string
        data?: { user?: AuthUser; token?: string }
      }

      lastStatus = res.status
      lastMessage = json.message || json.error || ''

      if (res.status === 404) continue

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            data: null,
            error:
              lastMessage ||
              'MatuDB rechazó Google (401). En el panel de MatuDB activa OAuth Google y pega el mismo Client ID que VITE_GOOGLE_CLIENT_ID.',
          }
        }
        return {
          data: null,
          error:
            lastMessage ||
            `No pudimos completar el inicio con Google (${res.status}).`,
        }
      }

      const user = json.data?.user
      const token = json.data?.token
      if (!user?.id || !token) {
        return { data: null, error: 'Respuesta OAuth inválida desde MatuDB' }
      }

      applyMatuAuthSession(user, token, { emit: false })
      return { data: { user, token }, error: null }
    }

    if (lastStatus === 404 || lastStatus === 0) {
      return {
        data: null,
        error:
          'MatuDB no tiene endpoint OAuth Google. Actívalo en el servidor (POST /auth/oauth/google) con el Client ID de Google.',
      }
    }

    return {
      data: null,
      error:
        lastMessage ||
        `No pudimos completar el inicio con Google (${lastStatus || 'sin respuesta'}).`,
    }
  } catch (err) {
    return { data: null, error: formatMatuNetworkError(err) }
  }
}

/** Persist JWT into matuclient AuthManager + localStorage (same shape as email login). */
export function applyMatuAuthSession(
  user: AuthUser,
  token: string,
  options?: { emit?: boolean },
): void {
  const db = getMatuClient()
  const auth = db.auth as unknown as {
    _buildSession?: (user: AuthUser, token: string) => StoredSession
    _saveSession?: (session: StoredSession | null) => void
    _emit?: (event: string) => void
  }

  let expiresAt = Math.floor(Date.now() / 1000) + 86400
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { exp?: number }
    if (payload.exp) expiresAt = payload.exp
  } catch {
    /* ignore */
  }

  const session: StoredSession =
    typeof auth._buildSession === 'function'
      ? auth._buildSession(user, token)
      : {
          access_token: token,
          token_type: 'bearer',
          expires_at: expiresAt,
          user,
        }

  if (typeof auth._saveSession === 'function') {
    auth._saveSession(session)
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  if (options?.emit !== false && typeof auth._emit === 'function') {
    auth._emit('SIGNED_IN')
  }
}

type BuilderFilter = { column: string; operator: string; value: unknown }

/**
 * Parche runtime para `@devjuanes/matuclient` v2.x contra db.matudb.com:
 *
 * El endpoint `/data` autentica con `apikey`. Un `Authorization: Bearer` (sesión
 * vieja, JWT inválido o de otro proyecto) hace fallar lecturas/escrituras con
 * 401/404 tipo "Project not found or access denied" / "Invalid token".
 *
 * Por eso en `/data` solo mandamos apikey (nunca Bearer). Storage sí puede
 * llevar JWT si hay sesión.
 */
function patchMatuClient(matu: MatuDBClient) {
  const patched = new WeakSet<object>()
  const originalFrom = matu.from.bind(matu)
  const apiKey = import.meta.env.VITE_MATUDB_API_KEY ?? ''
  const projectId = import.meta.env.VITE_MATUDB_PROJECT_ID ?? ''
  const rootUrl = getMatuUrl()

  function resolveAccessToken(): string | null {
    try {
      const fromAuth = matu.auth.getAccessToken?.()
      if (fromAuth) return fromAuth
    } catch {
      /* ignore */
    }
    return getStoredAccessToken()
  }

  function dataHeaders(extra?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: apiKey,
    }
    const schema = import.meta.env.VITE_MATUDB_SCHEMA
    if (schema) headers['X-MatuDB-Schema'] = schema

    if (extra && typeof extra === 'object') {
      if (extra instanceof Headers) {
        extra.forEach((value, key) => {
          if (key.toLowerCase() === 'authorization') return
          headers[key] = value
        })
      } else {
        for (const [k, v] of Object.entries(extra as Record<string, string>)) {
          if (v == null) continue
          if (k.toLowerCase() === 'authorization') continue
          headers[k] = String(v)
        }
      }
    }

    // Nunca Bearer en /data (ni Authorization ni authorization).
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'authorization') delete headers[key]
    }
    return headers
  }

  function wrapBuilder(table: string) {
    const builder = originalFrom(table) as Record<string, unknown> & {
      _filters?: BuilderFilter[]
      update?: (data: Record<string, unknown>) => Promise<{
        data: unknown
        error: { message: string } | null
      }>
    }
    if (patched.has(builder)) return builder

    const originalFetch = (
      builder._fetch as (url: string, init?: RequestInit) => Promise<Response>
    ).bind(builder)
    if (typeof originalFetch === 'function') {
      builder._fetch = async (url: string, init?: RequestInit) => {
        return originalFetch(url, {
          ...init,
          headers: dataHeaders(init?.headers),
        })
      }
    }

    builder.update = async (data: Record<string, unknown>) => {
      try {
        const filters: Record<string, unknown> = {}
        for (const f of builder._filters ?? []) {
          if (f.operator === 'eq') filters[f.column] = f.value
        }

        const params = new URLSearchParams({ apikey: apiKey })
        const schema = import.meta.env.VITE_MATUDB_SCHEMA
        if (schema) params.set('schema', schema)

        const url = `${rootUrl}/api/projects/${projectId}/data/${table}?${params}`
        const res = await fetch(url, {
          method: 'PUT',
          headers: dataHeaders(),
          body: JSON.stringify({ data, filters }),
        })
        const json = (await res.json().catch(() => ({}))) as {
          message?: string
          data?: { rows?: unknown[] } | unknown[]
        }
        if (!res.ok) {
          return {
            data: null,
            error: { message: json.message || `Update failed (${res.status})` },
          }
        }
        const rows = Array.isArray(json.data)
          ? json.data
          : ((json.data as { rows?: unknown[] } | undefined)?.rows ?? [])
        return { data: rows, error: null }
      } catch (err) {
        return {
          data: null,
          error: { message: err instanceof Error ? err.message : 'Update failed' },
        }
      }
    }

    patched.add(builder)
    return builder
  }

  matu.from = ((table: string) => wrapBuilder(table)) as typeof matu.from

  const storage = matu.storage as unknown as Record<string, unknown>
  const originalAuthHeader = storage._authHeader as () => Record<string, string>
  if (typeof originalAuthHeader === 'function') {
    storage._authHeader = () => {
      const base = originalAuthHeader.call(storage)
      const token = resolveAccessToken()
      if (token) base.Authorization = `Bearer ${token}`
      return base
    }
  }
}
