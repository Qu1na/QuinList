<script setup lang="ts">
import { computed } from 'vue'
import {
  Copy,
  Check,
  Link2,
  Loader2,
  Mail,
  Users,
  User,
  ArrowRight,
} from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useBoardShareStore } from '@/stores/boardShare'
import { canManageMembers } from '@/utils/permissions'
import AppWindow from '@/components/ui/AppWindow.vue'
import type { BoardShareRole } from '@/types'

const store = useQuinListStore()
const shareStore = useBoardShareStore()

const board = computed(() => store.boards.find((b) => b.id === shareStore.boardId))

const canManage = computed(() =>
  board.value ? canManageMembers(store.getUserRole(board.value.workspaceId)) : false,
)

const linkRoles: { value: BoardShareRole; label: string; desc: string }[] = [
  { value: 'viewer', label: 'Observador', desc: 'Solo ver' },
  { value: 'member', label: 'Miembro', desc: 'Editar tarjetas' },
]

const usageOptions = [
  { value: 1, label: 'Un solo usuario', desc: 'El enlace expira al usarse' },
  { value: null, label: 'Varios usuarios', desc: 'Cualquiera con el enlace puede unirse' },
]

const stepLabels = computed(() => {
  if (shareStore.step === 1) return 'Paso 1 de 3'
  if (shareStore.step === 2) {
    return shareStore.method === 'link' ? 'Paso 2 de 3 · Configura el enlace' : 'Paso 2 de 3 · Invitar por correo'
  }
  return 'Paso 3 de 3 · Enlace listo'
})

const windowTitle = computed(() => {
  if (shareStore.step === 1) return 'Compartir tablero'
  if (shareStore.step === 2) return shareStore.method === 'link' ? 'Enlace de invitación' : 'Invitación por correo'
  return 'Enlace creado'
})

function memberUser(memberId: string) {
  const member = shareStore.members.find((m) => m.id === memberId)
  if (!member?.userId) return null
  return shareStore.memberUsers.find((u) => u.id === member.userId) ?? null
}

