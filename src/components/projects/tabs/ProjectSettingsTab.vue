<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, AlertTriangle, HeartPulse } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useUiStore } from '@/stores/ui'
import ShareProjectPanel from '@/components/projects/shared/ShareProjectPanel.vue'
import { CURRENCIES, currencyLabel, formatMoney } from '@/utils/currency'
import { useProjectHealthConfig } from '@/composables/useProjectHealthConfig'
import { isProjectFinanceEnabled } from '@/utils/projectFinance'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const ui = useUiStore()
const router = useRouter()

const project = computed(() => projectsStore.getProject(props.projectId))
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))

const healthCounts = computed(() => ({
  tasks: tasks.value.length,
  milestones: milestones.value.length,
}))

const { factorOptions, setFactor, resetToDefaults } = useProjectHealthConfig(
  computed(() => props.projectId),
  project,
  healthCounts,
)

const financeEnabled = computed(() => (project.value ? isProjectFinanceEnabled(project.value) : false))
const selectedCurrency = ref('')
const savingCurrency = ref(false)

function loadCurrency() {
  selectedCurrency.value = project.value?.currency ?? 'COP'
}

loadCurrency()

async function saveCurrency() {
  if (!selectedCurrency.value) return
  savingCurrency.value = true
  try {
    await projectsStore.updateProject(props.projectId, { currency: selectedCurrency.value })
  } finally {
    savingCurrency.value = false
  }
}

async function deleteProject() {
  const ok = await ui.confirm({
    title: 'Eliminar proyecto',
    message: `¿Eliminar «${project.value?.name}»? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    variant: 'danger',
  })
  if (!ok) return
  await projectsStore.deleteProject(props.projectId)
  router.push('/app/projects')
}
</script>

<template>
  <div v-if="project" class="space-y-7">
    <div>
      <h2 class="project-page-title">Configuración</h2>
      <p class="project-page-sub">Preferencias, compartir y parámetros del proyecto</p>
    </div>

    <ShareProjectPanel :project-id="projectId" />

    <div class="project-card project-card--lg">
      <h3 class="mb-1 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
        <Settings :size="20" class="text-[#5bbce4]" />
        Configuración del proyecto
      </h3>
      <p class="mb-6 text-sm text-[#626f86]">Preferencias generales y parámetros financieros.</p>

      <div class="space-y-8">
        <section>
          <h4 class="mb-2 text-sm font-semibold text-[#172b4d]">Moneda del proyecto</h4>
          <p class="mb-4 text-sm text-[#626f86]">
            Todos los montos financieros se mostrarán en esta moneda. Por defecto: peso colombiano (COP).
          </p>
          <div class="flex flex-wrap items-end gap-3">
            <label class="min-w-[240px] flex-1 text-sm">
              <span class="mb-1.5 block font-medium text-[#44546f]">Moneda</span>
              <select v-model="selectedCurrency" class="ql-input">
                <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
                  {{ c.label }}
                </option>
              </select>
            </label>
            <button
              type="button"
              class="ql-btn ql-btn--primary"
              :disabled="savingCurrency || selectedCurrency === project.currency"
              @click="saveCurrency"
            >
              Guardar moneda
            </button>
          </div>
          <p class="mt-3 text-sm text-[#626f86]">
            Actual: <strong class="text-[#172b4d]">{{ currencyLabel(project.currency) }}</strong>
            · Ejemplo: {{ formatMoney(1500000, project.currency) }}
          </p>
        </section>

        <section class="border-t border-[#ebebed] pt-8">
          <h4 class="mb-2 text-sm font-semibold text-[#172b4d]">Rentabilidad objetivo</h4>
          <p v-if="!financeEnabled" class="mb-3 text-sm text-amber-700">
            El módulo de finanzas no está activo en este proyecto. Configura un presupuesto en Información para habilitarlo.
          </p>
          <p v-else class="mb-3 text-sm text-[#626f86]">Porcentaje de rentabilidad esperado para el proyecto.</p>
          <input
            type="number"
            :value="project.profitabilityTarget ?? ''"
            class="ql-input max-w-xs"
            placeholder="Opcional (%)"
            :disabled="!financeEnabled"
            @change="
              projectsStore.updateProject(projectId, {
                profitabilityTarget: parseFloat(($event.target as HTMLInputElement).value) || null,
              })
            "
          />
        </section>

        <section class="border-t border-[#ebebed] pt-8">
          <h4 class="mb-2 flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
            <HeartPulse :size="16" class="text-[#f4845f]" />
            Salud del proyecto
          </h4>
          <p class="mb-4 text-sm text-[#626f86]">
            Elige qué factores influyen en el indicador de salud. Solo aparecen los módulos activos en este proyecto.
          </p>
          <div class="space-y-2">
            <label
              v-for="opt in factorOptions"
              :key="opt.id"
              class="flex items-start gap-3 rounded-lg border border-[#ebebed] px-3 py-2.5"
              :class="opt.available ? 'bg-white' : 'bg-[#fafafa] opacity-70'"
            >
              <input
                type="checkbox"
                class="mt-0.5 rounded border-[#c7c7cc]"
                :checked="opt.enabled"
                :disabled="!opt.available"
                @change="setFactor(opt.id, ($event.target as HTMLInputElement).checked)"
              />
              <span class="min-w-0">
                <span class="block text-sm font-medium text-[#172b4d]">{{ opt.label }}</span>
                <span v-if="opt.unavailableReason" class="mt-0.5 block text-xs text-[#626f86]">
                  {{ opt.unavailableReason }}
                </span>
              </span>
            </label>
          </div>
          <button type="button" class="ql-btn ql-btn--ghost mt-3 text-sm" @click="resetToDefaults">
            Restaurar valores sugeridos
          </button>
        </section>
      </div>
    </div>

    <div class="project-card project-card--lg border-red-100">
      <h3 class="mb-2 flex items-center gap-2 text-base font-semibold text-red-700">
        <AlertTriangle :size="20" />
        Zona de peligro
      </h3>
      <p class="mb-4 text-sm text-[#626f86]">
        Eliminar el proyecto y todos sus datos asociados. Esta acción no se puede deshacer.
      </p>
      <button type="button" class="ql-btn ql-btn--ghost text-red-600 hover:bg-red-50" @click="deleteProject">
        Eliminar proyecto
      </button>
    </div>
  </div>
</template>
