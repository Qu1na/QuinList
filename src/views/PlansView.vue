<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, Sparkles } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useBillingStore } from '@/stores/billing'
import { useProjectsStore } from '@/stores/projects'
import { formatMoney } from '@/utils/currency'

const billing = useBillingStore()
const projects = useProjectsStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const priceUsd = computed(() => billing.offer.vipPriceUsd)
const priceCop = computed(() =>
  billing.offer.vipPriceCop ? formatMoney(billing.offer.vipPriceCop, 'COP') : '',
)

const boardUsage = computed(() => {
  const userId = auth.currentUserId
  if (!userId) return 0
  return billing.countOwnedBoards(userId)
})

const projectUsage = computed(() => {
  const userId = auth.currentUserId
  if (!userId) return 0
  return billing.countOwnedProjects(userId)
})

const periodEnd = computed(() => {
  const raw = billing.subscription?.currentPeriodEnd
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
})

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
  <div class="mx-auto w-full max-w-4xl px-6 py-8">
    <div class="mb-8">
      <p class="text-xs font-semibold tracking-wide text-[#6554c0] uppercase">Planes</p>
      <h1 class="mt-1 text-2xl font-bold text-[#172b4d]">Elige cómo trabajar en QuinList</h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-[#626f86]">
        Gratis incluye un tablero y un proyecto. VIP son ${{ priceUsd }} USD al mes: ilimitado y con
        asistente de IA. Landa Pay lo cobra en pesos a la tasa del día.
      </p>
    </div>

    <p v-if="billing.checkoutError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ billing.checkoutError }}
    </p>

    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-2xl border border-[#091e4221] bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-[#172b4d]">Gratis</h2>
          <span
            v-if="!billing.isVip"
            class="rounded-full bg-[#091e420f] px-2.5 py-1 text-xs font-semibold text-[#44546f]"
          >
            Plan actual
          </span>
        </div>
        <p class="mt-3 text-3xl font-extrabold text-[#172b4d]">{{ formatMoney(0, 'COP') }}</p>
        <p class="text-sm text-[#626f86]">Para empezar</p>
        <ul class="mt-5 space-y-2 text-sm text-[#172b4d]">
          <li class="flex items-start gap-2">
            <Check :size="16" class="mt-0.5 shrink-0 text-emerald-600" />
            1 tablero
            <span v-if="!billing.isVip" class="text-[#626f86]">· {{ boardUsage }} en uso</span>
          </li>
          <li class="flex items-start gap-2">
            <Check :size="16" class="mt-0.5 shrink-0 text-emerald-600" />
            1 proyecto
            <span v-if="!billing.isVip" class="text-[#626f86]">· {{ projectUsage }} en uso</span>
          </li>
          <li class="flex items-start gap-2 text-[#626f86]">
            <Check :size="16" class="mt-0.5 shrink-0" />
            Sin asistente de IA
          </li>
        </ul>
      </section>

      <section class="rounded-2xl border border-[#6554c0] bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-bold text-[#172b4d]">
            <Sparkles :size="18" class="text-[#6554c0]" />
            VIP
          </h2>
          <span
            v-if="billing.isVip"
            class="rounded-full bg-[#6554c0] px-2.5 py-1 text-xs font-semibold text-white"
          >
            Plan actual
          </span>
        </div>
        <p class="mt-3 text-4xl font-extrabold text-[#172b4d]">${{ priceUsd }} <span class="text-lg">USD</span></p>
        <p class="text-sm text-[#626f86]">
          al mes<span v-if="priceCop"> · aprox. {{ priceCop }}</span>
        </p>
        <ul class="mt-5 space-y-2 text-sm text-[#172b4d]">
          <li class="flex items-start gap-2">
            <Check :size="16" class="mt-0.5 shrink-0 text-[#6554c0]" />
            Tableros ilimitados
          </li>
          <li class="flex items-start gap-2">
            <Check :size="16" class="mt-0.5 shrink-0 text-[#6554c0]" />
            Proyectos ilimitados
          </li>
          <li class="flex items-start gap-2">
            <Check :size="16" class="mt-0.5 shrink-0 text-[#6554c0]" />
            Asistente de IA
          </li>
        </ul>
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
  </div>
</template>
