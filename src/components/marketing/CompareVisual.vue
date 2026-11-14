<script setup lang="ts">
/**
 * Visuales propios de las páginas de precios y comparativas (cada página tiene el suyo):
 *  - pricing: ticket interactivo Gratis / VIP
 *  - excel:   hoja de cálculo vs. QuinList con divisor que se arrastra
 *  - trello:  las mismas tareas en Tablero, Cronograma y Finanzas (pestañas)
 *  - suite:   todo incluido + selector de moneda por proyecto
 * HTML puro: sale en el prerender, pesa poco y es nítido en cualquier pantalla.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Check, CircleAlert, Cpu, Minus } from '@lucide/vue'
import { PRODUCT } from '@/seo/marketing'

export type CompareVisualKind = 'pricing' | 'excel' | 'trello' | 'suite'
const props = defineProps<{ kind: CompareVisualKind; label: string }>()

/* ---------- Precios ---------- */
const plan = ref<'free' | 'vip'>('vip')
const receipt = computed(() =>
  plan.value === 'vip'
    ? [
        ['Tableros Kanban', 'Ilimitados'],
        ['Proyectos completos', 'Ilimitados'],
        ['Gantt, riesgos y entregables', 'Incluido'],
        ['Presupuesto y flujo de caja', 'Incluido'],
        ['Equipo / miembros', 'Ilimitados'],
        ['Asistente de IA', 'Incluido'],
      ]
    : [
        ['Tableros Kanban', '1'],
        ['Proyectos completos', '1'],
        ['Gantt, riesgos y entregables', 'Incluido'],
        ['Presupuesto y flujo de caja', 'Incluido'],
        ['Equipo / miembros', '—'],
        ['Asistente de IA', '—'],
      ],
)

/* ---------- Excel: divisor arrastrable ---------- */
const split = ref(52)
const splitBox = ref<HTMLElement | null>(null)
const dragging = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | undefined
function setFromX(clientX: number) {
  const r = splitBox.value?.getBoundingClientRect()
  if (!r) return
  split.value = Math.min(92, Math.max(8, ((clientX - r.left) / r.width) * 100))
}
function onDown(e: PointerEvent) {
  dragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  setFromX(e.clientX)
}
function onMove(e: PointerEvent) {
  if (dragging.value) setFromX(e.clientX)
}
function onUp() {
  dragging.value = false
}
const sheet = [
  ['Cotización cliente', '¿Juan?', '15/11 (?)', 'pendiente!!', '#¡REF!'],
  ['Planos v2', 'Ana / Luis', 'ayer', 'NO TOCAR', '3.200.000'],
  ['Comprar materiales', '', '', 'urgente', '=SUMA(E2:E9'],
  ['Acta de inicio', 'Ana', '01/11', 'ok', ''],
]
const tasks = [
  { t: 'Cotización cliente', who: 'JM', when: 'Hoy', prio: 'Alta', cls: 'bg-red-50 text-red-800' },
  { t: 'Planos v2', who: 'AR', when: 'Mañana', prio: 'Media', cls: 'bg-amber-50 text-amber-800' },
  { t: 'Comprar materiales', who: 'LC', when: 'Vie', prio: 'Alta', cls: 'bg-red-50 text-red-800' },
  { t: 'Acta de inicio', who: 'AR', when: 'Hecho', prio: 'Baja', cls: 'bg-emerald-50 text-emerald-800' },
]

/* ---------- Trello: misma info, tres vistas ---------- */
const views = ['Tablero', 'Cronograma', 'Finanzas'] as const
const view = ref<(typeof views)[number]>('Tablero')
let rotate: ReturnType<typeof setInterval> | undefined
function pickView(v: (typeof views)[number]) {
  view.value = v
  clearInterval(rotate)
}

