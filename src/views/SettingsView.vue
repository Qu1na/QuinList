<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Pencil, Calendar, LayoutGrid, Shield, Loader2 } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { useIntegrationsStore } from '@/stores/integrations'
import { saveProfile } from '@/services/matuData'
import { isMatuConfigured } from '@/lib/matu'
import { roleLabel } from '@/utils/permissions'
import { INTEGRATION_META } from '@/utils/integrations'
import type { IntegrationType } from '@/utils/integrations'
import AccountShell from '@/components/layout/AccountShell.vue'

const auth = useAuthStore()
const store = useQuinListStore()
const integrations = useIntegrationsStore()
const router = useRouter()

const editing = ref(false)
const name = ref(auth.currentUser?.name ?? '')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const userRole = computed(() => roleLabel(store.getUserRole(store.currentWorkspaceId)))

const memberSince = computed(() => {
  const ws = store.currentWorkspace
  const member = ws?.members.find((m) => m.userId === auth.currentUserId)
  if (!member?.joinedAt) return '—'
  const date = new Date(member.joinedAt + (member.joinedAt.includes('T') ? '' : 'T00:00:00'))
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
})

const boardCount = computed(
  () => store.boards.filter((b) => b.workspaceId === store.currentWorkspaceId).length,
)

const workspaceBoards = computed(() =>
  store.boards.filter((b) => b.workspaceId === store.currentWorkspaceId),
)

const profileIntegrations: IntegrationType[] = ['google_calendar', 'github']

const connectedIntegrations = computed(() => {
  const connected = new Set<IntegrationType>()
  for (const board of workspaceBoards.value) {
    for (const integration of board.integrations) {
      if (integration.enabled) connected.add(integration.type)
    }
  }
  return connected
})

function startEditing() {
  name.value = auth.currentUser?.name ?? ''
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  name.value = auth.currentUser?.name ?? ''
  error.value = ''
}

