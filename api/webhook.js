/**
 * Webhook Mercado Pago — atualiza status do pagamento.
 * Configure MP_WEBHOOK_URL apontando para /api/webhook
 * e SUPABASE_SERVICE_ROLE_KEY no Vercel.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const paymentId = body?.data?.id
    if (!paymentId) return res.status(200).json({ ok: true })

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) return res.status(200).json({ ok: true, skipped: true })

    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payment = await payRes.json()

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceKey && payment.external_reference) {
      const statusMap = {
        approved: 'approved',
        rejected: 'rejected',
        cancelled: 'cancelled',
        pending: 'pending',
      }
      await fetch(`${supabaseUrl}/rest/v1/payments?mercado_pago_id=eq.${paymentId}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status: statusMap[payment.status] || payment.status,
          mercado_pago_id: String(paymentId),
        }),
      })
    }

    return res.status(200).json({ ok: true, status: payment.status })
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message })
  }
}
