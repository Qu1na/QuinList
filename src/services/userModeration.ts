import type { User } from '@/types'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { isUserSuspended } from '@/utils/permissions'

export type SuspendDuration = 7 | 30 | null

interface DbProfileModeration {
  id: string
  name: string
  email: string
  avatar?: string
  initials: string
  suspended_at?: string | null
  suspended_until?: string | null
  suspended_reason?: string | null
  suspended_by?: string | null
  last_login_at?: string | null
}

export function profileToUser(row: DbProfileModeration): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? '',
    initials: row.initials,
    suspendedAt: row.suspended_at ?? null,
    suspendedUntil: row.suspended_until ?? null,
    suspendedReason: row.suspended_reason ?? null,
    suspendedBy: row.suspended_by ?? null,
    lastLoginAt: row.last_login_at ?? null,
  }
}

export async function loadProfileById(userId: string): Promise<User | null> {
  if (!isMatuConfigured()) return null
  const db = getMatuClient()
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error || !data) return null
  return profileToUser(data as DbProfileModeration)
}

export async function touchLastLogin(userId: string): Promise<void> {
  if (!isMatuConfigured()) return
  const db = getMatuClient()
  const now = new Date().toISOString()
  await db.from('profiles').eq('id', userId).update({ last_login_at: now })
}

export async function suspendUser(
  userId: string,
  suspendedBy: string,
  options: { days: SuspendDuration; reason?: string },
): Promise<User> {
  if (!isMatuConfigured()) {
    throw new Error('MatuDB no está configurado')
  }
  const db = getMatuClient()
  const now = new Date()
  const until =
    options.days == null
      ? null
      : new Date(now.getTime() + options.days * 86_400_000).toISOString()

  const payload = {
    suspended_at: now.toISOString(),
    suspended_until: until,
    suspended_reason: options.reason?.trim() || null,
    suspended_by: suspendedBy,
  }

  const { error } = await db.from('profiles').eq('id', userId).update(payload)
  if (error) throw new Error(error.message)

  const profile = await loadProfileById(userId)
  if (!profile) throw new Error('No se pudo cargar el perfil suspendido')
  return profile
}

export async function unsuspendUser(userId: string): Promise<User> {
  if (!isMatuConfigured()) {
    throw new Error('MatuDB no está configurado')
  }
  const db = getMatuClient()
  const { error } = await db.from('profiles').eq('id', userId).update({
    suspended_at: null,
    suspended_until: null,
    suspended_reason: null,
    suspended_by: null,
  })
  if (error) throw new Error(error.message)

  const profile = await loadProfileById(userId)
  if (!profile) throw new Error('No se pudo cargar el perfil')
  return profile
}

export function suspensionMessage(user: User): string {
  if (!isUserSuspended(user)) return ''
  if (user.suspendedUntil) {
    const until = new Date(user.suspendedUntil).toLocaleDateString('es', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return user.suspendedReason
      ? `Tu cuenta está suspendida hasta el ${until}. Motivo: ${user.suspendedReason}`
      : `Tu cuenta está suspendida hasta el ${until}.`
  }
  return user.suspendedReason
    ? `Tu cuenta está suspendida. Motivo: ${user.suspendedReason}`
    : 'Tu cuenta está suspendida y no puedes acceder a la plataforma.'
}
