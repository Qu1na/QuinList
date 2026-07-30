<script setup lang="ts">
import { computed } from 'vue'
import {
  Crown,
  Trash2,
  ListTodo,
  DollarSign,
  Users,
  Shield,
  Mail,
} from '@lucide/vue'
import type { UserRole } from '@/types'
import type { ProjectMember } from '@/types/projects'
import type { User } from '@/types'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import { roleLabel } from '@/utils/permissions'
import { formatLoggedHours } from '@/utils/projectReports'

export interface TeamMemberWorkload {
  tasksDone: number
  tasksTotal: number
  deliverablesApproved: number
  deliverablesTotal: number
  minutesLogged: number
  recentActivity: number
}

const props = defineProps<{
  open: boolean
  member: (ProjectMember & { user?: User }) | null
  canManage: boolean
  presenceLabel: string
  presenceOnline: boolean
  workload?: TeamMemberWorkload | null
}>()

const emit = defineEmits<{
  close: []
  remove: []
  'update:role': [role: UserRole]
  'update:perm': [key: 'canManageTasks' | 'canViewFinance' | 'canManageTeam', value: boolean]
}>()

const isOwner = computed(() => props.member?.role === 'owner')
const canEdit = computed(() => props.canManage && !isOwner.value)

const assignableRoles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Miembro' },
  { value: 'viewer', label: 'Observador' },
]

const taskProgress = computed(() => {
  const w = props.workload
  if (!w || !w.tasksTotal) return 0
  return Math.round((w.tasksDone / w.tasksTotal) * 100)
})
</script>

<template>
  <ProjectModal
    v-if="open && member"
    :title="member.user?.name ?? 'Integrante'"
    :subtitle="roleLabel(member.role)"
    size="md"
    @close="emit('close')"
  >
    <div class="team-member-modal">
      <div class="team-member-modal__hero">
        <div class="team-member-modal__avatar-wrap">
          <UserAvatar :user-id="member.userId" size="lg" />
          <span
            class="team-member-modal__status"
            :class="{ 'team-member-modal__status--online': presenceOnline }"
          />
        </div>
        <div class="team-member-modal__meta">
          <p v-if="member.user?.email" class="team-member-modal__email">
            <Mail :size="14" />
            {{ member.user.email }}
          </p>
          <p class="team-member-modal__presence">{{ presenceLabel }}</p>
        </div>
      </div>

      <div v-if="isOwner" class="team-member-modal__owner-note">
        <Crown :size="16" />
        <p>Propietario del proyecto. Su rol y permisos no se pueden modificar ni quitar del equipo.</p>
      </div>

      <div v-if="workload" class="team-member-modal__stats">
        <div class="team-member-modal__stat">
          <span class="team-member-modal__stat-value">{{ workload.tasksDone }}/{{ workload.tasksTotal }}</span>
          <span class="team-member-modal__stat-label">Tareas</span>
        </div>
        <div class="team-member-modal__stat">
          <span class="team-member-modal__stat-value">{{ workload.deliverablesApproved }}/{{ workload.deliverablesTotal }}</span>
          <span class="team-member-modal__stat-label">Entregables</span>
        </div>
        <div class="team-member-modal__stat">
          <span class="team-member-modal__stat-value">{{ formatLoggedHours(workload.minutesLogged) }}</span>
          <span class="team-member-modal__stat-label">Registrado</span>
        </div>
        <div class="team-member-modal__stat">
          <span class="team-member-modal__stat-value">{{ workload.recentActivity }}</span>
          <span class="team-member-modal__stat-label">Actividad</span>
        </div>
      </div>

      <div v-if="workload" class="team-member-modal__progress">
        <div class="team-member-modal__progress-fill" :style="{ width: `${taskProgress}%` }" />
      </div>

      <template v-if="canEdit">
        <div class="team-member-modal__section">
          <h4 class="team-member-modal__section-title">Rol en el proyecto</h4>
          <div class="team-member-modal__segments" role="group">
            <button
              v-for="opt in assignableRoles"
              :key="opt.value"
              type="button"
              class="team-member-modal__segment"
              :class="{ 'team-member-modal__segment--active': member.role === opt.value }"
              @click="emit('update:role', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="team-member-modal__section">
          <h4 class="team-member-modal__section-title">Permisos</h4>
          <div class="team-member-modal__perms">
            <label class="team-member-modal__perm">
              <input
                type="checkbox"
                :checked="member.canManageTasks"
                @change="emit('update:perm', 'canManageTasks', ($event.target as HTMLInputElement).checked)"
              />
              <ListTodo :size="16" />
              <span>Gestionar tareas</span>
            </label>
            <label class="team-member-modal__perm">
              <input
                type="checkbox"
                :checked="member.canViewFinance"
                @change="emit('update:perm', 'canViewFinance', ($event.target as HTMLInputElement).checked)"
              />
              <DollarSign :size="16" />
              <span>Ver finanzas</span>
            </label>
            <label class="team-member-modal__perm">
              <input
                type="checkbox"
                :checked="member.canManageTeam"
                @change="emit('update:perm', 'canManageTeam', ($event.target as HTMLInputElement).checked)"
              />
              <Users :size="16" />
              <span>Gestionar equipo</span>
            </label>
          </div>
        </div>
      </template>

      <div v-else-if="!isOwner" class="team-member-modal__readonly-perms">
        <h4 class="team-member-modal__section-title">Permisos</h4>
        <div class="team-member-modal__perm-tags">
          <span v-if="member.canManageTasks" class="team-member-modal__tag">
            <ListTodo :size="12" /> Tareas
          </span>
          <span v-if="member.canViewFinance" class="team-member-modal__tag">
            <Shield :size="12" /> Finanzas
          </span>
          <span v-if="member.canManageTeam" class="team-member-modal__tag">
            <Users :size="12" /> Equipo
          </span>
          <span
            v-if="!member.canManageTasks && !member.canViewFinance && !member.canManageTeam"
            class="team-member-modal__tag team-member-modal__tag--muted"
          >
            Sin permisos adicionales
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn-brand-ghost" @click="emit('close')">Cerrar</button>
      <button
        v-if="canEdit"
        type="button"
        class="btn-brand btn-brand--danger"
        @click="emit('remove')"
      >
        <Trash2 :size="16" />
        Quitar del proyecto
      </button>
    </template>
  </ProjectModal>
