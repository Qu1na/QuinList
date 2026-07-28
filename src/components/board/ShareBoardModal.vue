<script setup lang="ts">
import { computed } from 'vue'
import {
  X,
  Copy,
  Check,
  Link2,
  Loader2,
  Mail,
  ChevronLeft,
  Users,
  User,
  ArrowRight,
} from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { useBoardShareStore } from '@/stores/boardShare'
import { canManageMembers } from '@/utils/permissions'
import type { BoardShareRole } from '@/types'

const store = useQuinListStore()
const auth = useAuthStore()
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
  if (shareStore.step === 1) return '¿Cómo quieres compartir?'
  if (shareStore.method === 'link') return 'Configura el enlace'
  return 'Invitar por correo'
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
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      @click.self="shareStore.closeModal()"
    >
      <div class="flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <!-- Panel izquierdo -->
        <aside class="hidden w-56 shrink-0 flex-col bg-[#0747a6] p-5 text-white sm:flex">
          <p class="text-xs font-medium tracking-wide text-blue-200 uppercase">Compartir</p>
          <h2 class="mt-1 text-lg font-bold leading-tight">{{ board.title }}</h2>
          <p class="mt-2 text-xs text-blue-200">Solo este tablero</p>

          <div class="mt-6 flex-1">
            <p class="mb-2 text-xs font-semibold text-blue-200 uppercase">Con acceso</p>
            <ul class="space-y-2">
              <li
                v-for="m in shareStore.members.filter((x) => x.status === 'accepted').slice(0, 4)"
                :key="m.id"
                class="flex items-center gap-2"
              >
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold"
                >
                  {{ memberUser(m.id)?.initials ?? m.email?.slice(0, 2).toUpperCase() }}
                </span>
                <span class="truncate text-xs">{{ memberUser(m.id)?.name ?? m.email }}</span>
              </li>
            </ul>
            <p v-if="shareStore.invites.length" class="mt-4 text-xs text-blue-200">
              {{ shareStore.invites.filter((i) => i.enabled).length }} enlace(s) activo(s)
            </p>
          </div>

          <div class="mt-auto flex gap-1">
            <span
              v-for="s in 3"
              :key="s"
              class="h-1 flex-1 rounded-full"
              :class="shareStore.step >= s ? 'bg-white' : 'bg-white/30'"
            />
          </div>
        </aside>

        <!-- Panel derecho — wizard -->
        <div class="flex min-h-[340px] flex-1 flex-col">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div class="flex items-center gap-2">
              <button
                v-if="shareStore.step > 1"
                class="rounded p-1 text-[#626f86] hover:bg-slate-100"
                @click="shareStore.goBack()"
              >
                <ChevronLeft :size="18" />
              </button>
              <h3 class="font-semibold text-[#172b4d]">{{ stepLabels }}</h3>
            </div>
            <button
              class="rounded p-2 text-[#626f86] hover:bg-slate-100"
              @click="shareStore.closeModal()"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="flex flex-1 flex-col px-6 py-5">
            <!-- Paso 1: método -->
            <div v-if="shareStore.step === 1" class="flex flex-1 flex-col gap-4">
              <p class="text-sm text-[#626f86]">
                Elige cómo dar acceso a <strong>{{ board.title }}</strong>
              </p>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  class="flex flex-col items-start gap-3 rounded-xl border-2 border-slate-200 p-5 text-left transition-all hover:border-[#0c66e4] hover:bg-blue-50/50"
                  @click="shareStore.selectMethod('link')"
                >
                  <Link2 :size="24" class="text-[#0c66e4]" />
                  <div>
                    <p class="font-semibold text-[#172b4d]">Enlace</p>
                    <p class="mt-1 text-xs text-[#626f86]">
                      Genera un link con permisos y límite de usuarios
                    </p>
                  </div>
                </button>
                <button
                  class="flex flex-col items-start gap-3 rounded-xl border-2 border-slate-200 p-5 text-left transition-all hover:border-[#0c66e4] hover:bg-blue-50/50"
                  @click="shareStore.selectMethod('email')"
                >
                  <Mail :size="24" class="text-[#0c66e4]" />
                  <div>
                    <p class="font-semibold text-[#172b4d]">Correo</p>
                    <p class="mt-1 text-xs text-[#626f86]">
                      Invitación personalizada a un correo específico
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Paso 2: configuración -->
            <div v-else-if="shareStore.step === 2" class="flex flex-1 flex-col gap-5">
              <template v-if="shareStore.method === 'link'">
                <div>
                  <label class="mb-2 block text-sm font-medium text-[#172b4d]">Permiso</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="r in linkRoles"
                      :key="r.value"
                      class="rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all"
                      :class="
                        shareStore.role === r.value
                          ? 'border-[#0c66e4] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      "
                      @click="shareStore.role = r.value"
                    >
                      <p class="font-medium text-[#172b4d]">{{ r.label }}</p>
                      <p class="text-xs text-[#626f86]">{{ r.desc }}</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-[#172b4d]">
                    ¿Cuántos usuarios?
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="opt in usageOptions"
                      :key="String(opt.value)"
                      class="flex items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all"
                      :class="
                        shareStore.maxUses === opt.value
                          ? 'border-[#0c66e4] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      "
                      @click="shareStore.maxUses = opt.value"
                    >
                      <component
                        :is="opt.value === 1 ? User : Users"
                        :size="16"
                        class="mt-0.5 shrink-0 text-[#0c66e4]"
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
                  <label class="mb-2 block text-sm font-medium text-[#172b4d]">
                    Correo del invitado
                  </label>
                  <input
                    v-model="shareStore.email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#388bff]"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-[#172b4d]">Permiso</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="r in linkRoles"
                      :key="r.value"
                      class="rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all"
                      :class="
                        shareStore.role === r.value
                          ? 'border-[#0c66e4] bg-blue-50'
                          : 'border-slate-200'
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

              <div class="mt-auto flex justify-end">
                <button
                  class="flex items-center gap-2 rounded-lg bg-[#0c66e4] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0055cc] disabled:opacity-60"
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

            <!-- Paso 3: resultado -->
            <div v-else-if="shareStore.step === 3" class="flex flex-1 flex-col gap-4">
              <div
                class="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                {{
                  shareStore.method === 'email'
                    ? `Invitación creada para ${shareStore.generatedInvite?.email}`
                    : shareStore.generatedInvite?.maxUses === 1
                      ? 'Enlace de un solo uso creado'
                      : 'Enlace para varios usuarios creado'
                }}
              </div>

              <div>
                <label class="mb-2 block text-xs font-semibold tracking-wide text-[#626f86] uppercase">
                  Enlace de invitación
                </label>
                <div class="flex gap-2">
                  <input
                    readonly
                    :value="shareStore.inviteUrl()"
                    class="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#172b4d]"
                  />
                  <button
                    class="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc]"
                    @click="shareStore.copyLink()"
                  >
                    <Check v-if="shareStore.copied" :size="15" />
                    <Copy v-else :size="15" />
                    {{ shareStore.copied ? 'Copiado' : 'Copiar' }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 text-center text-xs">
                <div class="rounded-lg bg-slate-50 px-3 py-2">
                  <p class="font-semibold text-[#172b4d]">
                    {{ shareStore.generatedInvite?.role === 'member' ? 'Miembro' : 'Observador' }}
                  </p>
                  <p class="text-[#626f86]">Permiso</p>
                </div>
                <div class="rounded-lg bg-slate-50 px-3 py-2">
                  <p class="font-semibold text-[#172b4d]">
                    {{
                      shareStore.generatedInvite?.maxUses === 1 ? '1 usuario' : 'Ilimitado'
                    }}
                  </p>
                  <p class="text-[#626f86]">Límite</p>
                </div>
                <div class="rounded-lg bg-slate-50 px-3 py-2">
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

              <div class="mt-auto flex justify-between">
                <button
                  class="text-sm text-[#0c66e4] hover:underline"
                  @click="shareStore.goBack(); shareStore.step = 1; shareStore.method = null"
                >
                  Crear otro enlace
                </button>
                <button
                  class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-[#172b4d] hover:bg-slate-200"
                  @click="shareStore.closeModal()"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
