<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, Minus } from '@lucide/vue'
import { VIP_PRICE_USD } from '@/config/plans'
import { formatMoney } from '@/utils/currency'
import { rememberStartPlan } from '@/lib/startPlan'

const vipPriceUsd = ref(VIP_PRICE_USD)
const vipPriceCop = ref<number | null>(null)
const copLabel = computed(() => (vipPriceCop.value ? formatMoney(vipPriceCop.value, 'COP') : ''))

onMounted(() => {
  void import('@/services/billing')
    .then(({ fetchPlanOffer }) => fetchPlanOffer())
    .then((offer) => {
      vipPriceUsd.value = offer.vipPriceUsd
      vipPriceCop.value = offer.vipPriceCop
    })
    .catch(() => {})
})

const rows: { label: string; free: string | boolean; vip: string | boolean }[] = [
  { label: 'Tableros Kanban', free: '1', vip: 'Ilimitados' },
  { label: 'Proyectos con todos los módulos', free: '1', vip: 'Ilimitados' },
  { label: 'Cronograma Gantt, hitos, entregables y riesgos', free: true, vip: true },
  { label: 'Presupuesto, flujo de caja y rentabilidad', free: true, vip: true },
  { label: 'Chat de equipo, calendario y notificaciones', free: true, vip: true },
  { label: 'Roles y permisos', free: true, vip: true },
  { label: 'Asistente de IA', free: false, vip: true },
]
</script>

<template>
  <div class="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2 lg:items-stretch">
    <!-- Gratis -->
    <article class="flex flex-col rounded-3xl border border-[#e4e9f0] bg-white p-8 shadow-[0_12px_32px_-24px_rgba(23,43,77,0.35)] lg:p-9">
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a72a8]">Para empezar</p>
      <h3 class="mt-3 text-2xl font-semibold tracking-tight text-[#172b4d]">Gratis</h3>
      <p class="mt-2 text-sm leading-relaxed text-[#5e6c84]">
        Ideal para probar QuinList con un proyecto y un tablero.
      </p>

      <div class="mt-8 border-b border-[#eef1f6] pb-8">
        <p class="flex items-baseline gap-1.5">
          <span class="text-5xl font-semibold tracking-tight text-[#172b4d]">$0</span>
        </p>
        <p class="mt-2 text-sm text-[#5e6c84]">Para siempre · sin tarjeta de crédito</p>
      </div>

      <ul class="mt-8 flex-1 space-y-3.5 text-sm text-[#172b4d]">
        <li v-for="r in rows" :key="`free-${r.label}`" class="flex gap-3" :class="r.free === false ? 'text-[#6b778c]' : ''">
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            :class="r.free === false ? 'bg-[#f6f8fb] text-[#6b778c]' : 'bg-[#e6f4fb] text-[#2a72a8]'"
          >
            <Minus v-if="r.free === false" :size="12" aria-hidden="true" />
            <Check v-else :size="12" aria-hidden="true" />
          </span>
          <span>
            <template v-if="typeof r.free === 'string'">
              {{ r.label }}: <span class="font-semibold">{{ r.free }}</span>
            </template>
            <template v-else>
              {{ r.label }}
              <span v-if="r.free === false" class="sr-only"> (no incluido)</span>
            </template>
          </span>
        </li>
      </ul>

      <RouterLink
        :to="{ path: '/register', query: { plan: 'free' } }"
        class="ql-btn--ghost mt-9 w-full"
        @click="rememberStartPlan('free')"
      >
        Empezar gratis
      </RouterLink>
    </article>

    <!-- VIP -->
    <article class="relative flex flex-col overflow-hidden rounded-3xl bg-[#1a2b4a] p-8 text-white shadow-[0_30px_60px_-30px_rgba(15,28,51,0.7)] lg:p-9">
      <div class="absolute inset-x-0 top-0 h-1.5 bg-[#5bbce4]" aria-hidden="true" />

      <div class="flex flex-wrap items-center gap-3">
        <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">Para equipos</p>
        <span class="rounded-full bg-[#f4845f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1a2b4a]">
          Recomendado
        </span>
      </div>

      <h3 class="mt-3 text-2xl font-semibold tracking-tight">VIP</h3>
      <p class="mt-2 text-sm leading-relaxed text-white/80">
        Tableros y proyectos ilimitados, con el asistente de IA incluido.
      </p>

      <div class="mt-8 border-b border-white/10 pb-8">
        <p class="flex items-baseline gap-2">
          <span class="text-5xl font-semibold tracking-tight">${{ vipPriceUsd }}</span>
          <span class="text-base font-semibold text-white/80">USD / mes</span>
        </p>
        <p class="mt-2 text-sm text-white/75">
          <span v-if="copLabel">Aprox. {{ copLabel }} · </span>cancela cuando quieras
        </p>
      </div>

      <ul class="mt-8 flex-1 space-y-3.5 text-sm text-white/90">
        <li v-for="r in rows" :key="`vip-${r.label}`" class="flex gap-3">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5bbce4]/25 text-[#5bbce4]">
            <Check :size="12" aria-hidden="true" />
          </span>
          <span>
            <template v-if="typeof r.vip === 'string'">
              {{ r.label }}: <span class="font-semibold text-white">{{ r.vip }}</span>
            </template>
            <template v-else>{{ r.label }}</template>
          </span>
        </li>
      </ul>

      <RouterLink
        :to="{ path: '/register', query: { plan: 'vip' } }"
        class="mt-9 inline-flex w-full items-center justify-center rounded-xl bg-[#f4845f] px-6 py-3.5 text-[15px] font-bold text-[#1a2b4a] shadow-[0_8px_20px_-10px_rgba(244,132,95,0.9)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        @click="rememberStartPlan('vip')"
      >
        Pasar a VIP
      </RouterLink>
    </article>
  </div>

  <p class="mt-8 text-center text-xs leading-relaxed text-[#5e6c84]">
    Precio en dólares. El cobro se hace en pesos colombianos, a la tasa del día, con Landa Pay.
  </p>
</template>
