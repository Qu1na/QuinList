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
  Filter,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
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
import { DEFAULT_CURRENCY } from '@/utils/currency'
import CurrencyInput from '@/components/projects/shared/CurrencyInput.vue'
import DateInput from '@/components/projects/shared/DateInput.vue'
import type { TransactionType, PaymentMethod } from '@/types/projects'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()

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
  date: new Date().toISOString().split('T')[0]!,
})

const inputClass = 'w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]'

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

const cashFlowChart = computed(() =>
  cashFlow.value.map((m) => ({
    label: m.label,
    value: m.net,
    color: m.net >= 0 ? '#0c66e4' : '#626f86',
  })),
)

const expenseDonut = computed(() =>
  expenseCategories.value.slice(0, 5).map((c, i) => ({
    label: c.category,
    value: c.amount,
    color: ['#0c66e4', '#6554c0', '#e56910', '#61bd4f', '#cd5a91'][i % 5]!,
  })),
)

function openAdd(type: TransactionType) {
  txType.value = type
  txForm.value = {
    title: '',
    amount: 0,
    category: TRANSACTION_CATEGORIES[type][0]!,
    paymentMethod: 'transfer',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]!,
  }
  showAdd.value = true
}

async function saveTransaction() {
  if (!txForm.value.title.trim() || txForm.value.amount <= 0) return
  await projectsStore.addTransaction(props.projectId, {
    type: txType.value,
    ...txForm.value,
  })
  showAdd.value = false
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
  return auth.getUserById(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div v-if="project && finance" class="space-y-6">
    <!-- Cuenta del proyecto -->
    <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c66e4] to-[#0747a6] p-6 text-white shadow-lg">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm text-white/70">Cuenta del proyecto</p>
          <h2 class="mt-1 text-2xl font-bold">{{ project.name }}</h2>
          <p class="mt-1 text-sm text-white/80">{{ project.client || 'Sin cliente' }}</p>
        </div>
        <Wallet :size="40" class="opacity-30" />
      </div>
      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs text-white/70 uppercase">Saldo disponible</p>
          <p class="text-3xl font-bold">{{ fmt(finance.balance) }}</p>
        </div>
        <div>
          <p class="text-xs text-white/70 uppercase">Presupuesto base</p>
          <p class="text-xl font-semibold">{{ fmt(finance.budget) }}</p>
        </div>
        <div>
          <p class="text-xs text-white/70 uppercase">Flujo neto</p>
          <p class="text-xl font-semibold text-white/90">
            {{ finance.netFlow >= 0 ? '+' : '' }}{{ fmt(finance.netFlow) }}
          </p>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <div class="flex items-center gap-2 text-[#0c66e4]">
          <ArrowDownLeft :size="18" />
          <span class="text-xs font-medium uppercase">Ingresos</span>
        </div>
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ fmt(finance.income) }}</p>
        <p class="text-xs text-[#626f86]">{{ transactions.filter((t) => t.type === 'income').length }} movimientos</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <div class="flex items-center gap-2 text-[#44546f]">
          <ArrowUpRight :size="18" />
          <span class="text-xs font-medium uppercase">Egresos</span>
        </div>
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ fmt(finance.expenses) }}</p>
        <p class="text-xs text-[#626f86]">{{ transactions.filter((t) => t.type === 'expense').length }} movimientos</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <div class="flex items-center gap-2 text-[#0c66e4]">
          <PiggyBank :size="18" />
          <span class="text-xs font-medium uppercase">Consumo presupuesto</span>
        </div>
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ finance.usagePercent }}%</p>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[#091e4214]">
          <div
            class="h-full rounded-full"
            :class="finance.usagePercent >= 90 ? 'bg-[#44546f]' : 'bg-[#0c66e4]'"
            :style="{ width: `${Math.min(100, finance.usagePercent)}%` }"
          />
        </div>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <div class="flex items-center gap-2 text-[#6554c0]">
          <TrendingUp :size="18" />
          <span class="text-xs font-medium uppercase">Rentabilidad</span>
        </div>
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">
          {{ finance.profitability != null ? `${finance.profitability}%` : '—' }}
        </p>
        <p v-if="project.profitabilityTarget" class="text-xs text-[#626f86]">
          Meta: {{ project.profitabilityTarget }}%
        </p>
      </div>
    </div>

    <!-- Acciones + presupuesto -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-2">
        <button
          class="flex items-center gap-1.5 rounded-lg border border-[#091e4229] bg-white px-4 py-2 text-sm font-medium text-[#172b4d] hover:bg-[#091e420a]"
          @click="openAdd('income')"
        >
          <ArrowDownLeft :size="16" />
          Registrar ingreso
        </button>
        <button
          class="flex items-center gap-1.5 rounded-lg border border-[#091e4229] bg-white px-4 py-2 text-sm font-medium text-[#172b4d] hover:bg-[#091e420a]"
          @click="openAdd('expense')"
        >
          <ArrowUpRight :size="16" />
          Registrar egreso
        </button>
      </div>
      <button
        class="text-sm text-[#0c66e4] hover:underline"
        @click="startEditBudget"
      >
        Ajustar presupuesto base
      </button>
    </div>

    <!-- Gráficos -->
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-[#091e4214] bg-white p-5">
        <h3 class="mb-4 flex items-center gap-2 font-semibold text-[#172b4d]">
          <TrendingDown :size="18" />
          Flujo de caja mensual
        </h3>
        <BarChart v-if="cashFlowChart.length" :items="cashFlowChart" unit="" />
        <p v-else class="text-sm text-[#626f86]">Sin movimientos para graficar.</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-5">
        <h3 class="mb-4 font-semibold text-[#172b4d]">Egresos por categoría</h3>
        <DonutChart v-if="expenseDonut.length" :segments="expenseDonut" :size="140" />
        <ul v-if="expenseCategories.length" class="mt-4 space-y-1.5">
          <li
            v-for="cat in expenseCategories.slice(0, 5)"
            :key="cat.category"
            class="flex justify-between text-sm"
          >
            <span class="text-[#44546f]">{{ cat.category }}</span>
            <span class="font-medium text-[#172b4d]">{{ fmt(cat.amount) }} ({{ cat.percent }}%)</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">Sin egresos registrados.</p>
      </div>
    </div>

    <!-- Libro mayor -->
    <div class="rounded-xl border border-[#091e4214] bg-white p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="flex items-center gap-2 font-semibold text-[#172b4d]">
          <Receipt :size="18" />
          Libro mayor — Movimientos
        </h3>
        <div class="flex flex-wrap gap-2">
          <div class="relative">
            <Filter :size="14" class="absolute top-2.5 left-2.5 text-[#626f86]" />
            <select
              v-model="typeFilter"
              class="rounded-lg border border-[#091e4229] py-1.5 pr-3 pl-8 text-sm"
            >
              <option value="all">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Egresos</option>
            </select>
          </div>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar..."
            class="rounded-lg border border-[#091e4229] px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px] text-sm">
          <thead>
            <tr class="border-b border-[#091e4214] text-left text-xs text-[#626f86]">
              <th class="pb-2 pr-4">Fecha</th>
              <th class="pb-2 pr-4">Concepto</th>
              <th class="pb-2 pr-4">Categoría</th>
              <th class="pb-2 pr-4">Método</th>
              <th class="pb-2 pr-4">Referencia</th>
              <th class="pb-2 pr-4 text-right">Monto</th>
              <th class="pb-2 text-right">Saldo</th>
              <th class="pb-2 w-8" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tx in filteredLedger"
              :key="tx.id"
              class="border-b border-[#091e4214] last:border-0 hover:bg-[#091e420a]"
            >
              <td class="py-2.5 pr-4 text-[#626f86]">{{ formatDate(tx.date) }}</td>
              <td class="py-2.5 pr-4">
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
              <td class="py-2.5 pr-4 text-[#626f86]">{{ tx.category }}</td>
              <td class="py-2.5 pr-4 text-[#626f86]">{{ PAYMENT_METHOD_LABELS[tx.paymentMethod] }}</td>
              <td class="py-2.5 pr-4 font-mono text-xs text-[#626f86]">{{ tx.reference || '—' }}</td>
              <td
                class="py-2.5 pr-4 text-right font-semibold text-[#172b4d]"
              >
                {{ tx.type === 'income' ? '+' : '-' }}{{ fmt(tx.amount) }}
              </td>
              <td class="py-2.5 text-right font-medium text-[#172b4d]">
                {{ fmt(tx.runningBalance) }}
              </td>
              <td class="py-2.5">
                <button
                  class="text-xs text-red-500 hover:underline"
                  title="Eliminar"
                  @click="projectsStore.deleteTransaction(tx.id)"
                >
                  ×
                </button>
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
        class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
        @click.self="showAdd = false"
      >
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <h3 class="font-semibold text-[#172b4d]">
            {{ txType === 'income' ? 'Registrar ingreso' : 'Registrar egreso' }}
          </h3>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs text-[#626f86]">Concepto *</label>
              <input v-model="txForm.title" :class="inputClass" placeholder="Descripción del movimiento" />
            </div>
            <div>
              <label class="mb-1 block text-xs text-[#626f86]">Monto *</label>
              <CurrencyInput v-model="txForm.amount" :currency="currency" />
            </div>
            <div>
              <label class="mb-1 block text-xs text-[#626f86]">Fecha</label>
              <DateInput v-model="txForm.date" label="Fecha" />
            </div>
            <div>
              <label class="mb-1 block text-xs text-[#626f86]">Categoría</label>
              <select v-model="txForm.category" :class="inputClass">
                <option v-for="cat in TRANSACTION_CATEGORIES[txType]" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs text-[#626f86]">Método de pago</label>
              <select v-model="txForm.paymentMethod" :class="inputClass">
                <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs text-[#626f86]">Referencia / No. comprobante</label>
              <input v-model="txForm.reference" :class="inputClass" placeholder="TRF-001, INV-123..." />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs text-[#626f86]">Notas</label>
              <textarea v-model="txForm.notes" rows="2" :class="inputClass" />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button class="rounded-lg px-4 py-2 text-sm text-[#626f86]" @click="showAdd = false">Cancelar</button>
            <button
              class="rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc]"
              @click="saveTransaction"
            >
              Registrar {{ txType === 'income' ? 'ingreso' : 'egreso' }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="editingBudget"
        class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
        @click.self="editingBudget = false"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <h3 class="font-semibold text-[#172b4d]">Ajustar presupuesto base</h3>
          <p class="mt-1 text-sm text-[#626f86]">
            El presupuesto base es el monto inicial asignado al proyecto. Los ingresos y egresos modifican el saldo disponible.
          </p>
          <div class="mt-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Presupuesto base *</label>
              <CurrencyInput v-model="budgetInput" :currency="currency" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Meta de rentabilidad (%)</label>
              <input v-model.number="profitabilityInput" type="number" min="0" max="100" :class="inputClass" />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button class="px-4 py-2 text-sm" @click="editingBudget = false">Cancelar</button>
            <button class="rounded-lg bg-[#0c66e4] px-4 py-2 text-sm text-white" @click="saveBudget">Guardar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
