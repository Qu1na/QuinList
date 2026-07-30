<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectActivity } from '@/types/projects'
import { getActivityParts } from '@/utils/activityFormat'

const props = defineProps<{
  activity: ProjectActivity
  userName: string
}>()

const parts = computed(() => getActivityParts(props.activity, props.userName))
</script>

<template>
  <span class="activity-line">
    <component
      :is="parts.icon"
      :size="13"
      class="activity-line__icon"
      :style="{ color: parts.accent }"
      aria-hidden="true"
    />
    <span class="activity-line__user">{{ parts.userName }}</span>
    <span class="activity-line__verb" :style="{ color: parts.accent }">{{ parts.verb }}</span>
  </span>
</template>

<style scoped>
.activity-line {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  line-height: 1.45;
}

.activity-line__icon {
  flex-shrink: 0;
}

.activity-line__user {
  font-weight: 600;
  color: #172b4d;
}

.activity-line__verb {
  font-weight: 700;
}
</style>
