import express from 'express'
import {
  AuthenticationError,
  LandapayError,
  SignatureVerificationError,
  landapay,
} from 'landapay'
import {
  isVipRow,
  readSubscription,
  recordFromSubscription,
  rememberWebhookEvent,
  saveSubscription,
  userFromAccessToken,
} from './matu.mjs'

const PORT = Number(process.env.BILLING_PORT || 4012)
const DEFAULT_VIP_CENTS = 700
const DEFAULT_VIP_CURRENCY = 'USD'
const USD_COP_FALLBACK = 3185

function vipAmountCents() {
  const raw = Number(process.env.LANDAPAY_VIP_AMOUNT || DEFAULT_VIP_CENTS)
  if (!Number.isFinite(raw) || raw < 100) return DEFAULT_VIP_CENTS
  return Math.round(raw)
}

function vipCurrency() {
  return String(process.env.LANDAPAY_VIP_CURRENCY || DEFAULT_VIP_CURRENCY).toUpperCase() === 'COP'
    ? 'COP'
    : 'USD'
}

let copPerUsd = { rate: USD_COP_FALLBACK, at: 0 }

async function usdCopRate() {
  if (Date.now() - copPerUsd.at < 6 * 60 * 60 * 1000 && copPerUsd.at > 0) return copPerUsd.rate
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(4000),
    })
    const json = await res.json()
    const rate = Number(json?.rates?.COP)
    if (res.ok && Number.isFinite(rate) && rate > 0) {
      copPerUsd = { rate, at: Date.now() }
    }
  } catch {
    /* se usa la última tasa conocida */
  }
  return copPerUsd.rate
}

function appOrigin(req) {
  const configured = (process.env.APP_PUBLIC_URL || '').replace(/\/$/, '')
  if (configured) return configured
  const proto = req.get('x-forwarded-proto') || req.protocol
  const host = req.get('x-forwarded-host') || req.get('host')
  return `${proto}://${host}`
}

function bearer(req) {
  const header = req.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

async function requireUser(req, res) {
  try {
    const user = await userFromAccessToken(bearer(req))
    if (!user) {
      res.status(401).json({ error: 'Inicia sesión para continuar.' })
      return null
    }
    return user
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo validar la sesión.'
    console.error('[billing] auth', message)
    res.status(503).json({ error: message })
    return null
  }
}

function publicSubscription(row, userId) {
  if (!row) {
    return {
      userId,
      plan: 'free',
      status: 'inactive',
      landapaySubscriptionId: null,
      landapayCustomerId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }
  }
  return {
    userId: row.user_id,
    plan: row.plan === 'vip' ? 'vip' : 'free',
    status: row.status || 'inactive',
    landapaySubscriptionId: row.landapay_subscription_id ?? null,
    landapayCustomerId: row.landapay_customer_id ?? null,
    currentPeriodEnd: row.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
  }
}

function landapayMessage(error) {
  if (error instanceof AuthenticationError) {
    return 'La API key de Landa Pay no es válida. Revisa LANDAPAY_API_KEY en el servidor.'
  }
  if (error instanceof LandapayError) return error.message
  if (error instanceof Error) return error.message
  return 'No se pudo completar el cobro.'
}

const aiHits = new Map()

function allowAiCall(userId) {
  const now = Date.now()
  const recent = (aiHits.get(userId) || []).filter((at) => now - at < 60_000)
  if (recent.length >= 20) {
    aiHits.set(userId, recent)
    return false
  }
  recent.push(now)
  aiHits.set(userId, recent)
  return true
}

const app = express()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'quinlist-billing' })
})

app.get('/api/billing/offer', async (_req, res) => {
  const currency = vipCurrency()
  const cents = vipAmountCents()
  const vipPriceUsd = currency === 'USD' ? cents / 100 : null
  const rate = await usdCopRate()
  const vipPriceCop =
    currency === 'USD' && vipPriceUsd
      ? Math.round(vipPriceUsd * rate)
      : Math.round(cents / 100)
  res.json({
    vipPriceUsd: vipPriceUsd ?? 7,
    vipPriceCop,
    currency: 'USD',
    interval: 'monthly',
  })
})

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event
  try {
    event = landapay.webhooks.constructEvent(req.body, req.get('Landa-Signature'))
  } catch (error) {
    if (error instanceof SignatureVerificationError) {
      return res.status(400).send(error.message)
    }
    console.error('[billing] webhook', error)
    return res.status(500).send('No se pudo verificar el webhook')
  }

  try {
    const fresh = await rememberWebhookEvent(event.id, event.type)
    if (!fresh) return res.sendStatus(200)

    if (event.type.startsWith('subscription.')) {
      const subscription = event.data.object
      const userId = subscription.externalId
      if (userId) {
        await saveSubscription(recordFromSubscription(userId, subscription))
      }
    }
    return res.sendStatus(200)
  } catch (error) {
    console.error('[billing] webhook persist', error)
    return res.status(500).send('No se pudo guardar el evento')
  }
})

app.use(express.json({ limit: '100kb' }))

