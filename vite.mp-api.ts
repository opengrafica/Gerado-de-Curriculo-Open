import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

function loadEnvFile(root: string) {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

async function readJsonBody(req: import('http').IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function sendJson(res: import('http').ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(data))
}

async function createPreference(body: Record<string, unknown>, origin: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    return { status: 503, data: { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado', demo: true } }
  }

  const {
    title = 'CurrículoJá — Currículo PDF',
    amount = 4.9,
    email,
    paymentId,
    product = 'resume',
    affiliateCode,
    couponCode,
    resumeId,
    userId,
  } = body

  const unitPrice = Number(Number(amount).toFixed(2))
  const appUrl = (process.env.APP_URL || origin || '').replace(/\/$/, '')
  const useHttpsOrigin = appUrl.startsWith('https://') ? appUrl : origin.startsWith('https://') ? origin : appUrl

  const preference: Record<string, unknown> = {
    items: [
      {
        id: String(product),
        title: String(title).slice(0, 250),
        quantity: 1,
        currency_id: 'BRL',
        unit_price: unitPrice,
      },
    ],
    payer: email ? { email: String(email) } : undefined,
    external_reference: String(paymentId || `${product}_${Date.now()}`),
    metadata: {
      product,
      affiliate_code: affiliateCode || null,
      coupon_code: couponCode || null,
      resume_id: resumeId || null,
      user_id: userId || null,
      payment_id: paymentId || null,
    },
    statement_descriptor: 'CURRICULOJA',
  }

  if (useHttpsOrigin.startsWith('https://')) {
    preference.back_urls = {
      success: `${useHttpsOrigin}/pagamento/sucesso`,
      failure: `${useHttpsOrigin}/pagamento/erro`,
      pending: `${useHttpsOrigin}/pagamento/sucesso`,
    }
    preference.auto_return = 'approved'
    if (process.env.MP_WEBHOOK_URL) {
      preference.notification_url = process.env.MP_WEBHOOK_URL
    }
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': String(paymentId || Date.now()),
    },
    body: JSON.stringify(preference),
  })
  const data = await mpRes.json()
  if (!mpRes.ok) return { status: mpRes.status, data: { error: data } }
  return {
    status: 200,
    data: {
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    },
  }
}

/** Expõe /api/* no `vite dev` (mesmo código usado na Vercel). */
export function mercadoPagoApiPlugin(): Plugin {
  return {
    name: 'curriculoja-mp-api',
    configureServer(server) {
      loadEnvFile(server.config.root)
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/')) return next()

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          res.end()
          return
        }

        try {
          if (url.startsWith('/api/create-preference') && req.method === 'POST') {
            const body = await readJsonBody(req)
            const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173'
            const proto = String(req.headers['x-forwarded-proto'] || 'http')
            const origin = `${proto}://${host}`
            const result = await createPreference(body as Record<string, unknown>, origin)
            return sendJson(res, result.status, result.data)
          }

          if (url.startsWith('/api/webhook')) {
            // Reuse production webhook logic lightly
            const token = process.env.MERCADOPAGO_ACCESS_TOKEN
            const body = req.method === 'POST' ? await readJsonBody(req) : {}
            const paymentId = (body as { data?: { id?: string }; id?: string })?.data?.id || (body as { id?: string })?.id
            if (!token || !paymentId) return sendJson(res, 200, { ok: true, skipped: true })
            const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const payment = await payRes.json()
            return sendJson(res, 200, { ok: true, status: payment.status, paymentId })
          }
        } catch (err) {
          return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Erro interno' })
        }

        return next()
      })
    },
  }
}
