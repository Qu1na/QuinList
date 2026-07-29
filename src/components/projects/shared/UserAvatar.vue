<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { avatarColor, getInitials, hasAvatarImage } from '@/utils/avatar'

const props = withDefaults(
  defineProps<{
    userId: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const auth = useAuthStore()

const user = computed(() => auth.getUserById(props.userId))

const titleAttr = computed(() => {
  const u = user.value
  if (u?.name) return u.name
  if (u?.email) return u.email
  return undefined
})

const initials = computed(() => {
  const u = user.value
  if (u?.initials) return u.initials
  if (u?.name || u?.email) return getInitials(u.name, u.email)
  return '?'
})

const bg = computed(() => avatarColor(props.userId))

const imageUrl = computed(() => {
  const url = user.value?.avatar
  return hasAvatarImage(url) ? url : null
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-7 w-7 text-[10px]'
  if (props.size === 'lg') return 'h-11 w-11 text-sm'
  return 'h-9 w-9 text-xs'
})
</script>

<template>
  <span
    v-bind="$attrs"
    class="user-avatar inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-sm ring-2 ring-white"
    :class="sizeClass"
    :style="imageUrl ? undefined : { background: bg }"
    :title="user?.name ?? titleAttr"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="user?.name ?? 'Avatar'"
      class="h-full w-full object-cover"
    />
    <span v-else>{{ initials }}</span>
  </span>
</template>
