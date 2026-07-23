import type { AnalyticsSnapshot, PaymentRecord } from '@/types'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function getDemoAnalytics(): AnalyticsSnapshot {
  const stored = JSON.parse(localStorage.getItem('cj_payments') || '[]') as PaymentRecord[]
  const demoPayments: PaymentRecord[] = [
    {
      id: 'pay_1',
      userId: 'u1',
      amount: 4.9,
      status: 'approved',
      product: 'resume',
      createdAt: `${daysAgo(1)}T14:22:00Z`,
    },
    {
      id: 'pay_2',
      userId: 'u2',
      amount: 19.9,
      status: 'approved',
      product: 'complete_pack',
      couponCode: 'BEMVINDO10',
      createdAt: `${daysAgo(2)}T10:05:00Z`,
    },
    {
      id: 'pay_3',
      userId: 'u3',
      amount: 9.9,
      status: 'approved',
      product: 'linkedin',
      createdAt: `${daysAgo(3)}T18:40:00Z`,
    },
    {
      id: 'pay_4',
      userId: 'u4',
      amount: 4.9,
      status: 'rejected',
      product: 'resume',
      createdAt: `${daysAgo(4)}T09:12:00Z`,
    },
    {
      id: 'pay_5',
      userId: 'u5',
      amount: 4.9,
      status: 'approved',
      product: 'cover_letter',
      affiliateCode: 'ANA2024',
      createdAt: `${daysAgo(5)}T16:33:00Z`,
    },
    ...stored,
  ]

  const approved = demoPayments.filter((p) => p.status === 'approved')
  const month = new Date().toISOString().slice(0, 7)
  const monthlyRevenue = approved
    .filter((p) => p.createdAt.startsWith(month))
    .reduce((sum, p) => sum + p.amount, 0)

  const salesByDay = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i)
    const dayPayments = approved.filter((p) => p.createdAt.startsWith(date))
    return {
      date: date.slice(5),
      sales: dayPayments.length,
      revenue: Number(dayPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)),
    }
  })

  const totalUsers = 128 + stored.length
  const totalSales = approved.length
  const resumesGenerated = 96 + stored.filter((p) => p.product === 'resume').length
  const conversionRate = Number(((totalSales / Math.max(totalUsers, 1)) * 100).toFixed(1))

  return {
    totalUsers,
    totalSales,
    monthlyRevenue: Number(monthlyRevenue.toFixed(2)) || 247.3,
    resumesGenerated,
    conversionRate,
    payments: demoPayments.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20),
    salesByDay,
  }
}
