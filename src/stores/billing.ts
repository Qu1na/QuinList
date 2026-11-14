import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { FREE_BOARD_LIMIT, FREE_PROJECT_LIMIT, isVipAccess } from '@/config/plans'
import type { PlanOffer } from '@/config/plans'
import { VIP_PRICE_USD } from '@/config/plans'
import {
  cancelVipAtPeriodEnd,
  createVipCheckout,
  fetchPlanOffer,
  loadBillingRecord,
  syncCheckout,
  type BillingRecord,
} from '@/services/billing'
import type { Workspace } from '@/types'
import { useAuthStore } from './auth'
import { useProjectsStore } from './projects'
import { useQuinListStore } from './quinlist'
import { useUiStore } from './ui'

export type UpgradeKind = 'board' | 'project' | 'ai'

function ownerIdOf(workspace: Workspace | undefined): string | null {
  return workspace?.members.find((member) => member.role === 'owner')?.userId ?? null
}

export const useBillingStore = defineStore('billing', () => {
  const auth = useAuthStore()
  const subscription = ref<BillingRecord | null>(null)
  const offer = ref<PlanOffer>({
    vipPriceUsd: VIP_PRICE_USD,
    vipPriceCop: null,
    currency: 'USD',
    interval: 'monthly',
  })
  const ready = ref(false)
  const checkoutBusy = ref(false)
  const checkoutError = ref('')
  const upgradeOpen = ref(false)
  const upgradeKind = ref<UpgradeKind>('board')
  const ownerCache = new Map<string, BillingRecord>()
  let loadedFor: string | null = null
  let initPromise: Promise<void> | null = null

  const isVip = computed(() => isVipAccess(subscription.value?.plan, subscription.value?.status))

  const planLabel = computed(() => (isVip.value ? 'VIP' : 'Gratis'))

  const boardUsage = computed(() => {
    const userId = auth.currentUserId
    if (!userId) return 0
    return countOwnedBoards(userId)
  })

  const projectUsage = computed(() => {
    const userId = auth.currentUserId
    if (!userId) return 0
    return countOwnedProjects(userId)
  })

  /** Plan Gratis: ya no puede crear más tableros. */
  const boardLimitReached = computed(
    () => !isVip.value && boardUsage.value >= FREE_BOARD_LIMIT,
  )

  /** Plan Gratis: ya no puede crear más proyectos. */
  const projectLimitReached = computed(
    () => !isVip.value && projectUsage.value >= FREE_PROJECT_LIMIT,
  )

  /** Alcanzó al menos un límite del plan Gratis. */
  const freeLimitReached = computed(() => boardLimitReached.value || projectLimitReached.value)

  function openUpgrade(kind: UpgradeKind) {
    upgradeKind.value = kind
    upgradeOpen.value = true
  }

  function closeUpgrade() {
    upgradeOpen.value = false
  }

  async function ensureOwnerRecord(ownerId: string): Promise<BillingRecord> {
    if (ownerId === auth.currentUserId && subscription.value) return subscription.value
    const cached = ownerCache.get(ownerId)
    if (cached) return cached
    const record = await loadBillingRecord(ownerId)
    ownerCache.set(ownerId, record)
    return record
  }

  function ownedWorkspaceIds(ownerId: string): Set<string> {
    const quinlist = useQuinListStore()
    return new Set(
      quinlist.workspaces
        .filter((workspace) => ownerIdOf(workspace) === ownerId)
        .map((workspace) => workspace.id),
    )
  }

  function countOwnedBoards(ownerId: string): number {
    const quinlist = useQuinListStore()
    const ids = ownedWorkspaceIds(ownerId)
    return quinlist.boards.filter((board) => ids.has(board.workspaceId)).length
  }

  function countOwnedProjects(ownerId: string): number {
    const projects = useProjectsStore()
    const ids = ownedWorkspaceIds(ownerId)
    return projects.projects.filter((project) => ids.has(project.workspaceId)).length
  }

  async function allowCreate(kind: 'board' | 'project', workspaceId: string): Promise<boolean> {
    const quinlist = useQuinListStore()
    const workspace = quinlist.workspaces.find((item) => item.id === workspaceId)
    const ownerId = ownerIdOf(workspace)
    if (!ownerId) return false

    const record = await ensureOwnerRecord(ownerId)
    if (isVipAccess(record.plan, record.status)) return true

    if (kind === 'board') return countOwnedBoards(ownerId) < FREE_BOARD_LIMIT
    const projects = useProjectsStore()
    if (!projects.isReady) await projects.init()
    return countOwnedProjects(ownerId) < FREE_PROJECT_LIMIT
  }

  async function init() {
    const userId = auth.currentUserId
    if (!userId) return
    if (loadedFor === userId && ready.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      try {
        const [record, nextOffer] = await Promise.all([loadBillingRecord(userId), fetchPlanOffer()])
        subscription.value = record
        offer.value = nextOffer
        ownerCache.set(userId, record)
        loadedFor = userId
        ready.value = true
      } finally {
        initPromise = null
      }
    })()

    return initPromise
  }

  async function refresh() {
    const userId = auth.currentUserId
    if (!userId) return
    ownerCache.delete(userId)
    loadedFor = null
    ready.value = false
    await init()
  }

  async function startVipCheckout() {
    checkoutError.value = ''
    checkoutBusy.value = true
    try {
      const url = await createVipCheckout()
      window.location.assign(url)
    } catch (error) {
      checkoutError.value = error instanceof Error ? error.message : 'No se pudo abrir el pago.'
    } finally {
      checkoutBusy.value = false
    }
  }

  async function confirmReturn(checkoutId: string) {
    checkoutError.value = ''
    checkoutBusy.value = true
    try {
      await syncCheckout(checkoutId)
      await refresh()
    } catch (error) {
      checkoutError.value = error instanceof Error ? error.message : 'No se pudo confirmar el pago.'
    } finally {
      checkoutBusy.value = false
    }
  }

  async function cancelVip() {
    checkoutError.value = ''
    checkoutBusy.value = true
    try {
      await cancelVipAtPeriodEnd()
      await refresh()
    } catch (error) {
      checkoutError.value = error instanceof Error ? error.message : 'No se pudo cancelar.'
    } finally {
      checkoutBusy.value = false
    }
  }

  async function requestCreateBoard() {
    const quinlist = useQuinListStore()
    const allowed = await allowCreate('board', quinlist.currentWorkspaceId)
    if (!allowed) {
      openUpgrade('board')
      return
    }
    useUiStore().openCreateBoard()
  }

  return {
    subscription,
    offer,
    ready,
    checkoutBusy,
    checkoutError,
    upgradeOpen,
    upgradeKind,
    isVip,
    planLabel,
    boardUsage,
    projectUsage,
    boardLimitReached,
    projectLimitReached,
    freeLimitReached,
    freeBoardLimit: FREE_BOARD_LIMIT,
    freeProjectLimit: FREE_PROJECT_LIMIT,
    openUpgrade,
    closeUpgrade,
    allowCreate,
    requestCreateBoard,
    countOwnedBoards,
    countOwnedProjects,
    init,
    refresh,
    startVipCheckout,
    confirmReturn,
    cancelVip,
  }
})
