<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRight, Check, Copy, Link2, Loader2, User, Users } from '@lucide/vue'
import type { UserRole } from '@/types'
import type { ProjectTeamInvite } from '@/types/projects'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import { roleLabel } from '@/utils/permissions'
import { buildProjectInviteUrl, createProjectTeamInvite } from '@/services/projectInvite'
import { generateQrDataUrl } from '@/utils/qrCode'

const props = defineProps<{
  projectId: string
  projectName: string
  createdBy: string
}>()

const open = defineModel<boolean>('open', { default: false })

const step = ref(1)
const role = ref<UserRole>('member')
const canFinance = ref(false)
const canTasks = ref(true)
const canTeam = ref(false)
const maxUses = ref<number | null>(null)
const creating = ref(false)
const error = ref('')
const copied = ref(false)
const generatedInvite = ref<ProjectTeamInvite | null>(null)
const qrDataUrl = ref('')

const inviteUrl = computed(() =>
  generatedInvite.value
    ? buildProjectInviteUrl(generatedInvite.value.projectId, generatedInvite.value.token)
    : '',
)

const usageOptions = [
  { value: 1 as number | null, label: 'Un solo usuario', desc: 'El enlace expira al usarse' },
  { value: null as number | null, label: 'Ilimitado', desc: 'Cualquiera con el enlace puede unirse' },
]

const roleOptions: { value: UserRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Administrador', desc: 'Control total del proyecto' },
  { value: 'member', label: 'Miembro', desc: 'Colabora según permisos' },
  { value: 'viewer', label: 'Observador', desc: 'Solo lectura' },
]

const subtitle = computed(() => {
  if (step.value === 1) return 'Paso 1 de 2 · Configura la invitación'
  return 'Paso 2 de 2 · Comparte el enlace'
})

watch(open, (isOpen) => {
  if (!isOpen) reset()
})

watch(inviteUrl, async (url) => {
  if (!url) {
    qrDataUrl.value = ''
    return
  }
  try {
    qrDataUrl.value = await generateQrDataUrl(url)
  } catch {
    qrDataUrl.value = ''
  }
})

function reset() {
  step.value = 1
  role.value = 'member'
  canFinance.value = false
  canTasks.value = true
  canTeam.value = false
  maxUses.value = null
  creating.value = false
  error.value = ''
  copied.value = false
  generatedInvite.value = null
  qrDataUrl.value = ''
}

function close() {
  open.value = false
}

async function generate() {
  error.value = ''
  creating.value = true
  try {
    generatedInvite.value = await createProjectTeamInvite(props.projectId, props.createdBy, {
      role: role.value,
      canViewFinance: canFinance.value,
      canManageTasks: canTasks.value,
      canManageTeam: canTeam.value,
      maxUses: maxUses.value,
    })
    step.value = 2
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo crear la invitación'
  } finally {
    creating.value = false
  }
}

