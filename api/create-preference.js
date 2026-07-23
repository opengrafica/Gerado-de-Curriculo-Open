/**
 * Vercel Serverless Function — cria preferência Mercado Pago Checkout Pro.
 * Variáveis de ambiente no Vercel (server-side):
 *   MERCADOPAGO_ACCESS_TOKEN
 * Client (Vite):
 *   VITE_MERCADOPAGO_PUBLIC_KEY
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    return res.status(503).json({
      error: 'MERCADOPAGO_ACCESS_TOKEN não configurado',
      demo: true,
    })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const {
      title = 'CurrículoJá',
      amount = 4.9,
      email,
      paymentId,
      product = 'resume',
    } = body || {}

    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173'

    const preference = {
      items: [
        {
          title,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(amount),
        },
      ],
      payer: email ? { email } : undefined,
      external_reference: paymentId || `${product}_${Date.now()}`,
      back_urls: {
        success: `${origin}/pagamento/sucesso`,
        failure: `${origin}/pagamento/erro`,
        pending: `${origin}/pagamento/sucesso`,
      },
      auto_return: 'approved',
      notification_url: process.env.MP_WEBHOOK_URL || undefined,
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const data = await mpRes.json()
    if (!mpRes.ok) {
      return res.status(mpRes.status).json({ error: data })
    }

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Erro interno' })
  }
}
