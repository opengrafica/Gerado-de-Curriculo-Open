import { useEffect, useMemo, useState } from 'react'
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
import { Users, ShoppingCart, Wallet, FileText, Shield, Banknote } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { getDemoAnalytics } from '@/data/analytics'
import { useAppStore } from '@/store/appStore'
import { getSupabase } from '@/lib/supabase'
import { getResumePrice, setResumePrice } from '@/lib/pricing'
import type { PaymentRecord } from '@/types'

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
  created_at: string
}

export function AdminPage() {
  const user = useAppStore((s) => s.user)
  const demo = useMemo(() => getDemoAnalytics(), [])
  const [tab, setTab] = useState<'overview' | 'users' | 'payments' | 'pricing'>('overview')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>(demo.payments)
  const [loading, setLoading] = useState(true)
  const [price, setPrice] = useState(4.9)
  const [priceMsg, setPriceMsg] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const currentPrice = await getResumePrice()
      if (!cancelled) setPrice(currentPrice)

      const supabase = getSupabase()
      if (!supabase || !user?.isAdmin) {
        setLoading(false)
        return
      }
      const [u, p] = await Promise.all([
        supabase.from('users').select('id,email,full_name,is_admin,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50),
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
            product: 'resume',
            couponCode: row.coupon_code || undefined,
            mercadoPagoId: row.mercado_pago_id || undefined,
            createdAt: row.created_at,
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

  const approvedPayments = payments.filter((p) => p.status === 'approved')
  const revenue = approvedPayments.reduce((s, p) => s + p.amount, 0)

  const savePrice = async () => {
    setSavingPrice(true)
    setPriceMsg('')
    try {
      const saved = await setResumePrice(price)
      setPrice(saved)
      setPriceMsg(`Preço atualizado: R$ ${saved.toFixed(2).replace('.', ',')}. Novos Pix usam este valor.`)
    } catch (err) {
      setPriceMsg(err instanceof Error ? err.message : 'Erro ao salvar preço')
    } finally {
      setSavingPrice(false)
    }
  }

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Painel Super Admin</h1>
            <p className="mt-2 text-ink-600 dark:text-ink-300">
              Olá, {user?.fullName}. Gerencie usuários, vendas, preço e currículos.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
            <Shield className="size-4" /> {user?.email}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Visão geral' },
            { id: 'users', label: 'Usuários' },
            { id: 'payments', label: 'Vendas' },
            { id: 'pricing', label: 'Preço / Pix' },
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

        {loading && <p className="mt-6 text-sm text-ink-500">Carregando…</p>}

        {tab === 'overview' && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Usuários" value={String(users.length || demo.totalUsers)} icon={Users} />
              <Stat label="Vendas aprovadas" value={String(approvedPayments.length || demo.totalSales)} icon={ShoppingCart} />
              <Stat
                label="Receita"
                value={`R$ ${(revenue || demo.monthlyRevenue).toFixed(2).replace('.', ',')}`}
                icon={Wallet}
              />
              <Stat label="Preço atual" value={`R$ ${price.toFixed(2).replace('.', ',')}`} icon={Banknote} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
                <h2 className="mb-4 font-semibold">Receita (7 dias)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demo.salesByDay}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00aeef" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#00aeef" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#00aeef" fill="url(#rev)" />
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
                      <Bar dataKey="sales" fill="#ec008c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">E-mail</th>
                  <th className="px-5 py-3 font-medium">Admin</th>
                  <th className="px-5 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-ink-100 dark:border-ink-800">
                    <td className="px-5 py-3 font-medium">{u.full_name || '—'}</td>
                    <td className="px-5 py-3">{u.email}</td>
                    <td className="px-5 py-3">{u.is_admin ? 'Sim' : 'Não'}</td>
                    <td className="px-5 py-3 text-ink-500">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-ink-500">
                      Nenhum usuário listado ainda.
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
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">MP</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-ink-100 dark:border-ink-800">
                    <td className="px-5 py-3 font-mono text-xs">{p.id.slice(0, 12)}</td>
                    <td className="px-5 py-3">R$ {p.amount.toFixed(2).replace('.', ',')}</td>
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
                    <td className="px-5 py-3 font-mono text-xs">{p.mercadoPagoId || '—'}</td>
                    <td className="px-5 py-3 text-ink-500">
                      {new Date(p.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'pricing' && (
          <div className="mt-8 max-w-lg space-y-4 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-brand-600" />
              <h2 className="text-lg font-semibold">Valor do currículo (Pix)</h2>
            </div>
            <p className="text-sm text-ink-500">
              Ao salvar, todos os novos pagamentos Pix usam este valor automaticamente.
            </p>
            <Field label="Preço em R$">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </Field>
            <Button loading={savingPrice} onClick={savePrice}>
              Salvar preço
            </Button>
            {priceMsg && <p className="text-sm text-brand-700 dark:text-brand-300">{priceMsg}</p>}
          </div>
        )}
      </Container>
    </div>
  )
}