/* ---------- Suite: moneda por proyecto ---------- */
const currencies = [
  { code: 'COP', project: 'Obra Bogotá', budget: 40000000, locale: 'es-CO' },
  { code: 'MXN', project: 'Campaña CDMX', budget: 185000, locale: 'es-MX' },
  { code: 'PEN', project: 'Consultoría Lima', budget: 42000, locale: 'es-PE' },
  { code: 'CLP', project: 'Sitio Santiago', budget: 9500000, locale: 'es-CL' },
  { code: 'USD', project: 'App Quito', budget: 12000, locale: 'es-EC' },
] as const
const cur = ref(0)
const money = (n: number) => {
  const c = currencies[cur.value]!
  return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.code, maximumFractionDigits: 0 }).format(n)
}
const modules = ['Kanban y tareas', 'Cronograma Gantt', 'Finanzas del proyecto', 'Riesgos y entregables', 'Chat de equipo', 'Asistente de IA (VIP)']

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (props.kind === 'excel') {
    // Pista: el divisor se mueve una vez para mostrar que se puede arrastrar.
    hintTimer = setTimeout(() => {
      split.value = 30
      hintTimer = setTimeout(() => (split.value = 60), 700)
    }, 900)
  }
  if (props.kind === 'trello') {
    rotate = setInterval(() => {
      view.value = views[(views.indexOf(view.value) + 1) % views.length]!
    }, 3200)
  }
})
onUnmounted(() => {
  clearTimeout(hintTimer)
  clearInterval(rotate)
})
</script>

