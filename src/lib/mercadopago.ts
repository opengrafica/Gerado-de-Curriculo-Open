import { PRICE_RESUME } from '@/types'
import { DEMO_COUPONS } from '@/data/constants'
import { getSupabase } from '@/lib/supabase'
import type { AffiliateCommission } from '@/types'

export const isMercadoPagoConfigured = Boolean(
  import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY &&
    !String(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY).includes('your-'),
)

export function applyCoupon(amount: number, code?: string) {
  if (!code) return { amount, discount: 0, valid: false, percent: 0 }
  const coupon = DEMO_COUPONS.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active)
  if (!coupon) return { amount, discount: 0, valid: false, percent: 0 }
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
  userId?: string
}

function uid() {
  return crypto.randomUUID()
}

export async function createCheckout(payload: CheckoutPayload): Promise<{
  initPoint?: string
  paymentId: string
  demo: boolean
}> {
  const final = applyCoupon(payload.amount || PRICE_RESUME, payload.couponCode)
  const paymentId = uid()

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

  // Persist pending in Supabase when possible
  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('payments').insert({
        id: paymentId,
        user_id: payload.userId || null,
        resume_id: payload.resumeId || null,
        amount: final.amount,
        status: 'pending',
        product: payload.product,
        coupon_code: payload.couponCode || null,
        affiliate_code: payload.affiliateCode || null,
      })
    } catch {
      // ignore
    }
  }

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

  const origin = window.location.origin
  const initPoint = `${origin}/pagamento/sucesso?payment_id=${paymentId}&status=approved&demo=1`
  return { initPoint, paymentId, demo: true }
}

export async function markPaymentApproved(paymentId: string) {
  const existing = JSON.parse(localStorage.getItem('cj_payments') || '[]') as Array<{
    id: string
    status: string
    amount?: number
    affiliateCode?: string
    email?: string
    product?: string
  }>
  const updated = existing.map((p) => (p.id === paymentId ? { ...p, status: 'approved' } : p))
  localStorage.setItem('cj_payments', JSON.stringify(updated))
  localStorage.setItem('cj_paid', 'true')
  const last = updated.find((p) => p.id === paymentId)
  if (last) localStorage.setItem('cj_last_payment', JSON.stringify(last))

  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('payments').update({ status: 'approved' }).eq('id', paymentId)
    } catch {
      // ignore
    }
  }

  // Local commission fallback (demo / when trigger already covers Supabase)
  if (last?.affiliateCode) {
    await registerLocalCommission({
      affiliateCode: last.affiliateCode,
      paymentId,
      saleAmount: Number(last.amount || PRICE_RESUME),
      referredEmail: last.email,
    })
  }
}

async function registerLocalCommission(params: {
  affiliateCode: string
  paymentId: string
  saleAmount: number
  referredEmail?: string
}) {
  const percent = 30
  const commissionAmount = Number(((params.saleAmount * percent) / 100).toFixed(2))
  const entry: AffiliateCommission = {
    id: uid(),
    affiliateUserId: params.affiliateCode,
    paymentId: params.paymentId,
    referredEmail: params.referredEmail,
    saleAmount: params.saleAmount,
    commissionPercent: percent,
    commissionAmount,
    status: 'approved',
    createdAt: new Date().toISOString(),
  }
  const list = JSON.parse(localStorage.getItem('cj_commissions') || '[]') as AffiliateCommission[]
  if (!list.some((c) => c.paymentId === params.paymentId)) {
    list.unshift(entry)
    localStorage.setItem('cj_commissions', JSON.stringify(list))
  }

  // If we can resolve affiliate user in Supabase, trigger path already handles it on payment update.
  // Extra safety insert when no row exists:
  const supabase = getSupabase()
  if (!supabase) return
  try {
    const { data: affiliate } = await supabase
      .from('users')
      .select('id, commission_percent')
      .ilike('affiliate_code', params.affiliateCode)
      .maybeSingle()
    if (!affiliate) return
    const pct = Number(affiliate.commission_percent ?? 30)
    const amount = Number(((params.saleAmount * pct) / 100).toFixed(2))
    await supabase.from('affiliate_commissions').insert({
      affiliate_user_id: affiliate.id,
      payment_id: params.paymentId,
      referred_email: params.referredEmail || null,
      sale_amount: params.saleAmount,
      commission_percent: pct,
      commission_amount: amount,
      status: 'approved',
    })
  } catch {
    // ignore duplicates / RLS
  }
}

export function hasPaidAccess(): boolean {
  return localStorage.getItem('cj_paid') === 'true'
}
