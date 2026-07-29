<script setup lang="ts">
import {
  Plus,
  Check,
  Flag,
  Trash2,
  Pencil,
  PartyPopper,
  Calendar,
  Target,
  Clock,
} from '@lucide/vue'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { formatDate } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import { burstConfettiFromElement } from '@/utils/confetti'
import DateInput from '@/components/projects/shared/DateInput.vue'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import { useProjectUsers } from '@/composables/useProjectUsers'
import type { ProjectMilestone } from '@/types/projects'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))

const completedCount = computed(() => milestones.value.filter((m) => m.completed).length)
const pendingCount = computed(() => milestones.value.length - completedCount.value)
const progress = computed(() =>
  milestones.value.length ? Math.round((completedCount.value / milestones.value.length) * 100) : 0,
)

const showModal = ref(false)
const editingId = ref<string | null>(null)
const activeMilestoneId = ref<string | null>(null)
const formError = ref('')
const saving = ref(false)
const form = ref({ title: '', description: '', startDate: todayISO(), dueDate: todayISO() })

function openCreate() {
  editingId.value = null
  form.value = { title: '', description: '', startDate: todayISO(), dueDate: todayISO() }
  formError.value = ''
  showModal.value = true
}

function openEdit(ms: ProjectMilestone) {
  activeMilestoneId.value = null
  editingId.value = ms.id
  form.value = {
    title: ms.title,
    description: ms.description,
    startDate: ms.startDate ?? todayISO(),
    dueDate: ms.dueDate ?? todayISO(),
  }
  formError.value = ''
  showModal.value = true
}

