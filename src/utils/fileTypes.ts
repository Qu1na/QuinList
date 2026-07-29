import type { Component } from 'vue'
import {
  FileImage,
  FileVideo,
  FileText,
  FileSpreadsheet,
  FileAudio,
  FileArchive,
  File,
  FileType,
  Folder,
} from '@lucide/vue'

export type FileKind =
  | 'folder'
  | 'image'
  | 'video'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'archive'
  | 'audio'
  | 'text'
  | 'generic'

export interface FileTypeInfo {
  kind: FileKind
  label: string
  color: string
  bg: string
  icon: Component
}

export function isImageType(type: string, name?: string): boolean {
  if (type.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name ?? '')
}

export function isVideoType(type: string, name?: string): boolean {
  if (type.startsWith('video/')) return true
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(name ?? '')
}

export function getFileKind(type: string, name = ''): Exclude<FileKind, 'folder'> {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (isImageType(type, name)) return 'image'
  if (isVideoType(type, name)) return 'video'
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (
    type.includes('word') ||
    type.includes('msword') ||
    ['doc', 'docx', 'odt', 'rtf'].includes(ext)
  ) {
    return 'word'
  }
  if (
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  ) {
    return 'excel'
  }
  if (type.includes('presentation') || ['ppt', 'pptx', 'odp'].includes(ext)) return 'powerpoint'
  if (type.includes('zip') || type.includes('archive') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'archive'
  }
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio'
  if (type.startsWith('text/') || ['txt', 'md', 'json', 'xml'].includes(ext)) return 'text'
  return 'generic'
}

const KIND_META: Record<Exclude<FileKind, 'folder'>, Omit<FileTypeInfo, 'kind'>> = {
  image: { label: 'Imagen', color: '#2d7eb8', bg: '#eef6fc', icon: FileImage },
  video: { label: 'Video', color: '#6554c0', bg: '#f3f0ff', icon: FileVideo },
  pdf: { label: 'PDF', color: '#e8754f', bg: '#fef0ec', icon: FileText },
  word: { label: 'Word', color: '#2563eb', bg: '#eff6ff', icon: FileType },
  excel: { label: 'Excel', color: '#10b981', bg: '#ecfdf5', icon: FileSpreadsheet },
  powerpoint: { label: 'PowerPoint', color: '#f4845f', bg: '#fef3ef', icon: FileType },
  archive: { label: 'Comprimido', color: '#8e8e93', bg: '#f5f5f7', icon: FileArchive },
  audio: { label: 'Audio', color: '#6554c0', bg: '#f3f0ff', icon: FileAudio },
  text: { label: 'Texto', color: '#626f86', bg: '#f5f5f7', icon: FileText },
  generic: { label: 'Archivo', color: '#626f86', bg: '#f5f5f7', icon: File },
}

export function getFileTypeInfo(type: string, name = ''): FileTypeInfo {
  const kind = getFileKind(type, name)
  const meta = KIND_META[kind]
  return { kind, ...meta }
}

export function getFolderTypeInfo(): FileTypeInfo {
  return {
    kind: 'folder',
    label: 'Carpeta',
    color: '#5bbce4',
    bg: '#eef6fc',
    icon: Folder,
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
