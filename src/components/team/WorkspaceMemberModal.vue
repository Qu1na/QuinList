<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Crown,
  Trash2,
  Mail,
  Ban,
  ShieldOff,
  Loader2,
} from '@lucide/vue'
import type { User, UserRole, WorkspaceMember } from '@/types'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import {
  roleLabel,
  canChangeMemberRole,
  canRemoveMember,
  canSuspendUsers,
  isUserSuspended,
} from '@/utils/permissions'
import { formatLastSeen } from '@/utils/chatTime'
import type { SuspendDuration } from '@/services/userModeration'

const props = defineProps<{
  open: boolean
  member: (WorkspaceMember & { user?: User }) | null
  actorRole: UserRole
  actorUserId: string | null
}>()

const emit = defineEmits<{
  close: []
  remove: []
  'update:role': [role: UserRole]
  suspend: [payload: { days: SuspendDuration; reason: string }]
  unsuspend: []
}>()

const suspendDays = ref<SuspendDuration>(7)
const suspendReason = ref('')
const showSuspendForm = ref(false)
const busy = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) {
      showSuspendForm.value = false
      suspendReason.value = ''
      suspendDays.value = 7
      busy.value = false
    }
  },
)

const isOwner = computed(() => props.member?.role === 'owner')
const isSelf = computed(() => props.member?.userId === props.actorUserId)
const suspended = computed(() => isUserSuspended(props.member?.user))

const canEditRole = computed(
  () =>
    props.member != null &&
    canChangeMemberRole(props.actorRole, props.member.role) &&
    !isSelf.value,
)

const canRemove = computed(
  () =>
    props.member != null &&
    canRemoveMember(props.actorRole, props.member.role) &&
    !isSelf.value,
)

const canSuspend = computed(
  () =>
    canSuspendUsers(props.actorRole) &&
    props.member != null &&
    !isOwner.value &&
    !isSelf.value,
)

const assignableRoles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Miembro' },
  { value: 'viewer', label: 'Observador' },
]

const lastAccessLabel = computed(() => {
  const at = props.member?.user?.lastLoginAt
  if (!at) return 'Sin accesos registrados'
  return formatLastSeen(at)
})

const suspensionLabel = computed(() => {
  const user = props.member?.user
  if (!user || !suspended.value) return ''
  if (user.suspendedUntil) {
    return `Suspendido hasta ${new Date(user.suspendedUntil).toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }
  return 'Suspendido indefinidamente'
})

async function confirmSuspend() {
  busy.value = true
  try {
    emit('suspend', { days: suspendDays.value, reason: suspendReason.value })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ProjectModal
    v-if="open && member"
    :title="member.user?.name ?? 'Integrante'"
    :subtitle="roleLabel(member.role)"
    size="md"
    @close="emit('close')"
  >
    <div class="ws-member-modal">
      <div class="ws-member-modal__hero">
        <div class="ws-member-modal__avatar">
          {{ member.user?.initials ?? '?' }}
        </div>
        <div class="min-w-0">
          <p v-if="member.user?.email" class="ws-member-modal__email">
            <Mail :size="14" />
            {{ member.user.email }}
          </p>
          <p class="ws-member-modal__meta">Último acceso · {{ lastAccessLabel }}</p>
          <p v-if="suspended" class="ws-member-modal__suspended">
            <Ban :size="14" />
            {{ suspensionLabel }}
            <span v-if="member.user?.suspendedReason"> · {{ member.user.suspendedReason }}</span>
          </p>
        </div>
      </div>

      <div v-if="isOwner" class="ws-member-modal__note">
        <Crown :size="16" />
        <p>Propietario del espacio. Su rol no se puede modificar ni quitarlo del equipo.</p>
      </div>

      <div v-if="canEditRole" class="ws-member-modal__section">
        <h4 class="ws-member-modal__section-title">Rol en el espacio</h4>
        <div class="ws-member-modal__segments" role="group">
          <button
            v-for="opt in assignableRoles"
            :key="opt.value"
            type="button"
            class="ws-member-modal__segment"
            :class="{ 'ws-member-modal__segment--active': member.role === opt.value }"
            @click="emit('update:role', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="canSuspend" class="ws-member-modal__section">
        <h4 class="ws-member-modal__section-title">Acceso a la plataforma</h4>
        <template v-if="suspended">
          <p class="ws-member-modal__hint">
            Esta cuenta no puede iniciar sesión mientras esté suspendida.
          </p>
          <button type="button" class="btn-brand-ghost" @click="emit('unsuspend')">
            <ShieldOff :size="16" />
            Reactivar cuenta
          </button>
        </template>
        <template v-else-if="!showSuspendForm">
          <button type="button" class="ws-member-modal__warn-btn" @click="showSuspendForm = true">
            <Ban :size="16" />
            Suspender acceso
          </button>
        </template>
        <template v-else>
          <div class="ws-member-modal__suspend">
            <label class="ws-member-modal__label">
              Duración
              <select v-model="suspendDays" class="ws-member-modal__input">
                <option :value="7">7 días</option>
                <option :value="30">30 días</option>
                <option :value="null">Indefinido</option>
              </select>
            </label>
            <label class="ws-member-modal__label">
              Motivo (opcional)
              <input
                v-model="suspendReason"
                type="text"
                maxlength="200"
                placeholder="Ej. acceso no autorizado"
                class="ws-member-modal__input"
              />
            </label>
            <div class="ws-member-modal__suspend-actions">
              <button type="button" class="btn-brand-ghost" @click="showSuspendForm = false">
                Cancelar
              </button>
              <button
                type="button"
                class="btn-brand btn-brand--danger"
                :disabled="busy"
                @click="confirmSuspend"
              >
                <Loader2 v-if="busy" :size="14" class="animate-spin" />
                Confirmar suspensión
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn-brand-ghost" @click="emit('close')">Cerrar</button>
      <button
        v-if="canRemove"
        type="button"
        class="btn-brand btn-brand--danger"
        @click="emit('remove')"
      >
        <Trash2 :size="16" />
        Quitar del espacio
      </button>
    </template>
  </ProjectModal>
</template>

<style scoped>
.ws-member-modal {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.ws-member-modal__hero {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ws-member-modal__avatar {
  display: flex;
  height: 3.25rem;
  width: 3.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #6554c0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #fff;
}

.ws-member-modal__email {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.875rem;
  color: #44546f;
  word-break: break-all;
}

.ws-member-modal__meta {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #626f86;
}

.ws-member-modal__suspended {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #b91c1c;
}

.ws-member-modal__note {
  display: flex;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.ws-member-modal__note p {
  margin: 0;
}

.ws-member-modal__section-title {
  margin: 0 0 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #97a0af;
}

.ws-member-modal__segments {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.625rem;
  background: #eef1f5;
  border: 1px solid rgba(9, 30, 66, 0.08);
}

.ws-member-modal__segment {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.375rem;
  border-radius: 0.45rem;
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: center;
  color: #626f86;
  background: transparent;
}

.ws-member-modal__segment--active {
  color: #2d7eb8;
  font-weight: 600;
  background: #fff;
  box-shadow: 0 1px 3px rgba(9, 30, 66, 0.1);
}

.ws-member-modal__hint {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: #626f86;
}

.ws-member-modal__warn-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.ws-member-modal__suspend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ws-member-modal__label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #172b4d;
}

.ws-member-modal__input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(9, 30, 66, 0.13);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.ws-member-modal__input:focus {
  border-color: #388bff;
}

.ws-member-modal__suspend-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
