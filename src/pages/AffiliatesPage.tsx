import { useEffect, useMemo, useState } from 'react'
import { Copy, Share2, Users, Wallet, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Field, Input } from '@/components/ui/Input'
import { useAppStore } from '@/store/appStore'
import { getSupabase } from '@/lib/supabase'
import type { AffiliateCommission } from '@/types'
import { PRICE_RESUME } from '@/types'

export function AffiliatesPage() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const [copied, setCopied] = useState(false)
  const [pixKey, setPixKey] = useState(user?.pixKey || '')
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([])
  const [saving, setSaving] = useState(false)

  const code = user?.affiliateCode || 'CONVIDE10'
  const percent = user?.commissionPercent ?? 30
  const link = useMemo(() => `${window.location.origin}/criar?ref=${code}`, [code])
  const exampleCommission = Number(((PRICE_RESUME * percent) / 100).toFixed(2))

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user?.id) {
        // local demo commissions
        const local = JSON.parse(localStorage.getItem('cj_commissions') || '[]') as AffiliateCommission[]
        setCommissions(local.filter((c) => !user || c.affiliateUserId === user.id || c.affiliateUserId === code))
        return
      }
      const supabase = getSupabase()
      if (!supabase) {
        const local = JSON.parse(localStorage.getItem('cj_commissions') || '[]') as AffiliateCommission[]
        setCommissions(local)
        return
      }
      const { data } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (data) {
        setCommissions(
          data.map((row) => ({
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
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user, code])

  const totals = useMemo(() => {
    const earned = commissions
      .filter((c) => c.status !== 'cancelled')
      .reduce((s, c) => s + c.commissionAmount, 0)
    const paid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0)
    const pending = earned - paid
    const sales = commissions.filter((c) => c.status !== 'cancelled').length
    return { earned, paid, pending, sales }
  }, [commissions])

  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Crie seu currículo profissional em 2 minutos no CurrículoJá por só R$4,90!\n${link}`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const savePix = async () => {
    if (!user) return
    setSaving(true)
    try {
      const supabase = getSupabase()
      if (supabase) {
        await supabase.from('users').update({ pix_key: pixKey }).eq('id', user.id)
      }
      setUser({ ...user, pixKey })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-12">
      <Container className="max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/40">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Programa de afiliados</h1>
            <p className="text-ink-600 dark:text-ink-300">
              Indique e ganhe <strong>{percent}%</strong> de comissão em cada venda aprovada.
            </p>
          </div>
        </div>

        {!user && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Faça <Link className="font-semibold underline" to="/login">login</Link> ou{' '}
            <Link className="font-semibold underline" to="/cadastro">cadastro</Link> para salvar suas comissões e chave Pix.
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <p className="text-sm text-ink-500">Vendas indicadas</p>
            <p className="mt-1 text-2xl font-bold">{totals.sales}</p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <p className="text-sm text-ink-500">Total ganho</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">
              R$ {totals.earned.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <p className="text-sm text-ink-500">A receber</p>
            <p className="mt-1 text-2xl font-bold">
              R$ {totals.pending.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
            <TrendingUp className="size-4 text-brand-600" />
            Em um currículo de R$ {PRICE_RESUME.toFixed(2).replace('.', ',')} você ganha{' '}
            <strong>R$ {exampleCommission.toFixed(2).replace('.', ',')}</strong>.
          </div>
          <p className="text-sm">
            Seu código: <strong className="font-mono">{code}</strong>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm dark:border-ink-700 dark:bg-ink-800"
            />
            <Button onClick={copy}>
              <Copy className="size-4" /> {copied ? 'Copiado!' : 'Copiar'}
            </Button>
            <Button variant="secondary" onClick={shareWhatsApp}>
              <Share2 className="size-4" /> WhatsApp
            </Button>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-500">
            <li>Compartilhe o link com `?ref={code}`.</li>
            <li>Quando a pessoa pagar, a comissão é registrada automaticamente.</li>
            <li>O admin marca o pagamento da comissão (Pix) no painel.</li>
          </ul>
        </div>

        {user && (
          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Wallet className="size-5 text-brand-600" /> Chave Pix para receber
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Pix (CPF, e-mail, telefone ou aleatória)">
                <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="sua-chave-pix" />
              </Field>
              <div className="flex items-end">
                <Button loading={saving} onClick={savePix}>Salvar</Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
          <div className="border-b border-ink-100 px-5 py-4 font-semibold dark:border-ink-800">
            Histórico de comissões
          </div>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800">
              <tr>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Venda</th>
                <th className="px-5 py-3 font-medium">Comissão</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-t border-ink-100 dark:border-ink-800">
                  <td className="px-5 py-3 text-ink-500">
                    {new Date(c.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">R$ {c.saleAmount.toFixed(2).replace('.', ',')}</td>
                  <td className="px-5 py-3 font-semibold text-brand-700">
                    R$ {c.commissionAmount.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-5 py-3">{c.status}</td>
                </tr>
              ))}
              {!commissions.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-ink-500">
                    Nenhuma comissão ainda. Compartilhe seu link para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  )
}
