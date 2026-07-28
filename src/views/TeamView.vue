<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserPlus, Loader2 } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { roleLabel, canManageMembers } from '@/utils/permissions'
import type { UserRole } from '@/types'
import AccountShell from '@/components/layout/AccountShell.vue'

const store = useQuinListStore()
const auth = useAuthStore()

const inviteEmail = ref('')
const inviteRole = ref<UserRole>('member')
const inviting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')

const canInvite = computed(() =>
  canManageMembers(store.getUserRole(store.currentWorkspaceId)),
)

const members = computed(() => {
  const ws = store.currentWorkspace
  if (!ws) return []
  return ws.members.map((m) => ({
    ...m,
    user: auth.getUserById(m.userId),
  }))
})

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Miembro' },
  { value: 'viewer', label: 'Observador' },
]

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
  } catch (err) {
    inviteError.value = err instanceof Error ? err.message : 'No se pudo enviar la invitación'
  } finally {
    inviting.value = false
  }
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

    <div class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="member in members"
        :key="member.userId"
        class="flex items-center gap-4 rounded-xl border border-[#091e4214] bg-white p-4 shadow-sm"
      >
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6554c0] text-sm font-bold text-white"
        >
          {{ member.user?.initials }}
        </div>
        <div class="min-w-0">
          <p class="truncate font-semibold text-[#172b4d]">{{ member.user?.name }}</p>
          <p class="truncate text-sm text-[#626f86]">{{ member.user?.email }}</p>
          <span
            class="mt-1 inline-block rounded-full bg-[#091e420f] px-2 py-0.5 text-xs font-medium text-[#44546f]"
          >
            {{ roleLabel(member.role) }}
          </span>
        </div>
      </div>
    </div>
  </AccountShell>
</template>
