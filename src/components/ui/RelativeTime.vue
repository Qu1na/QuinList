<script setup lang="ts">
import { useRelativeTime } from '@/composables/useRelativeTime'
import { formatInstantDateTime } from '@/utils/datetime'

const props = defineProps<{
  iso: string
}>()

const label = useRelativeTime(() => props.iso)
</script>

<template>
  <time :datetime="iso" :title="formatInstantDateTime(iso)">{{ label }}</time>
</template>
