<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UserPlus, Loader2, Ban, ChevronRight } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import {
  roleLabel,
  canManageMembers,
  canSuspendUsers,
  isUserSuspended,
} from '@/utils/permissions'
import type { UserRole } from '@/types'
import AccountShell from '@/components/layout/AccountShell.vue'
import WorkspaceMemberModal from '@/components/team/WorkspaceMemberModal.vue'
import { loadProfilesByIds } from '@/services/boardShare'
import { isMatuConfigured } from '@/lib/matu'
import { formatLastSeen } from '@/utils/chatTime'
import {
  suspendUser,
  unsuspendUser,
  type SuspendDuration,
} from '@/services/userModeration'

const store = useQuinListStore()
const auth = useAuthStore()
const ui = useUiStore()

const inviteEmail = ref('')
const inviteRole = ref<UserRole>('member')
const inviting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')
const selectedUserId = ref<string | null>(null)
const actionError = ref('')

const actorRole = computed(() => store.getUserRole(store.currentWorkspaceId))
const canInvite = computed(() => canManageMembers(actorRole.value))
const isOwnerActor = computed(() => canSuspendUsers(actorRole.value))

const members = computed(() => {
  const ws = store.currentWorkspace
  if (!ws) return []
  return ws.members
    .map((m) => ({
      ...m,
      user: auth.getUserById(m.userId),
    }))
    .sort((a, b) => {
      const order: Record<UserRole, number> = { owner: 0, admin: 1, member: 2, viewer: 3 }
      return order[a.role] - order[b.role]
    })
})

const selectedMember = computed(
  () => members.value.find((m) => m.userId === selectedUserId.value) ?? null,
)

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Miembro' },
  { value: 'viewer', label: 'Observador' },
]

async function ensureWorkspaceMemberProfiles() {
  const ws = store.currentWorkspace
  if (!ws) return

  const missing = ws.members.map((m) => m.userId).filter((id) => !auth.getUserById(id))
  const allIds = ws.members.map((m) => m.userId)

  if (!isMatuConfigured()) return

  try {
    const profiles = await loadProfilesByIds(allIds.length ? allIds : missing)
    for (const user of profiles) auth.addUser(user)
  } catch (err) {
    console.error('[TeamView] Error loading member profiles:', err)
  }
}

onMounted(() => {
  void ensureWorkspaceMemberProfiles()
})

async function sendInvite() {
  inviteError.value = ''
  inviteSuccess.value = ''

  if (!inviteEmail.value.trim()) {
    inviteError.value = 'Ingresa un correo electrónico'
    return
  }

  inviting.value = true
  try {
    await store.inviteTeamMember(inviteEmail.value.trim(), inviteRole.value)
    inviteSuccess.value = `Invitación enviada a ${inviteEmail.value.trim()}`
    inviteEmail.value = ''
    await ensureWorkspaceMemberProfiles()
  } catch (err) {
    inviteError.value = err instanceof Error ? err.message : 'No se pudo enviar la invitación'
  } finally {
    inviting.value = false
  }
}

function openMember(userId: string) {
  actionError.value = ''
  selectedUserId.value = userId
}

function closeMember() {
  selectedUserId.value = null
  actionError.value = ''
}

async function onUpdateRole(role: UserRole) {
  if (!selectedMember.value) return
  try {
    await store.updateWorkspaceMemberRole(selectedMember.value.userId, role)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'No se pudo actualizar el rol'
  }
}

