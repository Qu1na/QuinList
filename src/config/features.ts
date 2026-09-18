/**
 * Módulo Gestión de Proyectos — visible en home, menú y rutas de acceso.
 * Activar en la próxima etapa de lanzamiento.
 */
export const PROJECTS_MODULE_ENABLED = true

/** Creación de nuevos proyectos (requiere PROJECTS_MODULE_ENABLED) */
export const PROJECT_CREATION_ENABLED = true

const EMBED_STORAGE_KEY = 'quinlist_embed'

/** Modo iframe desde Sizor (`?embed=1` o flag de sesión tras SSO). */
export function isEmbedMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('embed') === '1') {
      sessionStorage.setItem(EMBED_STORAGE_KEY, '1')
      return true
    }
    if (params.get('embed') === '0') {
      sessionStorage.removeItem(EMBED_STORAGE_KEY)
      return false
    }
    return sessionStorage.getItem(EMBED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setEmbedMode(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (enabled) sessionStorage.setItem(EMBED_STORAGE_KEY, '1')
    else sessionStorage.removeItem(EMBED_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Proyectos visibles solo fuera de embed Sizor. */
export function isProjectsModuleVisible(): boolean {
  return PROJECTS_MODULE_ENABLED && !isEmbedMode()
}
