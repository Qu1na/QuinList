import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OKR, KeyResult, KeyResultUpdate } from '@/types/v3'
import * as okrsApi from '@/services/okrs'
import { useAuthStore } from './auth'

export const useOkrsStore = defineStore('okrs', () => {
  const okrs = ref<OKR[]>([])
  const keyResults = ref<Record<string, KeyResult[]>>({})
  const updates = ref<Record<string, KeyResultUpdate[]>>({})
  const isLoaded = ref(false)

  const active = computed(() => okrs.value.filter((o) => o.status !== 'completed'))
  const completed = computed(() => okrs.value.filter((o) => o.status === 'completed'))

  async function load(workspaceId: string) {
    const list = await okrsApi.listOKRs(workspaceId)
    okrs.value = list
    const krEntries = await Promise.all(list.map(async (o) => [o.id, await okrsApi.listKeyResults(o.id)] as const))
    keyResults.value = Object.fromEntries(krEntries)
    isLoaded.value = true
  }

  async function createOKR(input: Omit<OKR, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) {
    const auth = useAuthStore()
    const okr = await okrsApi.createOKR({ ...input, createdBy: input.createdBy ?? auth.currentUserId ?? null })
    okrs.value.push(okr)
    keyResults.value[okr.id] = []
    return okr
  }

  async function updateOKR(id: string, updates: Partial<OKR>) {
    const idx = okrs.value.findIndex((o) => o.id === id)
    if (idx === -1) return
    const prev = okrs.value[idx]!
    okrs.value[idx] = { ...prev, ...updates, id } as OKR
    try {
      const updated = await okrsApi.updateOKR(id, updates)
      okrs.value[idx] = updated
    } catch (err) {
      okrs.value[idx] = prev
      throw err
    }
  }

  async function deleteOKR(id: string) {
    const prev = okrs.value
    okrs.value = okrs.value.filter((o) => o.id !== id)
    delete keyResults.value[id]
    try {
      await okrsApi.deleteOKR(id)
    } catch (err) {
      okrs.value = prev
      throw err
    }
  }

  async function addKeyResult(input: Omit<KeyResult, 'id' | 'createdAt' | 'updatedAt'>) {
    const kr = await okrsApi.createKeyResult(input)
    const list = keyResults.value[input.okrId] ?? []
    list.push(kr)
    keyResults.value[input.okrId] = list
    await refreshOKRProgress(input.okrId)
    return kr
  }

  async function updateKeyResult(id: string, patch: Partial<KeyResult>) {
    for (const okrId of Object.keys(keyResults.value)) {
      const list = keyResults.value[okrId] ?? []
      const idx = list.findIndex((k) => k.id === id)
      if (idx >= 0) {
        const prev = list[idx]!
        const next: KeyResult = { ...prev, ...patch, id }
        list[idx] = next
        keyResults.value[okrId] = [...list]
        try {
          const updated = await okrsApi.updateKeyResult(id, patch)
          list[idx] = updated
          await refreshOKRProgress(okrId)
        } catch (err) {
          list[idx] = prev
          throw err
        }
        return
      }
    }
  }

  async function refreshOKRProgress(okrId: string) {
    const list = keyResults.value[okrId] ?? []
    const progress = okrsApi.computeOKRProgress(list)
    const okr = okrs.value.find((o) => o.id === okrId)
    if (!okr) return
    const status = okrsApi.suggestStatus(progress, okr.endsAt)
    await updateOKR(okrId, { progress, status })
  }

  function keyResultsFor(okrId: string): KeyResult[] {
    return keyResults.value[okrId] ?? []
  }

  function reset() {
    okrs.value = []
    keyResults.value = {}
    updates.value = {}
    isLoaded.value = false
  }

  return {
    okrs,
    keyResults,
    isLoaded,
    active,
    completed,
    load,
    createOKR,
    updateOKR,
    deleteOKR,
    addKeyResult,
    updateKeyResult,
    keyResultsFor,
    refreshOKRProgress,
    reset,
  }
})