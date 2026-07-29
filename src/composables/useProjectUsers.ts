import { computed, inject, onUnmounted, provide, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { User } from '@/types'
import { isMatuConfigured } from '@/lib/matu'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useProjectPresenceStore } from '@/stores/projectPresence'
import { PROJECTS_LOCAL_STORAGE_KEY, PROJECTS_LOCAL_SYNC_EVENT } from '@/services/projectData'
import { subscribeProjectIncrementalRealtime } from '@/services/projectMatuData'
import {
  collectProjectUserIds,
  ensureProjectUserProfiles,
  subscribeProfilesRealtime,
} from '@/services/projectUsers'

const PROJECT_USERS_KEY = Symbol('projectUsers')

export interface ProjectUsersContext {
  projectId: Ref<string>
  teamUsers: ComputedRef<User[]>
  visibleTeamUsers: ComputedRef<User[]>
  extraTeamCount: ComputedRef<number>
  onlineCount: ComputedRef<number>
  resolveUser: (userId: string | null | undefined) => User | undefined
  refreshProfiles: () => Promise<void>
  syncProject: () => Promise<void>
  setPresenceActivity: (status: 'online' | 'editing', activity?: string) => Promise<void>
}

export function provideProjectUsers(projectId: Ref<string> | ComputedRef<string>): ProjectUsersContext {
  const auth = useAuthStore()
  const projectsStore = useProjectsStore()
  const presenceStore = useProjectPresenceStore()

  let unsubscribe: (() => void) | null = null
  let unsubProfiles: (() => void) | null = null
  let localUnsubscribe: (() => void) | null = null
  let syncTimer: ReturnType<typeof setTimeout> | null = null

  async function refreshProfiles() {
    const id = projectId.value
    if (!id) return
    await ensureProjectUserProfiles(id)
  }

  async function syncProject() {
    const id = projectId.value
    if (!id) return
    await projectsStore.reloadProject(id)
    await refreshProfiles()
  }

  function scheduleProjectSync() {
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      void syncProject()
    }, 300)
  }

  function resolveUser(userId: string | null | undefined): User | undefined {
    if (!userId) return undefined
    return auth.getUserById(userId)
  }

  const teamUsers = computed(() => {
    const members = projectsStore.getProjectMembers(projectId.value)
    const seen = new Set<string>()
    const users: User[] = []

    for (const m of members) {
      if (seen.has(m.userId)) continue
      const user = resolveUser(m.userId)
      if (user) {
        seen.add(m.userId)
        users.push(user)
      }
    }

    return users
  })

  const visibleTeamUsers = computed(() => teamUsers.value.slice(0, 5))
  const extraTeamCount = computed(() => Math.max(0, teamUsers.value.length - 5))
  const onlineCount = computed(() => presenceStore.onlineCount)

  async function setPresenceActivity(status: 'online' | 'editing', activity = '') {
    await presenceStore.setActivity(status, activity)
  }

  watch(
    projectId,
    (id) => {
      unsubscribe?.()
      unsubProfiles?.()
      localUnsubscribe?.()
      if (syncTimer) clearTimeout(syncTimer)
      void presenceStore.unmount()

      if (!id) return

      projectsStore.setCurrentProject(id)
      void syncProject()
      void presenceStore.mount(id)

      if (isMatuConfigured()) {
        unsubscribe = subscribeProjectIncrementalRealtime(id, (payload) => {
          projectsStore.handleRealtimePayload(payload)
          void refreshProfiles()
        })

        unsubProfiles = subscribeProfilesRealtime((user) => {
          auth.addUser(user)
        })
      } else {
        const onLocalChange = () => scheduleProjectSync()
        const onStorage = (e: StorageEvent) => {
          if (e.key === PROJECTS_LOCAL_STORAGE_KEY) scheduleProjectSync()
        }
        window.addEventListener(PROJECTS_LOCAL_SYNC_EVENT, onLocalChange)
        window.addEventListener('storage', onStorage)
        localUnsubscribe = () => {
          window.removeEventListener(PROJECTS_LOCAL_SYNC_EVENT, onLocalChange)
          window.removeEventListener('storage', onStorage)
        }
      }
    },
    { immediate: true },
  )

  watch(
    () => collectProjectUserIds(projectId.value).join(','),
    () => {
      void refreshProfiles()
    },
  )

  onUnmounted(() => {
    unsubscribe?.()
    unsubProfiles?.()
    localUnsubscribe?.()
    if (syncTimer) clearTimeout(syncTimer)
    void presenceStore.unmount()
    if (projectsStore.currentProjectId === projectId.value) {
      projectsStore.setCurrentProject(null)
    }
  })

  const ctx: ProjectUsersContext = {
    projectId: projectId as Ref<string>,
    teamUsers,
    visibleTeamUsers,
    extraTeamCount,
    onlineCount,
    resolveUser,
    refreshProfiles,
    syncProject,
    setPresenceActivity,
  }

  provide(PROJECT_USERS_KEY, ctx)
  return ctx
}

export function useProjectUsers(): ProjectUsersContext {
  const ctx = inject<ProjectUsersContext>(PROJECT_USERS_KEY)
  if (!ctx) {
    const auth = useAuthStore()
    return {
      projectId: ref(''),
      teamUsers: computed(() => []),
      visibleTeamUsers: computed(() => []),
      extraTeamCount: computed(() => 0),
      onlineCount: computed(() => 0),
      resolveUser: (id) => (id ? auth.getUserById(id) : undefined),
      refreshProfiles: async () => {},
      syncProject: async () => {},
      setPresenceActivity: async () => {},
    }
  }
  return ctx
}
