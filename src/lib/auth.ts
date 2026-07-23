import { getSupabase } from '@/lib/supabase'
import { attributionForSignup } from '@/lib/traffic'
import type { UserProfile } from '@/types'

const SUPER_ADMIN_EMAIL = 'opengraficaoficial@gmail.com'

export function isSuperAdminEmail(email?: string | null) {
  return (email || '').toLowerCase() === SUPER_ADMIN_EMAIL
}

export async function fetchUserProfile(userId: string, email?: string): Promise<Partial<UserProfile>> {
  const supabase = getSupabase()
  if (!supabase) {
    return {
      isAdmin: isSuperAdminEmail(email),
      affiliateCode: isSuperAdminEmail(email) ? 'OPENGRAFICA' : undefined,
    }
  }

  const { data } = await supabase
    .from('users')
    .select('full_name, phone, is_admin, affiliate_code, commission_percent, pix_key, total_earned, total_paid')
    .eq('id', userId)
    .maybeSingle()

  return {
    fullName: data?.full_name,
    phone: data?.phone || undefined,
    isAdmin: Boolean(data?.is_admin) || isSuperAdminEmail(email),
    affiliateCode: data?.affiliate_code || undefined,
    commissionPercent: data?.commission_percent != null ? Number(data.commission_percent) : 30,
    pixKey: data?.pix_key || undefined,
    totalEarned: data?.total_earned != null ? Number(data.total_earned) : 0,
    totalPaid: data?.total_paid != null ? Number(data.total_paid) : 0,
  }
}

export async function ensureProfile(params: {
  id: string
  email: string
  fullName?: string
  phone?: string
}) {
  const supabase = getSupabase()
  if (!supabase) return

  const code = params.fullName
    ? `${params.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`
    : `CJ${Math.floor(Math.random() * 900000 + 100000)}`

  const attribution = attributionForSignup()

  await supabase.from('users').upsert(
    {
      id: params.id,
      email: params.email,
      full_name: params.fullName || params.email.split('@')[0],
      phone: params.phone || null,
      is_admin: isSuperAdminEmail(params.email),
      affiliate_code: isSuperAdminEmail(params.email) ? 'OPENGRAFICA' : code,
      traffic_source: attribution.traffic_source,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      landing_path: attribution.landing_path,
      first_seen_at: new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )

  const { data: existing } = await supabase
    .from('users')
    .select('traffic_source, phone')
    .eq('id', params.id)
    .maybeSingle()

  const weakSource = !existing?.traffic_source || existing.traffic_source === 'direto'
  const patch: Record<string, unknown> = {}
  if (params.phone && !existing?.phone) patch.phone = params.phone
  if (weakSource && attribution.traffic_source) {
    patch.traffic_source = attribution.traffic_source
    patch.utm_source = attribution.utm_source
    patch.utm_medium = attribution.utm_medium
    patch.utm_campaign = attribution.utm_campaign
    patch.utm_content = attribution.utm_content
    patch.utm_term = attribution.utm_term
    patch.landing_path = attribution.landing_path
  }
  if (Object.keys(patch).length) {
    await supabase.from('users').update(patch).eq('id', params.id)
  }
}
