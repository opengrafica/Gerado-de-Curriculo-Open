import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  FileDown,
  Briefcase,
  Zap,
  LayoutTemplate,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container, Section, Badge } from '@/components/ui/Container'
import { BENEFITS, TEMPLATES } from '@/data/constants'
import { PRICE_RESUME } from '@/types'

const icons = [Briefcase, FileDown, CheckCircle2, Zap, LayoutTemplate]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="mesh-bg">
      {/* Hero */}
      <Section className="relative overflow-hidden pb-10 pt-10 sm:pt-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="mb-4 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              Currículo<span className="text-brand-600">Já</span>
            </p>
            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              Faça seu currículo profissional em 2 minutos.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-600 dark:text-ink-300">
              Aumente suas chances de conseguir um emprego por apenas{' '}
              <span className="font-bold text-brand-700 dark:text-brand-300">
                R${PRICE_RESUME.toFixed(2).replace('.', ',')}
              </span>
              .
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate('/criar')}>
                Criar meu currículo agora
                <ArrowRight className="size-5" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/criar?demo=1')}>
                Ver demonstração
              </Button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-500">
              <Sparkles className="size-4 text-accent-500" />
              Texto melhorado com IA • PDF instantâneo • 10 modelos
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto mt-14 max-w-4xl"
            aria-hidden
          >
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-400/30 via-transparent to-accent-400/20 blur-2xl" />
            <div className="overflow-hidden rounded-[1.5rem] border border-ink-200/80 bg-white shadow-2xl shadow-ink-900/10 dark:border-ink-700 dark:bg-ink-900">
              <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-ink-400">curriculo-ana-mendes.pdf</span>
              </div>
              <div className="grid gap-0 md:grid-cols-[180px_1fr]">
                <div className="bg-brand-700 p-6 text-white">
                  <p className="text-lg font-bold">Ana Clara Mendes</p>
                  <p className="mt-3 text-xs opacity-80">São Paulo, SP</p>
                  <p className="mt-1 text-xs opacity-80">ana.mendes@email.com</p>
                  <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    Habilidades
                  </p>
                  <ul className="mt-2 space-y-1 text-xs opacity-90">
                    <li>Marketing Digital</li>
                    <li>Google Ads</li>
                    <li>SEO</li>
                  </ul>
                </div>
                <div className="space-y-4 p-6 text-left">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Resumo</p>
                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      Profissional de marketing digital com experiência em campanhas de performance e SEO...
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Experiência</p>
                    <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-100">
                      Assistente de Marketing — Agência Norte
                    </p>
                    <p className="text-xs text-ink-500">2022 — Atual</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Benefits */}
      <Section id="beneficios" className="bg-white/50 dark:bg-ink-950/40">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <Badge>Por que CurrículoJá</Badge>
            <h2 className="mt-3 text-3xl font-bold text-ink-900 dark:text-white">
              Tudo para você se candidatar com confiança
            </h2>
            <p className="mt-3 text-ink-600 dark:text-ink-300">
              Um fluxo simples: preencha, deixe a IA polir o texto, pague e baixe o PDF.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => {
              const Icon = icons[i] || Sparkles
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group"
                >
                  <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 transition group-hover:scale-105 dark:bg-brand-900/40 dark:text-brand-300">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{b.title}</h3>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{b.description}</p>
                </motion.div>
              )
            })}
          </div>
        </Container>
      </Section>

      {/* Templates */}
      <Section>
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-ink-900 dark:text-white">10 modelos profissionais</h2>
            <p className="mt-3 text-ink-600 dark:text-ink-300">
              Do primeiro emprego ao executivo — escolha o visual certo para a vaga.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/criar?template=${t.id}`)}
                className="rounded-2xl border border-ink-200 bg-white p-3 text-left transition hover:-translate-y-1 hover:shadow-lg dark:border-ink-700 dark:bg-ink-900"
              >
                <div className="mb-3 h-16 rounded-xl" style={{ background: t.preview }} />
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{t.name}</p>
                <p className="mt-1 text-xs text-ink-500 line-clamp-2">{t.description}</p>
              </motion.button>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pb-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-12 text-center text-white sm:px-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.35),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold">Pronto para se candidatar?</h2>
              <p className="mx-auto mt-3 max-w-lg text-brand-100">
                Crie agora, pague R$4,90 e receba seu PDF profissional na hora.
              </p>
              <Button
                size="lg"
                variant="accent"
                className="mt-8"
                onClick={() => navigate('/criar')}
              >
                Criar meu currículo agora
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>
    </div>
  )
}
