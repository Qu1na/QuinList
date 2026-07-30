import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileAudio,
  FileVideo,
  Presentation,
  Image as ImageIcon,
} from '@lucide/vue'
import type { Component } from 'vue'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileKindLabel(mime: string, name: string): string {
  if (mime.startsWith('image/')) return 'Imagen'
  if (mime.startsWith('video/')) return 'Video'
  if (mime.startsWith('audio/')) return 'Audio'
  if (mime === 'application/pdf') return 'PDF'
  if (mime.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'Excel'
  if (mime.includes('presentation') || name.endsWith('.pptx') || name.endsWith('.ppt')) return 'PowerPoint'
  if (mime.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return 'Word'
  if (mime.includes('zip') || name.endsWith('.zip')) return 'ZIP'
  return 'Archivo'
}

export function fileKindIcon(mime: string, name: string): Component {
  if (mime.startsWith('image/')) return ImageIcon
  if (mime.startsWith('video/')) return FileVideo
  if (mime.startsWith('audio/')) return FileAudio
  if (mime.includes('spreadsheet') || name.endsWith('.xlsx')) return FileSpreadsheet
  if (mime.includes('presentation') || name.endsWith('.pptx')) return Presentation
  if (mime.includes('zip') || name.endsWith('.zip')) return FileArchive
  return FileText
}

export function isImageType(type: string) {
  return type.startsWith('image/')
}

export function isVideoType(type: string) {
  return type.startsWith('video/')
}

export function isAudioType(type: string) {
  return type.startsWith('audio/')
}

export function isPdfType(type: string) {
  return type === 'application/pdf' || type.endsWith('/pdf')
}

export type ChatFilePreviewKind = 'image' | 'pdf' | 'video' | 'file'

export function resolveChatFilePreviewKind(type: string, name: string): ChatFilePreviewKind {
  if (isImageType(type)) return 'image'
  if (isPdfType(type) || name.toLowerCase().endsWith('.pdf')) return 'pdf'
  if (isVideoType(type)) return 'video'
  return 'file'
}

export function createFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeFilePreviewUrl(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url)
}
