const START_PLAN_KEY = 'quinlist_start_plan'

export type StartPlan = 'free' | 'vip'

export function rememberStartPlan(plan: StartPlan) {
  sessionStorage.setItem(START_PLAN_KEY, plan)
}

export function readStartPlan(): StartPlan {
  return sessionStorage.getItem(START_PLAN_KEY) === 'vip' ? 'vip' : 'free'
}

export function consumeVipIntent(): boolean {
  if (sessionStorage.getItem(START_PLAN_KEY) !== 'vip') return false
  sessionStorage.removeItem(START_PLAN_KEY)
  return true
}
