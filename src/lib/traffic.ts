export type TrafficAttribution = {
  trafficSource: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  landingPath?: string
  capturedAt: string
}

const STORAGE_KEY = 'cj_traffic_attribution'

function classifySource(params: URLSearchParams, referrer: string): string {
  const utmSource = (params.get('utm_source') || '').toLowerCase()
  const utmMedium = (params.get('utm_medium') || '').toLowerCase()
  const gclid = params.get('gclid')
  const fbclid = params.get('fbclid')
  const ttclid = params.get('ttclid')

  if (gclid || utmSource.includes('google') || utmMedium === 'cpc' || utmMedium === 'ppc') {
    return 'tráfego pago · Google'
  }
  if (fbclid || utmSource.includes('facebook') || utmSource.includes('fb') || utmSource.includes('meta') || utmSource.includes('instagram') || utmSource.includes('ig')) {
    return 'tráfego pago · Meta'
  }
  if (ttclid || utmSource.includes('tiktok')) {
    return 'tráfego pago · TikTok'
  }
  if (utmMedium.includes('paid') || utmMedium.includes('cpc') || utmMedium.includes('cpm') || utmMedium.includes('ads')) {
    return `tráfego pago · ${utmSource || 'anúncio'}`
  }
  if (utmSource) {
    return `campanha · ${utmSource}`
  }
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, '')
      if (host.includes('google')) return 'orgânico · Google'
      if (host.includes('instagram') || host.includes('facebook')) return 'social · Meta'
      if (host.includes('whatsapp')) return 'WhatsApp'
      return `referência · ${host}`
    } catch {
      return 'referência'
    }
  }
  return 'direto'
}

/** Captura UTM / cliques de anúncio na primeira visita e mantém até o cadastro. */
export function captureTrafficAttribution(search = window.location.search, path = window.location.pathname) {
  if (typeof window === 'undefined') return getTrafficAttribution()

  const existing = getTrafficAttribution()
  // Não sobrescreve atribuição já salva (first-touch)
  if (existing && existing.trafficSource !== 'direto') return existing

  const params = new URLSearchParams(search)
  const hasSignal =
    params.has('utm_source') ||
    params.has('utm_medium') ||
    params.has('utm_campaign') ||
    params.has('gclid') ||
    params.has('fbclid') ||
    params.has('ttclid') ||
    Boolean(document.referrer)

  if (!hasSignal && existing) return existing

  const attribution: TrafficAttribution = {
    trafficSource: classifySource(params, document.referrer || ''),
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmContent: params.get('utm_content') || undefined,
    utmTerm: params.get('utm_term') || undefined,
    landingPath: path || '/',
    capturedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  return attribution
}

export function getTrafficAttribution(): TrafficAttribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TrafficAttribution
  } catch {
    return null
  }
}

export function attributionForSignup() {
  const a = getTrafficAttribution() || captureTrafficAttribution() || {
    trafficSource: 'direto',
    landingPath: '/',
    capturedAt: new Date().toISOString(),
  }
  return {
    traffic_source: a.trafficSource,
    utm_source: a.utmSource || null,
    utm_medium: a.utmMedium || null,
    utm_campaign: a.utmCampaign || null,
    utm_content: a.utmContent || null,
    utm_term: a.utmTerm || null,
    landing_path: a.landingPath || null,
  }
}
