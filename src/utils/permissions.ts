import type { User, UserRole } from '@/types'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

export function canEdit(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.member
}

export function canManageMembers(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin
}

export function canSuspendUsers(role: UserRole): boolean {
  return role === 'owner'
}

export function canDeleteWorkspace(role: UserRole): boolean {
  return role === 'owner'
}

/** Owner can remove anyone except owner; admin only member/viewer. */
export function canRemoveMember(actorRole: UserRole, targetRole: UserRole): boolean {
  if (targetRole === 'owner') return false
  if (actorRole === 'owner') return true
  if (actorRole === 'admin') return targetRole === 'member' || targetRole === 'viewer'
  return false
}

/** Owner/admin can change roles except owner; admin cannot change other admins. */
export function canChangeMemberRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (targetRole === 'owner') return false
  if (actorRole === 'owner') return true
  if (actorRole === 'admin') return targetRole === 'member' || targetRole === 'viewer'
  return false
}

export function isUserSuspended(user: Pick<User, 'suspendedAt' | 'suspendedUntil'> | null | undefined): boolean {
  if (!user?.suspendedAt) return false
  if (!user.suspendedUntil) return true
  return new Date(user.suspendedUntil).getTime() > Date.now()
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    member: 'Miembro',
    viewer: 'Observador',
  }
  return labels[role]
}

export function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  }
  return labels[priority] ?? priority
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    alta: '#e74c3c',
    media: '#f39c12',
    baja: '#27ae60',
  }
  return colors[priority] ?? '#95a5a6'
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export {
  formatDate,
  formatDateTime,
  isDueSoon,
  isCalendarOverdue as isOverdue,
} from '@/utils/datetime'
