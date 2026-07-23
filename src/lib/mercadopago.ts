import { PRICE_RESUME } from '@/types'
import { DEMO_COUPONS } from '@/data/constants'

export const isMercadoPagoConfigured = Boolean(
  import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY &&
    !String(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY).includes('your-'),
)

export function applyCoupon(amount: number, code?: string) {
  if (!code) return { amount, discount: 0, valid: false }
  const coupon = DEMO_COUPONS.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active)
  if (!coupon) return { amount, discount: 0, valid: false }
  const discount = (amount * coupon.discountPercent) / 100
  return {
    amount: Math.max(0.01, Number((amount - discount).toFixed(2))),
    discount: Number(discount.toFixed(2)),
    valid: true,
    percent: coupon.discountPercent,
  }
}

export interface CheckoutPayload {
  product: 'resume' | 'cover_letter' | 'linkedin' | 'complete_pack'
  title: string
  amount: number
  resumeId?: string
  email?: string
  couponCode?: string
  affiliateCode?: string
}

/** Demo checkout: simula Mercado Pago e redireciona para sucesso/erro. */
export async function createCheckout(payload: CheckoutPayload): Promise<{
  initPoint?: string
  paymentId: string
  demo: boolean
}> {
  const final = applyCoupon(payload.amount || PRICE_RESUME, payload.couponCode)
  const paymentId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Persist pending payment for success page
  const record = {
    id: paymentId,
    ...payload,
    amount: final.amount,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  }
  const existing = JSON.parse(localStorage.getItem('cj_payments') || '[]')
  existing.unshift(record)
  localStorage.setItem('cj_payments', JSON.stringify(existing))
  localStorage.setItem('cj_last_payment', JSON.stringify(record))

  if (isMercadoPagoConfigured) {
    try {
      const res = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          amount: final.amount,
          paymentId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.init_point) {
          return { initPoint: data.init_point, paymentId, demo: false }
        }
      }
    } catch {
      // fallback to demo
    }
  }

  // Demo: approve after short delay via success URL
  const origin = window.location.origin
  const initPoint = `${origin}/pagamento/sucesso?payment_id=${paymentId}&status=approved&demo=1`
  return { initPoint, paymentId, demo: true }
}

export function markPaymentApproved(paymentId: string) {
  const existing = JSON.parse(localStorage.getItem('cj_payments') || '[]') as Array<{
    id: string
    status: string
  }>
  const updated = existing.map((p) => (p.id === paymentId ? { ...p, status: 'approved' } : p))
  localStorage.setItem('cj_payments', JSON.stringify(updated))
  localStorage.setItem('cj_paid', 'true')
  const last = updated.find((p) => p.id === paymentId)
  if (last) localStorage.setItem('cj_last_payment', JSON.stringify(last))
}

export function hasPaidAccess(): boolean {
  return localStorage.getItem('cj_paid') === 'true'
}
