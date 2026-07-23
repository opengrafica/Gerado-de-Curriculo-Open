/**
 * Vercel Serverless — cria pagamento Pix direto (Mercado Pago Payments API).
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    return res.status(503).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado', demo: true })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const amount = Number(Number(body.amount ?? 4.9).toFixed(2))
    const email = body.email || 'cliente@curriculoja.com.br'
    const paymentId = body.paymentId || crypto.randomUUID()
    const title = String(body.title || 'CurrículoJá — Currículo PDF profissional').slice(0, 200)

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': String(paymentId),
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: title,
        payment_method_id: 'pix',
        payer: { email },
        external_reference: String(paymentId),
        metadata: {
          product: 'resume',
          affiliate_code: body.affiliateCode || null,
          coupon_code: body.couponCode || null,
          resume_id: body.resumeId || null,
          user_id: body.userId || null,
          payment_id: paymentId,
        },
      }),
    })

    const data = await mpRes.json()
    if (!mpRes.ok) return res.status(mpRes.status).json({ error: data })

    const tx = data.point_of_interaction?.transaction_data || {}

    // Best-effort pending payment in Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            id: String(paymentId).match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            )
              ? paymentId
              : undefined,
            user_id: body.userId || null,
            resume_id: body.resumeId || null,
            amount,
            status: 'pending',
            product: 'resume',
            coupon_code: body.couponCode || null,
            affiliate_code: body.affiliateCode || null,
            mercado_pago_id: String(data.id),
          }),
        })
      } catch {
        // ignore
      }
    }

    return res.status(200).json({
      id: String(data.id),
      status: data.status,
      paymentId,
      amount,
      qr_code: tx.qr_code || null,
      qr_code_base64: tx.qr_code_base64 || null,
      ticket_url: tx.ticket_url || null,
      expires_at: data.date_of_expiration || null,
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Erro interno' })
  }
}
