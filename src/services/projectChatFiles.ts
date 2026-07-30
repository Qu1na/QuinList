import type { ChatAttachment } from '@/types'
import { validateChatFile } from '@/services/storage'
import { useProjectsStore } from '@/stores/projects'

export const CHAT_DRIVE_FOLDER = 'General'
export const CHAT_CHANNEL_LABEL = '#general'

/** Sube un archivo del chat a Documentación (carpeta General) y lo deja visible en Drive. */
export async function registerChatFileInProject(
  projectId: string,
  file: File,
): Promise<ChatAttachment> {
  validateChatFile(file)

  const projectsStore = useProjectsStore()
  const attachment = await projectsStore.registerChatDocumentFile(projectId, file, {
    folderName: CHAT_DRIVE_FOLDER,
    channelLabel: CHAT_CHANNEL_LABEL,
    category: 'Chat',
  })

  return {
    name: attachment.name,
    url: attachment.url,
    type: attachment.type,
    size: attachment.size,
  }
}
