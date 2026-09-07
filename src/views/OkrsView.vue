<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  Target,
  Plus,
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalIcon,
} from '@lucide/vue'
import { useOkrsStore } from '@/stores/okrs'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import type { OKRStatus, OKRPeriod } from '@/types/v3'

const okrsStore = useOkrsStore()
const auth = useAuthStore()
const store = useQuinListStore()

const showCreate = ref(false)
const editing = ref<string | null>(null)
const newTitle = ref('')
const newDescription = ref('')
const newPeriod = ref<OKRPeriod>('quarter')
const newStart = ref(new Date().toISOString().slice(0, 10))
const newEnd = ref('')

const periodOptions: { value: OKRPeriod; label: string; months: number }[] = [
  { value: 'quarter', label: 'Trimestral', months: 3 },
  { value: 'half', label: 'Semestral', months: 6 },
  { value: 'year', label: 'Anual', months: 12 },
]

function defaultEnd(period: OKRPeriod) {
  const opt = periodOptions.find((p) => p.value === period)
  const d = new Date()
  d.setMonth(d.getMonth() + (opt?.months ?? 3))
  return d.toISOString().slice(0, 10)
}

watchPeriod()

function watchPeriod() {
  newEnd.value = defaultEnd(newPeriod.value)
}

function openCreate() {
  newTitle.value = ''
  newDescription.value = ''
  newPeriod.value = 'quarter'
  newStart.value = new Date().toISOString().slice(0, 10)
  newEnd.value = defaultEnd('quarter')
  showCreate.value = true
}

async function submitCreate() {
  if (!store.currentWorkspaceId || !newTitle.value.trim()) return
  await okrsStore.createOKR({
    workspaceId: store.currentWorkspaceId,
    projectId: null,
    parentId: null,
    title: newTitle.value.trim(),
    description: newDescription.value.trim(),
    ownerId: auth.currentUserId,
    period: newPeriod.value,
    startsAt: newStart.value,
    endsAt: newEnd.value,
    status: 'on_track',
    createdBy: auth.currentUserId,
  })
  showCreate.value = false
}

function statusBadgeClass(status: OKRStatus): string {
  switch (status) {
    case 'on_track':
      return 'bg-emerald-100 text-emerald-700'
    case 'at_risk':
      return 'bg-amber-100 text-amber-700'
    case 'off_track':
      return 'bg-red-100 text-red-700'
    case 'completed':
      return 'bg-blue-100 text-blue-700'
  }
}

function statusLabel(status: OKRStatus): string {
  return { on_track: 'En meta', at_risk: 'En riesgo', off_track: 'Fuera de meta', completed: 'Logrado' }[status]
}

function statusIcon(status: OKRStatus) {
  return status === 'completed' ? CheckCircle2 : status === 'off_track' ? AlertTriangle : TrendingUp
}

const krInput = ref<Record<string, { title: string; target: number; unit: string }>>({})

function startKR(okrId: string) {
  krInput.value[okrId] = { title: '', target: 100, unit: '%' }
}

async function addKR(okrId: string) {
  const input = krInput.value[okrId]
  if (!input?.title.trim()) return
  await okrsStore.addKeyResult({
    okrId,
    title: input.title.trim(),
    metricType: 'percentage',
    targetValue: input.target,
    currentValue: 0,
    unit: input.unit,
    ownerId: auth.currentUserId,
    dueDate: null,
  })
  krInput.value[okrId] = { title: '', target: 100, unit: '%' }
}

async function setKRValue(krId: string, okrId: string, value: number) {
  await okrsStore.updateKeyResult(krId, { currentValue: value })
}

async function deleteOKR(id: string) {
  if (!confirm('¿Eliminar este OKR y todos sus Key Results?')) return
  await okrsStore.deleteOKR(id)
}

function krProgress(kr: { targetValue: number; currentValue: number }) {
  return Math.min(100, Math.max(0, (kr.currentValue / Math.max(0.01, kr.targetValue)) * 100))
}

onMounted(() => {
  if (store.currentWorkspaceId) okrsStore.load(store.currentWorkspaceId)
})

