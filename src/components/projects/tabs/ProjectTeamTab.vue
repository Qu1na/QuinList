<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  UserPlus,
  Shield,
  Trash2,
  Link2,
  Copy,
  Ban,
  Users,
  DollarSign,
  Loader2,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { roleLabel } from '@/utils/permissions'
import type { UserRole } from '@/types'
import type { ProjectTeamInvite } from '@/types/projects'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import ProjectInviteModal from '@/components/projects/ProjectInviteModal.vue'
import { useProjectAccess } from '@/utils/projectAccess'
import { useProjectUsers } from '@/composables/useProjectUsers'
import {
  buildProjectInviteUrl,
  loadProjectTeamInvites,
  revokeProjectTeamInvite,
  subscribeProjectTeamInvitesRealtime,
} from '@/services/projectInvite'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const quinlist = useQuinListStore()
const access = useProjectAccess(props.projectId)
const { resolveUser } = useProjectUsers()

const addUserId = ref('')
const addRole = ref<UserRole>('member')
const canFinance = ref(false)
const canTasks = ref(true)
const canTeam = ref(false)

const teamInvites = ref<ProjectTeamInvite[]>([])
const loadingInvites = ref(false)
const showInviteModal = ref(false)
const copiedId = ref<string | null>(null)

let unsubscribeRealtime: (() => void) | null = null

const project = computed(() => projectsStore.getProject(props.projectId))

const members = computed(() =>
  projectsStore.getProjectMembers(props.projectId).map((m) => ({
    ...m,
    user: resolveUser(m.userId),
  })),
)

const activeInvites = computed(() => teamInvites.value.filter((i) => i.enabled))

const availableUsers = computed(() => {
  const ws = quinlist.currentWorkspace
  if (!ws) return []
  const memberIds = new Set(members.value.map((m) => m.userId))
  return ws.members
    .filter((m) => !memberIds.has(m.userId))
    .map((m) => ({ ...m, user: resolveUser(m.userId) }))
})

async function refreshInvites() {
  loadingInvites.value = true
  try {
    teamInvites.value = await loadProjectTeamInvites(props.projectId)
  } finally {
    loadingInvites.value = false
  }
}

onMounted(() => {
  void refreshInvites()
  unsubscribeRealtime = subscribeProjectTeamInvitesRealtime(props.projectId, () => {
    void refreshInvites()
    const wsId = quinlist.currentWorkspaceId
    if (wsId) void projectsStore.reloadForWorkspace(wsId)
  })
})

onUnmounted(() => {
  unsubscribeRealtime?.()
})

watch(showInviteModal, (open, wasOpen) => {
  if (wasOpen && !open) void refreshInvites()
})

async function addMember() {
  if (!addUserId.value) return
  await projectsStore.addProjectMember(props.projectId, addUserId.value, addRole.value, {
    canViewFinance: canFinance.value,
    canManageTasks: canTasks.value,
    canManageTeam: canTeam.value,
  })
  addUserId.value = ''
}

function inviteUrl(invite: ProjectTeamInvite) {
  return buildProjectInviteUrl(invite.projectId, invite.token)
}

