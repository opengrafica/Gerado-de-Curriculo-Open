import { getSupabase } from '@/lib/supabase'
import { PRICE_RESUME } from '@/types'

const LOCAL_PRICE_KEY = 'cj_resume_price'
export const PRICE_UPDATED_EVENT = 'cj:price-updated'

function notifyPrice(price: number) {
  try {
    window.dispatchEvent(new CustomEvent(PRICE_UPDATED_EVENT, { detail: price }))
  } catch {
    // ignore (SSR / non-browser)
  }
}

export async function getResumePrice(): Promise<number> {
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'pricing').maybeSingle()
      const value = data?.value as { resume?: number } | null
      if (value?.resume != null && Number(value.resume) > 0) {
        const price = Number(value.resume)
        localStorage.setItem(LOCAL_PRICE_KEY, String(price))
        return price
      }
    } catch {
      // fallback
    }
  }
  const local = Number(localStorage.getItem(LOCAL_PRICE_KEY) || PRICE_RESUME)
  return local > 0 ? local : PRICE_RESUME
}

export async function setResumePrice(price: number): Promise<number> {
  const safe = Math.max(0.01, Number(Number(price).toFixed(2)))
  localStorage.setItem(LOCAL_PRICE_KEY, String(safe))
  notifyPrice(safe)

  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('app_settings').upsert(
      {
        key: 'pricing',
        value: { resume: safe },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    if (error) throw error
  }
  notifyPrice(safe)
  return safe
}
