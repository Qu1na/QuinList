import { computed, type ComputedRef } from 'vue'
import type { Project, ProjectMember } from '@/types/projects'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'

export function isWorkspaceMember(workspaceId: string, userId: string | null): boolean {
  if (!userId) return false
  const quinlist = useQuinListStore()
  const ws = quinlist.workspaces.find((w) => w.id === workspaceId)
  return ws?.members.some((m) => m.userId === userId) ?? false
}

export function getProjectMembership(
  members: ProjectMember[],
  projectId: string,
  userId: string | null,
): ProjectMember | null {
  if (!userId) return null
  return members.find((m) => m.projectId === projectId && m.userId === userId) ?? null
}

export function isSharedOnlyProject(project: Project, userId: string | null): boolean {
  if (!userId) return false
  return !isWorkspaceMember(project.workspaceId, userId)
}

export interface ProjectAccess {
  membership: ComputedRef<ProjectMember | null>
  hasAccess: ComputedRef<boolean>
  isSharedOnly: ComputedRef<boolean>
  canViewFinance: ComputedRef<boolean>
  canManageTasks: ComputedRef<boolean>
  canManageTeam: ComputedRef<boolean>
  canEditProject: ComputedRef<boolean>
}

export function useProjectAccess(projectId: string): ProjectAccess {
  const projectsStore = useProjectsStore()
  const auth = useAuthStore()
  const quinlist = useQuinListStore()

  const project = computed(() => projectsStore.getProject(projectId))

  const membership = computed(() =>
    getProjectMembership(
      projectsStore.getProjectMembers(projectId),
      projectId,
      auth.currentUserId,
    ),
  )

  const isWorkspaceAdmin = computed(() => {
    const wsId = project.value?.workspaceId
    if (!wsId) return false
    const role = quinlist.getUserRole(wsId)
    return role === 'owner' || role === 'admin'
  })

  const isWsMember = computed(() => {
    const wsId = project.value?.workspaceId
    if (!wsId) return false
    return isWorkspaceMember(wsId, auth.currentUserId)
  })

  const hasAccess = computed(
    () => Boolean(membership.value) || (isWsMember.value && Boolean(project.value)),
  )

  const isSharedOnly = computed(() => {
    if (!project.value || !auth.currentUserId) return false
    return Boolean(membership.value) && !isWsMember.value
  })

  const canViewFinance = computed(
    () => isWorkspaceAdmin.value || Boolean(membership.value?.canViewFinance),
  )

  const canManageTasks = computed(
    () => isWorkspaceAdmin.value || Boolean(membership.value?.canManageTasks),
  )

  const canManageTeam = computed(
    () => isWorkspaceAdmin.value || Boolean(membership.value?.canManageTeam),
  )

  const canEditProject = computed(() => isWorkspaceAdmin.value || isWsMember.value)

  return {
    membership,
    hasAccess,
    isSharedOnly,
    canViewFinance,
    canManageTasks,
    canManageTeam,
    canEditProject,
  }
}