</template>

<style scoped>
.team-member-modal {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.team-member-modal__hero {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.team-member-modal__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.team-member-modal__status {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  background: #94a3b8;
  border: 2px solid #f5f5f7;
}

.team-member-modal__status--online {
  background: #22c55e;
}

.team-member-modal__email {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.875rem;
  color: #44546f;
  word-break: break-all;
}

.team-member-modal__presence {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #626f86;
}

.team-member-modal__owner-note {
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

.team-member-modal__owner-note p {
  margin: 0;
}

.team-member-modal__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.team-member-modal__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.625rem 0.375rem;
  border-radius: 0.5rem;
  background: #f4f7fb;
  border: 1px solid rgba(9, 30, 66, 0.06);
}

.team-member-modal__stat-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #172b4d;
}

.team-member-modal__stat-label {
  margin-top: 0.15rem;
  font-size: 0.6875rem;
  color: #626f86;
}

.team-member-modal__progress {
  height: 0.35rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(9, 30, 66, 0.08);
}

.team-member-modal__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: #2d7eb8;
}

.team-member-modal__section-title {
  margin: 0 0 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #97a0af;
}

.team-member-modal__segments {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.625rem;
  background: #eef1f5;
  border: 1px solid rgba(9, 30, 66, 0.08);
}

.team-member-modal__segment {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.375rem;
  border-radius: 0.45rem;
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: center;
  color: #626f86;
  background: transparent;
  transition: background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease;
}

.team-member-modal__segment--active {
  color: #2d7eb8;
  font-weight: 600;
  background: #fff;
  box-shadow: 0 1px 3px rgba(9, 30, 66, 0.1);
}

.team-member-modal__perms {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-member-modal__perm {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #172b4d;
  background: #f8fafc;
  border: 1px solid rgba(9, 30, 66, 0.08);
  cursor: pointer;
}

.team-member-modal__perm:has(input:checked) {
  color: #2d7eb8;
  background: rgba(45, 126, 184, 0.08);
  border-color: rgba(45, 126, 184, 0.2);
}

.team-member-modal__perm input {
  width: 1rem;
  height: 1rem;
  accent-color: #2d7eb8;
}

.team-member-modal__perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.team-member-modal__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2d7eb8;
  background: rgba(45, 126, 184, 0.1);
}

.team-member-modal__tag--muted {
  color: #626f86;
  background: #f1f5f9;
  font-weight: 500;
}

@media (max-width: 480px) {
  .team-member-modal__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
