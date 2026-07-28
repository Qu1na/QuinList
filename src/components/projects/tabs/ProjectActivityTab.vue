<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/permissions'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()

const activities = computed(() => projectsStore.getProjectActivities(props.projectId))

function userName(id: string) {
  return auth.getUserById(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div class="rounded-xl border border-[#091e4214] bg-white p-6">
    <h2 class="mb-4 text-lg font-semibold text-[#172b4d]">Historial de actividad</h2>
    <ul class="space-y-4">
      <li
        v-for="act in activities"
        :key="act.id"
        class="flex gap-4 border-b border-[#091e4214] pb-4 last:border-0"
      >
        <span class="w-36 shrink-0 text-xs text-[#626f86]">{{ formatDateTime(act.createdAt) }}</span>
        <div>
          <p class="text-sm text-[#172b4d]">
            <span class="font-medium">{{ userName(act.userId) }}</span>
            — {{ act.action }}
          </p>
          <p class="text-sm text-[#626f86]">{{ act.details }}</p>
        </div>
      </li>
    </ul>
    <p v-if="!activities.length" class="text-sm text-[#626f86]">Sin actividad registrada.</p>
  </div>
</template>
