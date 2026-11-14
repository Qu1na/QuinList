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
  { label: 'Proyectos completos', free: '1', vip: 'Ilimitados' },
  { label: 'Gantt, hitos, entregables y riesgos', free: true, vip: true },
  { label: 'Presupuesto y flujo de caja', free: true, vip: true },
  { label: 'Chat, calendario y notificaciones', free: true, vip: true },
  { label: 'Roles y permisos', free: true, vip: true },
  { label: 'Asistente de IA', free: false, vip: true },
]
</script>

<template>
  <div class="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6">
    <!-- Gratis -->
    <article class="landing-reveal flex flex-col rounded-[20px] bg-white p-7 ring-1 ring-[#dfe1e6] lg:p-9">
      <p class="text-[12px] font-medium text-[#42526e]">Para empezar</p>
      <h3 class="ql-display mt-2 text-[1.75rem] font-semibold tracking-tight text-[#101214]">Gratis</h3>
      <p class="mt-1.5 text-[15px] leading-relaxed text-[#42526e]">
        Un proyecto real para probar QuinList con tu equipo.
      </p>

      <div class="mt-7 border-b border-[#f0f1f2] pb-7">
        <p class="flex items-baseline gap-2">
          <span class="ql-display text-5xl font-semibold tracking-tight text-[#101214]">$0</span>
          <span class="text-[15px] font-medium text-[#42526e]">USD</span>
        </p>
        <p class="mt-2 text-[14px] font-medium text-[#101214]">Gratis para siempre</p>
        <p class="mt-0.5 text-[13px] text-[#42526e]">Sin tarjeta de crédito</p>
      </div>

      <ul class="mt-7 flex-1 space-y-3 text-[14px] text-[#101214]">
        <li
          v-for="r in rows"
          :key="`free-${r.label}`"
          class="flex gap-3"
          :class="r.free === false ? 'text-[#97a0af]' : ''"
        >
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            :class="r.free === false ? 'bg-[#f0f1f2] text-[#97a0af]' : 'bg-[#e9f2fe] text-[#1868db]'"
          >
            <Minus v-if="r.free === false" :size="12" aria-hidden="true" />
            <Check v-else :size="12" aria-hidden="true" />
          </span>
          <span>
            <template v-if="typeof r.free === 'string'">
              {{ r.label }} · <span class="font-semibold">{{ r.free }}</span>
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
        class="ql-btn--ghost mt-8 w-full py-3 text-[15px]"
        @click="rememberStartPlan('free')"
      >
        Empezar gratis
      </RouterLink>
    </article>

    <!-- VIP -->
    <article
      class="landing-reveal relative flex flex-col overflow-hidden rounded-[20px] bg-[#101214] p-7 text-white lg:p-9"
      style="transition-delay: 80ms"
    >
      <div class="flex flex-wrap items-center gap-2.5">
        <p class="text-[12px] font-medium text-white/70">Para equipos</p>
        <span class="rounded-md bg-[#fca700] px-2 py-0.5 text-[11px] font-semibold text-[#101214]">
          Recomendado
        </span>
      </div>

      <h3 class="ql-display mt-2 text-[1.75rem] font-semibold tracking-tight">VIP</h3>
      <p class="mt-1.5 text-[15px] leading-relaxed text-white/75">
        Sin límites, con el asistente de IA incluido.
      </p>

      <div class="mt-7 border-b border-white/10 pb-7">
        <p class="flex items-baseline gap-2">
          <span class="ql-display text-5xl font-semibold tracking-tight">${{ vipPriceUsd }}</span>
          <span class="text-[15px] font-medium text-white/75">USD / mes</span>
        </p>
        <p class="mt-2 text-[14px] text-white/70">
          <span v-if="copLabel">Aprox. {{ copLabel }} · </span>cancela cuando quieras
        </p>
      </div>

      <ul class="mt-7 flex-1 space-y-3 text-[14px] text-white/90">
        <li v-for="r in rows" :key="`vip-${r.label}`" class="flex gap-3">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/12 text-white">
            <Check :size="12" aria-hidden="true" />
          </span>
          <span>
            <template v-if="typeof r.vip === 'string'">
              {{ r.label }} · <span class="font-semibold text-white">{{ r.vip }}</span>
            </template>
            <template v-else>{{ r.label }}</template>
          </span>
        </li>
      </ul>

      <RouterLink
        :to="{ path: '/register', query: { plan: 'vip' } }"
        class="ql-btn mt-8 w-full py-3 text-[15px]"
        @click="rememberStartPlan('vip')"
      >
        Pasar a VIP
      </RouterLink>
    </article>
  </div>

  <p class="landing-reveal mt-8 text-center text-[13px] leading-relaxed text-[#42526e]">
    Precio en dólares. En Colombia el cobro se hace en pesos, a la tasa del día, con Landa Pay.
  </p>
</template>
