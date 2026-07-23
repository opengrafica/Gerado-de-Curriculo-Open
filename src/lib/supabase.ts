import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('your-project'))

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createClient(url!, anonKey!)
  }
  return client
}

export type DbUser = {
  id: string
  email: string
  full_name: string
  phone: string | null
  is_admin: boolean
  affiliate_code: string | null
  created_at: string
}

export type DbResume = {
  id: string
  user_id: string | null
  data: Record<string, unknown>
  template_id: string
  pdf_url: string | null
  status: string
  created_at: string
}

export type DbPayment = {
  id: string
  user_id: string | null
  resume_id: string | null
  amount: number
  status: string
  product: string
  coupon_code: string | null
  affiliate_code: string | null
  mercado_pago_id: string | null
  created_at: string
}
