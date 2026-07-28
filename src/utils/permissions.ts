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

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false
  const due = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 3
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const due = new Date(dateStr + 'T23:59:59')
  return due < new Date()
}
