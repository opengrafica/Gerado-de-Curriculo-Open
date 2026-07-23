/**
 * Vercel Serverless — consulta status do pagamento Pix.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return res.status(503).json({ error: 'no_token' })

  try {
    const id = req.query?.id || (req.url || '').split('/').pop()
    if (!id) return res.status(400).json({ error: 'id obrigatório' })

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await mpRes.json()
    if (!mpRes.ok) return res.status(mpRes.status).json({ error: data })

    return res.status(200).json({
      id: String(data.id),
      status: data.status,
      status_detail: data.status_detail,
      external_reference: data.external_reference,
      transaction_amount: data.transaction_amount,
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Erro interno' })
  }
}
