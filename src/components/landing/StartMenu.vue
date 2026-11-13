<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { rememberStartPlan, type StartPlan } from '@/lib/startPlan'
import { formatMoney } from '@/utils/currency'

const props = defineProps<{
  variant?: 'menu' | 'stack'
  usd: number
  cop: number | null
}>()

const emit = defineEmits<{ navigate: [] }>()

const router = useRouter()
const auth = useAuthStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const copLabel = () => (props.cop ? formatMoney(props.cop, 'COP') : '')

function onDocumentClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

async function choose(plan: StartPlan) {
  rememberStartPlan(plan)
  open.value = false
  emit('navigate')
  if (auth.isAuthenticated && plan === 'vip') {
    await router.push({ name: 'plans', query: { checkout: '1' } })
    return
  }
  if (auth.isAuthenticated) {
    await router.push({ name: 'home' })
    return
  }
  await router.push({ name: 'register', query: { plan } })
}
</script>

<template>
  <div v-if="variant === 'stack'" class="flex flex-col gap-2">
    <button type="button" class="landing-nav-cta justify-center" @click="choose('vip')">
      VIP · ${{ usd }} USD
    </button>
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-[#121820] ring-1 ring-[#e2e6eb] hover:bg-[#f3f5f7]"
      @click="choose('free')"
    >
      Gratis
    </button>
  </div>

  <div v-else ref="root" class="relative">
    <button
      type="button"
      class="landing-nav-cta gap-1.5"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click.stop="open = !open"
    >
      Comenzar
      <ChevronDown :size="15" class="transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>

    <div
      v-if="open"
      class="start-fan absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] origin-top-right"
      role="menu"
    >
      <button
        type="button"
        class="start-fan__vip flex w-full flex-col rounded-xl bg-[#121820] px-4 py-3 text-left text-white shadow-lg"
        role="menuitem"
        @click="choose('vip')"
      >
        <span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
          Recomendado
        </span>
        <span class="mt-1 text-sm font-semibold">VIP · ${{ usd }} USD<span class="font-medium text-white/65"> / mes</span></span>
        <span v-if="copLabel()" class="text-xs text-white/55">aprox. {{ copLabel() }} en pesos</span>
        <span class="mt-1 text-xs text-white/70">Ilimitado + asistente de IA</span>
      </button>
      <button
        type="button"
        class="start-fan__free mt-2 flex w-full flex-col rounded-xl border border-[#e2e6eb] bg-white px-4 py-3 text-left shadow-md"
        role="menuitem"
        @click="choose('free')"
      >
        <span class="text-sm font-semibold text-[#121820]">Gratis</span>
        <span class="text-xs text-[#5a6573]">1 tablero y 1 proyecto</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.start-fan__vip {
  animation: fan-vip 180ms ease-out;
}
.start-fan__free {
  animation: fan-free 220ms ease-out;
}
@keyframes fan-vip {
  from {
    opacity: 0;
    transform: translateY(-8px) rotate(6deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes fan-free {
  from {
    opacity: 0;
    transform: translateY(-12px) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
