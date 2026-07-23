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
  year: string
}

export interface Course {
  id: string
  name: string
  institution: string
  year: string
}

export interface ResumeData {
  id?: string
  fullName: string
  address: string
  birthDate: string
  nationality: string
  maritalStatus: string
  phone: string
  email: string
  education: Education[]
  courses: Course[]
  experiences: Experience[]
  professionalSummary: string
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
  commissionPercent?: number
  pixKey?: string
  totalEarned?: number
  totalPaid?: number
  createdAt: string
}

export interface AffiliateCommission {
  id: string
  affiliateUserId: string
  paymentId?: string
  referredEmail?: string
  saleAmount: number
  commissionPercent: number
  commissionAmount: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  createdAt: string
  paidAt?: string
}

export interface PaymentRecord {
  id: string
  userId: string
  resumeId?: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  product: 'resume'
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
export const BRAND_NAME = 'Currículo OPEN'
export const BRAND_COMPANY = 'Open Gráfica'
