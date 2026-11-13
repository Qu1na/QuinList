/**
 * Indica, sin cargar el cliente de MatuDB, si el navegador PODRÍA tener una sesión abierta.
 *
 * Sirve para que las páginas públicas (landing, páginas SEO) no descarguen ni ejecuten
 * MatuDB para un visitante anónimo que llega desde Google. Si devuelve true, el flujo normal
 * de autenticación (auth.init) decide; si devuelve false, seguro no hay sesión.
 *
 * 'matudb_session' es la clave que usan @devjuanes/matuclient y src/lib/matu.ts.
 */
const MATU_SESSION_KEY = 'matudb_session'

export function mayHaveSession(): boolean {
  if (typeof window === 'undefined') return false
  const matuConfigured = Boolean(
    import.meta.env.VITE_MATUDB_URL &&
      import.meta.env.VITE_MATUDB_PROJECT_ID &&
      import.meta.env.VITE_MATUDB_API_KEY,
  )
  // Modo demo local (sin MatuDB): siempre hay un usuario de ejemplo.
  if (!matuConfigured) return true
  try {
    return Boolean(window.localStorage.getItem(MATU_SESSION_KEY))
  } catch {
    return true
  }
}
