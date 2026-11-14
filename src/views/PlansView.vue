<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Check, ChevronDown, Minus } from '@lucide/vue'
import { FREE_BOARD_LIMIT, FREE_PROJECT_LIMIT } from '@/config/plans'
import { useBillingStore } from '@/stores/billing'
import { useProjectsStore } from '@/stores/projects'
import { formatMoney } from '@/utils/currency'
import PlanBadge from '@/components/billing/PlanBadge.vue'

const billing = useBillingStore()
const projects = useProjectsStore()
const route = useRoute()
const router = useRouter()

const priceUsd = computed(() => billing.offer.vipPriceUsd)
const priceCop = computed(() =>
  billing.offer.vipPriceCop ? formatMoney(billing.offer.vipPriceCop, 'COP') : '',
)

const atLimit = computed(() => billing.freeLimitReached)

const periodEnd = computed(() => {
  const raw = billing.subscription?.currentPeriodEnd
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
})

const PREVIEW = 4
const showMoreFree = ref(false)
const showMoreVip = ref(false)

/** Funciones compartidas (después de los límites de cantidad). */
const sharedFeatures = [
  'Kanban con responsables, fechas, etiquetas, checklist y adjuntos',
  'Proyectos con lista, Kanban y cronograma Gantt',
  'Hitos, entregables y matriz de riesgos',
  'Presupuesto, ingresos, egresos, flujo de caja y rentabilidad',
  'Chat de equipo, calendario y notificaciones',
  'Roles: Propietario, Administrador, Miembro y Observador',
  '9 monedas (COP, MXN, USD…)',
]

type PlanRow = { id: string; label: string; kind: 'ok' | 'warn' | 'no'; detail?: string }

const freeRows = computed((): PlanRow[] => [
  {
    id: 'boards',
    kind: billing.boardLimitReached ? 'warn' : 'ok',
    label: `${FREE_BOARD_LIMIT} tablero Kanban`,
    detail: !billing.isVip
      ? `· ${billing.boardUsage} en uso${billing.boardLimitReached ? ' (límite)' : ''}`
      : undefined,
  },
  {
    id: 'projects',
    kind: billing.projectLimitReached ? 'warn' : 'ok',
    label: `${FREE_PROJECT_LIMIT} proyecto completo`,
    detail: !billing.isVip
      ? `· ${billing.projectUsage} en uso${billing.projectLimitReached ? ' (límite)' : ''}`
      : undefined,
  },
  ...sharedFeatures.map((label, i) => ({ id: `s${i}`, kind: 'ok' as const, label })),
  { id: 'ai', kind: 'no', label: 'Sin asistente de IA' },
])

const vipRows = computed((): PlanRow[] => [
  { id: 'boards', kind: 'ok', label: 'Tableros Kanban ilimitados' },
  { id: 'projects', kind: 'ok', label: 'Proyectos ilimitados' },
  ...sharedFeatures.map((label, i) => ({ id: `s${i}`, kind: 'ok' as const, label })),
  { id: 'ai', kind: 'ok', label: 'Asistente de IA (priorizar, resumir, redactar)' },
])

const freeVisible = computed(() =>
  showMoreFree.value ? freeRows.value : freeRows.value.slice(0, PREVIEW),
)
const vipVisible = computed(() =>
  showMoreVip.value ? vipRows.value : vipRows.value.slice(0, PREVIEW),
)

onMounted(async () => {
  await Promise.all([billing.init(), projects.init()])
  const checkoutId = route.query.checkout_id
  if (typeof checkoutId === 'string' && checkoutId) {
    await billing.confirmReturn(checkoutId)
    await router.replace({ name: 'plans' })
    return
  }
  if (route.query.checkout === '1' && !billing.isVip) {
    await router.replace({ name: 'plans' })
    await billing.startVipCheckout()
  }
})
</script>

