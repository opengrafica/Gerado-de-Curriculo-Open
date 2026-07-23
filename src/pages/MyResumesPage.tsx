import { Link, useNavigate } from 'react-router-dom'
import { Download, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useAppStore } from '@/store/appStore'
import { TEMPLATES } from '@/data/constants'
import { downloadResumePdf } from '@/lib/pdf/generator'

export function MyResumesPage() {
  const { resumes, replaceResume, paid } = useAppStore()
  const navigate = useNavigate()
  const store = useAppStore()

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Meus Currículos</h1>
            <p className="mt-2 text-ink-600 dark:text-ink-300">Gerencie, visualize e baixe seus PDFs.</p>
          </div>
          <Button onClick={() => navigate('/criar')}>Criar novo</Button>
        </div>

        {resumes.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-300 p-12 text-center dark:border-ink-700">
            <p className="text-ink-500">Você ainda não salvou nenhum currículo.</p>
            <Button className="mt-4" onClick={() => navigate('/criar')}>Começar agora</Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => {
              const tpl = TEMPLATES.find((t) => t.id === r.templateId)
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
                >
                  <div className="mb-3 h-2 rounded-full" style={{ background: tpl?.preview }} />
                  <p className="font-semibold text-ink-900 dark:text-white">{r.fullName || 'Sem nome'}</p>
                  <p className="text-sm text-ink-500">{tpl?.name} • {r.email || '—'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        replaceResume(r)
                        navigate(paid ? '/pagamento/sucesso' : '/pagamento')
                      }}
                    >
                      <Eye className="size-4" /> Ver
                    </Button>
                    <Button
                      size="sm"
                      disabled={!paid}
                      onClick={() => downloadResumePdf(r)}
                      title={paid ? 'Baixar' : 'Disponível após pagamento'}
                    >
                      <Download className="size-4" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        useAppStore.setState({
                          resumes: store.resumes.filter((x) => x.id !== r.id),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!paid && (
          <p className="mt-6 text-sm text-ink-500">
            Download liberado após pagamento.{' '}
            <Link to="/pagamento" className="text-brand-700 hover:underline">
              Ir para checkout
            </Link>
          </p>
        )}
      </Container>
    </div>
  )
}
