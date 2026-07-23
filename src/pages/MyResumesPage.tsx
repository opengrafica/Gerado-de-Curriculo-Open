import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Eye, Trash2, FileType2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useAppStore } from '@/store/appStore'
import { TEMPLATES } from '@/data/constants'
import { downloadResumePdf } from '@/lib/pdf/generator'
import { downloadResumeDocx } from '@/lib/word'
import { deleteUserResume, listUserResumes, type StoredResume } from '@/lib/resumes'

export function MyResumesPage() {
  const { user, replaceResume, setPaid } = useAppStore()
  const navigate = useNavigate()
  const [items, setItems] = useState<StoredResume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user?.id) {
        setLoading(false)
        return
      }
      const list = await listUserResumes(user.id)
      if (!cancelled) {
        setItems(list)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  const remove = async (id?: string) => {
    if (!id) return
    await deleteUserResume(id)
    setItems((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Meus Currículos</h1>
            <p className="mt-2 text-ink-600 dark:text-ink-300">
              Histórico da sua conta. Após o Pix, baixe PDF e Word para editar.
            </p>
          </div>
          <Button onClick={() => navigate('/criar')}>Criar novo</Button>
        </div>

        {loading ? (
          <p className="mt-10 text-ink-500">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-300 p-12 text-center dark:border-ink-700">
            <p className="text-ink-500">Você ainda não salvou nenhum currículo.</p>
            <Button className="mt-4" onClick={() => navigate('/criar')}>
              Começar agora
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => {
              const tpl = TEMPLATES.find((t) => t.id === r.templateId)
              const unlocked = r.status === 'paid' || r.status === 'generated'
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
                >
                  <div className="mb-3 h-2 rounded-full" style={{ background: tpl?.preview }} />
                  <p className="font-semibold text-ink-900 dark:text-white">{r.fullName || 'Sem nome'}</p>
                  <p className="text-sm text-ink-500">
                    {tpl?.name} • {unlocked ? 'Liberado' : 'Aguardando Pix'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        replaceResume(r)
                        if (unlocked) {
                          setPaid(true)
                          navigate('/pagamento/sucesso')
                        } else {
                          navigate('/criar')
                        }
                      }}
                    >
                      {unlocked ? <Eye className="size-4" /> : <Pencil className="size-4" />}
                      {unlocked ? 'Ver' : 'Editar'}
                    </Button>
                    <Button size="sm" disabled={!unlocked} onClick={() => downloadResumePdf(r)}>
                      <Download className="size-4" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!unlocked}
                      onClick={() => downloadResumeDocx(r)}
                    >
                      <FileType2 className="size-4" /> Word
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-6 text-sm text-ink-500">
          Sem pagamento?{' '}
          <Link to="/criar" className="text-brand-700 hover:underline">
            Continue editando
          </Link>{' '}
          e finalize o Pix.
        </p>
      </Container>
    </div>
  )
}
