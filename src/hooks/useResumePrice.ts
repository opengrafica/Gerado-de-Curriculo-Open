import { useEffect, useState } from 'react'
import { getResumePrice, PRICE_UPDATED_EVENT, setResumePrice as persistResumePrice } from '@/lib/pricing'
import { PRICE_RESUME } from '@/types'

/** Preço do currículo sincronizado com o painel admin (site + Pix). */
export function useResumePrice(initial = PRICE_RESUME) {
  const [price, setPrice] = useState(initial)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      void getResumePrice().then((value) => {
        if (!cancelled) setPrice(value)
      })
    }
    refresh()
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail
      if (typeof detail === 'number' && detail > 0) setPrice(detail)
      else refresh()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'cj_resume_price') refresh()
    }
    window.addEventListener(PRICE_UPDATED_EVENT, onUpdate)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.removeEventListener(PRICE_UPDATED_EVENT, onUpdate)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return price
}

export async function updateResumePrice(price: number) {
  return persistResumePrice(price)
}
