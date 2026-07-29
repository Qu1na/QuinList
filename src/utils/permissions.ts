import type { UserRole } from '@/types'

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

export function canDeleteWorkspace(role: UserRole): boolean {
  return role === 'owner'
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
