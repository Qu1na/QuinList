<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  UserPlus,
  Link2,
  Copy,
  Ban,
  Users,
  DollarSign,
  Loader2,
  ListTodo,
  BarChart3,
  Crown,
  ChevronRight,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { useUiStore } from '@/stores/ui'
import { roleLabel, canRemoveMember } from '@/utils/permissions'
import type { UserRole } from '@/types'
import type { ProjectTeamInvite } from '@/types/projects'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import ProjectInviteModal from '@/components/projects/ProjectInviteModal.vue'
import TeamMemberModal from '@/components/projects/shared/TeamMemberModal.vue'
import { useProjectAccess } from '@/utils/projectAccess'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { useProjectPresenceStore } from '@/stores/projectPresence'
import { isProjectPresenceActive } from '@/services/projectPresence'
import { formatLastSeen } from '@/utils/chatTime'
import {
  buildProjectInviteUrl,
  loadProjectTeamInvites,
  revokeProjectTeamInvite,
  subscribeProjectTeamInvitesRealtime,
} from '@/services/projectInvite'
import BarChart from '@/components/charts/BarChart.vue'
import { memberWorkload, tasksByAssignee, formatLoggedHours } from '@/utils/projectReports'
import {
  suspendUser,
  unsuspendUser,
  type SuspendDuration,
} from '@/services/userModeration'
import { loadProfilesByIds } from '@/services/boardShare'
import { isMatuConfigured } from '@/lib/matu'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const quinlist = useQuinListStore()
const ui = useUiStore()
const access = useProjectAccess(props.projectId)
const { resolveUser, onlineCount } = useProjectUsers()
const presenceStore = useProjectPresenceStore()

const addUserId = ref('')
const addRole = ref<UserRole>('member')
const canFinance = ref(false)
const canTasks = ref(true)
const canTeam = ref(false)

const teamInvites = ref<ProjectTeamInvite[]>([])
const loadingInvites = ref(false)
const showInviteModal = ref(false)
const copiedId = ref<string | null>(null)
const selectedMemberId = ref<string | null>(null)

let unsubscribeRealtime: (() => void) | null = null

const project = computed(() => projectsStore.getProject(props.projectId))

const workspaceActorRole = computed(() => {
  const wsId = project.value?.workspaceId
  if (!wsId) return 'viewer' as UserRole
  return quinlist.getUserRole(wsId)
})

const members = computed(() =>
  projectsStore.getProjectMembers(props.projectId).map((m) => ({
    ...m,
    user: resolveUser(m.userId),
  })),
)

const activeInvites = computed(() => teamInvites.value.filter((i) => i.enabled))

const availableUsers = computed(() => {
  const ws = quinlist.currentWorkspace
  if (!ws) return []
  const memberIds = new Set(members.value.map((m) => m.userId))
  return ws.members
    .filter((m) => !memberIds.has(m.userId))
    .map((m) => ({ ...m, user: resolveUser(m.userId) }))
})

const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const deliverables = computed(() => projectsStore.getProjectDeliverables(props.projectId))
const activities = computed(() => projectsStore.getProjectActivities(props.projectId))
const timeEntries = computed(() => projectsStore.getProjectTimeEntries(props.projectId))

const userName = (id: string) => resolveUser(id)?.name ?? 'Usuario'

const taskDistribution = computed(() => tasksByAssignee(tasks.value, userName))

const workloadRows = computed(() =>
  memberWorkload(
    projectsStore.getProjectMembers(props.projectId),
    tasks.value,
    deliverables.value,
    activities.value,
    timeEntries.value,
    userName,
  ),
)

const workloadByUser = computed(() => new Map(workloadRows.value.map((r) => [r.userId, r])))

const totalTasksAssigned = computed(() =>
  workloadRows.value.reduce((sum, row) => sum + row.tasksTotal, 0),
)

const financeAccessCount = computed(() => members.value.filter((m) => m.canViewFinance).length)

const selectedMember = computed(() =>
  members.value.find((m) => m.id === selectedMemberId.value) ?? null,
)

const selectedWorkload = computed(() => {
  if (!selectedMember.value) return null
  return workloadByUser.value.get(selectedMember.value.userId) ?? null
})

function roleBadgeClass(role: UserRole) {
  if (role === 'owner') return 'team-role--owner'
  if (role === 'admin') return 'team-role--admin'
  if (role === 'viewer') return 'team-role--viewer'
  return 'team-role--member'
}

