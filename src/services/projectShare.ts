import type { ProjectShareLink } from '@/types/projects'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { matuRealtimeTableChannel } from '@/lib/matuRealtime'
import { generateId } from '@/utils/permissions'

const LOCAL_KEY = 'quinlist_project_share_links'

export class ProjectShareError extends Error {
  constructor(
    message: string,
    public code: 'expired' | 'not_found' | 'disabled',
  ) {
    super(message)
    this.name = 'ProjectShareError'
  }
}

function createToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20)
}

function loadLocal(): ProjectShareLink[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as ProjectShareLink[]
  } catch {
    /* ignore */
  }
  return []
}

function saveLocal(links: ProjectShareLink[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(links))
}

function toShareLink(row: Record<string, unknown>): ProjectShareLink {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    token: row.token as string,
    role: (row.role as ProjectShareLink['role']) ?? 'viewer',
    expiresAt: (row.expires_at as string) ?? null,
    enabled: row.enabled !== false,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
  }
}

export function buildProjectShareUrl(token: string): string {
  return `${window.location.origin}/share/project/${token}`
}

export async function createProjectShareLink(
  projectId: string,
  createdBy: string,
  options: { expiresInMinutes?: number | null; role?: ProjectShareLink['role'] },
): Promise<ProjectShareLink> {
  const expiresAt =
    options.expiresInMinutes != null
      ? new Date(Date.now() + options.expiresInMinutes * 60_000).toISOString()
      : null

  const link: ProjectShareLink = {
    id: generateId(),
    projectId,
    token: createToken(),
    role: options.role ?? 'viewer',
    expiresAt,
    enabled: true,
    createdBy,
    createdAt: new Date().toISOString(),
  }

  if (!isMatuConfigured()) {
    const local = loadLocal()
    local.push(link)
    saveLocal(local)
    return link
  }

  const db = getMatuClient()
  const { error } = await db.from('project_share_links').insert({
    id: link.id,
    project_id: link.projectId,
    token: link.token,
    role: link.role,
    expires_at: link.expiresAt,
    enabled: link.enabled,
    created_by: link.createdBy,
    created_at: link.createdAt,
  })

  if (error) throw new Error(error.message)
  return link
}

export async function getProjectShareLinks(projectId: string): Promise<ProjectShareLink[]> {
  if (!isMatuConfigured()) {
    return loadLocal().filter((l) => l.projectId === projectId)
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('project_share_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data as Record<string, unknown>[]) ?? []).map(toShareLink)
}

export async function revokeProjectShareLink(linkId: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(loadLocal().map((l) => (l.id === linkId ? { ...l, enabled: false } : l)))
    return
  }

  const db = getMatuClient()
  const { error } = await db.from('project_share_links').eq('id', linkId).update({ enabled: false })
  if (error) throw new Error(error.message)
}

export async function resolveProjectShareToken(token: string): Promise<ProjectShareLink> {
  let link: ProjectShareLink | undefined

  if (!isMatuConfigured()) {
    link = loadLocal().find((l) => l.token === token)
  } else {
    const db = getMatuClient()
    const { data, error } = await db
      .from('project_share_links')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (data) link = toShareLink(data as Record<string, unknown>)
  }

  if (!link) throw new ProjectShareError('Enlace no encontrado', 'not_found')
  if (!link.enabled) throw new ProjectShareError('Este enlace fue desactivado', 'disabled')
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    throw new ProjectShareError('Este enlace expiró', 'expired')
  }

  return link
}

export function subscribeProjectShareRealtime(onChange: () => void): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  const channel = db
    .channel(matuRealtimeTableChannel('project_share_links'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'project_share_links' }, () => {
      onChange()
    })
    .subscribe()

  return () => {
    db.removeChannel(channel)
  }
}
