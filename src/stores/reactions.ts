import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reaction } from '@/types/v3'
import * as reactionsApi from '@/services/reactions'
import { useAuthStore } from './auth'

export const useReactionsStore = defineStore('reactions', () => {
  const byEntity = ref<Record<string, Reaction[]>>({})
  const pending = ref<Set<string>>(new Set())

  function cacheKey(entityType: Reaction['entityType'], entityId: string) {
    return `${entityType}:${entityId}`
  }

  async function load(entityType: Reaction['entityType'], entityId: string) {
    const key = cacheKey(entityType, entityId)
    try {
      const list = await reactionsApi.listForEntity(entityType, entityId)
      byEntity.value[key] = list
    } catch (err) {
      console.error('[reactions] load error:', err)
    }
  }

  function forEntity(entityType: Reaction['entityType'], entityId: string): Reaction[] {
    return byEntity.value[cacheKey(entityType, entityId)] ?? []
  }

  function summary(entityType: Reaction['entityType'], entityId: string) {
    return reactionsApi.summarizeReactions(forEntity(entityType, entityId))
  }

  async function toggle(entityType: Reaction['entityType'], entityId: string, emoji: string) {
    const auth = useAuthStore()
    if (!auth.currentUserId) return
    const key = cacheKey(entityType, entityId)
    pending.value.add(key + ':' + emoji)
    try {
      const { added } = await reactionsApi.toggleReaction({
        entityType,
        entityId,
        userId: auth.currentUserId,
        emoji,
      })
      if (added) {
        const list = byEntity.value[key] ?? []
        list.push({
          id: crypto.randomUUID(),
          entityType,
          entityId,
          userId: auth.currentUserId,
          emoji,
          createdAt: new Date().toISOString(),
        })
        byEntity.value[key] = list
      } else {
        byEntity.value[key] = (byEntity.value[key] ?? []).filter(
          (r) => !(r.userId === auth.currentUserId && r.emoji === emoji),
        )
      }
    } catch (err) {
      console.error('[reactions] toggle error:', err)
    } finally {
      pending.value.delete(key + ':' + emoji)
    }
  }

  function hasReacted(entityType: Reaction['entityType'], entityId: string, emoji: string): boolean {
    const auth = useAuthStore()
    if (!auth.currentUserId) return false
    return forEntity(entityType, entityId).some(
      (r) => r.userId === auth.currentUserId && r.emoji === emoji,
    )
  }

  const quickReactions = computed(() => reactionsApi.QUICK_REACTIONS)

  return {
    byEntity,
    pending,
    quickReactions,
    load,
    forEntity,
    summary,
    toggle,
    hasReacted,
  }
})