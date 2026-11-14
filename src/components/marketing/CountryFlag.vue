<script setup lang="ts">
/**
 * Bandera por código ISO-3166 alpha-2 (PNG local).
 * No usa emoji: en Windows no se renderizan las banderas regionales.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ code?: string; size?: number }>(),
  { size: 16 },
)

const src = computed(() => {
  const code = props.code?.toLowerCase()
  if (!code || code.length !== 2) return ''
  return `/image/flags/${code}.png`
})

const height = computed(() => Math.round(props.size * 0.75))
</script>

<template>
  <img
    v-if="src"
    :src="src"
    alt=""
    :width="size"
    :height="height"
    class="inline-block shrink-0 rounded-[2px] object-cover"
    loading="lazy"
    decoding="async"
    aria-hidden="true"
  />
</template>
