<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Save, FileText, Calendar, DollarSign, Tag, User, Building2 } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { useQuinListStore } from '@/stores/quinlist'
import type { ProjectStatus } from '@/types/projects'
import type { Priority } from '@/types'
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '@/utils/projectStats'
import { currencyLabel, formatMoney } from '@/utils/currency'
import ProjectStatusBadge from '@/components/projects/shared/ProjectStatusBadge.vue'
import CurrencyInput from '@/components/projects/shared/CurrencyInput.vue'
import DateInput from '@/components/projects/shared/DateInput.vue'
import { formatDate } from '@/utils/permissions'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()
const quinlist = useQuinListStore()

const section = ref<'general' | 'fechas' | 'finanzas' | 'etiquetas'>('general')
const saving = ref(false)
const saved = ref(false)
const dirty = ref(false)

const project = computed(() => projectsStore.getProject(props.projectId))

const form = ref({
  name: '',
  description: '',
  client: '',
  responsibleId: '',
  priority: 'media' as Priority,
  status: 'planning' as ProjectStatus,
  category: '',
  tagsStr: '',
  budget: 0,
  profitabilityTarget: '' as number | '',
  startDate: '',
  dueDate: '',
})

const sections = [
  { id: 'general' as const, label: 'General', desc: 'Nombre, cliente y responsable', icon: FileText },
  { id: 'fechas' as const, label: 'Fechas', desc: 'Inicio y fin del proyecto', icon: Calendar },
  { id: 'finanzas' as const, label: 'Finanzas', desc: 'Presupuesto y rentabilidad', icon: DollarSign },
  { id: 'etiquetas' as const, label: 'Etiquetas', desc: 'Clasificación y tags', icon: Tag },
]

const workspaceMembers = computed(() => {
  const ws = quinlist.currentWorkspace
  if (!ws) return []
  return ws.members.map((m) => ({
    ...m,
    user: resolveUser(m.userId),
  }))
})

const responsibleName = computed(() => {
  if (!form.value.responsibleId) return 'Sin asignar'
  return resolveUser(form.value.responsibleId)?.name ?? 'Usuario'
})

const tags = computed(() =>
  form.value.tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
)

function loadForm() {
  const p = project.value
  if (!p) return
  form.value = {
    name: p.name,
    description: p.description,
    client: p.client,
    responsibleId: p.responsibleId ?? '',
    priority: p.priority,
    status: p.status,
    category: p.category,
    tagsStr: p.tags.join(', '),
    budget: p.budget,
    profitabilityTarget: p.profitabilityTarget ?? '',
    startDate: p.startDate ?? '',
    dueDate: p.dueDate ?? '',
  }
  dirty.value = false
}

watch(() => props.projectId, loadForm, { immediate: true })
watch(form, () => { dirty.value = true }, { deep: true })

