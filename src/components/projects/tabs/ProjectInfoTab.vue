<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Save, FileText, Calendar, DollarSign, Tag } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import type { ProjectStatus } from '@/types/projects'
import type { Priority } from '@/types'
import { PROJECT_STATUS_LABELS } from '@/utils/projectStats'
import { currencyLabel } from '@/utils/currency'
import CurrencyInput from '@/components/projects/shared/CurrencyInput.vue'
import DateInput from '@/components/projects/shared/DateInput.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
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
  { id: 'general' as const, label: 'General', icon: FileText },
  { id: 'fechas' as const, label: 'Fechas', icon: Calendar },
  { id: 'finanzas' as const, label: 'Finanzas', icon: DollarSign },
  { id: 'etiquetas' as const, label: 'Etiquetas', icon: Tag },
]

const inputClass = 'ql-input'

const workspaceMembers = computed(() => {
  const ws = quinlist.currentWorkspace
  if (!ws) return []
  return ws.members.map((m) => ({
    ...m,
    user: auth.getUserById(m.userId),
  }))
})

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
      tags: form.value.tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
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
  <div v-if="project" class="project-card overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebebed] px-6 py-4">
      <div>
        <h2 class="project-page-title text-xl">Información del proyecto</h2>
        <p class="project-page-sub">Edita los datos por sección</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="saved" class="text-sm text-[#2d7eb8]">Guardado correctamente</span>
        <span v-else-if="dirty" class="text-sm text-[#626f86]">Cambios sin guardar</span>
        <button
          type="button"
          class="ql-btn ql-btn--primary"
          :disabled="saving || !dirty"
          @click="save"
        >
          <Save :size="18" />
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <div class="flex min-h-[420px] flex-col md:flex-row">
      <nav class="flex shrink-0 gap-1 overflow-x-auto border-b border-[#ebebed] p-3 md:w-52 md:flex-col md:border-b-0 md:border-r">
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          class="project-nav-item"
          :class="{ 'project-nav-item--active': section === s.id }"
          @click="section = s.id"
        >
          <component :is="s.icon" :size="15" />
          {{ s.label }}
        </button>
      </nav>

      <!-- Contenido -->
      <form class="flex-1 p-6" @submit.prevent="save">
        <div v-if="section === 'general'" class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm text-[#44546f]">Nombre</label>
            <input v-model="form.name" type="text" :class="inputClass" required />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm text-[#44546f]">Descripción</label>
            <textarea v-model="form.description" rows="3" :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-[#44546f]">Cliente</label>
            <input v-model="form.client" type="text" :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-[#44546f]">Responsable</label>
            <select v-model="form.responsibleId" :class="inputClass">
              <option value="">Sin asignar</option>
              <option v-for="m in workspaceMembers" :key="m.userId" :value="m.userId">
                {{ m.user?.name ?? m.userId }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm text-[#44546f]">Categoría</label>
            <input v-model="form.category" type="text" :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-[#44546f]">Prioridad</label>
            <select v-model="form.priority" :class="inputClass">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm text-[#44546f]">Estado</label>
            <select v-model="form.status" :class="inputClass">
              <option v-for="(label, key) in PROJECT_STATUS_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>
        </div>

        <div v-else-if="section === 'fechas'" class="grid max-w-lg gap-4 sm:grid-cols-2">
          <DateInput v-model="form.startDate" label="Fecha de inicio" :default-today="false" />
          <DateInput v-model="form.dueDate" label="Fecha de finalización" :default-today="false" />
        </div>

        <div v-else-if="section === 'finanzas'" class="grid max-w-lg gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm text-[#44546f]">Presupuesto inicial</label>
            <CurrencyInput v-model="form.budget" :currency="project.currency" />
            <p class="mt-1 text-xs text-[#626f86]">{{ currencyLabel(project.currency) }}</p>
          </div>
          <div>
            <label class="mb-1 block text-sm text-[#44546f]">Meta rentabilidad (%)</label>
            <input
              v-model.number="form.profitabilityTarget"
              type="number"
              min="0"
              max="100"
              :class="inputClass"
            />
          </div>
        </div>

        <div v-else class="max-w-lg">
          <label class="mb-1 block text-sm text-[#44546f]">Etiquetas (separadas por coma)</label>
          <input v-model="form.tagsStr" type="text" :class="inputClass" placeholder="ux, mobile, q1" />
        </div>
      </form>
    </div>
  </div>
</template>