async function save() {
  if (!auth.currentUser || !name.value.trim()) return
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    const updated = { ...auth.currentUser, name: name.value.trim() }
    if (isMatuConfigured()) {
      await saveProfile(updated)
    }
    auth.addUser(updated)
    saved.value = true
    editing.value = false
    setTimeout(() => {
      saved.value = false
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}

function openIntegrations() {
  const board = workspaceBoards.value[0]
  if (!board) return
  router.push({ name: 'board', params: { boardId: board.id } })
  integrations.openPanel(board.id)
}
</script>

<template>
  <AccountShell>
    <div class="space-y-4">
      <!-- Perfil -->
      <section class="overflow-hidden rounded-xl border border-[#091e4214] bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-[#091e4214] px-5 py-3">
          <h2 class="text-sm font-semibold text-[#172b4d]">Mi Perfil</h2>
          <button
            v-if="!editing"
            class="rounded p-1.5 text-[#626f86] transition-colors hover:bg-[#091e420a] hover:text-[#172b4d]"
            title="Editar perfil"
            @click="startEditing"
          >
            <Pencil :size="15" />
          </button>
        </div>

        <div class="px-5 py-4">
          <div class="flex items-start gap-4">
            <div class="relative shrink-0">
              <img
                v-if="auth.currentUser?.avatar"
                :src="auth.currentUser.avatar"
                :alt="auth.currentUser.name"
                class="h-14 w-14 rounded-full object-cover"
              />
              <span
                v-else
                class="flex h-14 w-14 items-center justify-center rounded-full bg-[#6554c0] text-lg font-bold text-white"
              >
                {{ auth.currentUser?.initials }}
              </span>
              <span
                class="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
              />
            </div>

            <div class="min-w-0 flex-1">
              <template v-if="editing">
                <input
                  v-model="name"
                  type="text"
                  class="w-full rounded-lg border border-[#091e4221] px-3 py-2 text-sm text-[#172b4d] outline-none focus:border-[#388bff] focus:ring-2 focus:ring-[#388bff33]"
                />
                <div class="mt-2 flex items-center gap-2">
                  <button
                    class="rounded-md bg-[#0c66e4] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0055cc] disabled:opacity-60"
                    :disabled="saving"
                    @click="save"
                  >
                    <span v-if="saving" class="flex items-center gap-1.5">
                      <Loader2 :size="13" class="animate-spin" />
                      Guardando…
                    </span>
                    <span v-else>Guardar</span>
                  </button>
                  <button
                    class="rounded-md px-3 py-1.5 text-xs font-medium text-[#626f86] hover:bg-[#091e420a]"
                    @click="cancelEditing"
                  >
                    Cancelar
                  </button>
                </div>
                <p v-if="error" class="mt-1.5 text-xs text-red-500">{{ error }}</p>
              </template>

              <template v-else>
                <p class="text-base font-semibold text-[#172b4d]">{{ auth.currentUser?.name }}</p>
                <p class="text-sm text-[#626f86]">{{ userRole }}</p>
                <p v-if="saved" class="mt-1 text-xs text-emerald-600">Cambios guardados</p>
              </template>

              <p class="mt-2 flex items-center gap-1.5 text-sm text-[#626f86]">
                <Mail :size="13" class="shrink-0" />
                <span class="truncate">{{ auth.currentUser?.email }}</span>
              </p>
            </div>
          </div>

          <dl class="mt-4 space-y-2 border-t border-[#091e4214] pt-4">
            <div class="flex items-center justify-between gap-4 text-sm">
              <dt class="flex items-center gap-2 text-[#626f86]">
                <Calendar :size="14" />
                Miembro desde
              </dt>
              <dd class="font-medium capitalize text-[#172b4d]">{{ memberSince }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <dt class="flex items-center gap-2 text-[#626f86]">
                <LayoutGrid :size="14" />
                Miembro de
              </dt>
              <dd class="font-medium text-[#172b4d]">{{ boardCount }} tableros</dd>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <dt class="flex items-center gap-2 text-[#626f86]">
                <Shield :size="14" />
                Rol
              </dt>
              <dd class="font-medium text-[#172b4d]">{{ userRole }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Integraciones -->
      <section class="overflow-hidden rounded-xl border border-[#091e4214] bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-[#091e4214] px-5 py-3">
          <h2 class="text-sm font-semibold text-[#172b4d]">Integraciones</h2>
          <button
            v-if="workspaceBoards.length"
            class="text-xs font-medium text-[#6554c0] hover:underline"
            @click="openIntegrations"
          >
            Gestionar
          </button>
        </div>

        <div class="px-3 py-2">
          <div
            v-for="type in profileIntegrations"
            :key="type"
            class="flex items-center gap-3 rounded-lg px-2 py-2.5"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
              :style="{ backgroundColor: `${INTEGRATION_META[type].color}18` }"
            >
              {{ INTEGRATION_META[type].icon }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-[#172b4d]">{{ INTEGRATION_META[type].name }}</p>
              <p class="text-xs text-[#626f86]">
                {{ connectedIntegrations.has(type) ? 'Conectado' : 'No conectado' }}
              </p>
            </div>
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :class="connectedIntegrations.has(type) ? 'bg-emerald-500' : 'bg-[#091e4221]'"
            />
          </div>

          <button
            v-if="workspaceBoards.length"
            class="mt-1 flex w-full items-center justify-center rounded-lg border border-dashed border-[#091e4224] px-3 py-2.5 text-sm font-medium text-[#44546f] transition-colors hover:border-[#091e4240] hover:bg-[#091e420a]"
            @click="openIntegrations"
          >
            + Conectar nueva integración
          </button>
          <p v-else class="px-2 py-4 text-center text-sm text-[#626f86]">
            Crea un tablero para configurar integraciones
          </p>
        </div>
      </section>
    </div>
  </AccountShell>
</template>
