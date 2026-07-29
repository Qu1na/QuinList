<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useProjectUsers } from '@/composables/useProjectUsers'
import BarChart from '@/components/charts/BarChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import {
  calcFinanceSummary,
  buildLedger,
  cashFlowByMonth,
  categoryBreakdown,
  formatMoney,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHOD_LABELS,
} from '@/utils/projectFinance'
import { formatDate } from '@/utils/permissions'
import { todayCalendarDate } from '@/utils/datetime'
import { DEFAULT_CURRENCY } from '@/utils/currency'
import CurrencyInput from '@/components/projects/shared/CurrencyInput.vue'
import DateInput from '@/components/projects/shared/DateInput.vue'
import AppWindow from '@/components/ui/AppWindow.vue'
import type { TransactionType, PaymentMethod } from '@/types/projects'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()

const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const fmt = (amount: number) => formatMoney(amount, currency.value)
const transactions = computed(() => projectsStore.getProjectTransactions(props.projectId))
const finance = computed(() =>
  project.value ? calcFinanceSummary(project.value, transactions.value) : null,
)
const ledger = computed(() =>
  project.value ? [...buildLedger(project.value, transactions.value)].reverse() : [],
)
const cashFlow = computed(() => cashFlowByMonth(transactions.value))
const expenseCategories = computed(() => categoryBreakdown(transactions.value, 'expense'))
const incomeCategories = computed(() => categoryBreakdown(transactions.value, 'income'))

const showAdd = ref(false)
const txType = ref<TransactionType>('expense')
const typeFilter = ref<'all' | TransactionType>('all')
const search = ref('')
const editingBudget = ref(false)
const budgetInput = ref(0)
const profitabilityInput = ref<number | ''>('')

const txForm = ref({
  title: '',
  amount: 0,
  category: '',
  paymentMethod: 'transfer' as PaymentMethod,
  reference: '',
  notes: '',
  date: todayCalendarDate(),
})

const inputClass = 'ql-input'

const cashFlowChart = computed(() =>
  cashFlow.value.map((m) => ({
    label: m.label,
    value: m.net,
    color: m.net >= 0 ? '#5bbce4' : '#f4845f',
  })),
)

const expenseDonut = computed(() =>
  expenseCategories.value.slice(0, 5).map((c, i) => ({
    label: c.category,
    value: c.amount,
    color: ['#5bbce4', '#6554c0', '#f4845f', '#10b981', '#2d7eb8'][i % 5]!,
  })),
)

const filteredLedger = computed(() => {
  const q = search.value.trim().toLowerCase()
  return ledger.value.filter((t) => {
    if (typeFilter.value !== 'all' && t.type !== typeFilter.value) return false
    if (!q) return true
    return (
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q)
    )
  })
})

function openAdd(type: TransactionType) {
  txType.value = type
  txForm.value = {
    title: '',
    amount: 0,
    category: TRANSACTION_CATEGORIES[type][0]!,
    paymentMethod: 'transfer',
    reference: '',
    notes: '',
    date: todayCalendarDate(),
  }
  showAdd.value = true
}

async function saveTransaction() {
  if (!txForm.value.title.trim() || txForm.value.amount <= 0) return
  const payload = { type: txType.value, ...txForm.value }
  showAdd.value = false
  try {
    await projectsStore.addTransaction(props.projectId, payload)
  } catch (err) {
    console.error(err)
  }
}

function startEditBudget() {
  if (!project.value) return
  budgetInput.value = project.value.budget
  profitabilityInput.value = project.value.profitabilityTarget ?? ''
  editingBudget.value = true
}

async function saveBudget() {
  await projectsStore.updateProject(props.projectId, {
    budget: budgetInput.value,
    profitabilityTarget: typeof profitabilityInput.value === 'number' ? profitabilityInput.value : null,
  })
  editingBudget.value = false
}