async function save() {
  if (!project.value) return
  saving.value = true
  saved.value = false
  try {
    await projectsStore.updateProject(props.projectId, {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      client: form.value.client.trim(),
      responsibleId: form.value.responsibleId || null,
      priority: form.value.priority,
      status: form.value.status,
      category: form.value.category.trim(),
      tags: tags.value,
      budget: form.value.budget,
      profitabilityTarget:
        typeof form.value.profitabilityTarget === 'number' ? form.value.profitabilityTarget : null,
      startDate: form.value.startDate || null,
      dueDate: form.value.dueDate || null,
    })
    saved.value = true
    dirty.value = false
    setTimeout(() => { saved.value = false }, 2500)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="project" class="info-page">
    <!-- Hero resumen -->
    <div class="info-hero">
      <div class="info-hero__main">
        <p class="info-hero__eyebrow">Información del proyecto</p>
        <h2 class="info-hero__title">{{ form.name || project.name }}</h2>
        <p v-if="form.description" class="info-hero__desc">{{ form.description }}</p>
        <div class="info-hero__chips">
          <ProjectStatusBadge :status="form.status" />
          <span v-if="form.category" class="info-chip">{{ form.category }}</span>
          <span class="info-chip info-chip--priority">{{ PRIORITY_LABELS[form.priority] }} prioridad</span>
        </div>
      </div>
      <div class="info-hero__stats">
        <div v-if="form.client" class="info-stat">
          <Building2 :size="16" class="text-[#5bbce4]" />
          <div>
            <p class="info-stat__label">Cliente</p>
            <p class="info-stat__value">{{ form.client }}</p>
          </div>
        </div>
        <div class="info-stat">
          <User :size="16" class="text-[#6554c0]" />
          <div>
            <p class="info-stat__label">Responsable</p>
            <p class="info-stat__value">{{ responsibleName }}</p>
          </div>
        </div>
        <div v-if="form.startDate || form.dueDate" class="info-stat">
          <Calendar :size="16" class="text-[#f4845f]" />
          <div>
            <p class="info-stat__label">Plazo</p>
            <p class="info-stat__value">
              {{ formatDate(form.startDate) }} — {{ formatDate(form.dueDate) }}
            </p>
          </div>
        </div>
        <div v-if="form.budget > 0" class="info-stat">
          <DollarSign :size="16" class="text-[#10b981]" />
          <div>
            <p class="info-stat__label">Presupuesto</p>
            <p class="info-stat__value">{{ formatMoney(form.budget, project.currency) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor -->
    <div class="info-editor">
      <div class="info-editor__header">
        <p class="info-editor__title">Editar información</p>
        <div class="flex items-center gap-2">
          <span v-if="saved" class="text-sm font-medium text-[#10b981]">✓ Guardado</span>
          <span v-else-if="dirty" class="text-sm text-[#626f86]">Cambios sin guardar</span>
          <button type="button" class="btn-brand" :disabled="saving || !dirty" @click="save">
            <Save :size="16" />
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>

      <div class="info-editor__body">
        <nav class="info-nav">
          <button
            v-for="s in sections"
            :key="s.id"
            type="button"
            class="info-nav__item"
            :class="{ 'info-nav__item--active': section === s.id }"
            @click="section = s.id"
          >
            <component :is="s.icon" :size="16" />
            <div class="min-w-0 text-left">
              <p class="info-nav__label">{{ s.label }}</p>
              <p class="info-nav__desc">{{ s.desc }}</p>
            </div>
          </button>
        </nav>

        <form class="info-form" @submit.prevent="save">
          <div v-if="section === 'general'" class="app-window-form-row app-window-form-row--2">
            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Nombre del proyecto *</label>
              <input v-model="form.name" type="text" class="project-create-modal__input" required />
            </div>
            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Descripción</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="project-create-modal__input resize-none"
                placeholder="Describe el alcance y objetivos..."
              />
            </div>
            <div>
              <label class="project-create-modal__label">Cliente</label>
              <input v-model="form.client" type="text" class="project-create-modal__input" placeholder="Nombre del cliente" />
            </div>
            <div>
              <label class="project-create-modal__label">Responsable</label>
              <select v-model="form.responsibleId" class="project-create-modal__input">
                <option value="">Sin asignar</option>
                <option v-for="m in workspaceMembers" :key="m.userId" :value="m.userId">
                  {{ m.user?.name ?? m.userId }}
                </option>
              </select>
            </div>
            <div>
              <label class="project-create-modal__label">Categoría</label>
              <input v-model="form.category" type="text" class="project-create-modal__input" placeholder="Desarrollo, producto..." />
            </div>
            <div>
              <label class="project-create-modal__label">Prioridad</label>
              <select v-model="form.priority" class="project-create-modal__input">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Estado del proyecto</label>
              <select v-model="form.status" class="project-create-modal__input">
                <option v-for="(label, key) in PROJECT_STATUS_LABELS" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div v-else-if="section === 'fechas'" class="app-window-form-row app-window-form-row--2 max-w-lg">
            <DateInput v-model="form.startDate" label="Fecha de inicio" variant="modal" :default-today="false" />
            <DateInput
              v-model="form.dueDate"
              label="Fecha de finalización"
              variant="modal"
              :default-today="false"
              :min="form.startDate || undefined"
            />
          </div>

          <div v-else-if="section === 'finanzas'" class="app-window-form-row app-window-form-row--2 max-w-lg">
            <div>
              <label class="project-create-modal__label">Presupuesto inicial</label>
              <CurrencyInput v-model="form.budget" :currency="project.currency" />
              <p class="mt-1 text-xs text-[#626f86]">{{ currencyLabel(project.currency) }}</p>
            </div>
            <div>
              <label class="project-create-modal__label">Meta de rentabilidad (%)</label>
              <input
                v-model.number="form.profitabilityTarget"
                type="number"
                min="0"
                max="100"
                class="project-create-modal__input"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div v-else class="max-w-lg space-y-3">
            <div>
              <label class="project-create-modal__label">Etiquetas (separadas por coma)</label>
              <input
                v-model="form.tagsStr"
                type="text"
                class="project-create-modal__input"
                placeholder="ux, mobile, q1"
              />
            </div>
            <div v-if="tags.length" class="flex flex-wrap gap-2">
              <span v-for="tag in tags" :key="tag" class="info-tag">{{ tag }}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-hero {
  border-radius: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.info-hero__eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8e8e93;
}

.info-hero__title {
  margin-top: 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #172b4d;
  letter-spacing: -0.02em;
}

.info-hero__desc {
  margin-top: 0.5rem;
  max-width: 40rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #626f86;
}

.info-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.info-chip {
  border-radius: 999px;
  background: #f5f5f7;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #44546f;
}

.info-chip--priority {
  background: #fef3ef;
  color: #e8754f;
}

.info-hero__stats {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
}

.info-stat {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  border-radius: 0.75rem;
  border: 1px solid #091e4214;
  background: #fafafa;
  padding: 0.75rem;
}

.info-stat__label {
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8e8e93;
}

.info-stat__value {
  margin-top: 0.1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #172b4d;
}

.info-editor {
  border-radius: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.info-editor__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid #ebebed;
  padding: 1rem 1.5rem;
}

.info-editor__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #172b4d;
}

.info-editor__body {
  display: flex;
  flex-direction: column;
  min-height: 22rem;
}

@media (min-width: 768px) {
  .info-editor__body {
    flex-direction: row;
  }
}

.info-nav {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  border-bottom: 1px solid #ebebed;
  padding: 0.75rem;
}

@media (min-width: 768px) {
  .info-nav {
    width: 14rem;
    flex-shrink: 0;
    flex-direction: column;
    border-bottom: none;
    border-right: 1px solid #ebebed;
    overflow-x: visible;
  }
}

.info-nav__item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  padding: 0.65rem 0.75rem;
  color: #626f86;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .info-nav__item {
    white-space: normal;
  }
}

.info-nav__item:hover {
  background: #f5f5f7;
}

.info-nav__item--active {
  background: #eef6fc;
  color: #2d7eb8;
}

.info-nav__label {
  font-size: 0.875rem;
  font-weight: 600;
}

.info-nav__desc {
  font-size: 0.6875rem;
  color: #8e8e93;
  margin-top: 0.1rem;
}

.info-nav__item--active .info-nav__desc {
  color: #5bbce4;
}

.info-form {
  flex: 1;
  padding: 1.5rem;
}

.info-tag {
  border-radius: 999px;
  background: #eef6fc;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #2d7eb8;
}
</style>
