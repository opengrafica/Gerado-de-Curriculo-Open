import { useEffect, useMemo, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts'
import {
  Users,
  ShoppingCart,
  Wallet,
  FileText,
  Percent,
  BadgeDollarSign,
  Shield,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { getDemoAnalytics } from '@/data/analytics'
import { useAppStore } from '@/store/appStore'
import { getSupabase } from '@/lib/supabase'
import type { AffiliateCommission, PaymentRecord } from '@/types'

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Users
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        <Icon className="size-5 text-brand-600" />
      </div>
      <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
    </div>
  )
}

type AdminUser = {
  id: string
  email: string
  full_name: string
  is_admin: boolean
  affiliate_code: string | null
  commission_percent: number
  total_earned: number
  total_paid: number
  created_at: string
}

export function AdminPage() {
  const user = useAppStore((s) => s.user)
  const demo = useMemo(() => getDemoAnalytics(), [])
  const [tab, setTab] = useState<'overview' | 'users' | 'payments' | 'affiliates'>('overview')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>(demo.payments)
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = getSupabase()
      if (!supabase || !user?.isAdmin) {
        setLoading(false)
        return
      }
      const [u, p, c] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50),
        supabase
          .from('affiliate_commissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      if (cancelled) return
      if (u.data) setUsers(u.data as AdminUser[])
      if (p.data?.length) {
        setPayments(
          p.data.map((row) => ({
            id: row.id,
            userId: row.user_id || '',
            resumeId: row.resume_id || undefined,
            amount: Number(row.amount),
            status: row.status,
            product: row.product,
            couponCode: row.coupon_code || undefined,
            affiliateCode: row.affiliate_code || undefined,
            mercadoPagoId: row.mercado_pago_id || undefined,
            createdAt: row.created_at,
          })),
        )
      }
      if (c.data?.length) {
        setCommissions(
          c.data.map((row) => ({
            id: row.id,
            affiliateUserId: row.affiliate_user_id,
            paymentId: row.payment_id || undefined,
            referredEmail: row.referred_email || undefined,
            saleAmount: Number(row.sale_amount),
            commissionPercent: Number(row.commission_percent),
            commissionAmount: Number(row.commission_amount),
            status: row.status,
            createdAt: row.created_at,
            paidAt: row.paid_at || undefined,
          })),
        )
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  if (!user.isAdmin) {
    return (
      <div className="py-20">
        <Container className="max-w-lg text-center">
          <Shield className="mx-auto size-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-ink-500">Somente super admin pode acessar este painel.</p>
          <Button className="mt-6" onClick={() => (window.location.href = '/')}>Voltar</Button>
        </Container>
      </div>
    )
  }

  const totalUsers = users.length || demo.totalUsers
  const approvedPayments = payments.filter((p) => p.status === 'approved')
  const revenue = approvedPayments.reduce((s, p) => s + p.amount, 0)
  const pendingCommissions = commissions
    .filter((c) => c.status === 'approved' || c.status === 'pending')
    .reduce((s, c) => s + c.commissionAmount, 0)

  const markCommissionPaid = async (id: string) => {
    const supabase = getSupabase()
    if (supabase) {
      await supabase
        .from('affiliate_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id)
    }
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'paid', paidAt: new Date().toISOString() } : c)),
    )
  }

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Painel Super Admin</h1>
            <p className="mt-2 text-ink-600 dark:text-ink-300">
              Olá, {user.fullName}. Gerencie usuários, vendas, currículos e afiliados.
            </p>
          </div>
          <Link to="/afiliados" className="text-sm font-semibold text-brand-700 hover:underline">
            Ver programa de afiliados →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Visão geral' },
            { id: 'users', label: 'Usuários' },
            { id: 'payments', label: 'Pagamentos' },
            { id: 'affiliates', label: 'Afiliados' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="mt-6 text-sm text-ink-500">Carregando dados do Supabase…</p>}

        {tab === 'overview' && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Total de usuários" value={String(totalUsers)} icon={Users} />
              <Stat label="Vendas aprovadas" value={String(approvedPayments.length || demo.totalSales)} icon={ShoppingCart} />
              <Stat label="Receita" value={`R$ ${revenue.toFixed(2).replace('.', ',') || demo.monthlyRevenue}`} icon={Wallet} />
              <Stat label="Currículos gerados" value={String(demo.resumesGenerated)} icon={FileText} />
              <Stat label="Comissões a pagar" value={`R$ ${pendingCommissions.toFixed(2).replace('.', ',')}`} icon={BadgeDollarSign} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
                <h2 className="mb-4 font-semibold">Receita (7 dias)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demo.salesByDay}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9476" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#0d9476" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#0d9476" fill="url(#rev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
                <h2 className="mb-4 font-semibold">Vendas (7 dias)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demo.salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">E-mail</th>
                  <th className="px-5 py-3 font-medium">Afiliado</th>
                  <th className="px-5 py-3 font-medium">Comissão</th>
                  <th className="px-5 py-3 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody>
                {(users.length ? users : []).map((u) => (
                  <tr key={u.id} className="border-t border-ink-100 dark:border-ink-800">
                    <td className="px-5 py-3 font-medium">{u.full_name || '—'}</td>
                    <td className="px-5 py-3">{u.email}</td>
                    <td className="px-5 py-3 font-mono text-xs">{u.affiliate_code || '—'}</td>
                    <td className="px-5 py-3">{Number(u.commission_percent || 30)}%</td>
                    <td className="px-5 py-3">{u.is_admin ? 'Sim' : 'Não'}</td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-ink-500">
                      Nenhum usuário listado ainda (ou RLS bloqueou a leitura).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payments' && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
                <tr>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Afiliado</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-ink-100 dark:border-ink-800">
                    <td className="px-5 py-3 font-mono text-xs">{p.id.slice(0, 12)}</td>
                    <td className="px-5 py-3">{p.product}</td>
                    <td className="px-5 py-3">R$ {p.amount.toFixed(2).replace('.', ',')}</td>
                    <td className="px-5 py-3">{p.affiliateCode || '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          p.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-500">
                      {new Date(p.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'affiliates' && (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-100">
              Comissão padrão: <strong>30%</strong> por venda aprovada. Seu código master:{' '}
              <strong>{user.affiliateCode || 'OPENGRAFICA'}</strong>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
                  <tr>
                    <th className="px-5 py-3 font-medium">Venda</th>
                    <th className="px-5 py-3 font-medium">Comissão</th>
                    <th className="px-5 py-3 font-medium">%</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-t border-ink-100 dark:border-ink-800">
                      <td className="px-5 py-3">R$ {c.saleAmount.toFixed(2).replace('.', ',')}</td>
                      <td className="px-5 py-3 font-semibold text-brand-700">
                        R$ {c.commissionAmount.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-5 py-3">{c.commissionPercent}%</td>
                      <td className="px-5 py-3">{c.status}</td>
                      <td className="px-5 py-3">
                        {(c.status === 'approved' || c.status === 'pending') && (
                          <Button size="sm" onClick={() => markCommissionPaid(c.id)}>
                            Marcar pago
                          </Button>
                        )}
                        {c.status === 'paid' && <span className="text-xs text-ink-400">Pago</span>}
                      </td>
                    </tr>
                  ))}
                  {!commissions.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-ink-500">
                        Nenhuma comissão registrada ainda. Elas aparecem após vendas com `?ref=CODIGO`.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="flex items-center gap-2 text-sm text-ink-500">
              <Percent className="size-4" /> Conversão demo: {demo.conversionRate}%
            </p>
          </div>
        )}
      </Container>
    </div>
  )
}
