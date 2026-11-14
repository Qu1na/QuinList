<script setup lang="ts">
import { useBillingStore } from '@/stores/billing'

withDefaults(
  defineProps<{
    size?: 'sm' | 'md'
    /** onDark = header azul; onLight = menús y páginas claras */
    tone?: 'onDark' | 'onLight'
  }>(),
  { size: 'sm', tone: 'onDark' },
)

const billing = useBillingStore()
</script>

<template>
  <span
    class="inline-flex items-center font-semibold tracking-wide"
    :class="[
      size === 'sm' ? 'rounded-full px-2 py-0.5 text-[11px]' : 'rounded-md px-2.5 py-1 text-xs',
      billing.isVip
        ? tone === 'onDark'
          ? 'bg-[#fca700] text-[#172b4d]'
          : 'bg-[#6554c0] text-white'
        : tone === 'onDark'
          ? 'bg-white/20 text-white ring-1 ring-white/35'
          : 'bg-[#091e420f] text-[#44546f] ring-1 ring-[#091e421f]',
    ]"
    :title="billing.isVip ? 'Tu plan es VIP' : 'Tu plan es Gratis'"
  >
    {{ billing.planLabel }}
  </span>
</template>
