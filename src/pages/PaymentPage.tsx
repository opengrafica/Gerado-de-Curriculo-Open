import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Tag, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Field, Input } from '@/components/ui/Input'
import { useAppStore } from '@/store/appStore'
import { PRICE_RESUME } from '@/types'
import { applyCoupon, createCheckout } from '@/lib/mercadopago'
import { TEMPLATES } from '@/data/constants'

export function PaymentPage() {
  const navigate = useNavigate()
  const { resume, couponCode, setCouponCode, affiliateCode, setAffiliateCode, setPaid, user } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [couponMsg, setCouponMsg] = useState('')

  const pricing = useMemo(() => applyCoupon(PRICE_RESUME, couponCode), [couponCode])

  const apply = () => {
    const result = applyCoupon(PRICE_RESUME, couponCode)
    setCouponMsg(
      result.valid
        ? `Cupom aplicado: ${result.percent}% de desconto`
        : 'Cupom inválido ou expirado',
    )
  }

  const pay = async () => {
    if (!resume.fullName || !resume.email) {
      alert('Preencha ao menos nome e e-mail no currículo antes de pagar.')
      navigate('/criar')
      return
    }
    setLoading(true)
    try {
      const { initPoint, demo } = await createCheckout({
        product: 'resume',
        title: 'CurrículoJá — Currículo PDF profissional',
        amount: pricing.amount,
        email: resume.email,
        couponCode: pricing.valid ? couponCode : undefined,
        affiliateCode: affiliateCode || undefined,
        resumeId: resume.id,
        userId: user?.id,
      })
      if (demo) {
        setPaid(true)
      }
      if (initPoint) window.location.href = initPoint
    } finally {
      setLoading(false)
    }
  }

  const template = TEMPLATES.find((t) => t.id === resume.templateId)

  return (
    <div className="py-12">
      <Container className="max-w-xl">
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Finalizar pagamento</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          Após a aprovação, seu PDF é liberado automaticamente.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink-900 dark:text-white">Currículo profissional (PDF)</p>
              <p className="text-sm text-ink-500">
                {resume.fullName || 'Seu currículo'} • Modelo {template?.name}
              </p>
            </div>
            <p className="text-lg font-bold text-brand-700 dark:text-brand-300">
              R$ {pricing.amount.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {pricing.discount > 0 && (
            <p className="text-sm text-brand-600">
              Desconto de R$ {pricing.discount.toFixed(2).replace('.', ',')} aplicado
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Cupom de desconto">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="BEMVINDO10"
              />
            </Field>
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={apply}>
                <Tag className="size-4" /> Aplicar
              </Button>
            </div>
          </div>
          {couponMsg && <p className="text-sm text-ink-500">{couponMsg}</p>}

          <Field label="Código de afiliado (opcional)">
            <Input
              value={affiliateCode}
              onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
              placeholder="ANA2024"
            />
          </Field>

          <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-600 dark:bg-ink-800 dark:text-ink-300">
            <ShieldCheck className="size-5 text-brand-600" />
            Pagamento seguro via Mercado Pago. Com as chaves configuradas, o checkout abre no Mercado Pago; sem elas, usa modo demonstração.
          </div>

          <Button className="w-full" size="lg" loading={loading} onClick={pay}>
            <CreditCard className="size-5" />
            Pagar R$ {pricing.amount.toFixed(2).replace('.', ',')}
          </Button>

          <Button className="w-full" variant="ghost" onClick={() => navigate('/criar')}>
            Voltar e editar currículo
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          Cupons demo: BEMVINDO10, CURRICULO20, AFILIADO15
        </p>
      </Container>
    </div>
  )
}