async function onGenerate() {
  if (shareStore.method === 'link') {
    await shareStore.generateLinkInvite()
  } else {
    await shareStore.generateEmailInvite()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="shareStore.showModal && board"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="shareStore.closeModal()"
    >
      <AppWindow
        :title="windowTitle"
        :subtitle="stepLabels"
        class="app-window--wide"
        @close="shareStore.closeModal()"
      >
        <div class="mb-4 flex items-center gap-1.5">
          <span
            v-for="s in 3"
            :key="s"
            class="app-step-bar"
            :class="{ 'app-step-bar--active': shareStore.step >= s }"
          />
        </div>

        <!-- Paso 1: método -->
        <div v-if="shareStore.step === 1" class="space-y-4">
          <p class="text-sm text-[#626f86]">
            Elige cómo dar acceso a <strong class="text-[#172b4d]">{{ board.title }}</strong>
          </p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="flex flex-col items-start gap-3 rounded-xl border-2 border-[#091e4221] p-5 text-left transition-all hover:border-[#5bbce4] hover:bg-[#eef6fc]"
              @click="shareStore.selectMethod('link')"
            >
              <Link2 :size="22" class="text-[#2d7eb8]" />
              <div>
                <p class="font-semibold text-[#172b4d]">Enlace</p>
                <p class="mt-1 text-xs text-[#626f86]">
                  Genera un link con permisos y límite de usuarios
                </p>
              </div>
            </button>
            <button
              type="button"
              class="flex flex-col items-start gap-3 rounded-xl border-2 border-[#091e4221] p-5 text-left transition-all hover:border-[#5bbce4] hover:bg-[#eef6fc]"
              @click="shareStore.selectMethod('email')"
            >
              <Mail :size="22" class="text-[#2d7eb8]" />
              <div>
                <p class="font-semibold text-[#172b4d]">Correo</p>
                <p class="mt-1 text-xs text-[#626f86]">
                  Invitación personalizada a un correo específico
                </p>
              </div>
            </button>
          </div>

          <div v-if="canManage" class="rounded-xl border border-[#091e4221] bg-[#fafafa] p-4">
            <p class="mb-2 text-xs font-semibold tracking-wide text-[#626f86] uppercase">
              Con acceso
            </p>
            <ul class="space-y-2">
              <li
                v-for="m in shareStore.members.filter((x) => x.status === 'accepted').slice(0, 4)"
                :key="m.id"
                class="flex items-center gap-2"
              >
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-[#2d7eb8] text-[10px] font-bold text-white"
                >
                  {{ memberUser(m.id)?.initials ?? m.email?.slice(0, 2).toUpperCase() }}
                </span>
                <span class="truncate text-sm text-[#172b4d]">
                  {{ memberUser(m.id)?.name ?? m.email }}
                </span>
              </li>
            </ul>
            <p v-if="shareStore.invites.length" class="mt-3 text-xs text-[#626f86]">
              {{ shareStore.invites.filter((i) => i.enabled).length }} enlace(s) activo(s)
            </p>
          </div>
        </div>

        <!-- Paso 2: configuración -->
        <div v-else-if="shareStore.step === 2" class="space-y-4">
          <template v-if="shareStore.method === 'link'">
            <div>
              <label class="project-create-modal__label">Permiso</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="r in linkRoles"
                  :key="r.value"
                  type="button"
                  class="rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all"
                  :class="
                    shareStore.role === r.value
                      ? 'border-[#2d7eb8] bg-[#eef6fc]'
                      : 'border-[#091e4221] hover:border-[#c7d0db]'
                  "
                  @click="shareStore.role = r.value"
                >
                  <p class="font-medium text-[#172b4d]">{{ r.label }}</p>
                  <p class="text-xs text-[#626f86]">{{ r.desc }}</p>
                </button>
              </div>
            </div>

            <div>
              <label class="project-create-modal__label">¿Cuántos usuarios?</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="opt in usageOptions"
                  :key="String(opt.value)"
                  type="button"
                  class="flex items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all"
                  :class="
                    shareStore.maxUses === opt.value
                      ? 'border-[#2d7eb8] bg-[#eef6fc]'
                      : 'border-[#091e4221] hover:border-[#c7d0db]'
                  "
                  @click="shareStore.maxUses = opt.value"
                >
                  <component
                    :is="opt.value === 1 ? User : Users"
                    :size="16"
                    class="mt-0.5 shrink-0 text-[#2d7eb8]"
                  />
                  <div>
                    <p class="font-medium text-[#172b4d]">{{ opt.label }}</p>
                    <p class="text-xs text-[#626f86]">{{ opt.desc }}</p>
                  </div>
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div>
              <label class="project-create-modal__label">Correo del invitado</label>
              <input
                v-model="shareStore.email"
                type="email"
                placeholder="correo@ejemplo.com"
                class="project-create-modal__input"
              />
            </div>
            <div>
              <label class="project-create-modal__label">Permiso</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="r in linkRoles"
                  :key="r.value"
                  type="button"
                  class="rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all"
                  :class="
                    shareStore.role === r.value
                      ? 'border-[#2d7eb8] bg-[#eef6fc]'
                      : 'border-[#091e4221]'
                  "
                  @click="shareStore.role = r.value"
                >
                  <p class="font-medium">{{ r.label }}</p>
                  <p class="text-xs text-[#626f86]">{{ r.desc }}</p>
                </button>
              </div>
            </div>
            <p class="text-xs text-[#626f86]">
              Solo ese correo podrá usar el enlace de invitación.
            </p>
          </template>

          <p v-if="shareStore.error" class="text-sm text-red-500">{{ shareStore.error }}</p>
        </div>

        <!-- Paso 3: resultado -->
        <div v-else-if="shareStore.step === 3" class="space-y-4">
          <div class="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            {{
              shareStore.method === 'email'
                ? `Invitación creada para ${shareStore.generatedInvite?.email}`
                : shareStore.generatedInvite?.maxUses === 1
                  ? 'Enlace de un solo uso creado'
                  : 'Enlace para varios usuarios creado'
            }}
          </div>

          <div>
            <label class="project-create-modal__label">Enlace de invitación</label>
            <div class="flex gap-2">
              <input
                readonly
                :value="shareStore.inviteUrl()"
                class="project-create-modal__input min-w-0 flex-1"
              />
              <button
                type="button"
                class="btn-brand flex shrink-0 items-center gap-1.5"
                @click="shareStore.copyLink()"
              >
                <Check v-if="shareStore.copied" :size="15" />
                <Copy v-else :size="15" />
                {{ shareStore.copied ? 'Copiado' : 'Copiar' }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center text-xs">
            <div class="rounded-lg bg-[#fafafa] px-3 py-2">
              <p class="font-semibold text-[#172b4d]">
                {{ shareStore.generatedInvite?.role === 'member' ? 'Miembro' : 'Observador' }}
              </p>
              <p class="text-[#626f86]">Permiso</p>
            </div>
            <div class="rounded-lg bg-[#fafafa] px-3 py-2">
              <p class="font-semibold text-[#172b4d]">
                {{ shareStore.generatedInvite?.maxUses === 1 ? '1 usuario' : 'Ilimitado' }}
              </p>
              <p class="text-[#626f86]">Límite</p>
            </div>
            <div class="rounded-lg bg-[#fafafa] px-3 py-2">
              <p class="font-semibold text-[#172b4d]">
                {{ shareStore.generatedInvite?.useCount ?? 0 }}
              </p>
              <p class="text-[#626f86]">Usos</p>
            </div>
          </div>

          <p class="text-xs text-[#626f86]">
            Al abrir el enlace, el usuario iniciará sesión o se registrará y será redirigido
            automáticamente a este tablero.
          </p>
        </div>

        <template #footer>
          <div class="flex w-full items-center justify-between gap-2">
            <button
              v-if="shareStore.step > 1 && shareStore.step < 3"
              type="button"
              class="btn-brand-ghost"
              @click="shareStore.goBack()"
            >
              Atrás
            </button>
            <button
              v-else-if="shareStore.step === 3"
              type="button"
              class="btn-brand-ghost"
              @click="shareStore.goBack(); shareStore.step = 1; shareStore.method = null"
            >
              Crear otro enlace
            </button>
            <span v-else />

            <div class="flex gap-2">
              <button type="button" class="btn-brand-ghost" @click="shareStore.closeModal()">
                {{ shareStore.step === 3 ? 'Listo' : 'Cancelar' }}
              </button>
              <button
                v-if="shareStore.step === 2"
                type="button"
                class="btn-brand flex items-center gap-2"
                :disabled="shareStore.creating || (shareStore.method === 'link' && shareStore.maxUses === undefined)"
                @click="onGenerate"
              >
                <Loader2 v-if="shareStore.creating" :size="16" class="animate-spin" />
                <template v-else>
                  Generar
                  <ArrowRight :size="16" />
                </template>
              </button>
            </div>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>
</template>
