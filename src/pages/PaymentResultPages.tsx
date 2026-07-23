import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Download, FileType2, Share2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useAppStore } from '@/store/appStore'
import { markPaymentApproved } from '@/lib/mercadopago'
import { downloadResumePdf, getResumePdfDataUrl } from '@/lib/pdf/generator'
import { downloadResumeDocx } from '@/lib/word'
import { markResumePaid, saveResumeToCloud } from '@/lib/resumes'

export function PaymentSuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { resume, setPaid, user, setResume } = useAppStore()
  const [preview, setPreview] = useState('')

  useEffect(() => {
    const paymentId = params.get('payment_id') || params.get('collection_id')
    const status = params.get('status') || params.get('collection_status')
    const approved = status === 'approved' || params.get('demo') === '1'

    async function unlock() {
      if (!approved) return
      if (paymentId) void markPaymentApproved(paymentId)
      setPaid(true)
      if (user?.id) {
        const id = resume.id || crypto.randomUUID()
        if (!resume.id) setResume({ id })
        await saveResumeToCloud({
          userId: user.id,
          resume: { ...resume, id },
          status: 'paid',
        })
        await markResumePaid(id)
      }
    }

    void unlock()
    try {
      setPreview(getResumePdfDataUrl(resume))
    } catch {
      setPreview('')
    }
  }, [params, resume, setPaid, user, setResume])

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Acabei de criar meu currículo profissional no Currículo OPEN!\nhttps://curriculoopen.com.br`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="py-12">
      <Container className="max-w-3xl text-center">
        <CheckCircle2 className="mx-auto size-16 text-brand-600" />
        <h1 className="mt-4 text-3xl font-bold text-ink-900 dark:text-white">
          Pagamento Pix aprovado!
        </h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          PDF e Word liberados. Você pode baixar agora ou depois em Meus Currículos.
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
          <Button size="lg" variant="secondary" onClick={() => downloadResumeDocx(resume)}>
            <FileType2 className="size-5" /> Baixar Word
          </Button>
          <Button size="lg" variant="ghost" onClick={shareWhatsApp}>
            <Share2 className="size-5" /> Compartilhar
          </Button>
        </div>

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
        <h1 className="mt-4 text-3xl font-bold text-ink-900 dark:text-white">Pix não confirmado</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          O pagamento não foi aprovado ou expirou. Você pode gerar um novo Pix.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/pagamento')}>Gerar novo Pix</Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
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
      `Parabéns! Criei meu currículo no Currículo OPEN em minutos. Confira: https://curriculoopen.com.br`,
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
          {resume.fullName ? `${resume.fullName}, seu` : 'Seu'} PDF e Word estão liberados.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={() => downloadResumePdf(resume)}>
            <Download className="size-5" /> Baixar PDF
          </Button>
          <Button size="lg" variant="secondary" onClick={() => downloadResumeDocx(resume)}>
            <FileType2 className="size-5" /> Baixar Word
          </Button>
          <Button size="lg" variant="ghost" onClick={shareWhatsApp}>
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
