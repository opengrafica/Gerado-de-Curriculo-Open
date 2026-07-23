/**
 * Vercel Serverless — cria preferência Mercado Pago Checkout Pro.
 *
 * Env (Vercel):
 *   MERCADOPAGO_ACCESS_TOKEN  (obrigatório para produção)
 *   APP_URL
 *   MP_WEBHOOK_URL
 *   VITE_SUPABASE_URL / SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (opcional, grava payment pending)
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

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
      title = 'CurrículoJá — Currículo PDF',
      amount = 4.9,
      email,
      paymentId,
      product = 'resume',
      affiliateCode,
      couponCode,
      resumeId,
      userId,
    } = body || {}

    const headerOrigin = req.headers.origin || ''
    const appUrl = (process.env.APP_URL || headerOrigin || 'http://localhost:5173').replace(/\/$/, '')
    const origin = appUrl.startsWith('https://') ? appUrl : (headerOrigin.startsWith('https://') ? headerOrigin : appUrl)
    const unitPrice = Number(Number(amount).toFixed(2))

    const preference = {
      items: [
        {
          id: product,
          title: String(title).slice(0, 250),
          quantity: 1,
          currency_id: 'BRL',
          unit_price: unitPrice,
        },
      ],
      payer: email ? { email } : undefined,
      external_reference: paymentId || `${product}_${Date.now()}`,
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

    if (String(origin).startsWith('https://')) {
      preference.back_urls = {
        success: `${origin}/pagamento/sucesso`,
        failure: `${origin}/pagamento/erro`,
        pending: `${origin}/pagamento/sucesso`,
      }
      preference.auto_return = 'approved'
      if (process.env.MP_WEBHOOK_URL) preference.notification_url = process.env.MP_WEBHOOK_URL
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': paymentId || `${Date.now()}`,
      },
      body: JSON.stringify(preference),
    })

    const data = await mpRes.json()
    if (!mpRes.ok) {
      return res.status(mpRes.status).json({ error: data })
    }

    // Best-effort: store pending payment in Supabase
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
            id: paymentId && String(paymentId).match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            )
              ? paymentId
              : undefined,
            user_id: userId || null,
            resume_id: resumeId || null,
            amount: unitPrice,
            status: 'pending',
            product,
            coupon_code: couponCode || null,
            affiliate_code: affiliateCode || null,
            mercado_pago_id: data.id,
          }),
        })
      } catch {
        // ignore persistence errors
      }
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
