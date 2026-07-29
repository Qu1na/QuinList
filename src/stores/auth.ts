import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { SEED_DATA } from '@/utils/seed'
import { isMatuConfigured, getMatuClient, formatMatuNetworkError } from '@/lib/matu'
import {
  acceptPendingInvites,
  createDefaultWorkspace,
  profileFromAuth,
  upsertProfile,
} from '@/services/matuData'
import { acceptPendingBoardInvites } from '@/services/boardShare'

export const useAuthStore = defineStore('auth', () => {
  const currentUserId = ref<string | null>(null)
  const users = ref<User[]>(SEED_DATA.users)
  const isReady = ref(false)
  const authError = ref<string | null>(null)

  const currentUser = computed(() =>
    users.value.find((u) => u.id === currentUserId.value) ?? null,
  )

  const isAuthenticated = computed(() => currentUserId.value !== null)
  const useDatabase = computed(() => isMatuConfigured())

  async function init(): Promise<void> {
    if (!isMatuConfigured()) {
      const saved = localStorage.getItem('quinlist_user')
      currentUserId.value = saved ?? 'u1'
      isReady.value = true
      return
    }

    const db = getMatuClient()
    const { data } = await db.auth.getSession()
    if (data.session?.user) {
      currentUserId.value = data.session.user.id
      const profile = profileFromAuth(
        data.session.user.id,
        data.session.user.email,
        data.session.user.name,
      )
      users.value = [profile]
    }

    db.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        currentUserId.value = session.user.id
        const profile = profileFromAuth(
          session.user.id,
          session.user.email,
          session.user.name,
        )
        const idx = users.value.findIndex((u) => u.id === profile.id)
        if (idx === -1) users.value.push(profile)
        else users.value[idx] = profile
      }
      if (event === 'SIGNED_OUT') {
        currentUserId.value = null
      }
    })

    isReady.value = true
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
      const { data, error } = await db.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
      })

      if (error) {
        authError.value = error.message
        return { ok: false, error: error.message }
      }

      if (!data.user) {
        return { ok: false, error: 'No se pudo crear la cuenta' }
      }

      const profile = profileFromAuth(data.user.id, data.user.email, name.trim())
      await upsertProfile(profile)
      await acceptPendingInvites(data.user.id, profile.email)
      await acceptPendingBoardInvites(data.user.id, profile.email)
      await createDefaultWorkspace(data.user.id, profile.name)

      currentUserId.value = data.user.id
      users.value = [profile]
      return { ok: true }
    } catch (err) {
      const msg = formatMatuNetworkError(err)
      authError.value = msg
      return { ok: false, error: msg }
    }
  }

  async function login(
    email: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> {
    authError.value = null

    if (!isMatuConfigured()) {
      const user = users.value.find((u) => u.email === email.trim().toLowerCase())
      if (!user) return { ok: false, error: 'Usuario no encontrado' }
      currentUserId.value = user.id
      localStorage.setItem('quinlist_user', user.id)
      return { ok: true }
    }

    const db = getMatuClient()
    try {
      const { data, error } = await db.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        authError.value = error.message
        return { ok: false, error: error.message }
      }

      if (!data.user) {
        return { ok: false, error: 'Credenciales inválidas' }
      }

      const profile = profileFromAuth(data.user.id, data.user.email, data.user.name)
      await upsertProfile(profile)
      await acceptPendingInvites(data.user.id, profile.email)
      await acceptPendingBoardInvites(data.user.id, profile.email)

      currentUserId.value = data.user.id
      const idx = users.value.findIndex((u) => u.id === profile.id)
      if (idx === -1) users.value.push(profile)
      else users.value[idx] = profile

      return { ok: true }
    } catch (err) {
      const msg = formatMatuNetworkError(err)
      authError.value = msg
      return { ok: false, error: msg }
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
    else users.value[idx] = user
  }

  return {
    currentUserId,
    users,
    currentUser,
    isAuthenticated,
    isReady,
    authError,
    useDatabase,
    init,
    register,
    login,
    logout,
    getUserById,
    setUsers,
    addUser,
  }
})