async function save() {
  formError.value = ''
  if (!form.value.title.trim()) {
    formError.value = 'El título es obligatorio'
    return
  }
  if (!form.value.dueDate) {
    formError.value = 'La fecha de vencimiento es obligatoria'
    return
  }
  if (form.value.startDate && form.value.dueDate < form.value.startDate) {
    formError.value = 'La fecha de fin debe ser posterior al inicio'
    return
  }

  const isEdit = !!editingId.value
  const editId = editingId.value
  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    startDate: form.value.startDate,
    dueDate: form.value.dueDate,
  }

  showModal.value = false
  saving.value = true

  try {
    if (isEdit && editId) {
      await projectsStore.updateMilestone(editId, payload)
    } else {
      await projectsStore.addMilestone(props.projectId, {
        title: payload.title,
        description: payload.description,
        startDate: payload.startDate,
        dueDate: payload.dueDate,
      })
    }
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

function onToggleMilestone(ms: ProjectMilestone, event: MouseEvent) {
  const willComplete = !ms.completed
  if (willComplete) {
    const target = event.currentTarget ?? event.target
    burstConfettiFromElement(target)
  }
  void projectsStore.toggleMilestone(ms.id)
}

function creatorName(userId: string | null) {
  if (!userId) return 'Creador'
  return resolveUser(userId)?.name ?? 'Usuario'
}

function durationDays(ms: ProjectMilestone) {
  if (!ms.startDate || !ms.dueDate) return null
  const start = new Date(ms.startDate).getTime()
  const end = new Date(ms.dueDate).getTime()
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
  return days
}

function isOverdue(ms: ProjectMilestone) {
  if (ms.completed || !ms.dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(ms.dueDate) < today
}

function onCardClick(ms: ProjectMilestone) {
  activeMilestoneId.value = activeMilestoneId.value === ms.id ? null : ms.id
}

function dismissActions() {
  activeMilestoneId.value = null
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.ms-card') && !target.closest('.ms-timeline__node')) {
    dismissActions()
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="ms-page">
    <!-- Header -->
    <header class="ms-header">
      <div class="ms-header__text">
        <div class="ms-header__eyebrow">
          <Flag :size="14" />
          Objetivos del proyecto
        </div>
        <h2 class="ms-header__title">Hitos</h2>
        <p class="ms-header__sub">Marca cada objetivo al completarlo y celebra el progreso del equipo</p>
      </div>
      <button type="button" class="ms-header__cta" @click="openCreate">
        <Plus :size="18" />
        Nuevo hito
      </button>
    </header>

    <!-- Panel unificado: stats + progreso + lista -->
    <section class="ms-panel">
      <div class="ms-stats">
        <div class="ms-stat ms-stat--total">
          <div class="ms-stat__icon">
            <Target :size="20" />
          </div>
          <div>
            <p class="ms-stat__value">{{ milestones.length }}</p>
            <p class="ms-stat__label">Total hitos</p>
          </div>
        </div>

        <div class="ms-stat ms-stat--done">
          <div class="ms-stat__icon">
            <Check :size="20" :stroke-width="2.5" />
          </div>
          <div>
            <p class="ms-stat__value">{{ completedCount }}</p>
            <p class="ms-stat__label">Completados</p>
          </div>
        </div>

        <div class="ms-stat ms-stat--pending">
          <div class="ms-stat__icon">
            <Clock :size="20" />
          </div>
          <div>
            <p class="ms-stat__value">{{ pendingCount }}</p>
            <p class="ms-stat__label">Pendientes</p>
          </div>
        </div>

        <div class="ms-stat ms-stat--progress">
          <div class="ms-progress-ring" :style="{ '--pct': progress }">
            <svg viewBox="0 0 36 36">
              <circle class="ms-progress-ring__bg" cx="18" cy="18" r="15.5" />
              <circle class="ms-progress-ring__fill" cx="18" cy="18" r="15.5" />
            </svg>
            <span class="ms-progress-ring__text">{{ progress }}%</span>
          </div>
          <div>
            <p class="ms-stat__value">{{ progress }}%</p>
            <p class="ms-stat__label">Progreso</p>
          </div>
        </div>
      </div>

      <div v-if="milestones.length" class="ms-progress-bar">
        <div class="ms-progress-bar__header">
          <span class="ms-progress-bar__label">
            {{ completedCount }} de {{ milestones.length }} hitos alcanzados
          </span>
          <span class="ms-progress-bar__pct">{{ progress }}%</span>
        </div>
        <div class="ms-progress-bar__track">
          <div class="ms-progress-bar__fill" :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <div v-if="milestones.length" class="ms-timeline">
        <div
          v-for="(ms, i) in milestones"
          :key="ms.id"
          class="ms-timeline__row"
          :class="{
            'ms-timeline__row--done': ms.completed,
            'ms-timeline__row--overdue': isOverdue(ms),
          }"
        >
          <div class="ms-timeline__track">
            <div
              v-if="i < milestones.length - 1"
              class="ms-timeline__connector"
              :class="{ 'ms-timeline__connector--done': ms.completed }"
            />
            <button
              type="button"
              class="ms-timeline__node"
              :class="{
                'ms-timeline__node--done': ms.completed,
                'ms-timeline__node--overdue': isOverdue(ms),
              }"
              :title="ms.completed ? 'Marcar como pendiente' : '¡Marcar como completado!'"
              @click.stop="onToggleMilestone(ms, $event)"
            >
              <Check v-if="ms.completed" :size="17" :stroke-width="3" />
              <span v-else class="ms-timeline__node-num">{{ i + 1 }}</span>
            </button>
          </div>

          <article
            class="ms-card"
            :class="{
              'ms-card--done': ms.completed,
              'ms-card--overdue': isOverdue(ms),
              'ms-card--active': activeMilestoneId === ms.id,
            }"
            @click="onCardClick(ms)"
          >
            <div class="ms-card__accent" />

            <div class="ms-card__body">
              <div class="ms-card__content">
                <div class="ms-card__main">
                  <h3 class="ms-card__title">{{ ms.title }}</h3>
                  <span v-if="ms.completed" class="ms-card__badge ms-card__badge--done">
                    <PartyPopper :size="11" />
                    Completado
                  </span>
                  <span v-else-if="isOverdue(ms)" class="ms-card__badge ms-card__badge--overdue">
                    Vencido
                  </span>
                </div>
                <div class="ms-card__meta">
                  <span class="ms-card__chip">
                    <Calendar :size="13" />
                    {{ formatDate(ms.startDate) }} → {{ formatDate(ms.dueDate) }}
                  </span>
                  <span v-if="durationDays(ms)" class="ms-card__chip ms-card__chip--muted">
                    {{ durationDays(ms) }} {{ durationDays(ms) === 1 ? 'día' : 'días' }}
                  </span>
                  <p v-if="ms.description" class="ms-card__desc">{{ ms.description }}</p>
                </div>
              </div>

              <div v-if="ms.createdBy" class="ms-card__creator" :title="`Creado por ${creatorName(ms.createdBy)}`">
                <UserAvatar :user-id="ms.createdBy" size="sm" />
              </div>

              <div class="ms-card__actions" :class="{ 'ms-card__actions--visible': activeMilestoneId === ms.id }">
                <button
                  type="button"
                  class="ms-card__action"
                  title="Editar"
                  @click.stop="openEdit(ms)"
                >
                  <Pencil :size="15" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  class="ms-card__action ms-card__action--danger"
                  title="Eliminar"
                  @click.stop="projectsStore.deleteMilestone(ms.id)"
                >
                  <Trash2 :size="15" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-else class="ms-empty">
        <div class="ms-empty__icon">
          <Flag :size="28" />
        </div>
        <h3 class="ms-empty__title">Sin hitos definidos</h3>
        <p class="ms-empty__text">
          Los hitos marcan los objetivos clave del proyecto. Crea el primero para empezar a
          seguir el progreso.
        </p>
        <button type="button" class="ms-header__cta" @click="openCreate">
          <Plus :size="18" />
          Crear primer hito
        </button>
      </div>
    </section>

    <ProjectModal
      v-if="showModal"
      :title="editingId ? 'Editar hito' : 'Nuevo hito'"
      subtitle="Las fechas son obligatorias"
      @close="showModal = false"
    >
      <div class="app-window-form-row">
        <div class="app-window-form-span-full">
          <label class="project-create-modal__label">Título del hito *</label>
          <input v-model="form.title" class="project-create-modal__input" placeholder="Ej. Lanzamiento beta" />
        </div>
        <div class="app-window-form-span-full">
          <label class="project-create-modal__label">Descripción</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="project-create-modal__input resize-none"
            placeholder="Opcional"
          />
        </div>
        <DateInput v-model="form.startDate" label="Fecha inicio" required variant="modal" />
        <DateInput
          v-model="form.dueDate"
          label="Fecha vencimiento"
          required
          variant="modal"
          :min="form.startDate"
        />
        <p v-if="formError" class="app-window-form-span-full text-xs text-red-500">{{ formError }}</p>
      </div>
      <template #footer>
        <button type="button" class="btn-brand-ghost" @click="showModal = false">Cancelar</button>
        <button type="button" class="btn-brand" :disabled="saving" @click="save">
          {{ editingId ? 'Guardar' : 'Crear hito' }}
        </button>
      </template>
    </ProjectModal>
  </div>
