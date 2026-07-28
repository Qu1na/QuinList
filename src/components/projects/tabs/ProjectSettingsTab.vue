<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useUiStore } from '@/stores/ui'
import { CURRENCIES, currencyLabel, formatMoney } from '@/utils/currency'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const ui = useUiStore()
const router = useRouter()

const project = computed(() => projectsStore.getProject(props.projectId))
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
  router.push('/projects')
}
</script>

<template>
  <div v-if="project" class="space-y-6">
    <div class="rounded-xl border border-[#091e4214] bg-white p-6">
      <h2 class="mb-1 text-lg font-semibold text-[#172b4d]">Configuración del proyecto</h2>
      <p class="mb-6 text-sm text-[#626f86]">Preferencias generales y parámetros financieros.</p>

      <div class="space-y-6">
        <section>
          <h3 class="mb-3 text-sm font-medium text-[#172b4d]">Moneda del proyecto</h3>
          <p class="mb-3 text-sm text-[#626f86]">
            Todos los montos financieros se mostrarán en esta moneda. Por defecto: peso colombiano (COP).
          </p>
          <div class="flex flex-wrap items-end gap-3">
            <div class="min-w-[240px]">
              <label class="mb-1 block text-xs text-[#626f86]">Moneda</label>
              <select
                v-model="selectedCurrency"
                class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4]"
              >
                <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
                  {{ c.label }}
                </option>
              </select>
            </div>
            <button
              class="rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc] disabled:opacity-50"
              :disabled="savingCurrency || selectedCurrency === project.currency"
              @click="saveCurrency"
            >
              Guardar moneda
            </button>
          </div>
          <p class="mt-2 text-xs text-[#626f86]">
            Actual: <strong>{{ currencyLabel(project.currency) }}</strong>
            · Ejemplo: {{ formatMoney(1500000, project.currency) }}
          </p>
        </section>

        <section class="border-t border-[#091e4214] pt-6">
          <h3 class="mb-3 text-sm font-medium text-[#172b4d]">Rentabilidad objetivo</h3>
          <input
            type="number"
            :value="project.profitabilityTarget ?? ''"
            class="w-full max-w-xs rounded-lg border border-[#091e4229] px-3 py-2 text-sm"
            placeholder="Opcional (%)"
            @change="
              projectsStore.updateProject(projectId, {
                profitabilityTarget: parseFloat(($event.target as HTMLInputElement).value) || null,
              })
            "
          />
        </section>
      </div>
    </div>

    <div class="rounded-xl border border-[#091e4214] bg-white p-6">
      <h3 class="mb-2 text-sm font-medium text-[#44546f]">Zona de peligro</h3>
      <p class="mb-3 text-sm text-[#626f86]">Eliminar el proyecto y todos sus datos asociados.</p>
      <button
        class="rounded-lg border border-[#091e4229] px-4 py-2 text-sm text-[#44546f] hover:bg-[#091e420a]"
        @click="deleteProject"
      >
        Eliminar proyecto
      </button>
    </div>
  </div>
</template>
