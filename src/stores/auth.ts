import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { SEED_DATA } from '@/utils/seed'
import { isMatuConfigured, getMatuClient, formatMatuNetworkError, signInWithGoogleCredential } from '@/lib/matu'
import {
  acceptPendingInvites,
  bootstrapAppUser,
  createDefaultWorkspace,
  ensureUserProfile,
  profileFromAuth,
} from '@/services/matuData'
import { acceptPendingBoardInvites } from '@/services/boardShare'
import {
  loadProfileById,
  suspensionMessage,
} from '@/services/userModeration'
import { isUserSuspended } from '@/utils/permissions'
import { isGoogleAuthConfigured, peekGoogleIdToken, requestGoogleIdToken } from '@/lib/googleAuth'
import { localizeAuthError } from '@/utils/authMessages'

export const useAuthStore = defineStore('auth', () => {
  const currentUserId = ref<string | null>(null)
  const users = ref<User[]>(isMatuConfigured() ? [] : SEED_DATA.users)
  const isReady = ref(false)
  const authError = ref<string | null>(null)

  const currentUser = computed(() =>
    users.value.find((u) => u.id === currentUserId.value) ?? null,
  )

  const isAuthenticated = computed(() => currentUserId.value !== null)
  const useDatabase = computed(() => isMatuConfigured())
  /** Visible when MatuDB is configured; Client ID is checked on click. */
  const googleAuthEnabled = computed(() => isMatuConfigured())

  function fail(message: string | null | undefined, fallback?: string) {
    const localized = localizeAuthError(message, fallback)
    authError.value = localized
    return { ok: false as const, error: localized }
  }

  function mergeUser(profile: User) {
    const idx = users.value.findIndex((u) => u.id === profile.id)
    if (idx === -1) users.value.push(profile)
    else users.value[idx] = { ...users.value[idx], ...profile }
  }

  let initPromise: Promise<void> | null = null
  /** Evita que onAuthStateChange repita el bootstrap mientras login/register ya lo hacen. */
  let suppressAuthBootstrap = false

  async function enforceActiveProfile(
    userId: string,
    email: string,
    name?: string | null,
  ): Promise<{ ok: boolean; error?: string; profile?: User }> {
    try {
      let profile = await loadProfileById(userId)
      if (!profile) {
        try {
          profile = await ensureUserProfile(profileFromAuth(userId, email, name))
        } catch (err) {
          console.warn('[auth] No se pudo guardar el perfil en MatuDB:', err)
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : 'No se pudo crear tu perfil. Inténtalo de nuevo.',
          }
        }
      }

      if (isUserSuspended(profile)) {
        await getMatuClient().auth.signOut()
        currentUserId.value = null
        return { ok: false, error: suspensionMessage(profile) }
      }

      mergeUser(profile)
      currentUserId.value = userId
      return { ok: true, profile }
    } catch (err) {
      console.warn('[auth] enforceActiveProfile falló:', err)
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo verificar tu perfil. Inténtalo de nuevo.',
      }
    }
  }

  async function init(): Promise<void> {
    if (isReady.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      if (!isMatuConfigured()) {
        const saved = localStorage.getItem('quinlist_user')
        currentUserId.value = saved ?? 'u1'
        isReady.value = true
        return
      }

      const db = getMatuClient()
      const { data } = await db.auth.getSession()

      let ignoreNextSignedIn = Boolean(data.session?.user)

      if (data.session?.user) {
        const result = await enforceActiveProfile(
          data.session.user.id,
          data.session.user.email,
          data.session.user.name,
        )
        if (!result.ok) {
          authError.value = result.error ?? null
          await db.auth.signOut()
          currentUserId.value = null
        }
      }

      db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (ignoreNextSignedIn || suppressAuthBootstrap) {
            ignoreNextSignedIn = false
            return
          }
          void enforceActiveProfile(
            session.user.id,
            session.user.email,
            session.user.name,
          ).catch((err) => console.warn('[auth] onAuthStateChange:', err))
        }
        if (event === 'SIGNED_OUT') {
          currentUserId.value = null
        }
      })

      isReady.value = true
    })()

    try {
      await initPromise
    } finally {
      if (!isReady.value) initPromise = null
    }
  }

  async function register(
    email: string,
    password: string,
    name: string,
  ): Promise<{ ok: boolean; error?: string }> {
    authError.value = null

    if (!isMatuConfigured()) {
      return { ok: false, error: 'MatuDB no está configurado. Crea un archivo .env con las credenciales.' }
    }

    const db = getMatuClient()
    try {
      suppressAuthBootstrap = true
      const { data, error } = await db.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
      })

      if (error) {
        return fail(error.message)
      }

      if (!data.user) {
        return fail(null, 'No pudimos crear tu cuenta. Inténtalo de nuevo.')
      }

      const profile = profileFromAuth(data.user.id, data.user.email, name.trim())
      currentUserId.value = data.user.id
      users.value = [profile]

      try {
        const saved = await ensureUserProfile(profile)
        mergeUser(saved)
        await Promise.all([
          acceptPendingInvites(data.user.id, saved.email),
          acceptPendingBoardInvites(data.user.id, saved.email),
        ])
        await createDefaultWorkspace(data.user.id, saved.name)
      } catch (err) {
        console.warn('[auth] register bootstrap parcial:', err)
        await db.auth.signOut()
        currentUserId.value = null
        users.value = []
        return fail(
          err instanceof Error ? err.message : null,
          'Tu cuenta se creó, pero no se pudo guardar el perfil. Intenta iniciar sesión de nuevo.',
        )
      }

      return { ok: true }
    } catch (err) {
      return fail(formatMatuNetworkError(err))
    } finally {
      suppressAuthBootstrap = false
    }
  }

  async function login(
    email: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> {
    authError.value = null

    if (!isMatuConfigured()) {
      const user = users.value.find((u) => u.email === email.trim().toLowerCase())
      if (!user) {
        return fail(
          null,
          'No pudimos iniciar sesión. Revisa tu correo y tu contraseña e inténtalo de nuevo.',
        )
      }
      if (isUserSuspended(user)) {
        return fail(suspensionMessage(user))
      }
      currentUserId.value = user.id
      localStorage.setItem('quinlist_user', user.id)
      return { ok: true }
    }

    const db = getMatuClient()
    try {
      suppressAuthBootstrap = true
      const { data, error } = await db.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return fail(error.message)
      }

      if (!data.user) {
        return fail(
          null,
          'No pudimos iniciar sesión. Revisa tu correo y tu contraseña e inténtalo de nuevo.',
        )
      }

      // Marcar sesión al instante para que el router no bloquee
      currentUserId.value = data.user.id

      const result = await enforceActiveProfile(data.user.id, data.user.email, data.user.name)
      if (!result.ok) {
        await db.auth.signOut()
        currentUserId.value = null
        return fail(result.error)
      }

      // Invitaciones en paralelo; no bloquean la UX crítica
      void Promise.all([
        acceptPendingInvites(data.user.id, result.profile!.email),
        acceptPendingBoardInvites(data.user.id, result.profile!.email),
      ]).catch((err) => console.warn('[auth] invitaciones pendientes:', err))

      return { ok: true }
    } catch (err) {
      return fail(formatMatuNetworkError(err))
    } finally {
      suppressAuthBootstrap = false
    }
  }

  /**
   * Google OAuth: GIS credential → MatuDB JWT → profiles + workspace bootstrap.
   * New Google users get a default workspace (same as email register).
   */
  async function loginWithGoogle(): Promise<{ ok: boolean; error?: string }> {
    authError.value = null

    if (!isMatuConfigured()) {
      return { ok: false, error: 'MatuDB no está configurado. Crea un archivo .env con las credenciales.' }
    }
    if (!isGoogleAuthConfigured()) {
      return {
        ok: false,
        error: 'Falta VITE_GOOGLE_CLIENT_ID en .env (OAuth Client ID de Google Cloud).',
      }
    }

    try {
      suppressAuthBootstrap = true
      const credential = await requestGoogleIdToken()
      const googleClaims = peekGoogleIdToken(credential)

      const { data, error } = await signInWithGoogleCredential(credential)
      if (error || !data) {
        return fail(error, 'No pudimos iniciar sesión con Google. Inténtalo de nuevo.')
      }

      const email = (data.user.email || googleClaims.email || '').trim().toLowerCase()
      if (!email) {
        await getMatuClient().auth.signOut()
        return fail(null, 'Google no compartió un correo válido para esta cuenta.')
      }

      const name = data.user.name || googleClaims.name || null
      const avatar = googleClaims.picture || null

      currentUserId.value = data.user.id
      const profile = await bootstrapAppUser(data.user.id, email, name, avatar)
      const moderated = (await loadProfileById(data.user.id)) ?? profile

      if (isUserSuspended(moderated)) {
        await getMatuClient().auth.signOut()
        currentUserId.value = null
        return fail(suspensionMessage(moderated))
      }

      mergeUser(moderated)
      return { ok: true }
    } catch (err) {
      return fail(formatMatuNetworkError(err))
    } finally {
      suppressAuthBootstrap = false
    }
  }

  async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
    if (!isMatuConfigured()) {
      return fail(null, 'MatuDB no está configurado.')
    }
    try {
      const { error } = await getMatuClient().auth.resetPasswordForEmail(email.trim().toLowerCase())
      if (error) return fail(error.message)
      return { ok: true }
    } catch (err) {
      return fail(formatMatuNetworkError(err))
    }
  }

  async function resetPasswordWithToken(
    token: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!isMatuConfigured()) {
      return fail(null, 'MatuDB no está configurado.')
    }
    try {
      const { error } = await getMatuClient().auth.updateUser({ password }, { token })
      if (error) return fail(error.message)
      return { ok: true }
    } catch (err) {
      return fail(formatMatuNetworkError(err))
    }
  }

  async function logout(): Promise<void> {
    if (isMatuConfigured()) {
      await getMatuClient().auth.signOut()
    } else {
      localStorage.removeItem('quinlist_user')
    }
    currentUserId.value = null
  }

  function getUserById(id: string): User | undefined {
    return users.value.find((u) => u.id === id)
  }

  function setUsers(list: User[]) {
    for (const user of list) {
      addUser(user)
    }
  }

  function addUser(user: User) {
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx === -1) users.value.push(user)
    else users.value[idx] = { ...users.value[idx], ...user }
  }

  return {
    currentUserId,
    users,
    currentUser,
    isAuthenticated,
    isReady,
    authError,
    useDatabase,
    googleAuthEnabled,
    init,
    register,
    login,
    loginWithGoogle,
    logout,
    requestPasswordReset,
    resetPasswordWithToken,
    getUserById,
    setUsers,
    addUser,
  }
})