</template>

<style scoped>
.ms-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Panel unificado ── */
.ms-panel {
  border-radius: 1rem;
  border: 1px solid rgb(0 0 0 / 6%);
  background: #fff;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgb(0 0 0 / 4%);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Header ── */
.ms-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.ms-header__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 999px;
  background: #eef6fc;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2d7eb8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ms-header__title {
  margin-top: 0.625rem;
  font-size: 1.75rem;
  font-weight: 800;
  color: #172b4d;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.ms-header__sub {
  margin-top: 0.375rem;
  max-width: 32rem;
  font-size: 0.9375rem;
  color: #626f86;
  line-height: 1.5;
}

.ms-header__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #0c66e4 0%, #2d7eb8 100%);
  padding: 0.625rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 4px 14px rgb(12 102 228 / 28%);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.ms-header__cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgb(12 102 228 / 35%);
}

/* ── Stats ── */
.ms-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .ms-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

.ms-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.875rem;
  border: 1px solid #eef0f3;
  background: #fafbfc;
  padding: 0.875rem 1rem;
  transition: background 0.15s ease;
}

.ms-stat:hover {
  background: #f4f5f7;
}

.ms-stat__icon {
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

.ms-stat--total .ms-stat__icon {
  background: #eef6fc;
  color: #2d7eb8;
}

.ms-stat--done .ms-stat__icon {
  background: #dcfce7;
  color: #16a34a;
}

.ms-stat--pending .ms-stat__icon {
  background: #fef3c7;
  color: #d97706;
}

.ms-stat--progress .ms-stat__icon {
  background: #ede9fe;
  color: #7c3aed;
}

.ms-stat__value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #172b4d;
  line-height: 1;
  letter-spacing: -0.03em;
}

.ms-stat__label {
  margin-top: 0.2rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #626f86;
}

/* Progress ring */
.ms-progress-ring {
  position: relative;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
}

.ms-progress-ring svg {
  transform: rotate(-90deg);
  height: 100%;
  width: 100%;
}

.ms-progress-ring__bg {
  fill: none;
  stroke: #ede9fe;
  stroke-width: 3;
}

.ms-progress-ring__fill {
  fill: none;
  stroke: #7c3aed;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 97.4;
  stroke-dashoffset: calc(97.4 - (97.4 * var(--pct, 0)) / 100);
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.ms-progress-ring__text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5625rem;
  font-weight: 800;
  color: #7c3aed;
}

/* ── Progress bar ── */
.ms-progress-bar {
  padding: 0 0.25rem;
}

