<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProjectShell from '@/components/projects/ProjectShell.vue'
import ProjectDashboardTab from '@/components/projects/tabs/ProjectDashboardTab.vue'
import ProjectInfoTab from '@/components/projects/tabs/ProjectInfoTab.vue'
import ProjectTasksTab from '@/components/projects/tabs/ProjectTasksTab.vue'
import ProjectGanttTab from '@/components/projects/tabs/ProjectGanttTab.vue'
import ProjectFinanceTab from '@/components/projects/tabs/ProjectFinanceTab.vue'
import ProjectMilestonesTab from '@/components/projects/tabs/ProjectMilestonesTab.vue'
import ProjectTeamTab from '@/components/projects/tabs/ProjectTeamTab.vue'
import ProjectDeliverablesTab from '@/components/projects/tabs/ProjectDeliverablesTab.vue'
import ProjectRisksTab from '@/components/projects/tabs/ProjectRisksTab.vue'
import ProjectDocumentsTab from '@/components/projects/tabs/ProjectDocumentsTab.vue'
import ProjectFilesTab from '@/components/projects/tabs/ProjectFilesTab.vue'
import ProjectActivityTab from '@/components/projects/tabs/ProjectActivityTab.vue'
import ProjectReportsTab from '@/components/projects/tabs/ProjectReportsTab.vue'
import ProjectSettingsTab from '@/components/projects/tabs/ProjectSettingsTab.vue'
import type { ProjectDetailTab } from '@/types/projects'
import { useProjectsStore } from '@/stores/projects'
import { useQuinListStore } from '@/stores/quinlist'

const route = useRoute()
const projectsStore = useProjectsStore()
const quinlist = useQuinListStore()

const projectId = computed(() => route.params.projectId as string)
const activeTab = computed(() => (route.query.tab as ProjectDetailTab) || 'dashboard')

const tabComponents: Record<ProjectDetailTab, object> = {
  dashboard: ProjectDashboardTab,
  info: ProjectInfoTab,
  tasks: ProjectTasksTab,
  gantt: ProjectGanttTab,
  finance: ProjectFinanceTab,
  milestones: ProjectMilestonesTab,
  team: ProjectTeamTab,
  deliverables: ProjectDeliverablesTab,
  risks: ProjectRisksTab,
  documents: ProjectDocumentsTab,
  files: ProjectFilesTab,
  activity: ProjectActivityTab,
  reports: ProjectReportsTab,
  settings: ProjectSettingsTab,
}

onMounted(() => {
  projectsStore.setCurrentProject(projectId.value)
})

watch(projectId, (id) => {
  projectsStore.setCurrentProject(id)
})

watch(
  () => quinlist.currentWorkspaceId,
  (wsId) => {
    void projectsStore.reloadForWorkspace(wsId)
  },
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <ProjectShell :project-id="projectId">
      <component :is="tabComponents[activeTab]" :project-id="projectId" />
    </ProjectShell>
  </div>
</template>