function memberPresence(userId: string) {
  const entry = presenceStore.getUserPresence(userId)
    ?? presenceStore.entries.find((e) => e.userId === userId)

  if (entry && isProjectPresenceActive(entry.lastSeen)) {
    return {
      online: true,
      label: entry.status === 'editing' ? 'Editando' : 'En línea',
    }
  }
  if (entry?.lastSeen) {
    return { online: false, label: formatLastSeen(entry.lastSeen) }
  }
  return { online: false, label: 'Desconectado' }
}

async function refreshInvites() {
  loadingInvites.value = true
  try {
    teamInvites.value = await loadProjectTeamInvites(props.projectId)
  } finally {
    loadingInvites.value = false
  }
}

onMounted(() => {
  void refreshInvites()
  void refreshMemberProfiles()
  unsubscribeRealtime = subscribeProjectTeamInvitesRealtime(props.projectId, () => {
    void refreshInvites()
  })
})

async function refreshMemberProfiles() {
  if (!isMatuConfigured()) return
  const ids = members.value.map((m) => m.userId)
  if (!ids.length) return
  try {
    const profiles = await loadProfilesByIds(ids)
    for (const user of profiles) auth.addUser(user)
  } catch (err) {
    console.error('[ProjectTeamTab] profiles:', err)
  }
}

onUnmounted(() => {
  unsubscribeRealtime?.()
})

