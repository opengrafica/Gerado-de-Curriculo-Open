import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FileDown, Briefcase, Zap, LayoutTemplate, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container, Section, Badge } from '@/components/ui/Container'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { BENEFITS, TEMPLATES } from '@/data/constants'
import { PRICE_RESUME } from '@/types'

const icons = [Briefcase, FileDown, CheckCircle2, Zap, LayoutTemplate]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="mesh-bg">
      <Section className="relative overflow-hidden pb-10 pt-10 sm:pt-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 flex justify-center">
              <BrandLogo size={72} />
            </div>
            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              Faça seu currículo profissional em 2 minutos.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-600 dark:text-ink-300">
              Simples, rápido e direto — por apenas{' '}
              <span className="font-bold text-brand-700 dark:text-brand-300">
                R${PRICE_RESUME.toFixed(2).replace('.', ',')}
              </span>{' '}
              no Pix. <span className="font-semibold text-ink-800 dark:text-ink-100">Sem criar conta.</span>
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
              <Sparkles className="size-4 text-[#EC008C]" />
              Dados essenciais • PDF na hora • 10 modelos
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto mt-14 max-w-3xl"
            aria-hidden
          >
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-[#00AEEF]/25 via-transparent to-[#EC008C]/20 blur-2xl" />
            <div className="overflow-hidden rounded-[1.5rem] border border-ink-200/80 bg-white shadow-2xl shadow-ink-900/10 dark:border-ink-700 dark:bg-ink-900">
              <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-ink-400">curriculo-open.pdf</span>
              </div>
              <div className="space-y-3 p-6 text-left text-sm">
                <p className="text-xl font-bold text-ink-900 dark:text-white">Ana Clara Mendes</p>
                <p className="text-ink-500">São Paulo, SP • (11) 98765-4321 • ana.mendes@email.com</p>
                <p className="text-ink-500">Brasileira • Solteira • Nasc.: 12/04/1998</p>
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Escolaridade</p>
                  <p className="mt-1 text-ink-700 dark:text-ink-200">Graduação em Publicidade — UNIP (2021)</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Experiência</p>
                  <p className="mt-1 font-semibold text-ink-800 dark:text-ink-100">Assistente de Marketing — Agência Norte</p>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      <Section id="beneficios" className="bg-white/50 dark:bg-ink-950/40">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <Badge>Por que Currículo OPEN</Badge>
            <h2 className="mt-3 text-3xl font-bold text-ink-900 dark:text-white">Rápido de preencher, pronto para enviar</h2>
            <p className="mt-3 text-ink-600 dark:text-ink-300">
              Só os dados que importam: pessoais, escolaridade, cursos e experiência.
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

      <Section>
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-ink-900 dark:text-white">10 modelos profissionais</h2>
            <p className="mt-3 text-ink-600 dark:text-ink-300">Escolha o visual e baixe o PDF após o Pix.</p>
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
                <p className="mt-1 line-clamp-2 text-xs text-ink-500">{t.description}</p>
              </motion.button>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="pb-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-12 text-center text-white sm:px-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,174,239,0.35),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(236,0,140,0.25),transparent_40%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold">Pronto para se candidatar?</h2>
              <p className="mx-auto mt-3 max-w-lg text-white/75">
                Crie agora, pague R$4,90 no Pix e baixe seu currículo OPEN.
              </p>
              <Button size="lg" className="mt-8 bg-[#00AEEF] hover:bg-[#0090c7]" onClick={() => navigate('/criar')}>
                Criar meu currículo agora
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>
    </div>
  )
}
