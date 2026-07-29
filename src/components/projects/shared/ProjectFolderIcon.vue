<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectStatus } from '@/types/projects'

const props = withDefaults(
  defineProps<{
    name: string
    status?: ProjectStatus
    progress?: number
    selected?: boolean
  }>(),
  { status: 'active', progress: 0, selected: false },
)

const folderColor = computed(() => {
  const map: Record<ProjectStatus, string> = {
    planning: '#5b8fd9',
    active: '#0c66e4',
    on_hold: '#e56910',
    completed: '#22a06b',
    cancelled: '#8c9bab',
  }
  return map[props.status]
})
</script>

<template>
  <div
    class="project-folder"
    :class="{ 'project-folder--selected': selected }"
    :title="name"
  >
    <div class="project-folder__icon-wrap">
      <svg viewBox="0 0 64 52" class="project-folder__svg" aria-hidden="true">
        <path
          d="M4 14c0-2.2 1.8-4 4-4h16l6 6h26c2.2 0 4 1.8 4 4v24c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V14z"
          :fill="folderColor"
          opacity="0.92"
        />
        <path
          d="M4 18h56v26c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V18z"
          :fill="folderColor"
        />
        <path
          d="M8 10h15l5 5h28c1.1 0 2 .9 2 2v1H4v-1c0-3.3 2.7-6 6-6z"
          :fill="folderColor"
          opacity="0.55"
        />
      </svg>
      <span v-if="progress > 0" class="project-folder__badge">{{ progress }}%</span>
    </div>
    <p class="project-folder__label">{{ name }}</p>
  </div>
</template>
