<script setup lang="ts">
import { computed, ref } from 'vue'
import { UserPlus, Shield, Trash2, Mail, Loader2 } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { roleLabel } from '@/utils/permissions'
import type { UserRole } from '@/types'

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
  <div class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-xs text-[#626f86] uppercase">Integrantes</p>
        <p class="text-2xl font-bold text-[#172b4d]">{{ members.length }}</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-xs text-[#626f86] uppercase">Invitaciones pendientes</p>
        <p class="text-2xl font-bold text-[#172b4d]">{{ pendingInvites.length }}</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-xs text-[#626f86] uppercase">Con acceso finanzas</p>
        <p class="text-2xl font-bold text-[#172b4d]">{{ members.filter((m) => m.canViewFinance).length }}</p>
      </div>
    </div>

    <!-- Invitar por correo -->
    <div class="rounded-xl border border-[#091e4214] bg-white p-5">
      <h2 class="mb-1 flex items-center gap-2 font-semibold text-[#172b4d]">
        <Mail :size="16" class="text-[#0c66e4]" />
        Invitar al equipo del proyecto
      </h2>
      <p class="mb-4 text-xs text-[#626f86]">
        Invita por correo. Si ya pertenece al workspace, se añade de inmediato.
      </p>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label class="flex-1 text-sm">
          <span class="mb-1 block text-[#44546f]">Correo electrónico</span>
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="colaborador@empresa.com"
            class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]"
          />
        </label>
        <select v-model="addRole" class="rounded-lg border border-[#091e4229] px-3 py-2 text-sm">
          <option value="admin">Administrador</option>
          <option value="member">Miembro</option>
          <option value="viewer">Observador</option>
        </select>
        <button
          class="flex items-center justify-center gap-1 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm text-white disabled:opacity-50"
          :disabled="inviting"
          @click="sendInvite"
        >
          <Loader2 v-if="inviting" :size="14" class="animate-spin" />
          <UserPlus v-else :size="14" />
          Invitar
        </button>
      </div>
      <div class="mt-3 flex flex-wrap gap-3 text-xs">
        <label class="flex items-center gap-1"><input v-model="canTasks" type="checkbox" /> Tareas</label>
        <label class="flex items-center gap-1"><input v-model="canFinance" type="checkbox" /> Finanzas</label>
        <label class="flex items-center gap-1"><input v-model="canTeam" type="checkbox" /> Equipo</label>
      </div>
      <p v-if="inviteError" class="mt-2 text-xs text-[#44546f]">{{ inviteError }}</p>
      <p v-if="inviteSuccess" class="mt-2 text-xs text-[#0c66e4]">{{ inviteSuccess }}</p>

      <ul v-if="pendingInvites.length" class="mt-4 space-y-1 border-t border-[#091e4214] pt-3">
        <li v-for="inv in pendingInvites" :key="inv.id" class="text-xs text-[#626f86]">
          {{ inv.email }} — pendiente ({{ roleLabel(inv.role) }})
        </li>
      </ul>
    </div>

    <!-- Añadir del workspace -->
    <div v-if="availableUsers.length" class="rounded-xl border border-dashed border-[#091e4229] bg-white p-4">
      <h3 class="mb-3 text-sm font-medium text-[#172b4d]">Añadir del workspace</h3>
      <div class="flex flex-wrap gap-2">
        <select v-model="addUserId" class="rounded-lg border border-[#091e4229] px-3 py-2 text-sm">
          <option value="">Seleccionar...</option>
          <option v-for="u in availableUsers" :key="u.userId" :value="u.userId">
            {{ u.user?.name ?? u.userId }}
          </option>
        </select>
        <button class="rounded-lg bg-[#091e420f] px-3 py-2 text-sm text-[#172b4d]" :disabled="!addUserId" @click="addMember">
          Añadir
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-[#091e4214] bg-white p-5">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-xs text-[#626f86]">
            <th class="pb-2">Integrante</th>
            <th class="pb-2">Rol</th>
            <th class="pb-2">Permisos</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in members" :key="m.id" class="border-b border-[#091e4214] last:border-0">
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[#6554c0] text-xs font-bold text-white">
                  {{ m.user?.initials ?? '?' }}
                </span>
                <div>
                  <p class="font-medium text-[#172b4d]">{{ m.user?.name ?? 'Usuario' }}</p>
                  <p class="text-xs text-[#626f86]">{{ m.user?.email }}</p>
                </div>
              </div>
            </td>
            <td class="py-3">
              <select
                :value="m.role"
                class="rounded border border-[#091e4229] px-2 py-1 text-xs"
                :disabled="m.role === 'owner'"
                @change="projectsStore.updateProjectMember(m.id, { role: ($event.target as HTMLSelectElement).value as UserRole })"
              >
                <option value="owner">Propietario</option>
                <option value="admin">Administrador</option>
                <option value="member">Miembro</option>
                <option value="viewer">Observador</option>
              </select>
            </td>
            <td class="py-3">
              <div class="flex flex-wrap gap-2 text-xs">
                <label class="flex items-center gap-1">
                  <input type="checkbox" :checked="m.canManageTasks" @change="projectsStore.updateProjectMember(m.id, { canManageTasks: ($event.target as HTMLInputElement).checked })" />
                  Tareas
                </label>
                <label class="flex items-center gap-1">
                  <input type="checkbox" :checked="m.canViewFinance" @change="projectsStore.updateProjectMember(m.id, { canViewFinance: ($event.target as HTMLInputElement).checked })" />
                  <Shield :size="10" /> Finanzas
                </label>
                <label class="flex items-center gap-1">
                  <input type="checkbox" :checked="m.canManageTeam" @change="projectsStore.updateProjectMember(m.id, { canManageTeam: ($event.target as HTMLInputElement).checked })" />
                  Equipo
                </label>
              </div>
            </td>
            <td class="py-3">
              <button
                v-if="m.role !== 'owner'"
                class="text-[#626f86] hover:text-[#172b4d]"
                @click="projectsStore.removeProjectMember(m.id)"
              >
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