<template>
  <div class="relative mx-auto w-full max-w-[540px]" role="img" :aria-label="label">
    <!-- ================= PRECIOS: ticket ================= -->
    <div v-if="kind === 'pricing'" class="rounded-[24px] bg-[#101214] p-6 sm:p-8">
      <div class="mx-auto max-w-[360px] -rotate-2 rounded-[18px] bg-white p-6 text-[#101214] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
        <div class="flex items-center justify-between">
          <p class="ql-display text-[18px] font-semibold">Tu plan QuinList</p>
          <span class="text-[11px] font-medium text-[#42526e]">#QL-2026</span>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-1 rounded-full bg-[#f0f1f2] p-1 text-[13px] font-semibold">
          <button
            type="button"
            class="rounded-full py-1.5 transition-colors"
            :class="plan === 'free' ? 'bg-white text-[#101214] shadow-sm' : 'text-[#42526e]'"
            :aria-pressed="plan === 'free'"
            @click="plan = 'free'"
          >
            Gratis
          </button>
          <button
            type="button"
            class="rounded-full py-1.5 transition-colors"
            :class="plan === 'vip' ? 'bg-[#1868db] text-white shadow-sm' : 'text-[#42526e]'"
            :aria-pressed="plan === 'vip'"
            @click="plan = 'vip'"
          >
            VIP
          </button>
        </div>
        <ul class="mt-5 space-y-2.5 text-[13px]">
          <li v-for="[k, v] in receipt" :key="k" class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2">
              <Minus v-if="v === '—'" :size="14" class="text-[#b7b9be]" />
              <Check v-else :size="14" class="text-emerald-600" />
              {{ k }}
            </span>
            <span class="font-semibold" :class="v === '—' ? 'text-[#b7b9be]' : ''">{{ v }}</span>
          </li>
        </ul>
        <div class="my-5 border-t-2 border-dashed border-[#e2e4e9]" />
        <div class="flex items-end justify-between">
          <span class="text-[13px] font-medium text-[#42526e]">Total al mes</span>
          <span class="ql-display text-[2.6rem] font-semibold leading-none">
            ${{ plan === 'vip' ? PRODUCT.vipPriceUsd : 0 }}<span class="ml-1 text-[14px] font-medium text-[#42526e]">USD</span>
          </span>
        </div>
        <p class="mt-3 text-[12px] text-[#42526e]">{{ plan === 'vip' ? 'Sin contrato · cancela cuando quieras' : 'Para siempre · sin tarjeta' }}</p>
        <!-- Borde dentado del ticket -->
        <div class="-mx-6 -mb-6 mt-5 h-3 bg-[radial-gradient(circle_at_6px_12px,#101214_6px,transparent_6.5px)] bg-[length:12px_12px]" />
      </div>
      <span class="absolute -right-2 -top-3 rotate-6 rounded-full bg-[#fca700] px-3 py-1 text-[12px] font-bold text-[#101214]">
        <Cpu :size="12" class="mr-1 inline" />IA incluida en VIP
      </span>
    </div>

    <!-- ================= EXCEL: antes / después con divisor ================= -->
    <div v-else-if="kind === 'excel'" class="rounded-[24px] bg-[#eed7fc] p-5 sm:p-7">
      <div
        ref="splitBox"
        class="relative h-[340px] touch-none select-none overflow-hidden rounded-[14px] bg-white shadow-[0_24px_48px_-24px_rgba(9,30,66,0.45)] sm:h-[360px]"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <!-- Después: QuinList -->
        <div class="absolute inset-0 flex flex-col">
          <div class="flex items-center gap-2 bg-[#2d7eb8] px-3 py-2 text-[11px] font-semibold text-white">
            <span class="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[9px] font-extrabold">Q</span>
            Remodelación oficina · Tareas
          </div>
          <ul class="flex-1 space-y-2 p-3">
            <li v-for="t in tasks" :key="t.t" class="flex items-center gap-2 rounded-lg border border-[#eef0f3] px-2.5 py-2 text-[11px]">
              <span class="flex h-4 w-4 items-center justify-center rounded border" :class="t.when === 'Hecho' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[#ccc]'">
                <Check v-if="t.when === 'Hecho'" :size="10" />
              </span>
              <span class="flex-1 truncate font-semibold text-[#172b4d]">{{ t.t }}</span>
              <span class="rounded-full px-1.5 py-0.5 text-[9px] font-bold" :class="t.cls">{{ t.prio }}</span>
              <span class="w-10 text-right text-[10px] text-[#42526e]">{{ t.when }}</span>
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#e9f2fe] text-[8px] font-bold text-[#1868db]">{{ t.who }}</span>
            </li>
          </ul>
          <div class="m-3 mt-0 flex items-center justify-between rounded-lg bg-[#e9f2fe] px-3 py-2 text-[11px] font-semibold text-[#172b4d]">
            Avance del proyecto <span class="text-[#1868db]">68%</span>
          </div>
        </div>

        <!-- Antes: hoja de cálculo (recortada por el divisor) -->
        <div class="absolute inset-0 flex flex-col bg-white" :style="{ clipPath: `inset(0 ${100 - split}% 0 0)` }">
          <div class="flex items-center gap-2 bg-[#1e7145] px-3 py-2 text-[11px] font-semibold text-white">
            <span class="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[10px] font-extrabold">▦</span>
            Cronograma_final_v3_AHORA_SI.xlsx
          </div>
          <div class="flex-1 overflow-hidden p-2 font-mono text-[10px]">
            <div class="grid grid-cols-[18px_repeat(5,minmax(0,1fr))] border-l border-t border-[#d6d6d6]">
              <span class="border-b border-r border-[#d6d6d6] bg-[#f3f3f3]" />
              <span v-for="c in ['A', 'B', 'C', 'D', 'E']" :key="c" class="border-b border-r border-[#d6d6d6] bg-[#f3f3f3] py-0.5 text-center text-[#666]">{{ c }}</span>
              <template v-for="(row, i) in sheet" :key="i">
                <span class="border-b border-r border-[#d6d6d6] bg-[#f3f3f3] py-1.5 text-center text-[#666]">{{ i + 2 }}</span>
                <span
                  v-for="(cell, j) in row"
                  :key="j"
                  class="truncate border-b border-r border-[#d6d6d6] px-1 py-1.5"
                  :class="cell.startsWith('#') || cell.startsWith('=') ? 'bg-red-50 text-red-700' : cell === 'NO TOCAR' || cell === 'urgente' ? 'bg-yellow-100 text-[#7a5a00]' : 'text-[#333]'"
                >{{ cell }}</span>
              </template>
            </div>
            <p class="mt-3 flex items-center gap-1.5 font-sans text-[10px] font-semibold text-red-700">
              <CircleAlert :size="12" /> 3 personas editaron versiones distintas
            </p>
          </div>
          <div class="flex gap-1 border-t border-[#d6d6d6] bg-[#f3f3f3] px-2 py-1 text-[9px] text-[#555]">
            <span class="rounded-sm bg-white px-2 py-0.5">Hoja1</span><span class="px-2 py-0.5">Hoja1 (2)</span><span class="px-2 py-0.5">copia</span>
          </div>
        </div>

        <!-- Divisor -->
        <div class="absolute inset-y-0 w-0.5 bg-[#101214]" :style="{ left: `${split}%` }" aria-hidden="true" />
        <button
          type="button"
          class="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-[#101214] text-[13px] font-bold text-white shadow-lg transition-[left] duration-500"
          :class="dragging ? 'duration-0' : ''"
          :style="{ left: `${split}%` }"
          aria-label="Arrastra para comparar"
          @pointerdown="onDown"
        >
          ⇆
        </button>
        <span class="pointer-events-none absolute left-3 top-11 rounded-full bg-[#101214]/80 px-2 py-0.5 text-[10px] font-semibold text-white">Antes</span>
        <span class="pointer-events-none absolute right-3 top-11 rounded-full bg-[#1868db] px-2 py-0.5 text-[10px] font-semibold text-white">Con QuinList</span>
      </div>
      <input
        v-model.number="split"
        type="range"
        min="8"
        max="92"
        class="mt-4 w-full accent-[#1868db]"
        aria-label="Comparar hoja de cálculo y QuinList"
      />
    </div>

    <!-- ================= TRELLO: misma info, tres vistas ================= -->
    <div v-else-if="kind === 'trello'" class="rounded-[24px] bg-[#1868db] p-5 sm:p-7">
      <div class="overflow-hidden rounded-[14px] bg-white shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]">
        <div class="flex items-center gap-2 bg-[#2d7eb8] px-3 py-2 text-[11px] font-semibold text-white">
          <span class="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[9px] font-extrabold">Q</span>
          Lanzamiento web
        </div>
        <div class="flex gap-1 border-b border-[#eef0f3] px-3 pt-2" role="tablist" aria-label="Vistas del proyecto">
          <button
            v-for="v in views"
            :key="v"
            type="button"
            role="tab"
            :aria-selected="view === v"
            class="-mb-px border-b-2 px-3 py-2 text-[12px] font-semibold transition-colors"
            :class="view === v ? 'border-[#1868db] text-[#1868db]' : 'border-transparent text-[#42526e] hover:text-[#101214]'"
            @click="pickView(v)"
          >
            {{ v }}
          </button>
        </div>
        <div class="relative h-[260px] p-3">
          <Transition mode="out-in" enter-active-class="transition duration-300" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
            <div v-if="view === 'Tablero'" key="t" class="grid h-full grid-cols-3 gap-2">
              <div v-for="(col, ci) in [['Diseño', 'Textos'], ['Desarrollo'], ['Brief']]" :key="ci" class="rounded-lg bg-[#f0f1f2] p-2">
                <p class="mb-2 text-[10px] font-bold uppercase text-[#42526e]">{{ ['Por hacer', 'En curso', 'Hecho'][ci] }}</p>
                <div v-for="c in col" :key="c" class="mb-2 rounded-md bg-white p-2 text-[11px] font-semibold text-[#172b4d] shadow-sm">
                  {{ c }}
                  <span class="mt-1.5 block h-1 rounded-full" :class="['bg-[#fca700]', 'bg-[#1868db]', 'bg-emerald-500'][ci]" />
                </div>
              </div>
            </div>
            <div v-else-if="view === 'Cronograma'" key="g" class="space-y-3 pt-2">
              <div v-for="(b, i) in [{ n: 'Brief', s: 0, w: 22, c: 'bg-emerald-500' }, { n: 'Diseño', s: 18, w: 34, c: 'bg-[#fca700]' }, { n: 'Textos', s: 30, w: 26, c: 'bg-[#fca700]' }, { n: 'Desarrollo', s: 46, w: 44, c: 'bg-[#1868db]' }]" :key="i" class="grid grid-cols-[72px_1fr] items-center gap-2">
                <span class="text-[11px] font-semibold text-[#172b4d]">{{ b.n }}</span>
                <span class="relative h-5 rounded bg-[#f0f1f2]"><span class="absolute inset-y-0 rounded" :class="b.c" :style="{ left: `${b.s}%`, width: `${b.w}%` }" /></span>
              </div>
              <p class="pt-2 text-[10px] font-medium text-[#42526e]">Las mismas tarjetas, ahora en el tiempo.</p>
            </div>
            <div v-else key="f" class="space-y-3 pt-1">
              <div class="rounded-xl bg-[#101214] p-3 text-white">
                <p class="text-[10px] text-white/70">Saldo del proyecto</p>
                <p class="ql-display text-[22px] font-semibold">$ 8.600 USD</p>
              </div>
              <div v-for="r in [['Diseño', '− $ 1.200'], ['Desarrollo', '− $ 3.400'], ['Anticipo cliente', '+ $ 6.000']]" :key="r[0]" class="flex justify-between text-[11px]">
                <span class="text-[#172b4d]">{{ r[0] }}</span>
                <span class="font-bold" :class="r[1]!.startsWith('+') ? 'text-emerald-700' : 'text-red-700'">{{ r[1] }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- ================= ASANA / MONDAY: todo incluido + moneda ================= -->
    <div v-else class="rounded-[24px] bg-[#101214] p-5 sm:p-7">
      <div class="rounded-[14px] bg-white p-5 text-[#101214]">
        <div class="flex items-center justify-between gap-3">
          <p class="ql-display text-[17px] font-semibold">Todo incluido</p>
          <span class="rounded-full bg-[#fca700] px-2.5 py-0.5 text-[11px] font-bold">${{ PRODUCT.vipPriceUsd }} USD/mes</span>
        </div>
        <ul class="mt-4 grid grid-cols-2 gap-2">
          <li v-for="m in modules" :key="m" class="flex items-center gap-2 rounded-lg bg-[#f0f1f2] px-2.5 py-2 text-[11px] font-semibold">
            <Check :size="13" class="shrink-0 text-emerald-600" /> {{ m }}
          </li>
        </ul>
        <div class="mt-5 rounded-xl border border-[#eef0f3] p-3">
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Moneda del proyecto">
            <button
              v-for="(c, i) in currencies"
              :key="c.code"
              type="button"
              class="rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors"
              :class="cur === i ? 'bg-[#1868db] text-white' : 'bg-[#f0f1f2] text-[#42526e] hover:bg-[#e9f2fe]'"
              :aria-pressed="cur === i"
              @click="cur = i"
            >
              {{ c.code }}
            </button>
          </div>
          <p class="mt-3 text-[11px] text-[#42526e]">{{ currencies[cur]!.project }} · presupuesto</p>
          <p class="ql-display text-[24px] font-semibold">{{ money(currencies[cur]!.budget) }}</p>
          <div class="mt-2 h-2 rounded-full bg-[#f0f1f2]"><div class="h-2 w-[58%] rounded-full bg-[#1868db]" /></div>
          <p class="mt-1 text-[10px] text-[#42526e]">58% consumido · cada proyecto en su moneda</p>
        </div>
      </div>
    </div>
  </div>
</template>