<template>
  <div class="h-full overflow-y-auto">
  <div class="mx-auto w-full max-w-4xl px-6 py-8">
    <div class="mb-8">
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-xs font-semibold tracking-wide text-[#6554c0] uppercase">Planes</p>
        <PlanBadge tone="onLight" size="md" />
      </div>
      <h1 class="mt-1 text-2xl font-bold text-[#172b4d]">Elige cómo trabajar en QuinList</h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-[#626f86]">
        Estás en el plan <span class="font-semibold text-[#172b4d]">{{ billing.planLabel }}</span>.
        Ambos planes incluyen las mismas funciones de trabajo; VIP quita los límites y suma la IA.
      </p>
    </div>

    <p
      v-if="!billing.isVip && atLimit"
      class="mb-4 text-[13px] text-[#626f86]"
      role="status"
    >
      Límite alcanzado ·
      <span :class="billing.boardLimitReached ? 'font-medium text-[#172b4d]' : ''">
        {{ billing.boardUsage }}/{{ FREE_BOARD_LIMIT }} tableros
      </span>
      ·
      <span :class="billing.projectLimitReached ? 'font-medium text-[#172b4d]' : ''">
        {{ billing.projectUsage }}/{{ FREE_PROJECT_LIMIT }} proyectos
      </span>
      — no puedes crear más en Gratis.
    </p>

    <p v-if="billing.checkoutError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ billing.checkoutError }}
    </p>

    <div class="grid items-stretch gap-4 md:grid-cols-2">
      <!-- Gratis -->
      <section
        class="flex flex-col rounded-2xl border bg-white p-6 shadow-sm"
        :class="!billing.isVip ? 'border-[#6554c0] ring-1 ring-[#6554c0]/20' : 'border-[#091e4221]'"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="text-[11px] font-semibold tracking-wide text-[#626f86] uppercase">Para empezar</p>
            <h2 class="mt-1 text-lg font-bold text-[#172b4d]">Gratis</h2>
          </div>
          <span
            v-if="!billing.isVip"
            class="rounded-full bg-[#6554c0] px-2.5 py-1 text-xs font-semibold text-white"
          >
            Plan actual
          </span>
        </div>

        <p class="mt-4 text-3xl font-extrabold text-[#172b4d]">$0</p>
        <p class="mt-1 text-sm text-[#626f86]">Para siempre · sin tarjeta</p>

        <ul class="mt-5 space-y-2.5 text-sm text-[#172b4d]">
          <li
            v-for="row in freeVisible"
            :key="row.id"
            class="flex items-start gap-2"
            :class="row.kind === 'no' ? 'text-[#626f86]' : ''"
          >
            <Minus v-if="row.kind === 'no'" :size="16" class="mt-0.5 shrink-0" />
            <Check
              v-else
              :size="16"
              class="mt-0.5 shrink-0"
              :class="row.kind === 'warn' ? 'text-amber-600' : 'text-emerald-600'"
            />
            <span>
              {{ row.label }}
              <span
                v-if="row.detail"
                class="font-medium"
                :class="row.kind === 'warn' ? 'text-amber-700' : 'text-[#626f86]'"
              >
                {{ row.detail }}
              </span>
            </span>
          </li>
        </ul>
        <button
          v-if="freeRows.length > PREVIEW"
          type="button"
          class="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0c66e4] hover:underline"
          @click="showMoreFree = !showMoreFree"
        >
          {{ showMoreFree ? 'Ver menos' : 'Ver más' }}
          <ChevronDown :size="14" class="transition-transform" :class="showMoreFree ? 'rotate-180' : ''" />
        </button>
      </section>

      <!-- VIP -->
      <section class="flex flex-col rounded-2xl border border-[#6554c0] bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="text-[11px] font-semibold tracking-wide text-[#6554c0] uppercase">Para equipos</p>
            <h2 class="mt-1 text-lg font-bold text-[#172b4d]">VIP</h2>
          </div>
          <span
            v-if="billing.isVip"
            class="rounded-full bg-[#6554c0] px-2.5 py-1 text-xs font-semibold text-white"
          >
            Plan actual
          </span>
        </div>

        <p class="mt-4 text-3xl font-extrabold text-[#172b4d]">
          ${{ priceUsd }} <span class="text-lg font-bold">USD</span>
        </p>
        <p class="mt-1 text-sm text-[#626f86]">
          al mes<span v-if="priceCop"> · aprox. {{ priceCop }}</span>
          · cancela cuando quieras
        </p>

        <ul class="mt-5 flex-1 space-y-2.5 text-sm text-[#172b4d]">
          <li v-for="row in vipVisible" :key="row.id" class="flex items-start gap-2">
            <Check :size="16" class="mt-0.5 shrink-0 text-[#6554c0]" />
            {{ row.label }}
          </li>
        </ul>
        <button
          v-if="vipRows.length > PREVIEW"
          type="button"
          class="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0c66e4] hover:underline"
          @click="showMoreVip = !showMoreVip"
        >
          {{ showMoreVip ? 'Ver menos' : 'Ver más' }}
          <ChevronDown :size="14" class="transition-transform" :class="showMoreVip ? 'rotate-180' : ''" />
        </button>

        <button
          v-if="!billing.isVip"
          type="button"
          class="btn-brand mt-6 w-full"
          :disabled="billing.checkoutBusy"
          @click="billing.startVipCheckout()"
        >
          {{ billing.checkoutBusy ? 'Abriendo pago…' : 'Pasar a VIP' }}
        </button>
        <div v-else class="mt-6 space-y-3">
          <p v-if="periodEnd" class="text-sm text-[#626f86]">
            {{
              billing.subscription?.cancelAtPeriodEnd
                ? `Sigue activo hasta el ${periodEnd}.`
                : `Próximo cobro: ${periodEnd}.`
            }}
          </p>
          <button
            v-if="!billing.subscription?.cancelAtPeriodEnd"
            type="button"
            class="text-sm font-medium text-[#626f86] underline-offset-2 hover:underline"
            :disabled="billing.checkoutBusy"
            @click="billing.cancelVip()"
          >
            Cancelar al final del periodo
          </button>
          <RouterLink to="/app/ia" class="btn-brand inline-flex">Abrir asistente de IA</RouterLink>
        </div>
      </section>
    </div>

    <p class="mt-5 pb-4 text-center text-[12px] text-[#626f86]">
      Precio en USD. En Colombia el cobro se hace en pesos a la tasa del día, con Landa Pay.
    </p>
  </div>
  </div>
</template>
