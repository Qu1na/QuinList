import { createClient } from '@devjuanes/matuclient'

function required(name, fallback) {
  const value = process.env[name] || fallback || ''
  return String(value).trim()
}

export function matuConfig() {
  const url = required('MATUDB_URL', process.env.VITE_MATUDB_URL).replace(/\/$/, '')
  const projectId = required('MATUDB_PROJECT_ID', process.env.VITE_MATUDB_PROJECT_ID)
  const apiKey = required('MATUDB_API_KEY', process.env.VITE_MATUDB_API_KEY)
  const schema = required('MATUDB_SCHEMA', process.env.VITE_MATUDB_SCHEMA)
  return { url, projectId, apiKey, schema }
}

let client = null

export function getServerDb() {
  if (client) return client
  const { url, projectId, apiKey, schema } = matuConfig()
  if (!url || !projectId || !apiKey) {
    throw new Error('Faltan MATUDB_URL, MATUDB_PROJECT_ID o MATUDB_API_KEY en el servidor.')
  }
  client = createClient({
    url,
    projectId,
    apiKey,
    schema: schema || undefined,
  })
  return client
}

export async function userFromAccessToken(token) {
  const { url, projectId, apiKey } = matuConfig()
  if (!url || !projectId || !apiKey || !token) return null

  let res
  try {
    res = await fetch(`${url}/api/projects/${projectId}/auth/user`, {
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(12_000),
    })
  } catch (error) {
    const cause = error instanceof Error ? error.cause : null
    const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : ''
    const hint =
      code === 'ENOTFOUND' || code === 'ECONNREFUSED'
        ? `No se pudo conectar a MatuDB (${url}). Revisa red/DNS.`
        : error instanceof Error
          ? error.message
          : 'No se pudo validar la sesión.'
    throw new Error(hint)
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok) return null

  const user = json.data?.user ?? json.data ?? json.user
  const id = user?.id || user?.user_id
  if (!id) return null

  const email = String(user.email || user.user_email || '').trim()
  const name =
    user.name ||
    user.user_metadata?.name ||
    (email ? email.split('@')[0] : 'Usuario')

  return { id: String(id), email, name: String(name) }
}

const VIP_STATUSES = new Set(['active', 'trialing', 'past_due'])

export function recordFromSubscription(userId, subscription) {
  const status = subscription?.status || 'inactive'
  const vip = VIP_STATUSES.has(status)
  return {
    user_id: userId,
    plan: vip ? 'vip' : 'free',
    status,
    landapay_customer_id: subscription?.customer || null,
    landapay_subscription_id: subscription?.id || null,
    current_period_end: subscription?.currentPeriodEnd || null,
    cancel_at_period_end: Boolean(subscription?.cancelAtPeriodEnd),
    updated_at: new Date().toISOString(),
  }
}

export async function readSubscription(userId) {
  const db = getServerDb()
  const { data, error } = await db
    .from('billing_subscriptions')
    .select(
      'user_id, plan, status, landapay_subscription_id, landapay_customer_id, current_period_end, cancel_at_period_end',
    )
    .eq('user_id', userId)
    .limit(1)

  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return row || null
}

export async function saveSubscription(row) {
  const db = getServerDb()
  const { data, error } = await db
    .from('billing_subscriptions')
    .select('user_id')
    .eq('user_id', row.user_id)
    .limit(1)

  if (error) throw new Error(error.message)
  const existing = Array.isArray(data) ? data[0] : data

  if (existing) {
    const { user_id, ...patch } = row
    const { error: updErr } = await db.from('billing_subscriptions').eq('user_id', user_id).update(patch)
    if (updErr) throw new Error(updErr.message)
    return
  }

  const { error: insErr } = await db.from('billing_subscriptions').insert(row)
  if (insErr) {
    const { data: again, error: againErr } = await db
      .from('billing_subscriptions')
      .select('user_id')
      .eq('user_id', row.user_id)
      .limit(1)
    if (againErr || !(Array.isArray(again) ? again[0] : again)) {
      throw new Error(insErr.message)
    }
    const { user_id, ...patch } = row
    const { error: updErr } = await db.from('billing_subscriptions').eq('user_id', user_id).update(patch)
    if (updErr) throw new Error(updErr.message)
  }
}

export async function rememberWebhookEvent(eventId, eventType) {
  const db = getServerDb()
  const { error } = await db.from('billing_webhook_events').insert({
    id: eventId,
    event_type: eventType,
    received_at: new Date().toISOString(),
  })
  if (!error) return true
  if (/duplicate|unique|already exists/i.test(error.message)) return false
  throw new Error(error.message)
}

export function isVipRow(row) {
  return row?.plan === 'vip' && VIP_STATUSES.has(row.status)
}
