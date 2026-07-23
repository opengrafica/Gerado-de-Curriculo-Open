/**
 * Webhook Mercado Pago — aprova pagamento e dispara comissão de afiliado (via trigger SQL).
 */

const STATUS_MAP = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'cancelled',
  pending: 'pending',
  in_process: 'pending',
}

async function fetchPayment(token, paymentId) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

async function patchPayment(supabaseUrl, serviceKey, patch, filters) {
  const qs = new URLSearchParams(filters).toString()
  await fetch(`${supabaseUrl}/rest/v1/payments?${qs}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // MP sometimes pings with query topic/id
    const { id, topic, 'data.id': dataId } = req.query || {}
    if ((topic === 'payment' || topic === 'merchant_order') && (id || dataId)) {
      req.body = { type: topic, data: { id: id || dataId } }
    } else {
      return res.status(200).json({ ok: true })
    }
  }

  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const paymentId = body?.data?.id || body?.id || req.query?.id
    if (!paymentId) return res.status(200).json({ ok: true, skipped: true })

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) return res.status(200).json({ ok: true, skipped: 'no_token' })

    const payment = await fetchPayment(token, paymentId)
    const status = STATUS_MAP[payment.status] || payment.status || 'pending'
    const meta = payment.metadata || {}
    const external = payment.external_reference

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceKey) {
      const patch = {
        status,
        mercado_pago_id: String(paymentId),
        amount: payment.transaction_amount != null ? Number(payment.transaction_amount) : undefined,
        affiliate_code: meta.affiliate_code || undefined,
        coupon_code: meta.coupon_code || undefined,
        product: meta.product || undefined,
      }

      // Clean undefined
      Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k])

      if (external) {
        await patchPayment(supabaseUrl, serviceKey, patch, { external_reference: `eq.${external}` })
        // also try by id if external is uuid
        await patchPayment(supabaseUrl, serviceKey, patch, { id: `eq.${external}` })
      }
      await patchPayment(supabaseUrl, serviceKey, patch, { mercado_pago_id: `eq.${paymentId}` })

      // If no row matched, insert approved payment
      if (status === 'approved') {
        await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=ignore-duplicates,return=minimal',
          },
          body: JSON.stringify({
            amount: Number(payment.transaction_amount || 0),
            status: 'approved',
            product: meta.product || 'resume',
            coupon_code: meta.coupon_code || null,
            affiliate_code: meta.affiliate_code || null,
            mercado_pago_id: String(paymentId),
            user_id: meta.user_id || null,
            resume_id: meta.resume_id || null,
          }),
        })
      }
    }

    return res.status(200).json({ ok: true, status, paymentId })
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message })
  }
}
