<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import { useBillingStore } from '@/stores/billing'

const props = withDefaults(
  defineProps<{
    context?: 'home' | 'projects' | 'boards'
  }>(),
  { context: 'home' },
)

const billing = useBillingStore()
const router = useRouter()
const dismissed = ref(false)

watch(
  () => billing.isVip,
  (vip) => {
    if (vip) dismissed.value = false
  },
)

const visible = computed(() => {
  if (billing.isVip || dismissed.value || !billing.ready) return false
  if (props.context === 'projects') return billing.projectLimitReached
  if (props.context === 'boards') return billing.boardLimitReached
  return billing.freeLimitReached
})

const summary = computed(() => {
  const boardHit = billing.boardLimitReached
  const projectHit = billing.projectLimitReached
  if (props.context === 'projects' || (projectHit && !boardHit)) {
    return 'Límite de proyectos del plan Gratis'
  }
  if (props.context === 'boards' || (boardHit && !projectHit)) {
    return 'Límite de tableros del plan Gratis'
  }
  return 'Límite del plan Gratis alcanzado'
})
</script>

<template>
  <aside
    v-if="visible"
    class="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#091e4214] bg-[#f7f8f9] py-1.5 pr-1.5 pl-2.5 text-[12px] text-[#44546f]"
    role="status"
  >
    <p class="min-w-0 truncate">
      {{ summary }}.
      <button
        type="button"
        class="font-semibold text-[#0c66e4] hover:underline"
        @click="router.push({ name: 'plans' })"
      >
        Pasar a VIP
      </button>
    </p>
    <button
      type="button"
      class="shrink-0 rounded p-0.5 text-[#626f86] hover:bg-[#091e420f] hover:text-[#172b4d]"
      aria-label="Ocultar aviso"
      @click="dismissed = true"
    >
      <X :size="14" />
    </button>
  </aside>
</template>