watch(showInviteModal, (open, wasOpen) => {
  if (wasOpen && !open) void refreshInvites()
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

function inviteUrl(invite: ProjectTeamInvite) {
  return buildProjectInviteUrl(invite.projectId, invite.token)
}

async function copyInvite(invite: ProjectTeamInvite) {
  await navigator.clipboard.writeText(inviteUrl(invite))
  copiedId.value = invite.id
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

async function revokeInvite(inviteId: string) {
  const ok = await ui.confirm({
    title: 'Revocar enlace',
    message: '¿Revocar este enlace de invitación? Dejará de funcionar de inmediato.',
    confirmText: 'Revocar',
    variant: 'danger',
  })
  if (!ok) return
  await revokeProjectTeamInvite(inviteId)
  await refreshInvites()
}

async function removeMember(memberId: string, name: string) {
  const member = members.value.find((m) => m.id === memberId)
  if (!member || member.role === 'owner') return
  if (!canRemoveMember(workspaceActorRole.value, member.role) && !access.canManageTeam.value) {
    return
  }
  const ok = await ui.confirm({
    title: 'Quitar del proyecto',
    message: `¿Quitar a ${name} del equipo de este proyecto?`,
    confirmText: 'Quitar',
    variant: 'danger',
  })
  if (!ok) return
  await projectsStore.removeProjectMember(memberId)
  selectedMemberId.value = null
}

function openMember(memberId: string) {
  selectedMemberId.value = memberId
}

function closeMember() {
  selectedMemberId.value = null
}

function onUpdateRole(role: UserRole) {
  if (!selectedMember.value || selectedMember.value.role === 'owner') return
  void projectsStore.updateProjectMember(selectedMember.value.id, { role })
}

function onUpdatePerm(
  key: 'canManageTasks' | 'canViewFinance' | 'canManageTeam',
  value: boolean,
) {
  if (!selectedMember.value || selectedMember.value.role === 'owner') return
  void projectsStore.updateProjectMember(selectedMember.value.id, { [key]: value })
}

async function onRemoveSelected() {
  if (!selectedMember.value) return
  await removeMember(selectedMember.value.id, selectedMember.value.user?.name ?? 'este usuario')
}

async function onSuspendMember(payload: { days: SuspendDuration; reason: string }) {
  if (!selectedMember.value || !auth.currentUserId) return
  const name = selectedMember.value.user?.name ?? 'este usuario'
  const ok = await ui.confirm({
    title: 'Suspender cuenta',
    message: `¿Suspender a ${name}? No podrá iniciar sesión en QuinList.`,
    confirmText: 'Suspender',
    variant: 'danger',
  })
  if (!ok) return
  try {
    const updated = await suspendUser(selectedMember.value.userId, auth.currentUserId, {
      days: payload.days,
      reason: payload.reason,
    })
    auth.addUser(updated)
  } catch (err) {
    console.error('[ProjectTeamTab] suspend:', err)
  }
}

async function onUnsuspendMember() {
  if (!selectedMember.value) return
  try {
    const updated = await unsuspendUser(selectedMember.value.userId)
    auth.addUser(updated)
  } catch (err) {
    console.error('[ProjectTeamTab] unsuspend:', err)
  }
}
</script>

<template>
  <div class="team-view">
    <!-- Hero -->
    <header class="team-hero">
      <div class="team-hero__content">
        <div class="team-hero__avatars" aria-hidden="true">
          <UserAvatar
            v-for="m in members.slice(0, 6)"
            :key="m.id"
            :user-id="m.userId"
            size="md"
            class="team-hero__avatar"
          />
          <span v-if="members.length > 6" class="team-hero__more">+{{ members.length - 6 }}</span>
        </div>
        <div class="team-hero__text">
          <h2 class="team-hero__title">Equipo del proyecto</h2>
          <p class="team-hero__sub">Integrantes, permisos e invitaciones</p>
        </div>
      </div>
      <button
        v-if="access.canManageTeam.value"
        type="button"
        class="team-hero__invite"
        @click="showInviteModal = true"
      >
        <UserPlus :size="18" />
        Invitar al equipo
      </button>
    </header>

    <!-- KPIs -->
    <div class="team-kpis">
      <div class="team-kpi">
        <span class="team-kpi__icon team-kpi__icon--blue"><Users :size="20" /></span>
        <div>
          <p class="team-kpi__value">{{ members.length }}</p>
          <p class="team-kpi__label">Integrantes</p>
        </div>
      </div>
      <div class="team-kpi">
        <span class="team-kpi__icon team-kpi__icon--sky"><ListTodo :size="20" /></span>
        <div>
          <p class="team-kpi__value">{{ totalTasksAssigned }}</p>
          <p class="team-kpi__label">Tareas asignadas</p>
        </div>
      </div>
      <div class="team-kpi">
        <span class="team-kpi__icon team-kpi__icon--coral"><DollarSign :size="20" /></span>
        <div>
          <p class="team-kpi__value">{{ financeAccessCount }}</p>
          <p class="team-kpi__label">Acceso finanzas</p>
        </div>
      </div>
      <div class="team-kpi">
        <span class="team-kpi__icon team-kpi__icon--violet"><BarChart3 :size="20" /></span>
        <div>
          <p class="team-kpi__value">{{ onlineCount }}</p>
          <p class="team-kpi__label">Conectados ahora</p>
        </div>
      </div>
    </div>

    <!-- Miembros en tarjetas -->
    <section class="team-section">
      <div class="team-section__head">
        <h3>Integrantes</h3>
        <p>Toca un integrante para ver detalles, rol y permisos</p>
      </div>

      <div class="team-grid">
        <button
          v-for="m in members"
          :key="m.id"
          type="button"
          class="team-card"
          :class="{ 'team-card--owner': m.role === 'owner' }"
          @click="openMember(m.id)"
        >
          <div class="team-card__avatar-wrap">
            <UserAvatar :user-id="m.userId" size="md" />
            <span
              class="team-card__status"
              :class="{ 'team-card__status--online': memberPresence(m.userId).online }"
            />
          </div>
          <div class="team-card__body">
            <p class="team-card__name">
              {{ m.user?.name ?? 'Usuario' }}
              <Crown v-if="m.role === 'owner'" :size="12" class="team-card__crown" />
            </p>
            <span class="team-role team-role--compact" :class="roleBadgeClass(m.role)">
              {{ roleLabel(m.role) }}
            </span>
          </div>
          <ChevronRight :size="16" class="team-card__chevron" />
        </button>
      </div>
    </section>

    <!-- Analítica -->
    <div v-if="taskDistribution.length" class="team-analytics">
      <div class="project-card project-card--lg">
        <h3 class="team-section__chart-title">
          <BarChart3 :size="20" class="text-[#2d7eb8]" />
          Distribución de tareas
        </h3>
        <BarChart :items="taskDistribution" />
      </div>

      <div class="project-card project-card--lg">
        <h3 class="team-section__chart-title">
          <Users :size="20" class="text-[#6554c0]" />
          Carga por integrante
        </h3>
        <div class="team-workload-list">
          <div v-for="row in workloadRows" :key="row.userId" class="team-workload-item">
            <UserAvatar :user-id="row.userId" size="md" />
            <div class="team-workload-item__body">
              <div class="team-workload-item__head">
                <p class="team-workload-item__name">{{ row.name }}</p>
                <span class="team-workload-item__badge">{{ row.recentActivity }} act.</span>
              </div>
              <p class="team-workload-item__meta">
                {{ row.tasksDone }}/{{ row.tasksTotal }} tareas
                · {{ row.deliverablesApproved }}/{{ row.deliverablesTotal }} entregables
                · {{ formatLoggedHours(row.minutesLogged) }}
              </p>
              <div class="team-workload-item__progress">
                <div
                  class="team-workload-item__progress-fill"
                  :style="{ width: `${row.tasksTotal ? Math.round((row.tasksDone / row.tasksTotal) * 100) : 0}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invitaciones -->
    <section
      v-if="access.canManageTeam.value && activeInvites.length"
      class="team-section project-card project-card--lg"
    >
      <h3 class="team-section__chart-title">
        <Link2 :size="20" class="text-[#5bbce4]" />
        Enlaces de invitación
      </h3>

      <div v-if="loadingInvites" class="flex items-center gap-2 text-sm text-[#626f86]">
        <Loader2 :size="16" class="animate-spin" />
        Cargando enlaces...
      </div>

      <ul v-else class="team-invites">
        <li v-for="inv in activeInvites" :key="inv.id" class="team-invite">
          <div class="team-invite__info">
            <p class="team-invite__url">{{ inviteUrl(inv) }}</p>
            <p class="team-invite__meta">
              {{ roleLabel(inv.role) }}
              · {{ inv.useCount }} uso(s)
              <span v-if="inv.maxUses === 1"> · Un solo usuario</span>
              <span v-if="inv.canManageTasks"> · Tareas</span>
              <span v-if="inv.canViewFinance"> · Finanzas</span>
              <span v-if="inv.canManageTeam"> · Equipo</span>
            </p>
          </div>
          <div class="team-invite__actions">
            <button type="button" class="ql-btn ql-btn--ghost py-1.5 text-xs" @click="copyInvite(inv)">
              <Copy :size="14" />
              {{ copiedId === inv.id ? 'Copiado' : 'Copiar' }}
            </button>
            <button type="button" class="ql-btn ql-btn--ghost py-1.5 text-xs text-red-600" @click="revokeInvite(inv.id)">
              <Ban :size="14" />
              Revocar
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- Añadir del workspace -->
    <section
      v-if="access.canManageTeam.value && availableUsers.length"
      class="team-section project-card project-card--lg team-add"
    >
      <h3 class="mb-1 text-base font-semibold text-[#172b4d]">Añadir del workspace</h3>
      <p class="mb-4 text-sm text-[#626f86]">Integra a alguien que ya pertenece a tu espacio de trabajo</p>
      <div class="team-add__form">
        <label class="team-add__field">
          <span>Usuario</span>
          <select v-model="addUserId" class="ql-input">
            <option value="">Seleccionar...</option>
            <option v-for="u in availableUsers" :key="u.userId" :value="u.userId">
              {{ u.user?.name ?? u.userId }}
            </option>
          </select>
        </label>
        <label class="team-add__field">
          <span>Rol</span>
          <select v-model="addRole" class="ql-input">
            <option value="admin">Administrador</option>
            <option value="member">Miembro</option>
            <option value="viewer">Observador</option>
          </select>
        </label>
        <button type="button" class="ql-btn ql-btn--primary team-add__btn" :disabled="!addUserId" @click="addMember">
          <UserPlus :size="16" />
          Añadir
        </button>
      </div>
    </section>

    <TeamMemberModal
      :open="Boolean(selectedMember)"
      :member="selectedMember"
      :can-manage="access.canManageTeam.value"
      :presence-label="selectedMember ? memberPresence(selectedMember.userId).label : ''"
      :presence-online="selectedMember ? memberPresence(selectedMember.userId).online : false"
      :workload="selectedWorkload"
      :workspace-actor-role="workspaceActorRole"
      :actor-user-id="auth.currentUserId"
      @close="closeMember"
      @remove="onRemoveSelected"
      @update:role="onUpdateRole"
      @update:perm="onUpdatePerm"
      @suspend="onSuspendMember"
      @unsuspend="onUnsuspendMember"
    />

    <ProjectInviteModal
      v-if="auth.currentUserId && project"
      v-model:open="showInviteModal"
      :project-id="projectId"
      :project-name="project.name"
      :created-by="auth.currentUserId"
    />
  </div>
</template>

<style scoped>
.team-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.team-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.5rem 1.75rem;
  border-radius: 0.875rem;
  background: #2d7eb8;
  color: #fff;
  box-shadow: 0 2px 8px rgba(45, 126, 184, 0.2);
}

.team-hero__content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
}

.team-hero__avatars {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.team-hero__avatar {
  margin-left: -0.5rem;
  box-shadow: 0 0 0 2px #2d7eb8;
}

.team-hero__avatar:first-child {
  margin-left: 0;
}

.team-hero__more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  margin-left: -0.35rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.35);
}