app.post('/api/billing/checkout', async (req, res) => {
  const user = await requireUser(req, res)
  if (!user?.email) {
    if (user) res.status(400).json({ error: 'Tu cuenta no tiene correo para el cobro.' })
    return
  }
  if (!process.env.LANDAPAY_API_KEY) {
    return res.status(503).json({
      error: 'Landa Pay no está configurado. Agrega LANDAPAY_API_KEY en el servidor.',
    })
  }

  const current = await readSubscription(user.id).catch(() => null)
  if (isVipRow(current) && !current.cancel_at_period_end) {
    return res.status(409).json({ error: 'Ya tienes el plan VIP activo.' })
  }

  try {
    const plan = process.env.LANDAPAY_VIP_PLAN_ID
      ? process.env.LANDAPAY_VIP_PLAN_ID
      : {
          name: 'QuinList VIP',
          interval: 'monthly',
          amount: vipAmountCents(),
          currency: vipCurrency(),
        }

    const created = await landapay.subscriptions.create(
      {
        plan,
        customer: { name: user.name, email: user.email },
        externalId: user.id,
        metadata: { product: 'quinlist-vip' },
        redirectUrl: `${appOrigin(req)}/app/planes`,
      },
      { idempotencyKey: `quinlist-vip-${user.id}-${Math.floor(Date.now() / 60_000)}` },
    )

    return res.json({ checkoutUrl: created.checkoutUrl, checkoutId: created.checkout.id })
  } catch (error) {
    console.error('[billing] checkout', error instanceof Error ? error.message : error)
    return res.status(502).json({ error: landapayMessage(error) })
  }
})

app.post('/api/billing/sync', async (req, res) => {
  const user = await requireUser(req, res)
  if (!user) return

  const checkoutId = String(req.body?.checkoutId || '')
  if (!checkoutId.startsWith('scs_')) {
    return res.status(400).json({ error: 'Checkout inválido.' })
  }

  try {
    const checkout = await landapay.subscriptions.retrieveCheckout(checkoutId)
    if (checkout.externalId && checkout.externalId !== user.id) {
      return res.status(403).json({ error: 'Este pago pertenece a otra cuenta.' })
    }
    if (checkout.status === 'completed' && checkout.subscription) {
      const subscription = await landapay.subscriptions.retrieve(checkout.subscription)
      const ownerId = subscription.externalId || user.id
      if (ownerId !== user.id) {
        return res.status(403).json({ error: 'Este pago pertenece a otra cuenta.' })
      }
      await saveSubscription(recordFromSubscription(user.id, subscription))
    }
    const row = await readSubscription(user.id)
    return res.json({
      pending: checkout.status !== 'completed',
      subscription: publicSubscription(row, user.id),
    })
  } catch (error) {
    console.error('[billing] sync', error instanceof Error ? error.message : error)
    return res.status(502).json({ error: landapayMessage(error) })
  }
})

app.post('/api/billing/cancel', async (req, res) => {
  const user = await requireUser(req, res)
  if (!user) return

  try {
    const row = await readSubscription(user.id)
    const subscriptionId = row?.landapay_subscription_id
    if (!subscriptionId || !isVipRow(row)) {
      return res.status(409).json({ error: 'No hay una suscripción VIP activa.' })
    }
    const subscription = await landapay.subscriptions.cancel(subscriptionId, {
      atPeriodEnd: true,
      reason: 'Cancelación desde QuinList',
    })
    await saveSubscription(recordFromSubscription(user.id, subscription))
    return res.json({ subscription: publicSubscription(await readSubscription(user.id), user.id) })
  } catch (error) {
    console.error('[billing] cancel', error instanceof Error ? error.message : error)
    return res.status(502).json({ error: landapayMessage(error) })
  }
})

app.post('/api/ai/chat', async (req, res) => {
  const user = await requireUser(req, res)
  if (!user) return

  let row
  try {
    row = await readSubscription(user.id)
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'No se pudo leer el plan.' })
  }
  if (!isVipRow(row)) {
    return res.status(402).json({ error: 'El asistente de IA está incluido en el plan VIP.' })
  }
  if (!allowAiCall(user.id)) {
    return res.status(429).json({ error: 'Demasiadas preguntas seguidas. Espera un momento.' })
  }

  const apiKey = process.env.AI_API_KEY || ''
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4o-mini'
  if (!apiKey) {
    return res.status(503).json({
      error: 'La IA no está configurada en el servidor. Agrega AI_API_KEY.',
    })
  }

  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : []
  const messages = incoming
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-12)
    .map((item) => ({
      role: item.role,
      content: String(item.content || '').slice(0, 4000),
    }))
    .filter((item) => item.content.trim())

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Escribe una pregunta.' })
  }

  const context = String(req.body?.context || '').slice(0, 6000)

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'Eres el asistente de QuinList, un software de gestión de proyectos. Respondes en español, breve y concreto. Ayudas a organizar tableros, proyectos y tareas. No inventes datos que no estén en el contexto del workspace. Si falta información, dilo.',
          },
          {
            role: 'system',
            content: context ? `Contexto del workspace:\n${context}` : 'No hay contexto del workspace.',
          },
          ...messages,
        ],
      }),
    })
    const payload = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      const message = payload?.error?.message || 'El modelo de IA rechazó la solicitud.'
      return res.status(502).json({ error: message })
    }
    const reply = payload?.choices?.[0]?.message?.content
    if (!reply || typeof reply !== 'string') {
      return res.status(502).json({ error: 'La IA no devolvió una respuesta.' })
    }
    return res.json({ reply: reply.trim() })
  } catch (error) {
    console.error('[ai]', error instanceof Error ? error.message : error)
    return res.status(502).json({ error: 'No se pudo contactar al modelo de IA.' })
  }
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[quinlist-billing] http://127.0.0.1:${PORT} vip=${vipAmountCents()} ${vipCurrency()}`)
})
