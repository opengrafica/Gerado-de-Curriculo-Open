import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

function loadEnvFile(root: string) {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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

async function createPixPayment(body: Record<string, unknown>) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    return { status: 503, data: { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado', demo: true } }
  }

  const amount = Number(Number(body.amount ?? 4.9).toFixed(2))
  const email = String(body.email || 'cliente@curriculoopen.com.br')
  const paymentId = String(body.paymentId || crypto.randomUUID())
  const description = String(body.title || 'Currículo OPEN — Currículo PDF profissional').slice(0, 200)

  const payload = {
    transaction_amount: amount,
    description,
    payment_method_id: 'pix',
    payer: {
      email,
      first_name: body.firstName ? String(body.firstName) : undefined,
      last_name: body.lastName ? String(body.lastName) : undefined,
    },
    external_reference: paymentId,
    metadata: {
      product: 'resume',
      affiliate_code: body.affiliateCode || null,
      coupon_code: body.couponCode || null,
      resume_id: body.resumeId || null,
      user_id: body.userId || null,
      payment_id: paymentId,
    },
  }

  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': paymentId,
    },
    body: JSON.stringify(payload),
  })
  const data = (await mpRes.json()) as {
    id?: string | number
    status?: string
    date_of_expiration?: string
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string
        qr_code_base64?: string
        ticket_url?: string
      }
    }
  }
  if (!mpRes.ok) return { status: mpRes.status, data: { error: data } }

  const tx = data.point_of_interaction?.transaction_data || {}
  return {
    status: 200,
    data: {
      id: String(data.id),
      status: data.status,
      paymentId,
      amount,
      qr_code: tx.qr_code || null,
      qr_code_base64: tx.qr_code_base64 || null,
      ticket_url: tx.ticket_url || null,
      expires_at: data.date_of_expiration || null,
    },
  }
}

async function getPaymentStatus(mpPaymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return { status: 503, data: { error: 'no_token' } }
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await mpRes.json()) as {
    id?: string | number
    status?: string
    status_detail?: string
    external_reference?: string
    transaction_amount?: number
  }
  if (!mpRes.ok) return { status: mpRes.status, data: { error: data } }
  return {
    status: 200,
    data: {
      id: String(data.id),
      status: data.status,
      status_detail: data.status_detail,
      external_reference: data.external_reference,
      transaction_amount: data.transaction_amount,
    },
  }
}

export function mercadoPagoApiPlugin(): Plugin {
  return {
    name: 'curriculoja-mp-api',
    configureServer(server) {
      loadEnvFile(server.config.root)
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0]
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
          if (url === '/api/create-pix' && req.method === 'POST') {
            const body = await readJsonBody(req)
            const result = await createPixPayment(body as Record<string, unknown>)
            return sendJson(res, result.status, result.data)
          }

          if (url.startsWith('/api/payment-status/') && req.method === 'GET') {
            const id = url.replace('/api/payment-status/', '').replace(/\/$/, '')
            const result = await getPaymentStatus(id)
            return sendJson(res, result.status, result.data)
          }

          // Compat: create-preference agora também gera Pix
          if (url === '/api/create-preference' && req.method === 'POST') {
            const body = await readJsonBody(req)
            const result = await createPixPayment(body as Record<string, unknown>)
            return sendJson(res, result.status, result.data)
          }

          if (url.startsWith('/api/webhook')) {
            const token = process.env.MERCADOPAGO_ACCESS_TOKEN
            const body = req.method === 'POST' ? await readJsonBody(req) : {}
            const paymentId =
              (body as { data?: { id?: string }; id?: string })?.data?.id ||
              (body as { id?: string })?.id
            if (!token || !paymentId) return sendJson(res, 200, { ok: true, skipped: true })
            const result = await getPaymentStatus(String(paymentId))
            return sendJson(res, 200, { ok: true, ...result.data })
          }
        } catch (err) {
          return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Erro interno' })
        }

        return next()
      })
    },
  }
}