.team-hero__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.team-hero__sub {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  opacity: 0.88;
}

.team-hero__invite {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d7eb8;
  background: #fff;
  transition: background 0.12s ease;
}

.team-hero__invite:hover {
  background: #f4f7fb;
}

.team-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.875rem;
}

.team-kpi {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 0.875rem;
  background: #fff;
  border: 1px solid rgba(9, 30, 66, 0.08);
  box-shadow: 0 1px 3px rgba(9, 30, 66, 0.04);
}

.team-kpi__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
}

.team-kpi__icon--blue { background: rgba(45, 126, 184, 0.12); color: #2d7eb8; }
.team-kpi__icon--sky { background: rgba(91, 188, 228, 0.15); color: #5bbce4; }
.team-kpi__icon--coral { background: rgba(244, 132, 95, 0.15); color: #f4845f; }
.team-kpi__icon--violet { background: rgba(101, 84, 192, 0.12); color: #6554c0; }

.team-kpi__value {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
  line-height: 1.1;
  color: #172b4d;
}

.team-kpi__label {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: #626f86;
}

.team-section__head {
  margin-bottom: 1rem;
}

.team-section__head h3 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: #172b4d;
}

.team-section__head p {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #626f86;
}

.team-section__chart-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #172b4d;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
  gap: 0.5rem;
}

.team-card {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: 0.625rem;
  text-align: left;
  background: #fff;
  border: 1px solid rgba(9, 30, 66, 0.08);
  box-shadow: 0 1px 2px rgba(9, 30, 66, 0.04);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}

.team-card:hover {
  border-color: rgba(45, 126, 184, 0.22);
  background: #fafcfe;
  box-shadow: 0 2px 8px rgba(45, 126, 184, 0.08);
}

.team-card--owner {
  border-color: rgba(101, 84, 192, 0.2);
}

.team-card__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.team-card__status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 999px;
  background: #94a3b8;
  border: 2px solid #fff;
}

.team-card__status--online {
  background: #22c55e;
}

.team-card__body {
  min-width: 0;
  flex: 1;
}

.team-card__name {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #172b4d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-card__crown {
  flex-shrink: 0;
  color: #f59e0b;
}

.team-role--compact {
  margin-top: 0.2rem;
  padding: 0.1rem 0.4rem;
  font-size: 0.625rem;
}

.team-card__chevron {
  flex-shrink: 0;
  color: #c7d0db;
}

.team-role {
  display: inline-block;
  border-radius: 999px;
  font-weight: 600;
}

.team-role--owner { background: #fef3c7; color: #b45309; }
.team-role--admin { background: #dbeafe; color: #1d4ed8; }
.team-role--member { background: #dcfce7; color: #15803d; }
.team-role--viewer { background: #f1f5f9; color: #64748b; }

.team-analytics {
  display: grid;
  gap: 1.25rem;
}

@media (min-width: 1024px) {
  .team-analytics {
    grid-template-columns: 1fr 1fr;
  }
}

.team-workload-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.team-workload-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.team-workload-item__body {
  flex: 1;
  min-width: 0;
}

.team-workload-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.team-workload-item__name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #172b4d;
}

.team-workload-item__badge {
  flex-shrink: 0;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #2d7eb8;
  background: #eef6fc;
}

.team-workload-item__meta {
  margin: 0.2rem 0 0.4rem;
  font-size: 0.75rem;
  color: #626f86;
}

.team-workload-item__progress {
  height: 0.3rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(9, 30, 66, 0.08);
}

.team-workload-item__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: #2d7eb8;
  transition: width 0.3s ease;
}

.team-invites {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.team-invite {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: #f8fafc;
  border: 1px solid rgba(9, 30, 66, 0.06);
}

.team-invite__url {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: #44546f;
  word-break: break-all;
}

.team-invite__meta {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: #626f86;
}

.team-invite__actions {
  display: flex;
  gap: 0.5rem;
}

.team-add__form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.team-add__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #44546f;
}

.team-add__field select {
  min-width: 12rem;
}

.team-add__btn {
  flex-shrink: 0;
}
</style>
