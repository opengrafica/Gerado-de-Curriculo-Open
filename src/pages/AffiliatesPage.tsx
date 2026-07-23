import { useMemo, useState } from 'react'
import { Copy, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useAppStore } from '@/store/appStore'

export function AffiliatesPage() {
  const user = useAppStore((s) => s.user)
  const [copied, setCopied] = useState(false)
  const code = user?.affiliateCode || 'CONVIDE10'
  const link = useMemo(() => `${window.location.origin}/criar?ref=${code}`, [code])

  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-12">
      <Container className="max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/40">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Programa de afiliados</h1>
            <p className="text-ink-600 dark:text-ink-300">Indique e ganhe comissão por venda aprovada.</p>
          </div>
        </div>

        <div className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
          <p className="text-sm text-ink-600 dark:text-ink-300">
            Comissão demo: <strong>30%</strong> sobre cada venda de currículo (R$4,90). Seu código:{' '}
            <strong>{code}</strong>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm dark:border-ink-700 dark:bg-ink-800"
            />
            <Button onClick={copy}>
              <Copy className="size-4" /> {copied ? 'Copiado!' : 'Copiar link'}
            </Button>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-500">
            <li>Compartilhe no WhatsApp, Instagram ou LinkedIn.</li>
            <li>O parâmetro <code>?ref=</code> registra a indicação no checkout.</li>
            <li>Painel completo de comissões disponível após conectar Supabase.</li>
          </ul>
        </div>
      </Container>
    </div>
  )
}
