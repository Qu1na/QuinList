<script setup lang="ts">
import { computed, ref } from 'vue'
import { UserPlus, Shield, Trash2, Mail, Loader2 } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { roleLabel } from '@/utils/permissions'
import type { UserRole } from '@/types'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const quinlist = useQuinListStore()

const addUserId = ref('')
const addRole = ref<UserRole>('member')
const canFinance = ref(false)
const canTasks = ref(true)
const canTeam = ref(false)

const inviteEmail = ref('')
const inviting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')

const members = computed(() =>
  projectsStore.getProjectMembers(props.projectId).map((m) => ({
    ...m,
    user: auth.getUserById(m.userId),
  })),
)

const pendingInvites = computed(() =>
  projectsStore.getProjectInvites(props.projectId).filter((i) => i.status === 'pending'),
)

const availableUsers = computed(() => {
  const ws = quinlist.currentWorkspace
  if (!ws) return []
  const memberIds = new Set(members.value.map((m) => m.userId))
  return ws.members
    .filter((m) => !memberIds.has(m.userId))
    .map((m) => ({ ...m, user: auth.getUserById(m.userId) }))
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

async function sendInvite() {
  inviteError.value = ''
  inviteSuccess.value = ''
  if (!inviteEmail.value.trim()) {
    inviteError.value = 'Ingresa un correo electrónico'
    return
  }
  inviting.value = true
  try {
    const result = await projectsStore.inviteProjectMember(
      props.projectId,
      inviteEmail.value.trim(),
      addRole.value,
      { canViewFinance: canFinance.value, canManageTasks: canTasks.value, canManageTeam: canTeam.value },
    )
    if (result.type === 'added') {
      inviteSuccess.value = 'Usuario añadido al equipo del proyecto'
    } else {
      inviteSuccess.value = `Invitación enviada a ${inviteEmail.value.trim()}`
    }
    inviteEmail.value = ''
  } catch (err) {
    inviteError.value = err instanceof Error ? err.message : 'No se pudo enviar la invitación'
  } finally {
    inviting.value = false
  }
}
</script>

<template>
  <div class="space-y-7">
    <div>
      <h2 class="project-page-title">Equipo</h2>
      <p class="project-page-sub">Integrantes, permisos e invitaciones del proyecto</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="project-card project-kpi">
        <p class="project-kpi__label">Integrantes</p>
        <p class="project-kpi__value">{{ members.length }}</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__label">Invitaciones pendientes</p>
        <p class="project-kpi__value">{{ pendingInvites.length }}</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__label">Con acceso finanzas</p>
        <p class="project-kpi__value">{{ members.filter((m) => m.canViewFinance).length }}</p>
      </div>
    </div>

    <div class="project-card project-card--lg">
      <h3 class="mb-1 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
        <Mail :size="20" class="text-[#5bbce4]" />
        Invitar al equipo
      </h3>
      <p class="mb-4 text-sm text-[#626f86]">
        Invita por correo. Si ya pertenece al workspace, se añade de inmediato.
      </p>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label class="flex-1 text-sm">
          <span class="mb-1.5 block font-medium text-[#44546f]">Correo electrónico</span>
          <input v-model="inviteEmail" type="email" placeholder="colaborador@empresa.com" class="ql-input" />
        </label>
        <select v-model="addRole" class="ql-input w-auto min-w-[160px]">
          <option value="admin">Administrador</option>
          <option value="member">Miembro</option>
          <option value="viewer">Observador</option>
        </select>
        <button type="button" class="ql-btn ql-btn--primary" :disabled="inviting" @click="sendInvite">
          <Loader2 v-if="inviting" :size="18" class="animate-spin" />
          <UserPlus v-else :size="18" />
          Invitar
        </button>
      </div>
      <div class="mt-4 flex flex-wrap gap-4 text-sm text-[#44546f]">
        <label class="flex items-center gap-2"><input v-model="canTasks" type="checkbox" class="rounded" /> Tareas</label>
        <label class="flex items-center gap-2"><input v-model="canFinance" type="checkbox" class="rounded" /> Finanzas</label>
        <label class="flex items-center gap-2"><input v-model="canTeam" type="checkbox" class="rounded" /> Equipo</label>
      </div>
      <p v-if="inviteError" class="mt-2 text-sm text-red-600">{{ inviteError }}</p>
      <p v-if="inviteSuccess" class="mt-2 text-sm text-[#2d7eb8]">{{ inviteSuccess }}</p>

      <ul v-if="pendingInvites.length" class="mt-4 space-y-2 border-t border-[#ebebed] pt-4">
        <li v-for="inv in pendingInvites" :key="inv.id" class="text-sm text-[#626f86]">
          {{ inv.email }} — pendiente ({{ roleLabel(inv.role) }})
        </li>
      </ul>
    </div>

    <div v-if="availableUsers.length" class="project-card project-card--lg border-dashed">
      <h3 class="mb-3 text-base font-semibold text-[#172b4d]">Añadir del workspace</h3>
      <div class="flex flex-wrap gap-2">
        <select v-model="addUserId" class="ql-input w-auto min-w-[200px]">
          <option value="">Seleccionar...</option>
          <option v-for="u in availableUsers" :key="u.userId" :value="u.userId">
            {{ u.user?.name ?? u.userId }}
          </option>
        </select>
        <button type="button" class="ql-btn ql-btn--ghost" :disabled="!addUserId" @click="addMember">Añadir</button>
      </div>
    </div>

    <div class="ql-table-wrap">
      <table class="ql-table">
        <thead>
          <tr>
            <th>Integrante</th>
            <th>Rol</th>
            <th>Permisos</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in members" :key="m.id">
            <td>
              <div class="flex items-center gap-3">
                <UserAvatar :user-id="m.userId" />
                <div>
                  <p class="font-medium text-[#172b4d]">{{ m.user?.name ?? 'Usuario' }}</p>
                  <p class="text-sm text-[#626f86]">{{ m.user?.email }}</p>
                </div>
              </div>
            </td>
            <td>
              <select
                :value="m.role"
                class="ql-input w-auto py-1.5 text-sm"
                :disabled="m.role === 'owner'"
                @change="projectsStore.updateProjectMember(m.id, { role: ($event.target as HTMLSelectElement).value as UserRole })"
              >
                <option value="owner">Propietario</option>
                <option value="admin">Administrador</option>
                <option value="member">Miembro</option>
                <option value="viewer">Observador</option>
              </select>
            </td>
            <td>
              <div class="flex flex-wrap gap-3 text-sm">
                <label class="flex items-center gap-1.5">
                  <input type="checkbox" :checked="m.canManageTasks" @change="projectsStore.updateProjectMember(m.id, { canManageTasks: ($event.target as HTMLInputElement).checked })" />
                  Tareas
                </label>
                <label class="flex items-center gap-1.5">
                  <input type="checkbox" :checked="m.canViewFinance" @change="projectsStore.updateProjectMember(m.id, { canViewFinance: ($event.target as HTMLInputElement).checked })" />
                  <Shield :size="14" /> Finanzas
                </label>
                <label class="flex items-center gap-1.5">
                  <input type="checkbox" :checked="m.canManageTeam" @change="projectsStore.updateProjectMember(m.id, { canManageTeam: ($event.target as HTMLInputElement).checked })" />
                  Equipo
                </label>
              </div>
            </td>
            <td>
              <button
                v-if="m.role !== 'owner'"
                type="button"
                class="rounded-lg p-2 text-[#626f86] hover:bg-[#f5f5f7] hover:text-red-600"
                @click="projectsStore.removeProjectMember(m.id)"
              >
                <Trash2 :size="18" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
