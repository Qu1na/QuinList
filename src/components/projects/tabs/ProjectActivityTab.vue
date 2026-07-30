<script setup lang="ts">
import { computed } from 'vue'
import { Activity, Users, Clock } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import { useProjectUsers } from '@/composables/useProjectUsers'
import ActivityLine from '@/components/projects/shared/ActivityLine.vue'
import { compareInstants } from '@/utils/datetime'
import RelativeTime from '@/components/ui/RelativeTime.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()

const activities = computed(() =>
  [...projectsStore.getProjectActivities(props.projectId)].sort((a, b) =>
    compareInstants(b.createdAt, a.createdAt),
  ),
)

const uniqueUsers = computed(() => new Set(activities.value.map((a) => a.userId)).size)

const lastSevenDays = computed(() => {
  const sevenDaysAgoMs = Date.now() - 7 * 86_400_000
  return activities.value.filter((a) => new Date(a.createdAt).getTime() >= sevenDaysAgoMs).length
})

function userName(id: string) {
  return resolveUser(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div class="space-y-7">
    <div>
      <h2 class="project-page-title">Actividad</h2>
      <p class="project-page-sub">Historial completo de acciones en el proyecto</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="project-card project-kpi">
        <Activity :size="20" class="mb-2 text-[#5bbce4]" />
        <p class="project-kpi__value">{{ activities.length }}</p>
        <p class="project-kpi__label">Eventos registrados</p>
      </div>
      <div class="project-card project-kpi">
        <Users :size="20" class="mb-2 text-[#2d7eb8]" />
        <p class="project-kpi__value">{{ uniqueUsers }}</p>
        <p class="project-kpi__label">Colaboradores activos</p>
      </div>
      <div class="project-card project-kpi">
        <Clock :size="20" class="mb-2 text-[#f4845f]" />
        <p class="project-kpi__value">{{ lastSevenDays }}</p>
        <p class="project-kpi__label">Últimos 7 días</p>
      </div>
    </div>

    <div class="project-card project-card--lg">
      <h3 class="mb-5 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
        <Activity :size="20" class="text-[#5bbce4]" />
        Historial de actividad
      </h3>

      <ul v-if="activities.length" class="divide-y divide-[#ebebed]">
        <li
          v-for="act in activities"
          :key="act.id"
          class="flex gap-4 py-4 first:pt-0 last:pb-0"
        >
          <UserAvatar :user-id="act.userId" size="md" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <ActivityLine :activity="act" :user-name="userName(act.userId)" class="text-sm" />
            </div>
            <p v-if="act.details && act.entityTitle !== act.details" class="mt-0.5 text-sm text-[#626f86]">{{ act.details }}</p>
            <RelativeTime :iso="act.createdAt" class="mt-1.5 text-xs font-medium text-[#626f86]" />
          </div>
        </li>
      </ul>

      <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin actividad registrada.</p>
    </div>
  </div>
</template>
