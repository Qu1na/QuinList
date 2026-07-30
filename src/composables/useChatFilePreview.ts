import { ref, shallowRef } from 'vue'
import { resolveChatFilePreviewKind, type ChatFilePreviewKind } from '@/utils/chatFilePreview'

export interface ChatFilePreview {
  url: string
  name: string
  type: string
  size?: number
  kind: ChatFilePreviewKind
}

const open = ref(false)
const file = shallowRef<ChatFilePreview | null>(null)

export function useChatFilePreview() {
  function show(url: string, name: string, type: string, size?: number) {
    if (!url) return
    file.value = {
      url,
      name: name || 'archivo',
      type: type || 'application/octet-stream',
      size,
      kind: resolveChatFilePreviewKind(type, name),
    }
    open.value = true
  }

  function close() {
    open.value = false
    file.value = null
  }

  async function downloadCurrent() {
    const current = file.value
    if (!current) return

    const { url, name } = current
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = name
      anchor.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = name
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.click()
    }
  }

  return { open, file, show, close, downloadCurrent }
}

/** @deprecated Usa useChatFilePreview */
export function useChatImageLightbox() {
  const preview = useChatFilePreview()
  return {
    open: preview.open,
    image: preview.file,
    show: (url: string, name: string) =>
      preview.show(url, name, 'image/jpeg'),
    close: preview.close,
    downloadCurrent: preview.downloadCurrent,
  }
}
