export type TemplateId =
  | 'moderno'
  | 'classico'
  | 'executivo'
  | 'minimalista'
  | 'azul'
  | 'preto'
  | 'criativo'
  | 'jovem-aprendiz'
  | 'primeiro-emprego'
  | 'corporativo'

export interface Experience {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export interface Education {
  id: string
  institution: string
  course: string
  level: string
  startDate: string
  endDate: string
}

export interface Course {
  id: string
  name: string
  institution: string
  year: string
}

export interface Language {
  id: string
  name: string
  level: string
}

export interface ResumeData {
  id?: string
  fullName: string
  birthDate: string
  phone: string
  email: string
  city: string
  objective: string
  professionalSummary: string
  experiences: Experience[]
  education: Education[]
  courses: Course[]
  skills: string[]
  languages: Language[]
  keywords: string[]
  templateId: TemplateId
  aiEnhanced: boolean
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  isAdmin?: boolean
  affiliateCode?: string
  createdAt: string
}

export interface PaymentRecord {
  id: string
  userId: string
  resumeId?: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  product: 'resume' | 'cover_letter' | 'linkedin' | 'complete_pack'
  couponCode?: string
  affiliateCode?: string
  mercadoPagoId?: string
  createdAt: string
}

export interface Coupon {
  code: string
  discountPercent: number
  active: boolean
  maxUses?: number
  usedCount: number
}

export interface UpsellOffer {
  id: string
  name: string
  description: string
  price: number
  product: PaymentRecord['product']
  badge?: string
}

export interface AnalyticsSnapshot {
  totalUsers: number
  totalSales: number
  monthlyRevenue: number
  resumesGenerated: number
  conversionRate: number
  payments: PaymentRecord[]
  salesByDay: { date: string; sales: number; revenue: number }[]
}

export const PRICE_RESUME = 4.9
export const PRICE_COVER = 4.9
export const PRICE_LINKEDIN = 9.9
export const PRICE_COMPLETE = 19.9