async function copyLink() {
  if (!inviteUrl.value) return
  await navigator.clipboard.writeText(inviteUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function createAnother() {
  step.value = 1
  generatedInvite.value = null
  qrDataUrl.value = ''
  copied.value = false
}
</script>

<template>
  <ProjectModal
    v-if="open"
    :title="step === 1 ? 'Generar invitación' : 'Invitación lista'"
    :subtitle="subtitle"
    :step="step"
    :total-steps="2"
    size="lg"
    @close="close"
  >
    <div v-if="step === 1" class="space-y-5">
      <p class="text-sm text-[#626f86]">
        Invita a alguien a <strong class="text-[#172b4d]">{{ projectName }}</strong>. Al abrir el
        enlace o escanear el código QR, podrá unirse con su cuenta.
      </p>

      <div>
        <label class="project-create-modal__label">Rol en el proyecto</label>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            v-for="opt in roleOptions"
            :key="opt.value"
            type="button"
            class="rounded-xl border-2 px-3 py-3 text-left text-sm transition-all"
            :class="
              role === opt.value
                ? 'border-[#f4845f] bg-[#fef3ef]'
                : 'border-[#091e4221] hover:border-[#c7d0db]'
            "
            @click="role = opt.value"
          >
            <p class="font-semibold text-[#172b4d]">{{ opt.label }}</p>
            <p class="mt-0.5 text-xs text-[#626f86]">{{ opt.desc }}</p>
          </button>
        </div>
      </div>

      <div>
        <label class="project-create-modal__label">Usos del enlace</label>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            v-for="opt in usageOptions"
            :key="String(opt.value)"
            type="button"
            class="flex items-start gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm transition-all"
            :class="
              maxUses === opt.value
                ? 'border-[#2d7eb8] bg-[#eef6fc]'
                : 'border-[#091e4221] hover:border-[#c7d0db]'
            "
            @click="maxUses = opt.value"
          >
            <component
              :is="opt.value === 1 ? User : Users"
              :size="18"
              class="mt-0.5 shrink-0 text-[#2d7eb8]"
            />
            <div>
              <p class="font-semibold text-[#172b4d]">{{ opt.label }}</p>
              <p class="mt-0.5 text-xs text-[#626f86]">{{ opt.desc }}</p>
            </div>
          </button>
        </div>
      </div>

      <div>
        <label class="project-create-modal__label">Permisos adicionales</label>
        <div class="flex flex-wrap gap-3 rounded-xl border border-[#091e4221] bg-[#fafafa] p-4">
          <label class="flex cursor-pointer items-center gap-2 text-sm text-[#44546f]">
            <input v-model="canTasks" type="checkbox" class="rounded border-[#c7d0db]" />
            Gestionar tareas
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-[#44546f]">
            <input v-model="canFinance" type="checkbox" class="rounded border-[#c7d0db]" />
            Ver finanzas
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-[#44546f]">
            <input v-model="canTeam" type="checkbox" class="rounded border-[#c7d0db]" />
            Gestionar equipo
          </label>
        </div>
      </div>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>
    </div>

    <div v-else class="space-y-5">
      <div class="rounded-xl bg-[#eef6fc] px-4 py-3 text-sm text-[#2d7eb8]">
        <Link2 :size="16" class="mr-1.5 inline" />
        Invitación creada · {{ roleLabel(generatedInvite?.role ?? 'member') }}
        <span v-if="generatedInvite?.maxUses === 1"> · Un solo uso</span>
      </div>

      <div class="grid gap-5 md:grid-cols-[1fr_auto]">
        <div class="min-w-0 space-y-3">
          <label class="project-create-modal__label">Enlace de invitación</label>
          <div class="flex gap-2">
            <input readonly :value="inviteUrl" class="project-create-modal__input min-w-0 flex-1 font-mono text-xs" />
            <button type="button" class="btn-brand flex shrink-0 items-center gap-1.5" @click="copyLink">
              <Check v-if="copied" :size="15" />
              <Copy v-else :size="15" />
              {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
          <p class="text-xs text-[#626f86]">
            Quien abra el enlace iniciará sesión o se registrará y entrará directo al proyecto.
          </p>
        </div>

        <div class="flex flex-col items-center gap-2">
          <label class="project-create-modal__label">Código QR</label>
          <div class="rounded-xl border border-[#091e4221] bg-white p-3 shadow-sm">
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="Código QR de invitación"
              class="h-[220px] w-[220px]"
            />
            <div
              v-else
              class="flex h-[220px] w-[220px] items-center justify-center text-sm text-[#626f86]"
            >
              <Loader2 :size="24" class="animate-spin" />
            </div>
          </div>
          <p class="text-center text-xs text-[#626f86]">Escanea para unirte al proyecto</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <button
          v-if="step === 2"
          type="button"
          class="btn-brand-ghost"
          @click="createAnother"
        >
          Crear otra
        </button>
        <span v-else />

        <div class="flex gap-2">
          <button type="button" class="btn-brand-ghost" @click="close">
            {{ step === 2 ? 'Listo' : 'Cancelar' }}
          </button>
          <button
            v-if="step === 1"
            type="button"
            class="btn-brand flex items-center gap-2"
            :disabled="creating"
            @click="generate"
          >
            <Loader2 v-if="creating" :size="16" class="animate-spin" />
            <template v-else>
              Generar invitación
              <ArrowRight :size="16" />
            </template>
          </button>
        </div>
      </div>
    </template>
  </ProjectModal>
</template>
