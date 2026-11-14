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
  subscribeBillingRealtime,
  syncCheckout,
  type BillingRecord,
} from '@/services/billing'
import type { Workspace } from '@/types'
import { useAuthStore } from './auth'
import { useProjectsStore } from './projects'
import { useQuinListStore } from './quinlist'
import { useUiStore } from './ui'

export type UpgradeKind = 'board' | 'project' | 'ai' | 'team'
export type PaymentModalStatus = 'processing' | 'approved' | 'failed'

const FAILED_CHECKOUT = new Set(['cancelled', 'canceled', 'expired', 'failed', 'void'])

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
  const paymentModalOpen = ref(false)
  const paymentModalStatus = ref<PaymentModalStatus>('processing')
  const ownerCache = new Map<string, BillingRecord>()
  let loadedFor: string | null = null
  let initPromise: Promise<void> | null = null
  let billingRealtimeUnsub: (() => void) | null = null
  let waitingCheckout = false

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

  function openPaymentModal(status: PaymentModalStatus) {
    paymentModalStatus.value = status
    paymentModalOpen.value = true
  }

  function closePaymentModal() {
    paymentModalOpen.value = false
    waitingCheckout = false
  }

  function applyRecord(record: BillingRecord) {
    subscription.value = record
    ownerCache.set(record.userId, record)
    if (waitingCheckout && isVipAccess(record.plan, record.status)) {
      waitingCheckout = false
      openPaymentModal('approved')
    }
  }

  function startBillingRealtime(userId: string) {
    billingRealtimeUnsub?.()
    billingRealtimeUnsub = subscribeBillingRealtime(userId, (record) => {
      applyRecord(record)
    })
  }

  function stopBillingRealtime() {
    billingRealtimeUnsub?.()
    billingRealtimeUnsub = null
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

  /** Crear espacios o invitar/gestionar equipo: solo VIP (dueño del espacio o usuario actual). */
  async function allowTeam(workspaceId?: string): Promise<boolean> {
    if (!ready.value) await init()
    if (workspaceId) {
      const quinlist = useQuinListStore()
      const workspace = quinlist.workspaces.find((item) => item.id === workspaceId)
      const ownerId = ownerIdOf(workspace)
      if (!ownerId) return false
      const record = await ensureOwnerRecord(ownerId)
      return isVipAccess(record.plan, record.status)
    }
    return isVip.value
  }

  async function requestCreateWorkspace() {
    const allowed = await allowTeam()
    if (!allowed) {
      openUpgrade('team')
      return
    }
    useUiStore().openCreateWorkspace()
  }

  async function requestInviteTeam(workspaceId?: string) {
    const quinlist = useQuinListStore()
    const allowed = await allowTeam(workspaceId || quinlist.currentWorkspaceId)
    if (!allowed) {
      openUpgrade('team')
      return false
    }
    return true
  }

  async function init() {
    const userId = auth.currentUserId
    if (!userId) return
    if (loadedFor === userId && ready.value) {
      startBillingRealtime(userId)
      return
    }
    if (initPromise) return initPromise

    initPromise = (async () => {
      try {
        const [record, nextOffer] = await Promise.all([loadBillingRecord(userId), fetchPlanOffer()])
        subscription.value = record
        offer.value = nextOffer
        ownerCache.set(userId, record)
        loadedFor = userId
        ready.value = true
        startBillingRealtime(userId)
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
    waitingCheckout = true
    openPaymentModal('processing')
    const userId = auth.currentUserId
    if (userId) startBillingRealtime(userId)

    try {
      const result = await syncCheckout(checkoutId)
      if (result.subscription) {
        applyRecord(result.subscription)
      }

      if (isVipAccess(result.subscription?.plan, result.subscription?.status)) {
        waitingCheckout = false
        openPaymentModal('approved')
        return
      }

      const status = result.checkoutStatus.toLowerCase()
      if (FAILED_CHECKOUT.has(status)) {
        waitingCheckout = false
        openPaymentModal('failed')
        return
      }

      // Sigue pending: el modal queda en "processing" y MatuDB WebSocket
      // actualizará a approved cuando el webhook escriba billing_subscriptions.
      if (!result.pending && !isVip.value) {
        waitingCheckout = false
        openPaymentModal('failed')
      }
    } catch (error) {
      waitingCheckout = false
      checkoutError.value = error instanceof Error ? error.message : 'No se pudo confirmar el pago.'
      openPaymentModal('failed')
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
    paymentModalOpen,
    paymentModalStatus,
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
    openPaymentModal,
    closePaymentModal,
    allowCreate,
    allowTeam,
    requestCreateBoard,
    requestCreateWorkspace,
    requestInviteTeam,
    countOwnedBoards,
    countOwnedProjects,
    init,
    refresh,
    startVipCheckout,
    confirmReturn,
    cancelVip,
    stopBillingRealtime,
  }
})
