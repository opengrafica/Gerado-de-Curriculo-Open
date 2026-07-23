import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, QrCode, Tag, ShieldCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Field, Input } from '@/components/ui/Input'
import { useAppStore } from '@/store/appStore'
import { PRICE_RESUME } from '@/types'
import {
  applyCoupon,
  approveDemoPix,
  checkPixStatus,
  createPixPayment,
  markPaymentApproved,
  type PixPaymentResult,
} from '@/lib/mercadopago'
import { TEMPLATES } from '@/data/constants'

export function PaymentPage() {
  const navigate = useNavigate()
  const { resume, couponCode, setCouponCode, affiliateCode, setAffiliateCode, setPaid, user } =
    useAppStore()
  const [loading, setLoading] = useState(false)
  const [couponMsg, setCouponMsg] = useState('')
  const [pix, setPix] = useState<PixPaymentResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [polling, setPolling] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const pricing = useMemo(() => applyCoupon(PRICE_RESUME, couponCode), [couponCode])
  const template = TEMPLATES.find((t) => t.id === resume.templateId)

  const apply = () => {
    const result = applyCoupon(PRICE_RESUME, couponCode)
    setCouponMsg(
      result.valid
        ? `Cupom aplicado: ${result.percent}% de desconto`
        : 'Cupom inválido ou expirado',
    )
  }

  const generatePix = async () => {
    if (!resume.fullName || !resume.email) {
      alert('Preencha ao menos nome e e-mail no currículo antes de pagar.')
      navigate('/criar')
      return
    }
    setLoading(true)
    setStatusMsg('')
    try {
      const result = await createPixPayment({
        title: 'Currículo OPEN — Currículo PDF profissional',
        amount: pricing.amount,
        email: resume.email,
        firstName: resume.fullName.split(' ')[0],
        couponCode: pricing.valid ? couponCode : undefined,
        affiliateCode: affiliateCode || undefined,
        resumeId: resume.id,
        userId: user?.id,
      })
      setPix(result)
      if (result.demo) {
        setStatusMsg('Modo demonstração: use “Já paguei” para liberar o PDF.')
      } else {
        setStatusMsg('Escaneie o QR Code ou copie o código Pix. Aguardando pagamento…')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível gerar o Pix')
    } finally {
      setLoading(false)
    }
  }

  // Auto-poll Pix status
  useEffect(() => {
    if (!pix || pix.demo || pix.status === 'approved') return
    let stopped = false
    const tick = async () => {
      try {
        setPolling(true)
        const result = await checkPixStatus(pix.mpPaymentId)
        if (stopped) return
        if (result.status === 'approved') {
          await markPaymentApproved(pix.paymentId)
          setPaid(true)
          navigate(`/pagamento/sucesso?payment_id=${pix.paymentId}&status=approved`)
          return
        }
        if (result.status === 'rejected' || result.status === 'cancelled') {
          setStatusMsg('Pagamento não aprovado. Gere um novo Pix.')
          setPix(null)
        }
      } catch {
        // keep waiting
      } finally {
        if (!stopped) setPolling(false)
      }
    }
    const id = window.setInterval(tick, 4000)
    void tick()
    return () => {
      stopped = true
      window.clearInterval(id)
    }
  }, [pix, navigate, setPaid])

  const copyPix = async () => {
    if (!pix?.qrCode) return
    await navigator.clipboard.writeText(pix.qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const confirmDemo = async () => {
    if (!pix) return
    setLoading(true)
    try {
      await approveDemoPix(pix.paymentId, pix.mpPaymentId)
      setPaid(true)
      navigate(`/pagamento/sucesso?payment_id=${pix.paymentId}&status=approved&demo=1`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12">
      <Container className="max-w-xl">
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Pagar com Pix</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          Só currículo PDF — pagamento instantâneo via Pix.
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

          {!pix && (
            <>
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
                  placeholder="OPENGRAFICA"
                />
              </Field>

              <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                <ShieldCheck className="size-5 text-brand-600" />
                Pix seguro via Mercado Pago. O valor cai automático na conta Mercado Pago da Open Gráfica (sem login do cliente).
              </div>

              <Button className="w-full" size="lg" loading={loading} onClick={generatePix}>
                <QrCode className="size-5" />
                Gerar Pix de R$ {pricing.amount.toFixed(2).replace('.', ',')}
              </Button>
            </>
          )}

          {pix && (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-50 p-3 text-center text-sm font-medium text-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
                {statusMsg || 'Aguardando confirmação do Pix…'}
                {polling && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs opacity-70">
                    <RefreshCw className="size-3 animate-spin" /> verificando
                  </span>
                )}
              </div>

              {pix.qrCodeBase64 ? (
                <div className="mx-auto w-fit rounded-2xl border border-ink-200 bg-white p-3 dark:border-ink-700">
                  <img
                    src={`data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="size-56"
                  />
                </div>
              ) : (
                <div className="mx-auto flex size-56 items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-950">
                  Use o código copia e cola abaixo
                  {pix.demo && <span className="mt-2 block text-xs">(Pix demonstração)</span>}
                </div>
              )}

              <Field label="Pix copia e cola">
                <textarea
                  readOnly
                  value={pix.qrCode}
                  className="min-h-[96px] w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-xs dark:border-ink-700 dark:bg-ink-950"
                />
              </Field>

              <Button className="w-full" variant="secondary" onClick={copyPix}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Código copiado!' : 'Copiar código Pix'}
              </Button>

              {pix.demo && (
                <Button className="w-full" size="lg" loading={loading} onClick={confirmDemo}>
                  Já paguei (liberar PDF)
                </Button>
              )}

              <Button className="w-full" variant="ghost" onClick={() => setPix(null)}>
                Gerar novo Pix
              </Button>
            </div>
          )}

          <Button className="w-full" variant="ghost" onClick={() => navigate('/criar')}>
            Voltar e editar currículo
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          Cupons: BEMVINDO10, CURRICULO20, AFILIADO15
        </p>
      </Container>
    </div>
  )
}
