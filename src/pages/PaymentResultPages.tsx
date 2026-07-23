import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Download, Share2, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Container'
import { useAppStore } from '@/store/appStore'
import { markPaymentApproved } from '@/lib/mercadopago'
import { downloadResumePdf, getResumePdfDataUrl } from '@/lib/pdf/generator'
import { UPSELLS } from '@/data/constants'
import { createCheckout } from '@/lib/mercadopago'
import { generateCoverLetter, generateLinkedInProfile } from '@/lib/openrouter'

export function PaymentSuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { resume, setPaid, setCoverLetter, setLinkedInText, coverLetter, linkedInText } = useAppStore()
  const [preview, setPreview] = useState('')
  const [upsellLoading, setUpsellLoading] = useState<string | null>(null)

  useEffect(() => {
    const paymentId = params.get('payment_id') || params.get('collection_id')
    const status = params.get('status') || params.get('collection_status')
    if (status === 'approved' || params.get('demo') === '1') {
      if (paymentId) markPaymentApproved(paymentId)
      setPaid(true)
    }
    try {
      setPreview(getResumePdfDataUrl(resume))
    } catch {
      setPreview('')
    }
  }, [params, resume, setPaid])

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Acabei de criar meu currículo profissional no CurrículoJá! 🎉\nhttps://curriculoja.com.br`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const buyUpsell = async (id: string) => {
    const offer = UPSELLS.find((u) => u.id === id)
    if (!offer) return
    setUpsellLoading(id)
    try {
      if (offer.product === 'cover_letter' || offer.product === 'complete_pack') {
        const letter = await generateCoverLetter(resume)
        setCoverLetter(letter)
      }
      if (offer.product === 'linkedin' || offer.product === 'complete_pack') {
        const linkedin = await generateLinkedInProfile(resume)
        setLinkedInText(linkedin)
      }
      const { initPoint } = await createCheckout({
        product: offer.product,
        title: `CurrículoJá — ${offer.name}`,
        amount: offer.price,
        email: resume.email,
      })
      // Demo: stay on page and show generated content
      if (initPoint?.includes('demo=1')) {
        markPaymentApproved(params.get('payment_id') || `upsell_${id}`)
        navigate('/sucesso')
      } else if (initPoint) {
        window.location.href = initPoint
      }
    } finally {
      setUpsellLoading(null)
    }
  }

  return (
    <div className="py-12">
      <Container className="max-w-3xl text-center">
        <CheckCircle2 className="mx-auto size-16 text-brand-600" />
        <h1 className="mt-4 text-3xl font-bold text-ink-900 dark:text-white">
          Pagamento aprovado!
        </h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          Seu currículo está pronto para visualizar e baixar.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
          {preview ? (
            <iframe title="Prévia do PDF" src={preview} className="h-[480px] w-full" />
          ) : (
            <div className="flex h-64 items-center justify-center text-ink-500">Prévia indisponível</div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => downloadResumePdf(resume)}>
            <Download className="size-5" /> Baixar PDF
          </Button>
          <Button size="lg" variant="secondary" onClick={shareWhatsApp}>
            <Share2 className="size-5" /> Compartilhar
          </Button>
          <Button size="lg" variant="ghost" onClick={() => navigate('/sucesso')}>
            Ir para página final
          </Button>
        </div>

        {/* Upsells */}
        <div className="mt-14 text-left">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-accent-500" />
            <h2 className="text-xl font-bold text-ink-900 dark:text-white">Aproveite e complete seu kit</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {UPSELLS.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
              >
                {u.badge && <Badge className="mb-2">{u.badge}</Badge>}
                <p className="font-semibold text-ink-900 dark:text-white">{u.name}</p>
                <p className="mt-2 text-sm text-ink-500">{u.description}</p>
                <p className="mt-3 text-lg font-bold text-brand-700">
                  +R$ {u.price.toFixed(2).replace('.', ',')}
                </p>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  variant="accent"
                  loading={upsellLoading === u.id}
                  onClick={() => buyUpsell(u.id)}
                >
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        </div>

        {(coverLetter || linkedInText) && (
          <div className="mt-10 space-y-4 text-left">
            {coverLetter && (
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-800">
                <p className="font-semibold">Carta de apresentação</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">{coverLetter}</pre>
              </div>
            )}
            {linkedInText && (
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-800">
                <p className="font-semibold">Perfil LinkedIn</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">{linkedInText}</pre>
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-sm">
          <Link to="/meus-curriculos" className="text-brand-700 hover:underline">
            Ir para Meus Currículos
          </Link>
        </p>
      </Container>
    </div>
  )
}

export function PaymentErrorPage() {
  const navigate = useNavigate()
  return (
    <div className="py-20">
      <Container className="max-w-lg text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          ✕
        </div>
        <h1 className="mt-4 text-3xl font-bold text-ink-900 dark:text-white">Pagamento não aprovado</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          Algo deu errado ou o pagamento foi cancelado. Você pode tentar novamente.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/pagamento')}>Tentar novamente</Button>
          <Button variant="secondary" onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </Container>
    </div>
  )
}

export function FinalSuccessPage() {
  const navigate = useNavigate()
  const { resume, resetResume } = useAppStore()

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Parabéns! Criei meu currículo no CurrículoJá em minutos. Confira: https://curriculoja.com.br`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="py-20">
      <Container className="max-w-lg text-center">
        <CheckCircle2 className="mx-auto size-16 text-brand-600" />
        <h1 className="mt-4 text-3xl font-bold text-ink-900 dark:text-white">
          Parabéns! Seu currículo foi criado com sucesso.
        </h1>
        <p className="mt-3 text-ink-600 dark:text-ink-300">
          {resume.fullName ? `${resume.fullName}, seu` : 'Seu'} PDF profissional está pronto.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={() => downloadResumePdf(resume)}>
            <Download className="size-5" /> Baixar PDF
          </Button>
          <Button size="lg" variant="secondary" onClick={shareWhatsApp}>
            <Share2 className="size-5" /> Compartilhar
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => {
              resetResume()
              navigate('/criar')
            }}
          >
            <Plus className="size-5" /> Criar outro currículo
          </Button>
        </div>
      </Container>
    </div>
  )
}
