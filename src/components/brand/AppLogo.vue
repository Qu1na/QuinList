<script setup lang="ts">
import { computed } from 'vue'

const LOGO_SRC = '/image/logo/logo-app.png'

const props = withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    class?: string
    rounded?: boolean
  }>(),
  {
    size: 'md',
    rounded: true,
  },
)

const sizeClass = computed(() => {
  const map = {
    xs: 'h-7 w-7',
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  }
  return map[props.size]
})
</script>

<template>
  <img
    :src="LOGO_SRC"
    alt="QuinList"
    class="shrink-0 object-contain"
    :class="[sizeClass, rounded ? 'rounded-[22%]' : '', props.class]"
    draggable="false"
  />
</template>
