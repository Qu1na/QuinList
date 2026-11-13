import type { PlanOffer } from '@/config/plans'
import { VIP_PRICE_USD } from '@/config/plans'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { isMissingTableError, markTableMissing } from '@/lib/matuTables'

export interface BillingRecord {
  userId: string
  plan: 'free' | 'vip'
  status: string
  landapaySubscriptionId: string | null
  landapayCustomerId: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const EMPTY = (userId: string): BillingRecord => ({
  userId,
  plan: 'free',
  status: 'inactive',
  landapaySubscriptionId: null,
  landapayCustomerId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
})

interface DbBillingRow {
  user_id: string
  plan?: string | null
  status?: string | null
  landapay_subscription_id?: string | null
  landapay_customer_id?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean | null
}

function fromRow(row: DbBillingRow): BillingRecord {
  const plan = row.plan === 'vip' ? 'vip' : 'free'
  return {
    userId: row.user_id,
    plan,
    status: row.status || 'inactive',
    landapaySubscriptionId: row.landapay_subscription_id ?? null,
    landapayCustomerId: row.landapay_customer_id ?? null,
    currentPeriodEnd: row.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
  }
}

export function getSessionToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem('matudb_session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { access_token?: string }
    return parsed.access_token ?? null
  } catch {
    return null
  }
}

export async function fetchPlanOffer(): Promise<PlanOffer> {
  const fallback: PlanOffer = {
    vipPriceUsd: VIP_PRICE_USD,
    vipPriceCop: null,
    currency: 'USD',
    interval: 'monthly',
  }
  try {
    const res = await fetch('/api/billing/offer')
    if (!res.ok) return fallback
    const data = (await res.json()) as Partial<PlanOffer>
    const vipPriceUsd = Number(data.vipPriceUsd)
    const vipPriceCop = Number(data.vipPriceCop)
    return {
      vipPriceUsd: Number.isFinite(vipPriceUsd) && vipPriceUsd > 0 ? vipPriceUsd : VIP_PRICE_USD,
      vipPriceCop: Number.isFinite(vipPriceCop) && vipPriceCop > 0 ? Math.round(vipPriceCop) : null,
      currency: 'USD',
      interval: 'monthly',
    }
  } catch {
    return fallback
  }
}

export async function loadBillingRecord(userId: string): Promise<BillingRecord> {
  if (!isMatuConfigured()) return EMPTY(userId)
  const db = getMatuClient()
  const { data, error } = await db
    .from('billing_subscriptions')
    .select(
      'user_id, plan, status, landapay_subscription_id, landapay_customer_id, current_period_end, cancel_at_period_end',
    )
    .eq('user_id', userId)
    .limit(1)

  if (error) {
    if (isMissingTableError(error.message)) {
      markTableMissing('billing_subscriptions')
      return EMPTY(userId)
    }
    console.warn('[billing] No se pudo leer la suscripción:', error.message)
    return EMPTY(userId)
  }

  const row = (data as DbBillingRow[] | null)?.[0]
  return row ? fromRow(row) : EMPTY(userId)
}

async function billingFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getSessionToken()
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(path, { ...init, headers })
}

export async function createVipCheckout(): Promise<string> {
  const res = await billingFetch('/api/billing/checkout', { method: 'POST', body: '{}' })
  const data = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string }
  if (!res.ok || !data.checkoutUrl) {
    throw new Error(data.error || 'No se pudo abrir el pago de Landa Pay.')
  }
  return data.checkoutUrl
}

export async function syncCheckout(checkoutId: string): Promise<BillingRecord | null> {
  const res = await billingFetch('/api/billing/sync', {
    method: 'POST',
    body: JSON.stringify({ checkoutId }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    subscription?: BillingRecord
  }
  if (!res.ok) throw new Error(data.error || 'No se pudo confirmar el pago.')
  return data.subscription ?? null
}

export async function cancelVipAtPeriodEnd(): Promise<void> {
  const res = await billingFetch('/api/billing/cancel', { method: 'POST', body: '{}' })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error || 'No se pudo programar la cancelación.')
}

export async function sendAiMessage(input: {
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: string
}): Promise<string> {
  const res = await billingFetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
  if (!res.ok || !data.reply) {
    throw new Error(data.error || 'La IA no pudo responder.')
  }
  return data.reply
}