function userName(id: string | null) {
  if (!id) return '—'
  return resolveUser(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div v-if="project && finance" class="space-y-7">
    <div>
      <h2 class="project-page-title">Finanzas</h2>
      <p class="project-page-sub">Cuenta del proyecto, flujo de caja y libro mayor</p>
    </div>

    <div class="finance-hero">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="finance-hero__label">Cuenta del proyecto</p>
          <h3 class="mt-1 text-2xl font-bold">{{ project.name }}</h3>
          <p class="mt-1 text-sm text-white/80">{{ project.client || 'Sin cliente' }}</p>
        </div>
        <Wallet :size="44" class="opacity-30" />
      </div>
      <div class="mt-6 grid gap-6 sm:grid-cols-3">
        <div>
          <p class="finance-hero__label">Saldo disponible</p>
          <p class="finance-hero__value">{{ fmt(finance.balance) }}</p>
        </div>
        <div>
          <p class="finance-hero__label">Presupuesto base</p>
          <p class="text-xl font-semibold">{{ fmt(finance.budget) }}</p>
        </div>
        <div>
          <p class="finance-hero__label">Flujo neto</p>
          <p class="text-xl font-semibold">
            {{ finance.netFlow >= 0 ? '+' : '' }}{{ fmt(finance.netFlow) }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="project-card project-kpi">
        <div class="mb-2 flex items-center gap-2 text-[#5bbce4]">
          <ArrowDownLeft :size="20" />
          <span class="project-kpi__label">Ingresos</span>
        </div>
        <p class="project-kpi__value">{{ fmt(finance.income) }}</p>
        <p class="text-sm text-[#626f86]">{{ transactions.filter((t) => t.type === 'income').length }} movimientos</p>
      </div>
      <div class="project-card project-kpi">
        <div class="mb-2 flex items-center gap-2 text-[#f4845f]">
          <ArrowUpRight :size="20" />
          <span class="project-kpi__label">Egresos</span>
        </div>
        <p class="project-kpi__value">{{ fmt(finance.expenses) }}</p>
        <p class="text-sm text-[#626f86]">{{ transactions.filter((t) => t.type === 'expense').length }} movimientos</p>
      </div>
      <div class="project-card project-kpi">
        <div class="mb-2 flex items-center gap-2 text-[#2d7eb8]">
          <PiggyBank :size="20" />
          <span class="project-kpi__label">Consumo presupuesto</span>
        </div>
        <p class="project-kpi__value">{{ finance.usagePercent }}%</p>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-[#ebebed]">
          <div
            class="h-full rounded-full"
            :class="finance.usagePercent >= 90 ? 'bg-[#f4845f]' : 'bg-[#5bbce4]'"
            :style="{ width: `${Math.min(100, finance.usagePercent)}%` }"
          />
        </div>
      </div>
      <div class="project-card project-kpi">
        <div class="mb-2 flex items-center gap-2 text-[#6554c0]">
          <TrendingUp :size="20" />
          <span class="project-kpi__label">Rentabilidad</span>
        </div>
        <p class="project-kpi__value">{{ finance.profitability != null ? `${finance.profitability}%` : '—' }}</p>
        <p v-if="project.profitabilityTarget" class="text-sm text-[#626f86]">Meta: {{ project.profitabilityTarget }}%</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <button type="button" class="ql-btn ql-btn--ghost" @click="openAdd('income')">
          <ArrowDownLeft :size="18" />
          Registrar ingreso
        </button>
        <button type="button" class="ql-btn ql-btn--ghost" @click="openAdd('expense')">
          <ArrowUpRight :size="18" />
          Registrar egreso
        </button>
      </div>
      <button type="button" class="project-link-btn" @click="startEditBudget">Ajustar presupuesto base</button>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <div class="project-card project-card--lg">
        <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
          <TrendingDown :size="20" class="text-[#5bbce4]" />
          Flujo de caja mensual
        </h3>
        <BarChart v-if="cashFlowChart.length" :items="cashFlowChart" unit="" />
        <p v-else class="text-sm text-[#626f86]">Sin movimientos para graficar.</p>
      </div>
      <div class="project-card project-card--lg">
        <h3 class="mb-4 text-base font-semibold text-[#172b4d]">Egresos por categoría</h3>
        <DonutChart v-if="expenseDonut.length" :segments="expenseDonut" :size="160" />
        <ul v-if="expenseCategories.length" class="mt-4 space-y-2">
          <li v-for="cat in expenseCategories.slice(0, 5)" :key="cat.category" class="flex justify-between text-sm">
            <span class="text-[#44546f]">{{ cat.category }}</span>
            <span class="font-medium text-[#172b4d]">{{ fmt(cat.amount) }} ({{ cat.percent }}%)</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">Sin egresos registrados.</p>
      </div>
    </div>

    <div class="project-card project-card--lg">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="flex items-center gap-2 text-base font-semibold text-[#172b4d]">
          <Receipt :size="20" />
          Libro mayor
        </h3>
        <div class="flex flex-wrap gap-2">
          <select v-model="typeFilter" class="ql-input w-auto min-w-[140px] py-2">
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Egresos</option>
          </select>
          <input v-model="search" type="text" placeholder="Buscar..." class="ql-input w-auto min-w-[180px] py-2" />
        </div>
      </div>

      <div class="ql-table-wrap overflow-x-auto">
        <table class="ql-table min-w-[700px]">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Método</th>
              <th>Referencia</th>
              <th class="text-right">Monto</th>
              <th class="text-right">Saldo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in filteredLedger" :key="tx.id">
              <td class="text-[#626f86]">{{ formatDate(tx.date) }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-[#091e420f] text-[#44546f]"
                  >
                    <ArrowDownLeft v-if="tx.type === 'income'" :size="12" />
                    <ArrowUpRight v-else :size="12" />
                  </span>
                  <div>
                    <p class="font-medium text-[#172b4d]">{{ tx.title }}</p>
                    <p v-if="tx.notes" class="text-xs text-[#626f86]">{{ tx.notes }}</p>
                  </div>
                </div>
              </td>
              <td class="text-[#626f86]">{{ tx.category }}</td>
              <td class="text-[#626f86]">{{ PAYMENT_METHOD_LABELS[tx.paymentMethod] }}</td>
              <td class="font-mono text-xs text-[#626f86]">{{ tx.reference || '—' }}</td>
              <td class="text-right font-semibold text-[#172b4d]">
                {{ tx.type === 'income' ? '+' : '-' }}{{ fmt(tx.amount) }}
              </td>
              <td class="text-right font-medium text-[#172b4d]">{{ fmt(tx.runningBalance) }}</td>
              <td>
                <button type="button" class="text-sm text-red-500 hover:underline" @click="projectsStore.deleteTransaction(tx.id)">×</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!filteredLedger.length" class="py-8 text-center text-sm text-[#626f86]">
        No hay movimientos. Registra un ingreso o egreso para comenzar.
      </p>
    </div>

    <!-- Modal ingreso/egreso -->
    <Teleport to="body">
      <div
        v-if="showAdd"
        class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
        @click.self="showAdd = false"
      >
        <AppWindow
          :title="txType === 'income' ? 'Registrar ingreso' : 'Registrar egreso'"
          :subtitle="txType === 'income' ? 'Entrada de dinero' : 'Salida de dinero'"
          class="app-window--wide"
          @close="showAdd = false"
        >
          <div class="app-window-form-row app-window-form-row--2">
            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Concepto *</label>
              <input v-model="txForm.title" class="project-create-modal__input" placeholder="Descripción del movimiento" />
            </div>
            <div>
              <label class="project-create-modal__label">Monto *</label>
              <CurrencyInput v-model="txForm.amount" :currency="currency" />
            </div>
            <div>
              <label class="project-create-modal__label">Fecha</label>
              <DateInput v-model="txForm.date" label="Fecha" />
            </div>
            <div>
              <label class="project-create-modal__label">Categoría</label>
              <select v-model="txForm.category" class="project-create-modal__input">
                <option v-for="cat in TRANSACTION_CATEGORIES[txType]" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div>
              <label class="project-create-modal__label">Método de pago</label>
              <select v-model="txForm.paymentMethod" class="project-create-modal__input">
                <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Referencia / No. comprobante</label>
              <input v-model="txForm.reference" class="project-create-modal__input" placeholder="TRF-001, INV-123..." />
            </div>
            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Notas</label>
              <textarea v-model="txForm.notes" rows="2" class="project-create-modal__input resize-none" />
            </div>
          </div>
          <template #footer>
            <div class="app-window-footer-actions">
              <button type="button" class="btn-brand-ghost" @click="showAdd = false">Cancelar</button>
              <button type="button" class="btn-brand" @click="saveTransaction">
                Registrar {{ txType === 'income' ? 'ingreso' : 'egreso' }}
              </button>
            </div>
          </template>
        </AppWindow>
      </div>

      <div
        v-if="editingBudget"
        class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
        @click.self="editingBudget = false"
      >
        <AppWindow
          title="Ajustar presupuesto base"
          subtitle="Configuración financiera"
          class="app-window--md"
          @close="editingBudget = false"
        >
          <p class="mb-3 text-sm text-[#626f86]">
            El presupuesto base es el monto inicial asignado al proyecto. Los ingresos y egresos modifican el saldo disponible.
          </p>
          <div class="app-window-form-row">
            <div>
              <label class="project-create-modal__label">Presupuesto base *</label>
              <CurrencyInput v-model="budgetInput" :currency="currency" />
            </div>
            <div>
              <label class="project-create-modal__label">Meta de rentabilidad (%)</label>
              <input v-model.number="profitabilityInput" type="number" min="0" max="100" class="project-create-modal__input" />
            </div>
          </div>
          <template #footer>
            <div class="app-window-footer-actions">
              <button type="button" class="btn-brand-ghost" @click="editingBudget = false">Cancelar</button>
              <button type="button" class="btn-brand" @click="saveBudget">Guardar</button>
            </div>
          </template>
        </AppWindow>
      </div>
    </Teleport>
  </div>
</template>
