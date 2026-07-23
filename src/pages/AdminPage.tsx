import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Shield,
  Banknote,
  Trash2,
  RefreshCw,
  UserPlus,
  Percent,
  Megaphone,
  Clock3,
  Download,
} from 'lucide-react'
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
  hint,
}: {
  label: string
  value: string
  icon: typeof Users
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        <Icon className="size-5 text-brand-600" />
      </div>
      <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

type AdminUser = {
  id: string
  email: string
  full_name: string
  phone: string | null
  is_admin: boolean
  created_at: string
  traffic_source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  landing_path: string | null
}

type AdminPayment = PaymentRecord & {
  email?: string
}

function daysAgo(n: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function buildSalesByDay(payments: AdminPayment[], days = 7) {
  const map = new Map<string, { date: string; sales: number; revenue: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, {
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      sales: 0,
      revenue: 0,
    })
  }
  payments
    .filter((p) => p.status === 'approved')
    .forEach((p) => {
      const key = new Date(p.createdAt).toISOString().slice(0, 10)
      const row = map.get(key)
      if (row) {
        row.sales += 1
        row.revenue += p.amount
      }
    })
  return Array.from(map.values())
}

function isNewClient(createdAt: string) {
  return new Date(createdAt).getTime() >= daysAgo(7).getTime()
}

function formatMoney(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

export function AdminPage() {
  const user = useAppStore((s) => s.user)
  const demo = useMemo(() => getDemoAnalytics(), [])
  const [tab, setTab] = useState<'overview' | 'users' | 'payments' | 'pricing'>('overview')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [price, setPrice] = useState(4.9)
  const [priceMsg, setPriceMsg] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const currentPrice = await getResumePrice()
    setPrice(currentPrice)

    const supabase = getSupabase()
    if (!supabase || !user?.isAdmin) {
      setPayments(demo.payments)
      setLoading(false)
      return
    }

    const [u, p] = await Promise.all([
      supabase
        .from('users')
        .select(
          'id,email,full_name,phone,is_admin,created_at,traffic_source,utm_source,utm_medium,utm_campaign,landing_path',
        )
        .order('created_at', { ascending: false })
        .limit(300),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200),
    ])

    if (u.data) setUsers(u.data as AdminUser[])

    if (p.data?.length) {
      const emailById = new Map((u.data || []).map((row) => [row.id, row.email]))
      setPayments(
        p.data.map((row) => ({
          id: row.id,
          userId: row.user_id || '',
          resumeId: row.resume_id || undefined,
          amount: Number(row.amount),
          status: row.status,
          product: 'resume' as const,
          couponCode: row.coupon_code || undefined,
          mercadoPagoId: row.mercado_pago_id || undefined,
          createdAt: row.created_at,
          email: row.user_id ? emailById.get(row.user_id) : undefined,
        })),
      )
    } else {
      setPayments([])
    }
    setLoading(false)
  }, [user, demo.payments])

  useEffect(() => {
    void load()
  }, [load])

  const clients = useMemo(() => users.filter((u) => !u.is_admin), [users])
  const approvedPayments = payments.filter((p) => p.status === 'approved')
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const revenue = approvedPayments.reduce((s, p) => s + p.amount, 0)
  const newClients7d = clients.filter((u) => isNewClient(u.created_at))
  const newClientsToday = clients.filter(
    (u) => new Date(u.created_at).toDateString() === new Date().toDateString(),
  )
  const paidTraffic = clients.filter((u) => (u.traffic_source || '').includes('tráfego pago'))
  const conversion =
    clients.length > 0 ? Math.round((approvedPayments.length / clients.length) * 1000) / 10 : 0
  const salesByDay = useMemo(
    () => (payments.length ? buildSalesByDay(payments) : demo.salesByDay),
    [payments, demo.salesByDay],
  )

  const sourceBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    clients.forEach((u) => {
      const key = u.traffic_source || 'direto'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [clients])

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    return clients.filter((u) => {
      const matchesQuery =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.utm_campaign || '').toLowerCase().includes(q)
      const matchesSource =
        sourceFilter === 'todos' ||
        (sourceFilter === 'pago'
          ? (u.traffic_source || '').includes('tráfego pago')
          : sourceFilter === 'novos'
            ? isNewClient(u.created_at)
            : (u.traffic_source || 'direto') === sourceFilter)
      return matchesQuery && matchesSource
    })
  }, [clients, userQuery, sourceFilter])

  const savePrice = async () => {
    setSavingPrice(true)
    setPriceMsg('')
    try {
      const saved = await setResumePrice(price)
      setPrice(saved)
      setPriceMsg(
        `Preço atualizado: ${formatMoney(saved)}. Já aparece no site e nos próximos Pix.`,
      )
    } catch (err) {
      setPriceMsg(err instanceof Error ? err.message : 'Erro ao salvar preço')
    } finally {
      setSavingPrice(false)
    }
  }

  const deletePayment = async (id: string) => {
    if (!confirm('Excluir esta venda? Esta ação não pode ser desfeita.')) return
    setDeletingId(id)
    try {
      const supabase = getSupabase()
      if (supabase) {
        const { error } = await supabase.from('payments').delete().eq('id', id)
        if (error) throw error
      }
      setPayments((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível excluir a venda')
    } finally {
      setDeletingId(null)
    }
  }

  const exportClientsCsv = () => {
    const header = [
      'nome',
      'email',
      'telefone',
      'origem',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'landing',
      'cadastro',
    ]
    const rows = filteredUsers.map((u) =>
      [
        u.full_name,
        u.email,
        u.phone || '',
        u.traffic_source || 'direto',
        u.utm_source || '',
        u.utm_medium || '',
        u.utm_campaign || '',
        u.landing_path || '',
        new Date(u.created_at).toLocaleString('pt-BR'),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes-curriculo-open-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => void load()} loading={loading}>
              <RefreshCw className="size-4" /> Atualizar
            </Button>
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
              <Shield className="size-4" /> {user?.email}
            </div>
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
              <Stat
                label="Clientes"
                value={String(clients.length || demo.totalUsers)}
                icon={Users}
                hint={`${newClientsToday.length} novos hoje`}
              />
              <Stat
                label="Novos (7 dias)"
                value={String(newClients7d.length)}
                icon={UserPlus}
                hint={`${paidTraffic.length} de tráfego pago`}
              />
              <Stat
                label="Vendas aprovadas"
                value={String(approvedPayments.length || demo.totalSales)}
                icon={ShoppingCart}
                hint={`${pendingPayments.length} Pix pendentes`}
              />
              <Stat
                label="Receita"
                value={formatMoney(revenue || demo.monthlyRevenue)}
                icon={Wallet}
                hint={`Ticket médio ${formatMoney(
                  approvedPayments.length ? revenue / approvedPayments.length : price,
                )}`}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Preço no site" value={formatMoney(price)} icon={Banknote} hint="Sincronizado com Pix" />
              <Stat label="Conversão" value={`${conversion}%`} icon={Percent} hint="Clientes → venda aprovada" />
              <Stat
                label="Pix pendentes"
                value={String(pendingPayments.length)}
                icon={Clock3}
                hint="Aguardando confirmação"
              />
              <Stat
                label="Tráfego pago"
                value={String(paidTraffic.length)}
                icon={Megaphone}
                hint="Google / Meta / TikTok"
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
                <h2 className="mb-4 font-semibold">Receita (7 dias)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesByDay}>
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
                    <BarChart data={salesByDay}>
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

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
                <h2 className="mb-3 font-semibold">Origem dos clientes</h2>
                {sourceBreakdown.length === 0 ? (
                  <p className="text-sm text-ink-500">Ainda sem clientes capturados.</p>
                ) : (
                  <ul className="space-y-2">
                    {sourceBreakdown.map((row) => (
                      <li key={row.source} className="flex items-center justify-between text-sm">
                        <span className="text-ink-700 dark:text-ink-200">{row.source}</span>
                        <span className="font-semibold">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
                <h2 className="mb-3 font-semibold">Ações rápidas</h2>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setTab('users')}>
                    Ver clientes novos
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setTab('payments')}>
                    Gerenciar vendas
                  </Button>
                  <Button size="sm" onClick={() => setTab('pricing')}>
                    Alterar preço Pix
                  </Button>
                </div>
                <p className="mt-4 text-sm text-ink-500">
                  Últimas vendas aprovadas: {approvedPayments.slice(0, 3).map((p) => formatMoney(p.amount)).join(' · ') || '—'}
                </p>
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Field label="Buscar cliente">
                  <Input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Nome, e-mail, telefone ou campanha"
                  />
                </Field>
              </div>
              <div>
                <Field label="Filtro">
                  <select
                    className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-900"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                  >
                    <option value="todos">Todos</option>
                    <option value="novos">Novos (7 dias)</option>
                    <option value="pago">Tráfego pago</option>
                    {sourceBreakdown.map((s) => (
                      <option key={s.source} value={s.source}>
                        {s.source}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Button variant="secondary" onClick={exportClientsCsv}>
                <Download className="size-4" /> Exportar CSV
              </Button>
            </div>

            <p className="text-sm text-ink-500">
              {filteredUsers.length} cliente(s) · captura automática de UTM / anúncios (Google, Meta, TikTok)
            </p>

            <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Contato</th>
                    <th className="px-5 py-3 font-medium">Origem</th>
                    <th className="px-5 py-3 font-medium">Campanha</th>
                    <th className="px-5 py-3 font-medium">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-ink-100 dark:border-ink-800">
                      <td className="px-5 py-3">
                        <p className="font-medium">{u.full_name || '—'}</p>
                        <p className="text-xs text-ink-500">{u.email}</p>
                        {isNewClient(u.created_at) && (
                          <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Novo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">{u.phone || '—'}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            (u.traffic_source || '').includes('tráfego pago')
                              ? 'bg-fuchsia-100 text-fuchsia-800'
                              : 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200'
                          }`}
                        >
                          {u.traffic_source || 'direto'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-500">
                        {u.utm_campaign || u.utm_source || '—'}
                        {u.landing_path ? (
                          <span className="mt-1 block text-[11px]">{u.landing_path}</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-ink-500">
                        {new Date(u.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-ink-500">
                        Nenhum cliente encontrado com este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
                <tr>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">MP</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-ink-100 dark:border-ink-800">
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.email || '—'}</p>
                      <p className="font-mono text-[11px] text-ink-400">{p.id.slice(0, 12)}</p>
                    </td>
                    <td className="px-5 py-3">{formatMoney(p.amount)}</td>
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
                    <td className="px-5 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={deletingId === p.id}
                        onClick={() => void deletePayment(p.id)}
                      >
                        <Trash2 className="size-4 text-red-500" /> Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
                {!payments.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-ink-500">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
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
              Ao salvar, o preço muda no site (landing) e nos novos Pix automaticamente.
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