.ms-progress-bar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.ms-progress-bar__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #626f86;
}

.ms-progress-bar__pct {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #16a34a;
}

.ms-progress-bar__track {
  height: 0.4375rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e8edf2;
}

.ms-progress-bar__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Timeline ── */
.ms-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid #eef0f3;
  padding-top: 1rem;
}

.ms-timeline__row {
  display: flex;
  gap: 0.875rem;
}

/* Track */
.ms-timeline__track {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 2.5rem;
  flex-shrink: 0;
  padding-top: 0.375rem;
}

.ms-timeline__connector {
  position: absolute;
  top: 2.75rem;
  bottom: -0.5rem;
  width: 2px;
  border-radius: 999px;
  background: #e2e8f0;
  transition: background 0.4s ease;
}

.ms-timeline__connector--done {
  background: linear-gradient(180deg, #22c55e, #86efac);
}

.ms-timeline__node {
  position: relative;
  z-index: 1;
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid #d1d9e6;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 4px rgb(15 23 42 / 6%);
  flex-shrink: 0;
}

.ms-timeline__node:hover {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgb(34 197 94 / 25%);
}

.ms-timeline__node--done {
  border-color: #16a34a;
  background: linear-gradient(145deg, #22c55e, #15803d);
  color: #fff;
  box-shadow: 0 4px 16px rgb(34 197 94 / 40%);
}

.ms-timeline__node--done:hover {
  background: linear-gradient(145deg, #16a34a, #166534);
  color: #fff;
}

.ms-timeline__node--overdue:not(.ms-timeline__node--done) {
  border-color: #fca5a5;
  color: #dc2626;
}

.ms-timeline__node-num {
  font-size: 0.8125rem;
  font-weight: 800;
}

/* Card */
.ms-card {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #e8edf2;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  box-shadow: 0 1px 3px rgb(15 23 42 / 5%);
  user-select: none;
}

.ms-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgb(15 23 42 / 8%);
}

.ms-card--active {
  border-color: #93c5fd;
  background: #f8fbff;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 12%), 0 2px 8px rgb(15 23 42 / 8%);
}

.ms-card__accent {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #5bbce4, #2d7eb8);
  border-radius: 4px 0 0 4px;
  transition: background 0.3s ease;
}

.ms-card--done .ms-card__accent {
  background: linear-gradient(180deg, #4ade80, #16a34a);
}

.ms-card--overdue:not(.ms-card--done) .ms-card__accent {
  background: linear-gradient(180deg, #f87171, #dc2626);
}

.ms-card--done {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #f0fdf4 0%, #fff 60%);
}

.ms-card--overdue:not(.ms-card--done) {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 60%);
}

.ms-card__body {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem 0.75rem 0.75rem;
}

.ms-card__content {
  flex: 1;
  min-width: 0;
}

.ms-card__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.ms-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #172b4d;
  line-height: 1.35;
}

.ms-card--done .ms-card__title {
  color: #166534;
}

.ms-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.ms-card__desc {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.ms-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 0.375rem;
  background: #f4f5f7;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #44546f;
  white-space: nowrap;
}

.ms-card--done .ms-card__chip {
  background: #dcfce7;
  color: #166534;
}

.ms-card__chip--muted {
  background: transparent;
  border: 1px solid #e8edf2;
  color: #94a3b8;
}

.ms-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.ms-card__badge--done {
  background: #dcfce7;
  color: #15803d;
}

.ms-card__badge--overdue {
  background: #fee2e2;
  color: #dc2626;
}

.ms-card__creator {
  flex-shrink: 0;
  align-self: flex-start;
}

.ms-card__actions {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}

.ms-card__actions--visible {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.ms-card__action {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #44546f;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.ms-card__action:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #172b4d;
}

.ms-card__action--danger {
  color: #dc2626;
  border-color: #fecaca;
}

.ms-card__action--danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}

/* ── Empty state ── */
.ms-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  text-align: center;
  border-top: 1px solid #eef0f3;
}

.ms-empty__icon {
  display: flex;
  height: 4.5rem;
  width: 4.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #eef6fc, #dbeafe);
  color: #2d7eb8;
  margin-bottom: 1.25rem;
}

.ms-empty__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #172b4d;
}

.ms-empty__text {
  margin-top: 0.5rem;
  max-width: 22rem;
  font-size: 0.9375rem;
  color: #626f86;
  line-height: 1.55;
}

.ms-empty .ms-header__cta {
  margin-top: 1.5rem;
}
</style>
