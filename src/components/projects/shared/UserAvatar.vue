<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    userId: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const auth = useAuthStore()

const user = computed(() => auth.getUserById(props.userId))

const AVATAR_COLORS = ['#6554c0', '#2d7eb8', '#f4845f', '#5bbce4', '#10b981', '#e56910', '#cd5a91']

const bg = computed(() => {
  let hash = 0
  for (let i = 0; i < props.userId.length; i++) hash += props.userId.charCodeAt(i)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-7 w-7 text-[10px]'
  if (props.size === 'lg') return 'h-11 w-11 text-sm'
  return 'h-9 w-9 text-xs'
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
    :class="sizeClass"
    :style="{ background: bg }"
    :title="user?.name"
  >
    {{ user?.initials ?? '?' }}
  </span>
</template>
