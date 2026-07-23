import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Trash2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Field, Input, Textarea, Select } from '@/components/ui/Input'
import { BirthDatePicker, MonthYearPicker, YearPicker } from '@/components/ui/DatePickers'
import { useAppStore } from '@/store/appStore'
import { MARITAL_STATUS, TEMPLATES } from '@/data/constants'
import { enhanceResumeWithAI } from '@/lib/openrouter'
import type { Course, Education, Experience, TemplateId } from '@/types'

const steps = ['Dados', 'Formação', 'Experiência', 'Modelo']

function newId() {
  return crypto.randomUUID()
}

export function CreateResumePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { resume, setResume, replaceResume, loadDemo, saveCurrentResume } = useAppStore()
  const [step, setStep] = useState(0)
  const [enhancing, setEnhancing] = useState(false)

  useEffect(() => {
    if (params.get('demo') === '1') loadDemo()
    const t = params.get('template') as TemplateId | null
    if (t && TEMPLATES.some((x) => x.id === t)) setResume({ templateId: t })
  }, [params, loadDemo, setResume])

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step])

  const addEducation = () =>
    setResume({
      education: [...resume.education, { id: newId(), institution: '', course: '', year: '' }],
    })

  const updateEdu = (id: string, patch: Partial<Education>) =>
    setResume({ education: resume.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) })

  const addCourse = () =>
    setResume({
      courses: [...resume.courses, { id: newId(), name: '', institution: '', year: '' }],
    })

  const updateCourse = (id: string, patch: Partial<Course>) =>
    setResume({ courses: resume.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  const addExperience = () =>
    setResume({
      experiences: [
        ...resume.experiences,
        { id: newId(), company: '', role: '', startDate: '', endDate: '', current: false, description: '' },
      ],
    })

  const updateExp = (id: string, patch: Partial<Experience>) =>
    setResume({
      experiences: resume.experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })

  const runAI = async () => {
    setEnhancing(true)
    try {
      const result = await enhanceResumeWithAI(resume)
      replaceResume({
        ...resume,
        professionalSummary: result.professionalSummary,
        experiences: resume.experiences.map((e) => {
          const improved = result.experiences.find((x) => x.id === e.id)
          return improved ? { ...e, description: improved.description } : e
        }),
        aiEnhanced: true,
      })
    } finally {
      setEnhancing(false)
    }
  }

  const goCheckout = () => {
    saveCurrentResume()
    navigate('/pagamento')
  }

  return (
    <div className="py-10">
      <Container className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Criar currículo</h1>
          <p className="mt-2 text-ink-600 dark:text-ink-300">
            Simples e rápido — preencha os dados essenciais e gere o PDF.
            <span className="mt-1 block font-medium text-brand-700 dark:text-brand-300">
              Não precisa criar conta para comprar.
            </span>
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
            <motion.div
              className="h-full rounded-full bg-brand-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(i)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  i === step
                    ? 'bg-brand-600 text-white'
                    : i < step
                      ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                      : 'bg-ink-100 text-ink-500 dark:bg-ink-800'
                }`}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-700 dark:bg-ink-900 sm:p-8">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome completo">
                  <Input
                    value={resume.fullName}
                    onChange={(e) => setResume({ fullName: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Endereço">
                  <Input
                    value={resume.address}
                    onChange={(e) => setResume({ address: e.target.value })}
                    placeholder="Rua, número — Cidade, UF"
                  />
                </Field>
              </div>
              <Field label="Nascimento">
                <BirthDatePicker
                  value={resume.birthDate}
                  onChange={(birthDate) => setResume({ birthDate })}
                />
              </Field>
              <Field label="Nacionalidade">
                <Input
                  value={resume.nationality}
                  onChange={(e) => setResume({ nationality: e.target.value })}
                  placeholder="Brasileira"
                />
              </Field>
              <Field label="Estado civil">
                <Select
                  value={resume.maritalStatus}
                  onChange={(e) => setResume({ maritalStatus: e.target.value })}
                >
                  {MARITAL_STATUS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Telefone">
                <Input
                  value={resume.phone}
                  onChange={(e) => setResume({ phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="E-mail">
                  <Input
                    type="email"
                    value={resume.email}
                    onChange={(e) => setResume({ email: e.target.value })}
                    placeholder="voce@email.com"
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="font-semibold">Escolaridade</p>
                {resume.education.length === 0 && (
                  <p className="text-sm text-ink-500">Adicione sua formação (ensino médio, faculdade…).</p>
                )}
                {resume.education.map((ed, idx) => (
                  <div key={ed.id} className="grid gap-3 border-b border-ink-100 pb-4 dark:border-ink-800 sm:grid-cols-2">
                    <div className="flex items-center justify-between sm:col-span-2">
                      <p className="text-sm font-medium text-ink-500">Item {idx + 1}</p>
                      <button type="button" onClick={() => setResume({ education: resume.education.filter((x) => x.id !== ed.id) })}>
                        <Trash2 className="size-4 text-red-500" />
                      </button>
                    </div>
                    <Field label="Curso / Nível">
                      <Input value={ed.course} onChange={(e) => updateEdu(ed.id, { course: e.target.value })} placeholder="Ex: Ensino Médio / Administração" />
                    </Field>
                    <Field label="Instituição">
                      <Input value={ed.institution} onChange={(e) => updateEdu(ed.id, { institution: e.target.value })} />
                    </Field>
                    <Field label="Ano de conclusão">
                      <YearPicker value={ed.year} onChange={(year) => updateEdu(ed.id, { year })} />
                    </Field>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addEducation}>
                  <Plus className="size-4" /> Adicionar escolaridade
                </Button>
              </div>

              <div className="space-y-4">
                <p className="font-semibold">Cursos</p>
                {resume.courses.map((c, idx) => (
                  <div key={c.id} className="grid gap-3 sm:grid-cols-3">
                    <Field label={`Curso ${idx + 1}`}>
                      <Input value={c.name} onChange={(e) => updateCourse(c.id, { name: e.target.value })} />
                    </Field>
                    <Field label="Instituição">
                      <Input value={c.institution} onChange={(e) => updateCourse(c.id, { institution: e.target.value })} />
                    </Field>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Field label="Ano">
                          <YearPicker value={c.year} onChange={(year) => updateCourse(c.id, { year })} />
                        </Field>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => setResume({ courses: resume.courses.filter((x) => x.id !== c.id) })}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addCourse}>
                  <Plus className="size-4" /> Adicionar curso
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {resume.experiences.length === 0 && (
                <p className="text-sm text-ink-500">
                  Sem experiência? Pode pular — ideal para primeiro emprego.
                </p>
              )}
              {resume.experiences.map((exp, idx) => (
                <div key={exp.id} className="space-y-3 border-b border-ink-100 pb-6 dark:border-ink-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Experiência {idx + 1}</p>
                    <button type="button" onClick={() => setResume({ experiences: resume.experiences.filter((e) => e.id !== exp.id) })}>
                      <Trash2 className="size-4 text-red-500" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Empresa">
                      <Input value={exp.company} onChange={(e) => updateExp(exp.id, { company: e.target.value })} />
                    </Field>
                    <Field label="Cargo">
                      <Input value={exp.role} onChange={(e) => updateExp(exp.id, { role: e.target.value })} />
                    </Field>
                    <Field label="Início">
                      <MonthYearPicker value={exp.startDate} onChange={(startDate) => updateExp(exp.id, { startDate })} />
                    </Field>
                    <Field label="Fim">
                      <MonthYearPicker
                        value={exp.endDate}
                        disabled={exp.current}
                        onChange={(endDate) => updateExp(exp.id, { endDate })}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExp(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
                      />
                      Trabalho atual
                    </label>
                    <div className="sm:col-span-2">
                      <Field label="Descrição (opcional)">
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateExp(exp.id, { description: e.target.value })}
                          placeholder="O que você fazia no dia a dia"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addExperience}>
                <Plus className="size-4" /> Adicionar experiência
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 font-semibold">Escolha o modelo</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setResume({ templateId: t.id })}
                      className={`rounded-xl border p-3 text-left transition ${
                        resume.templateId === t.id
                          ? 'border-brand-600 ring-2 ring-brand-500/30'
                          : 'border-ink-200 dark:border-ink-700'
                      }`}
                    >
                      <div className="mb-2 h-10 rounded-lg" style={{ background: t.preview }} />
                      <p className="text-sm font-semibold">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-950/30">
                <p className="font-semibold text-brand-900 dark:text-brand-100">Melhorar textos com IA</p>
                <p className="mt-1 text-sm text-brand-800/80 dark:text-brand-200/80">
                  Opcional: corrige português e cria um resumo profissional.
                </p>
                <Button className="mt-3" variant="accent" loading={enhancing} onClick={runAI}>
                  <Sparkles className="size-4" /> {resume.aiEnhanced ? 'Melhorar novamente' : 'Melhorar com IA'}
                </Button>
                {resume.professionalSummary && (
                  <div className="mt-4">
                    <Field label="Resumo profissional">
                      <Textarea
                        value={resume.professionalSummary}
                        onChange={(e) => setResume({ professionalSummary: e.target.value })}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" /> Voltar
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Continuar <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={goCheckout}>
                Ir para pagamento Pix <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={loadDemo}>
            Preencher demonstração
          </Button>
        </div>
      </Container>
    </div>
  )
}