async function onRemove() {
  if (!selectedMember.value) return
  const name = selectedMember.value.user?.name ?? 'este usuario'
  const ok = await ui.confirm({
    title: 'Quitar del espacio',
    message: `¿Quitar a ${name} de este espacio de trabajo? Perderá acceso a tableros y proyectos del espacio.`,
    confirmText: 'Quitar',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await store.removeWorkspaceMember(selectedMember.value.userId)
    closeMember()
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'No se pudo quitar al miembro'
  }
}

async function onSuspend(payload: { days: SuspendDuration; reason: string }) {
  if (!selectedMember.value || !auth.currentUserId || !isOwnerActor.value) return
  const name = selectedMember.value.user?.name ?? 'este usuario'
  const ok = await ui.confirm({
    title: 'Suspender cuenta',
    message: `¿Suspender a ${name}? No podrá iniciar sesión en QuinList hasta que se reactive o venza el plazo.`,
    confirmText: 'Suspender',
    variant: 'danger',
  })
  if (!ok) return
  try {
    if (isMatuConfigured()) {
      const updated = await suspendUser(selectedMember.value.userId, auth.currentUserId, {
        days: payload.days,
        reason: payload.reason,
      })
      auth.addUser(updated)
    } else {
      const user = auth.getUserById(selectedMember.value.userId)
      if (!user) throw new Error('Usuario no encontrado')
      const now = new Date()
      auth.addUser({
        ...user,
        suspendedAt: now.toISOString(),
        suspendedUntil:
          payload.days == null
            ? null
            : new Date(now.getTime() + payload.days * 86_400_000).toISOString(),
        suspendedReason: payload.reason.trim() || null,
        suspendedBy: auth.currentUserId,
      })
    }
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'No se pudo suspender'
  }
}

async function onUnsuspend() {
  if (!selectedMember.value || !isOwnerActor.value) return
  try {
    if (isMatuConfigured()) {
      const updated = await unsuspendUser(selectedMember.value.userId)
      auth.addUser(updated)
    } else {
      const user = auth.getUserById(selectedMember.value.userId)
      if (!user) throw new Error('Usuario no encontrado')
      auth.addUser({
        ...user,
        suspendedAt: null,
        suspendedUntil: null,
        suspendedReason: null,
        suspendedBy: null,
      })
    }
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'No se pudo reactivar'
  }
}

function lastAccess(userId: string) {
  const at = auth.getUserById(userId)?.lastLoginAt
  if (!at) return 'Sin acceso'
  return formatLastSeen(at)
}

function roleBadgeClass(role: UserRole) {
  if (role === 'owner') return 'bg-amber-50 text-amber-800'
  if (role === 'admin') return 'bg-blue-50 text-blue-800'
  if (role === 'viewer') return 'bg-slate-100 text-slate-600'
  return 'bg-[#091e420f] text-[#44546f]'
}
</script>

<template>
  <AccountShell>
    <div
      v-if="canInvite"
      class="mb-6 rounded-xl border border-[#091e4214] bg-white p-5 shadow-sm"
    >
      <h2 class="mb-1 flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
        <UserPlus :size="16" />
        Invitar al equipo
      </h2>
      <p class="mb-4 text-xs text-[#626f86]">
        Si el usuario ya tiene cuenta, se añadirá de inmediato. Si no, la invitación quedará
        pendiente hasta que se registre.
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label class="flex-1 text-sm font-medium text-[#172b4d]">
          Correo
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="colega@empresa.com"
            class="mt-1 w-full rounded-lg border border-[#091e4221] px-3 py-2 text-sm outline-none focus:border-[#388bff]"
            @keyup.enter="sendInvite"
          />
        </label>
        <label class="text-sm font-medium text-[#172b4d] sm:w-40">
          Rol
          <select
            v-model="inviteRole"
            class="mt-1 w-full rounded-lg border border-[#091e4221] px-3 py-2 text-sm outline-none focus:border-[#388bff]"
          >
            <option v-for="r in roles" :key="r.value" :value="r.value">
              {{ r.label }}
            </option>
          </select>
        </label>
        <button
          class="flex items-center justify-center gap-2 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc] disabled:opacity-60"
          :disabled="inviting"
          @click="sendInvite"
        >
          <Loader2 v-if="inviting" :size="14" class="animate-spin" />
          Invitar
        </button>
      </div>

      <p v-if="inviteError" class="mt-2 text-sm text-red-500">{{ inviteError }}</p>
      <p v-if="inviteSuccess" class="mt-2 text-sm text-green-600">{{ inviteSuccess }}</p>
    </div>

    <div class="overflow-hidden rounded-xl border border-[#091e4214] bg-white shadow-sm">
      <div class="border-b border-[#091e4214] px-4 py-3">
        <h2 class="text-sm font-semibold text-[#172b4d]">
          Miembros · {{ members.length }}
        </h2>
        <p class="text-xs text-[#626f86]">
          Roles, último acceso
          <span v-if="isOwnerActor"> y suspensión de cuenta</span>
        </p>
      </div>

      <button
        v-for="member in members"
        :key="member.userId"
        type="button"
        class="flex w-full items-center gap-3 border-b border-[#091e420a] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#f8fafc]"
        @click="openMember(member.userId)"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6554c0] text-sm font-bold text-white"
        >
          {{ member.user?.initials ?? '?' }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate font-semibold text-[#172b4d]">
              {{ member.user?.name ?? 'Usuario' }}
            </p>
            <span
              class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
              :class="roleBadgeClass(member.role)"
            >
              {{ roleLabel(member.role) }}
            </span>
            <span
              v-if="isUserSuspended(member.user)"
              class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
            >
              <Ban :size="11" />
              Suspendido
            </span>
          </div>
          <p class="truncate text-sm text-[#626f86]">{{ member.user?.email }}</p>
          <p class="mt-0.5 text-xs text-[#97a0af]">{{ lastAccess(member.userId) }}</p>
        </div>
        <ChevronRight :size="16" class="shrink-0 text-[#97a0af]" />
      </button>

      <p v-if="!members.length" class="px-4 py-8 text-center text-sm text-[#626f86]">
        Aún no hay miembros en este espacio
      </p>
    </div>

    <p v-if="actionError" class="mt-3 text-sm text-red-500">{{ actionError }}</p>

    <WorkspaceMemberModal
      :open="Boolean(selectedMember)"
      :member="selectedMember"
      :actor-role="actorRole"
      :actor-user-id="auth.currentUserId"
      @close="closeMember"
      @update:role="onUpdateRole"
      @remove="onRemove"
      @suspend="onSuspend"
      @unsuspend="onUnsuspend"
    />
  </AccountShell>
</template>