async function copyInvite(invite: ProjectTeamInvite) {
  await navigator.clipboard.writeText(inviteUrl(invite))
  copiedId.value = invite.id
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

async function revokeInvite(inviteId: string) {
  await revokeProjectTeamInvite(inviteId)
  await refreshInvites()
}
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="project-page-title">Equipo</h2>
        <p class="project-page-sub">Integrantes, permisos e invitaciones del proyecto</p>
      </div>
      <button
        v-if="access.canManageTeam.value"
        type="button"
        class="ql-btn ql-btn--accent"
        @click="showInviteModal = true"
      >
        <UserPlus :size="18" />
        Generar invitación
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="project-card project-kpi">
        <Users :size="22" class="mb-2 text-[#2d7eb8]" />
        <p class="project-kpi__value">{{ members.length }}</p>
        <p class="project-kpi__label">Integrantes</p>
      </div>
      <div class="project-card project-kpi">
        <Link2 :size="22" class="mb-2 text-[#5bbce4]" />
        <p class="project-kpi__value">{{ activeInvites.length }}</p>
        <p class="project-kpi__label">Enlaces activos</p>
      </div>
      <div class="project-card project-kpi">
        <DollarSign :size="22" class="mb-2 text-[#f4845f]" />
        <p class="project-kpi__value">{{ members.filter((m) => m.canViewFinance).length }}</p>
        <p class="project-kpi__label">Con acceso finanzas</p>
      </div>
    </div>

    <div
      v-if="access.canManageTeam.value && activeInvites.length"
      class="project-card project-card--lg"
    >
      <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
        <Link2 :size="20" class="text-[#5bbce4]" />
        Enlaces de invitación activos
      </h3>

      <div v-if="loadingInvites" class="flex items-center gap-2 text-sm text-[#626f86]">
        <Loader2 :size="16" class="animate-spin" />
        Cargando enlaces...
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="inv in activeInvites"
          :key="inv.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#091e4214] bg-[#fafafa] px-4 py-3"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate font-mono text-xs text-[#44546f]">{{ inviteUrl(inv) }}</p>
            <p class="mt-1 text-xs text-[#626f86]">
              {{ roleLabel(inv.role) }}
              · {{ inv.useCount }} uso(s)
              <span v-if="inv.maxUses === 1"> · Un solo usuario</span>
              <span v-if="inv.canManageTasks"> · Tareas</span>
              <span v-if="inv.canViewFinance"> · Finanzas</span>
              <span v-if="inv.canManageTeam"> · Equipo</span>
            </p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="ql-btn ql-btn--ghost py-1.5 text-xs" @click="copyInvite(inv)">
              <Copy :size="14" />
              {{ copiedId === inv.id ? 'Copiado' : 'Copiar' }}
            </button>
            <button
              type="button"
              class="ql-btn ql-btn--ghost py-1.5 text-xs text-red-600"
              @click="revokeInvite(inv.id)"
            >
              <Ban :size="14" />
              Revocar
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div
      v-if="access.canManageTeam.value && availableUsers.length"
      class="project-card project-card--lg border-dashed"
    >
      <h3 class="mb-3 text-base font-semibold text-[#172b4d]">Añadir del workspace</h3>
      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm">
          <span class="mb-1.5 block font-medium text-[#44546f]">Usuario</span>
          <select v-model="addUserId" class="ql-input w-auto min-w-[220px]">
            <option value="">Seleccionar...</option>
            <option v-for="u in availableUsers" :key="u.userId" :value="u.userId">
              {{ u.user?.name ?? u.userId }}
            </option>
          </select>
        </label>
        <label class="text-sm">
          <span class="mb-1.5 block font-medium text-[#44546f]">Rol</span>
          <select v-model="addRole" class="ql-input w-auto min-w-[160px]">
            <option value="admin">Administrador</option>
            <option value="member">Miembro</option>
            <option value="viewer">Observador</option>
          </select>
        </label>
        <button type="button" class="ql-btn ql-btn--primary" :disabled="!addUserId" @click="addMember">
          <UserPlus :size="16" />
          Añadir
        </button>
      </div>
    </div>

    <div class="project-card project-card--lg !p-0 overflow-hidden">
      <div class="border-b border-[#091e4214] px-5 py-4">
        <h3 class="text-base font-semibold text-[#172b4d]">Integrantes del proyecto</h3>
      </div>

      <div class="divide-y divide-[#091e4214]">
        <div
          v-for="m in members"
          :key="m.id"
          class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex min-w-0 items-center gap-3">
            <UserAvatar :user-id="m.userId" size="lg" />
            <div class="min-w-0">
              <p class="font-semibold text-[#172b4d]">{{ m.user?.name ?? 'Cargando…' }}</p>
              <p class="truncate text-sm text-[#626f86]">{{ m.user?.email ?? m.userId }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <select
              :value="m.role"
              class="ql-input w-auto py-2 text-sm"
              :disabled="!access.canManageTeam.value || m.role === 'owner'"
              @change="
                projectsStore.updateProjectMember(m.id, {
                  role: ($event.target as HTMLSelectElement).value as UserRole,
                })
              "
            >
              <option value="owner">Propietario</option>
              <option value="admin">Administrador</option>
              <option value="member">Miembro</option>
              <option value="viewer">Observador</option>
            </select>

            <div class="flex flex-wrap gap-3 text-sm text-[#44546f]">
              <label class="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  :checked="m.canManageTasks"
                  :disabled="!access.canManageTeam.value"
                  @change="
                    projectsStore.updateProjectMember(m.id, {
                      canManageTasks: ($event.target as HTMLInputElement).checked,
                    })
                  "
                />
                Tareas
              </label>
              <label class="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  :checked="m.canViewFinance"
                  :disabled="!access.canManageTeam.value"
                  @change="
                    projectsStore.updateProjectMember(m.id, {
                      canViewFinance: ($event.target as HTMLInputElement).checked,
                    })
                  "
                />
                <Shield :size="14" class="text-[#f4845f]" />
                Finanzas
              </label>
              <label class="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  :checked="m.canManageTeam"
                  :disabled="!access.canManageTeam.value"
                  @change="
                    projectsStore.updateProjectMember(m.id, {
                      canManageTeam: ($event.target as HTMLInputElement).checked,
                    })
                  "
                />
                Equipo
              </label>
            </div>

            <button
              v-if="access.canManageTeam.value && m.role !== 'owner'"
              type="button"
              class="rounded-lg p-2 text-[#626f86] transition hover:bg-[#f5f5f7] hover:text-red-600"
              title="Quitar del proyecto"
              @click="projectsStore.removeProjectMember(m.id)"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ProjectInviteModal
      v-if="auth.currentUserId && project"
      v-model:open="showInviteModal"
      :project-id="projectId"
      :project-name="project.name"
      :created-by="auth.currentUserId"
    />
  </div>
</template>
