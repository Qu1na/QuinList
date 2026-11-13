import { track } from '@/lib/analytics'

const START_PLAN_KEY = 'quinlist_start_plan'

export type StartPlan = 'free' | 'vip'

export function rememberStartPlan(plan: StartPlan) {
  sessionStorage.setItem(START_PLAN_KEY, plan)
  track('begin_sign_up', { plan, page_path: window.location.pathname })
}

export function readStartPlan(): StartPlan {
  return sessionStorage.getItem(START_PLAN_KEY) === 'vip' ? 'vip' : 'free'
}

export function consumeVipIntent(): boolean {
  if (sessionStorage.getItem(START_PLAN_KEY) !== 'vip') return false
  sessionStorage.removeItem(START_PLAN_KEY)
  return true
}
