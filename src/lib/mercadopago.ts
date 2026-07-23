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

export interface PixCheckoutPayload {
  title: string
  amount: number
  resumeId?: string
  email?: string
  firstName?: string
  couponCode?: string
  affiliateCode?: string
  userId?: string
}

export interface PixPaymentResult {
  paymentId: string
  mpPaymentId: string
  amount: number
  qrCode: string
  qrCodeBase64: string
  ticketUrl?: string
  expiresAt?: string
  demo: boolean
  status: string
}

function uid() {
  return crypto.randomUUID()
}

export async function createPixPayment(payload: PixCheckoutPayload): Promise<PixPaymentResult> {
  const final = applyCoupon(payload.amount || PRICE_RESUME, payload.couponCode)
  const paymentId = uid()

  const record = {
    id: paymentId,
    product: 'resume' as const,
    ...payload,
    amount: final.amount,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  }
  const existing = JSON.parse(localStorage.getItem('cj_payments') || '[]')
  existing.unshift(record)
  localStorage.setItem('cj_payments', JSON.stringify(existing))
  localStorage.setItem('cj_last_payment', JSON.stringify(record))

  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('payments').insert({
        id: paymentId,
        user_id: payload.userId || null,
        resume_id: payload.resumeId || null,
        amount: final.amount,
        status: 'pending',
        product: 'resume',
        coupon_code: payload.couponCode || null,
        affiliate_code: payload.affiliateCode || null,
      })
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        amount: final.amount,
        email: payload.email,
        firstName: payload.firstName,
        paymentId,
        couponCode: payload.couponCode,
        affiliateCode: payload.affiliateCode,
        resumeId: payload.resumeId,
        userId: payload.userId,
      }),
    })
    const data = await res.json()
    if (res.ok && data.qr_code) {
      if (data.id) {
        localStorage.setItem('cj_mp_payment_id', String(data.id))
        localStorage.setItem('cj_local_payment_id', paymentId)
      }
      if (supabase && data.id) {
        try {
          await supabase
            .from('payments')
            .update({ mercado_pago_id: String(data.id) })
            .eq('id', paymentId)
        } catch {
          // ignore
        }
      }
      return {
        paymentId,
        mpPaymentId: String(data.id),
        amount: final.amount,
        qrCode: data.qr_code,
        qrCodeBase64: data.qr_code_base64 || '',
        ticketUrl: data.ticket_url || undefined,
        expiresAt: data.expires_at || undefined,
        demo: false,
        status: data.status || 'pending',
      }
    }
    if (data?.demo || res.status === 503) {
      // fall through to demo
    } else if (data?.error) {
      console.warn('Pix API error', data.error)
    }
  } catch (err) {
    console.warn('Pix API unavailable', err)
  }

  // Demo Pix (sem token / falha de API)
  const demoCode = `00020126580014BR.GOV.BCB.PIX0136${paymentId}520400005303986540${final.amount.toFixed(2)}5802BR5913CurriculoJa6009SAO PAULO62070503***6304ABCD`
  return {
    paymentId,
    mpPaymentId: `demo_${paymentId}`,
    amount: final.amount,
    qrCode: demoCode,
    qrCodeBase64: '',
    demo: true,
    status: 'pending',
  }
}

export async function checkPixStatus(mpPaymentId: string): Promise<{
  status: string
  statusDetail?: string
  externalReference?: string
}> {
  if (mpPaymentId.startsWith('demo_')) {
    return { status: 'pending' }
  }
  const res = await fetch(`/api/payment-status/${mpPaymentId}`)
  if (!res.ok) throw new Error('Falha ao consultar pagamento')
  const data = await res.json()
  return {
    status: data.status,
    statusDetail: data.status_detail,
    externalReference: data.external_reference,
  }
}

export async function markPaymentApproved(paymentId: string) {
  const existing = JSON.parse(localStorage.getItem('cj_payments') || '[]') as Array<{
    id: string
    status: string
    amount?: number
    affiliateCode?: string
    email?: string
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
    // ignore
  }
}

export function hasPaidAccess(): boolean {
  return localStorage.getItem('cj_paid') === 'true'
}

/** Simula aprovação imediata no modo demo (botão "Já paguei" / teste). */
export async function approveDemoPix(paymentId: string, mpPaymentId: string) {
  if (!mpPaymentId.startsWith('demo_')) return false
  await markPaymentApproved(paymentId)
  return true
}
