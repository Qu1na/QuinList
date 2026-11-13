/** Precio del plan VIP. Landa Pay cobra los dólares en pesos a la tasa del día. */
export const VIP_PRICE_USD = 15

export const FREE_BOARD_LIMIT = 1
export const FREE_PROJECT_LIMIT = 1

export const VIP_ACCESS_STATUSES = ['active', 'trialing', 'past_due'] as const

export type PlanId = 'free' | 'vip'

export interface PlanOffer {
  vipPriceUsd: number
  /** Equivalente aproximado en pesos. Null si no hay tasa. */
  vipPriceCop: number | null
  currency: 'USD'
  interval: 'monthly'
}

export function isVipAccess(plan: string | null | undefined, status: string | null | undefined): boolean {
  return plan === 'vip' && !!status && (VIP_ACCESS_STATUSES as readonly string[]).includes(status)
}
