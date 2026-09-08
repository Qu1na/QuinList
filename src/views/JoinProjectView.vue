<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2, AlertCircle } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useQuinListStore } from '@/stores/quinlist'
import { acceptProjectTeamInvite, ProjectInviteError } from '@/services/projectInvite'
import { ensureUserProfile, profileFromAuth } from '@/services/matuData'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { isWorkspaceMember } from '@/utils/projectAccess'
import { REDIRECT_KEY } from '@/router'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const projectsStore = useProjectsStore()
const quinlist = useQuinListStore()

const loading = ref(true)
const error = ref('')
const errorCode = ref('')

async function resolveInviteUser() {
  if (auth.currentUser?.email) return auth.currentUser
  if (!isMatuConfigured() || !auth.currentUserId) return null

  const { data } = await getMatuClient().auth.getSession()
  const email = data.session?.user?.email
  if (!email) return null

  return profileFromAuth(auth.currentUserId, email, data.session?.user?.name)
}

onMounted(async () => {
  const projectId = route.params.projectId as string
  const token = route.params.token as string

  if (!auth.isAuthenticated) {
    sessionStorage.setItem(REDIRECT_KEY, route.fullPath)
    router.replace({ name: 'login' })
    return
  }

  if (!auth.currentUserId) {
    error.value = 'Debes iniciar sesión para aceptar la invitación'
    loading.value = false
    return
  }

  try {
    const draft = await resolveInviteUser()
    if (!draft?.email) {
      error.value = 'Debes iniciar sesión para aceptar la invitación'
      loading.value = false
      return
    }

    // Asegura fila en profiles antes de project_members (FK user_id)
    const profile = await ensureUserProfile(draft)
    auth.addUser(profile)

    await quinlist.init()
    await projectsStore.init()

    const result = await acceptProjectTeamInvite(projectId, token, auth.currentUserId)
    await projectsStore.persistProjectMember(result.member)

    const project = await projectsStore.ensureProjectLoaded(result.projectId)
    const wsId = project?.workspaceId ?? quinlist.currentWorkspaceId

    if (wsId && isWorkspaceMember(wsId, auth.currentUserId)) {
      quinlist.setCurrentWorkspace(wsId)
    }

    if (wsId) {
      await projectsStore.reloadForWorkspace(wsId)
    }

    router.replace({
      name: 'project-detail',
      params: { projectId: result.projectId },
      query: { tab: 'dashboard' },
    })
  } catch (err) {
    if (err instanceof ProjectInviteError) {
      error.value = err.message
      errorCode.value = err.code
    } else {
      error.value = err instanceof Error ? err.message : 'No se pudo aceptar la invitación'
    }
    loading.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#0747a6] p-6">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
      <Loader2 v-if="loading" :size="32" class="mx-auto animate-spin text-[#0c66e4]" />
      <template v-else>
        <AlertCircle :size="40" class="mx-auto text-red-400" />
        <h1 class="mt-4 text-lg font-bold text-[#172b4d]">
          {{
            errorCode === 'expired'
              ? 'Enlace expirado'
              : errorCode === 'disabled'
                ? 'Enlace desactivado'
                : 'No se pudo unir al proyecto'
          }}
        </h1>
        <p class="mt-2 text-sm text-[#626f86]">{{ error }}</p>
        <button
          class="mt-6 rounded-lg bg-[#0c66e4] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0055cc]"
          @click="router.push({ name: 'projects' })"
        >
          Ir a proyectos
        </button>
      </template>
    </div>
  </div>
</template>
