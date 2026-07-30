import type { Attachment } from '@/types'
import { getMatuClient, getMatuUrl, isMatuConfigured } from '@/lib/matu'

/**
 * MatuDB project storage (flat namespace per project):
 * - Upload → server assigns UUID filename, returns public `url`
 * - Public read → GET /api/projects/{projectId}/storage/{filename} (no auth)
 *
 * Logical paths live in `original` metadata only, e.g.:
 *   quinlist/boards/{boardId}/cards/{cardId}/{timestamp}-{name}.pdf
 */

export interface MatuStorageFile {
  filename: string
  original: string
  mime_type?: string
  size?: number
  url: string
}

export interface UploadedFile {
  url: string
  storageFilename: string
  original: string
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function buildCardOriginalName(boardId: string, cardId: string, fileName: string): string {
  return `quinlist/boards/${boardId}/cards/${cardId}/${Date.now()}-${sanitizeFileName(fileName)}`
}

function buildChatOriginalName(boardId: string, fileName: string): string {
  return `quinlist/boards/${boardId}/chat/${Date.now()}-${sanitizeFileName(fileName)}`
}

function parseUploadResponse(data: unknown): MatuStorageFile | null {
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  const filename = String(row.filename ?? row.name ?? '')
  const url = String(row.url ?? '')
  if (!filename || !url) return null
  return {
    filename,
    original: String(row.original ?? filename),
    mime_type: row.mime_type ? String(row.mime_type) : undefined,
    size: row.size != null ? Number(row.size) : undefined,
    url,
  }
}

export function parseStorageFilenameFromUrl(url: string): string | null {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null

  const marker = '/storage/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null

  const raw = url.slice(idx + marker.length).split('?')[0]!
  try {
    const decoded = decodeURIComponent(raw)
    const parts = decoded.split('/')
    return parts[parts.length - 1] || null
  } catch {
    const parts = raw.split('/')
    return parts[parts.length - 1] || null
  }
}

export function getAttachmentStorageFilename(
  attachment: Pick<Attachment, 'url' | 'storageFilename' | 'storagePath'>,
): string | null {
  if (attachment.storageFilename) return attachment.storageFilename
  if (attachment.storagePath) {
    const parts = attachment.storagePath.split('/')
    return parts[parts.length - 1] || attachment.storagePath
  }
  return parseStorageFilenameFromUrl(attachment.url)
}

export function getAttachmentPublicUrl(
  attachment: Pick<Attachment, 'url' | 'storageFilename' | 'storagePath'>,
): string {
  if (attachment.url.startsWith('data:') || attachment.url.startsWith('blob:')) {
    return attachment.url
  }

  const filename = getAttachmentStorageFilename(attachment)
  if (filename && isMatuConfigured()) {
    return getMatuClient().storage.getPublicUrl(filename).data.publicUrl
  }

  return attachment.url
}

function buildProjectOriginalName(
  projectId: string,
  scope: string,
  entityId: string,
  fileName: string,
): string {
  return `quinlist/projects/${projectId}/${scope}/${entityId}/${Date.now()}-${sanitizeFileName(fileName)}`
}

export async function uploadProjectFile(
  projectId: string,
  scope: string,
  entityId: string,
  file: File,
  options?: { strict?: boolean },
): Promise<UploadedFile> {
  if (!isMatuConfigured()) {
    const url = await readAsDataUrl(file)
    return { url, storageFilename: '', original: file.name }
  }

  const db = getMatuClient()
  const originalName = buildProjectOriginalName(projectId, scope, entityId, file.name)
  const { data, error } = await db.storage.upload(originalName, file)

  if (error) {
    const message = `No se pudo subir el archivo a MatuDB: ${error.message}`
    if (options?.strict) throw new Error(message)
    console.warn('Project storage upload failed, using local URL:', error.message)
    const url = await readAsDataUrl(file)
    return { url, storageFilename: '', original: file.name }
  }

  const uploaded = parseUploadResponse(data)
  if (!uploaded) {
    const message = 'Respuesta de storage inválida'
    if (options?.strict) throw new Error(message)
    throw new Error(message)
  }

  return {
    url: uploaded.url,
    storageFilename: uploaded.filename,
    original: uploaded.original,
  }
}

/** Evita guardar data URLs enormes en filas de MatuDB. */
export function attachmentForPersistence<T extends Pick<Attachment, 'url' | 'storageFilename'>>(
  attachment: T,
): T {
  if (!attachment.url.startsWith('data:') && !attachment.url.startsWith('blob:')) {
    return attachment
  }
  if (attachment.storageFilename) {
    return {
      ...attachment,
      url: getAttachmentPublicUrl(attachment as unknown as Attachment),
    }
  }
  return { ...attachment, url: '' }
}

export async function uploadCardFile(
  boardId: string,
  cardId: string,
  file: File,
): Promise<UploadedFile> {
  if (!isMatuConfigured()) {
    const url = await readAsDataUrl(file)
    return { url, storageFilename: '', original: file.name }
  }

  const db = getMatuClient()
  const originalName = buildCardOriginalName(boardId, cardId, file.name)
  const { data, error } = await db.storage.upload(originalName, file)

  if (error) {
    console.warn('Storage upload failed, using local URL:', error.message)
    const url = await readAsDataUrl(file)
    return { url, storageFilename: '', original: file.name }
  }

  const uploaded = parseUploadResponse(data)
  if (!uploaded) {
    throw new Error('Respuesta de storage inválida')
  }

  return {
    url: uploaded.url,
    storageFilename: uploaded.filename,
    original: uploaded.original,
  }
}

export async function deleteStorageFile(
  attachment: Pick<Attachment, 'storageFilename' | 'storagePath' | 'url'>,
): Promise<void> {
  if (!isMatuConfigured()) return

  const filename = getAttachmentStorageFilename(attachment)
  if (!filename) return

  const db = getMatuClient()
  const { error } = await db.storage.remove([filename])
  if (error) {
    console.warn('No se pudo eliminar el archivo del storage:', error.message)
  }
}

export async function openAttachment(attachment: Attachment): Promise<void> {
  const url = getAttachmentPublicUrl(attachment)
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function downloadAttachment(attachment: Attachment): Promise<void> {
  const url = getAttachmentPublicUrl(attachment)

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    triggerDownload(url, attachment.name)
    return
  }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    triggerDownload(blobUrl, attachment.name)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.warn('Descarga directa falló, abriendo URL pública:', err)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const CHAT_MAX_FILE_BYTES = 5 * 1024 * 1024
export const CHAT_MAX_FILE_LABEL = '5 MB'

const CHAT_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

export function validateChatFile(file: File): void {
  if (file.size > CHAT_MAX_FILE_BYTES) {
    throw new Error(`El archivo supera el límite de ${CHAT_MAX_FILE_LABEL}`)
  }
  const allowed =
    CHAT_ALLOWED_MIME.has(file.type) ||
    file.type.startsWith('image/') ||
    file.type.startsWith('text/')
  if (!allowed) {
    throw new Error('Tipo de archivo no permitido. Usa imágenes, PDF u oficina.')
  }
}

export async function uploadChatFile(boardId: string, file: File): Promise<{
  name: string
  url: string
  type: string
  size: number
  storageFilename: string
}> {
  validateChatFile(file)

  if (!isMatuConfigured()) {
    return {
      name: file.name,
      url: await readAsDataUrl(file),
      type: file.type,
      size: file.size,
      storageFilename: '',
    }
  }

  const db = getMatuClient()
  const originalName = buildChatOriginalName(boardId, file.name)
  const { data, error } = await db.storage.upload(originalName, file)

  if (error) {
    console.warn('Chat storage upload failed, using local URL:', error.message)
    return {
      name: file.name,
      url: await readAsDataUrl(file),
      type: file.type,
      size: file.size,
      storageFilename: '',
    }
  }

  const uploaded = parseUploadResponse(data)
  if (!uploaded) {
    throw new Error('Respuesta de storage inválida')
  }

  return {
    name: file.name,
    url: uploaded.url,
    type: file.type,
    size: file.size,
    storageFilename: uploaded.filename,
  }
}

export function getStorageDocsBaseUrl(): string {
  if (!isMatuConfigured()) return ''
  const projectId = import.meta.env.VITE_MATUDB_PROJECT_ID as string
  return `${getMatuUrl()}/api/projects/${projectId}/storage`
}