const allOkrs = computed(() => okrsStore.okrs)
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <Target :size="22" class="text-blue-500" />
          Objetivos y Key Results
        </h1>
        <p class="text-sm text-slate-500">
          Define objetivos medibles para alinear al equipo con métricas claras.
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        @click="openCreate"
      >
        <Plus :size="16" />
        Nuevo objetivo
      </button>
    </div>

    <div v-if="allOkrs.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <Target :size="36" class="mx-auto mb-3 text-slate-300" />
      <p class="text-sm text-slate-500">
        Aún no hay objetivos. Crea el primero para empezar a medir el progreso del equipo.
      </p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="okr in allOkrs"
        :key="okr.id"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <component
                :is="statusIcon(okr.status)"
                :size="18"
                :class="{
                  'text-emerald-500': okr.status === 'on_track',
                  'text-amber-500': okr.status === 'at_risk',
                  'text-red-500': okr.status === 'off_track',
                  'text-blue-500': okr.status === 'completed',
                }"
              />
              <h3 class="text-lg font-semibold text-slate-800">{{ okr.title }}</h3>
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusBadgeClass(okr.status)">
                {{ statusLabel(okr.status) }}
              </span>
            </div>
            <p v-if="okr.description" class="mt-1 text-sm text-slate-600">{{ okr.description }}</p>
            <p class="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <CalIcon :size="12" />
              {{ okr.startsAt }} → {{ okr.endsAt }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <div class="text-right">
              <div class="text-2xl font-bold text-slate-800">{{ okr.progress }}%</div>
              <div class="text-xs text-slate-400">progreso</div>
            </div>
            <button
              class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
              @click="deleteOKR(okr.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>

        <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full transition-all"
            :class="{
              'bg-emerald-500': okr.status === 'on_track',
              'bg-amber-500': okr.status === 'at_risk',
              'bg-red-500': okr.status === 'off_track',
              'bg-blue-500': okr.status === 'completed',
            }"
            :style="{ width: okr.progress + '%' }"
          />
        </div>

        <div class="mt-4 space-y-2">
          <div
            v-for="kr in okrsStore.keyResultsFor(okr.id)"
            :key="kr.id"
            class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-700">{{ kr.title }}</p>
              <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-blue-500 transition-all"
                  :style="{ width: krProgress(kr) + '%' }"
                />
              </div>
            </div>
            <input
              type="number"
              :value="kr.currentValue"
              class="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
              @change="(e) => setKRValue(kr.id, okr.id, Number((e.target as HTMLInputElement).value))"
            />
            <span class="text-xs text-slate-500">/ {{ kr.targetValue }} {{ kr.unit }}</span>
          </div>

          <div v-if="krInput[okr.id]" class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <input
              v-model="krInput[okr.id]!.title"
              placeholder="Nuevo Key Result..."
              class="flex-1 rounded border border-slate-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
              @keyup.enter="addKR(okr.id)"
            />
            <input
              v-model.number="krInput[okr.id]!.target"
              type="number"
              class="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              v-model="krInput[okr.id]!.unit"
              placeholder="%"
              class="w-12 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-blue-400 focus:outline-none"
            />
            <button
              class="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              @click="addKR(okr.id)"
            >
              Añadir
            </button>
          </div>
          <button
            v-else
            class="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            @click="startKR(okr.id)"
          >
            <Plus :size="12" /> Añadir Key Result
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="showCreate = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Nuevo objetivo</h2>
        <div class="space-y-3">
          <input
            v-model="newTitle"
            placeholder="¿Qué quieres lograr?"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <textarea
            v-model="newDescription"
            placeholder="Contexto / por qué importa (opcional)"
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <div class="flex gap-2">
            <select
              v-model="newPeriod"
              class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              @change="watchPeriod"
            >
              <option v-for="o in periodOptions" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <input
              v-model="newStart"
              type="date"
              class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              v-model="newEnd"
              type="date"
              class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            @click="showCreate = false"
          >
            Cancelar
          </button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="submitCreate"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>