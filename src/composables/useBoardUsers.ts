import type { Ref } from 'vue'
import { computed } from 'vue'
import type { Card, User } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useBoardShareStore } from '@/stores/boardShare'
import { loadProfilesByIds } from '@/services/boardShare'

export function useBoardUsers(boardId: Ref<string | undefined>) {
  const auth = useAuthStore()
  const boardShare = useBoardShareStore()

  function resolveUser(userId: string | null | undefined): User | undefined {
    if (!userId) return undefined

    const fromAuth = auth.getUserById(userId)
    if (fromAuth) return fromAuth

    if (boardShare.participantsBoardId === boardId.value) {
      return boardShare.participants.find((p) => p.user.id === userId)?.user
    }

    return undefined
  }

  const hasMultipleParticipants = computed(() => {
    if (boardShare.participantsBoardId !== boardId.value) return false
    return boardShare.participants.length > 1
  })

  function getCardUsers(card: Card): User[] {
    const seen = new Set<string>()
    const users: User[] = []

    if (card.createdBy) {
      const creator = resolveUser(card.createdBy)
      if (creator) {
        seen.add(creator.id)
        users.push(creator)
      }
    }

    for (const id of card.assigneeIds) {
      if (seen.has(id)) continue
      const user = resolveUser(id)
      if (user) {
        seen.add(id)
        users.push(user)
      }
    }

    return users
  }

  return { resolveUser, getCardUsers, hasMultipleParticipants }
}

export async function ensureCardUserProfiles(cards: Card[]): Promise<void> {
  const auth = useAuthStore()
  const ids = new Set<string>()

  for (const card of cards) {
    if (card.createdBy) ids.add(card.createdBy)
    for (const id of card.assigneeIds) ids.add(id)
    for (const comment of card.comments) ids.add(comment.userId)
  }

  const missing = [...ids].filter((id) => !auth.getUserById(id))
  if (!missing.length) return

  try {
    const profiles = await loadProfilesByIds(missing)
    for (const user of profiles) auth.addUser(user)
  } catch (err) {
    console.error('Error cargando perfiles de tarjetas:', err)
  }
}
