import { createClient, type MatuDBClient } from '@devjuanes/matuclient'

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
    client = createClient({
      url: getMatuUrl(),
      projectId: import.meta.env.VITE_MATUDB_PROJECT_ID,
      apiKey: import.meta.env.VITE_MATUDB_API_KEY,
    })
  }
  return client
}

export function resetMatuClient() {
  client = null
}
