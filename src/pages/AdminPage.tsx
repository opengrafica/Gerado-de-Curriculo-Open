import { useMemo } from 'react'
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
import { Users, ShoppingCart, Wallet, FileText, Percent } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { getDemoAnalytics } from '@/data/analytics'

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

export function AdminPage() {
  const data = useMemo(() => getDemoAnalytics(), [])

  return (
    <div className="py-12">
      <Container>
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Painel Administrativo</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          Métricas de demonstração + pagamentos locais. Conecte o Supabase para dados reais.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Total de usuários" value={String(data.totalUsers)} icon={Users} />
          <Stat label="Total de vendas" value={String(data.totalSales)} icon={ShoppingCart} />
          <Stat
            label="Receita mensal"
            value={`R$ ${data.monthlyRevenue.toFixed(2).replace('.', ',')}`}
            icon={Wallet}
          />
          <Stat label="Currículos gerados" value={String(data.resumesGenerated)} icon={FileText} />
          <Stat label="Taxa de conversão" value={`${data.conversionRate}%`} icon={Percent} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <h2 className="mb-4 font-semibold">Receita (7 dias)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesByDay}>
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
                <BarChart data={data.salesByDay}>
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

        <div className="mt-8 overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="font-semibold">Histórico de pagamentos</h2>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Valor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id} className="border-t border-ink-100 dark:border-ink-800">
                  <td className="px-5 py-3 font-mono text-xs">{p.id.slice(0, 12)}</td>
                  <td className="px-5 py-3">{p.product}</td>
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
                  <td className="px-5 py-3 text-ink-500">
                    {new Date(p.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  )
}
