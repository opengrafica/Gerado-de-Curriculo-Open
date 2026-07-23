import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Field, Input, Textarea, Select } from '@/components/ui/Input'
import { BirthDatePicker, MonthYearPicker, YearPicker } from '@/components/ui/DatePickers'
import { ResumePreview } from '@/components/resume/ResumePreview'
import { useAppStore } from '@/store/appStore'
import {
  maritalOptionsFor,
  NATIONALITIES,
  TEMPLATES,
} from '@/data/constants'
import { enhanceResumeWithAI } from '@/lib/openrouter'
import { saveResumeToCloud } from '@/lib/resumes'
import { compressResumePhoto } from '@/lib/photo'
import type { Course, Education, Experience, TemplateId } from '@/types'

const steps = ['Dados', 'Formação', 'Experiência', 'Modelo']

function newId() {
  return crypto.randomUUID()
}

export function CreateResumePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { resume, setResume, replaceResume, loadDemo, saveCurrentResume, user } = useAppStore()
  const [step, setStep] = useState(0)
  const [enhancing, setEnhancing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [mobilePreview, setMobilePreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (params.get('demo') === '1') loadDemo()
    const t = params.get('template') as TemplateId | null
    if (t && TEMPLATES.some((x) => x.id === t)) setResume({ templateId: t })
  }, [params, loadDemo, setResume])

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step])
  const maritalOptions = useMemo(
    () => maritalOptionsFor(resume.nationality),
    [resume.nationality],
  )

  const onNationalityChange = (nationality: string) => {
    const options = maritalOptionsFor(nationality)
    const maritalStatus = options.includes(resume.maritalStatus)
      ? resume.maritalStatus
      : options[0]
    setResume({ nationality, maritalStatus })
  }

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

  const onPhoto = async (file?: File | null) => {
    if (!file) return
    setPhotoBusy(true)
    setPhotoError('')
    try {
      const photoDataUrl = await compressResumePhoto(file)
      setResume({ photoDataUrl, includePhoto: true })
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Falha ao enviar foto')
    } finally {
      setPhotoBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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

  const goCheckout = async () => {
    if (!user?.id) {
      navigate('/login?next=/criar')
      return
    }
    setSaving(true)
    try {
      saveCurrentResume()
      const id = await saveResumeToCloud({
        userId: user.id,
        resume: { ...resume, id: resume.id || crypto.randomUUID() },
        status: 'draft',
      })
      setResume({ id })
      navigate('/pagamento')
    } catch (err) {
      console.warn(err)
      navigate('/pagamento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-6 sm:py-10">
      <Container className="max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl dark:text-white">
              Criar currículo
            </h1>
            <p className="mt-1 text-sm text-ink-600 sm:text-base dark:text-ink-300">
              Preencha, veja a prévia e escolha o modelo. Foto opcional.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="lg:hidden"
            onClick={() => setMobilePreview(true)}
          >
            <Eye className="size-4" /> Ver prévia
          </Button>
        </div>

        <div className="mb-5">
          <div className="h-2 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
            <motion.div
              className="h-full rounded-full bg-brand-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2">
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(i)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
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

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-700 dark:bg-ink-900 sm:p-6 md:p-8">
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
                <Field label="Nacionalidade" hint="Toque na seta para escolher">
                  <Select
                    value={resume.nationality === 'Brasileiro' ? 'Brasileiro' : 'Brasileira'}
                    onChange={(e) => onNationalityChange(e.target.value)}
                  >
                    {NATIONALITIES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Estado civil" hint="Toque na seta para escolher">
                  <Select
                    value={
                      maritalOptions.includes(resume.maritalStatus)
                        ? resume.maritalStatus
                        : maritalOptions[0]
                    }
                    onChange={(e) => setResume({ maritalStatus: e.target.value })}
                  >
                    {maritalOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Telefone / WhatsApp">
                  <Input
                    value={resume.phone}
                    onChange={(e) => setResume({ phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    inputMode="tel"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="E-mail">
                    <Input
                      type="email"
                      value={resume.email}
                      onChange={(e) => setResume({ email: e.target.value })}
                      placeholder="voce@email.com"
                      inputMode="email"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-dashed border-ink-300 p-4 dark:border-ink-600">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">Foto no currículo</p>
                      <p className="mt-1 text-sm text-ink-500">
                        Opcional. Se quiser, envie uma foto (aparece na prévia e no PDF).
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(resume.includePhoto && resume.photoDataUrl)}
                        onChange={(e) => {
                          if (e.target.checked && !resume.photoDataUrl) {
                            fileRef.current?.click()
                            return
                          }
                          setResume({ includePhoto: e.target.checked })
                        }}
                      />
                      Incluir foto
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    {resume.photoDataUrl ? (
                      <img
                        src={resume.photoDataUrl}
                        alt="Sua foto"
                        className="size-20 rounded-full object-cover ring-2 ring-brand-500/40"
                      />
                    ) : (
                      <div className="flex size-20 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
                        <Camera className="size-7" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => void onPhoto(e.target.files?.[0])}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        loading={photoBusy}
                        onClick={() => fileRef.current?.click()}
                      >
                        <Camera className="size-4" />
                        {resume.photoDataUrl ? 'Trocar foto' : 'Enviar foto'}
                      </Button>
                      {resume.photoDataUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setResume({ photoDataUrl: undefined, includePhoto: false })}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                  {photoError && <p className="mt-2 text-sm text-red-600">{photoError}</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="font-semibold">Escolaridade</p>
                  {resume.education.length === 0 && (
                    <p className="text-sm text-ink-500">
                      Adicione sua formação (ensino médio, faculdade…).
                    </p>
                  )}
                  {resume.education.map((ed, idx) => (
                    <div
                      key={ed.id}
                      className="grid gap-3 border-b border-ink-100 pb-4 dark:border-ink-800 sm:grid-cols-2"
                    >
                      <div className="flex items-center justify-between sm:col-span-2">
                        <p className="text-sm font-medium text-ink-500">Item {idx + 1}</p>
                        <button
                          type="button"
                          onClick={() =>
                            setResume({ education: resume.education.filter((x) => x.id !== ed.id) })
                          }
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </button>
                      </div>
                      <Field label="Curso / Nível">
                        <Input
                          value={ed.course}
                          onChange={(e) => updateEdu(ed.id, { course: e.target.value })}
                          placeholder="Ex: Ensino Médio / Administração"
                        />
                      </Field>
                      <Field label="Instituição">
                        <Input
                          value={ed.institution}
                          onChange={(e) => updateEdu(ed.id, { institution: e.target.value })}
                        />
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
                        <Input
                          value={c.name}
                          onChange={(e) => updateCourse(c.id, { name: e.target.value })}
                        />
                      </Field>
                      <Field label="Instituição">
                        <Input
                          value={c.institution}
                          onChange={(e) => updateCourse(c.id, { institution: e.target.value })}
                        />
                      </Field>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Field label="Ano">
                            <YearPicker
                              value={c.year}
                              onChange={(year) => updateCourse(c.id, { year })}
                            />
                          </Field>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setResume({ courses: resume.courses.filter((x) => x.id !== c.id) })
                          }
                        >
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
                  <div
                    key={exp.id}
                    className="space-y-3 border-b border-ink-100 pb-6 dark:border-ink-800"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Experiência {idx + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setResume({
                            experiences: resume.experiences.filter((e) => e.id !== exp.id),
                          })
                        }
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Empresa">
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExp(exp.id, { company: e.target.value })}
                        />
                      </Field>
                      <Field label="Cargo">
                        <Input
                          value={exp.role}
                          onChange={(e) => updateExp(exp.id, { role: e.target.value })}
                        />
                      </Field>
                      <Field label="Início">
                        <MonthYearPicker
                          value={exp.startDate}
                          onChange={(startDate) => updateExp(exp.id, { startDate })}
                        />
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
                          onChange={(e) =>
                            updateExp(exp.id, {
                              current: e.target.checked,
                              endDate: e.target.checked ? '' : exp.endDate,
                            })
                          }
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
                  <p className="mb-1 font-semibold">Escolha o modelo</p>
                  <p className="mb-4 text-sm text-ink-500">
                    Dois designs profissionais — a prévia atualiza na hora.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {TEMPLATES.map((t) => {
                      const selected =
                        (resume.templateId === 'classico' ? 'classico' : 'moderno') === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setResume({ templateId: t.id })}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? 'border-brand-600 ring-2 ring-brand-500/30'
                              : 'border-ink-200 dark:border-ink-700'
                          }`}
                        >
                          <div
                            className="mb-3 h-24 rounded-xl"
                            style={{ background: t.preview }}
                          />
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-base font-semibold">{t.name}</p>
                            <span
                              className={`flex size-6 items-center justify-center rounded-full border text-xs ${
                                selected
                                  ? 'border-brand-600 bg-brand-600 text-white'
                                  : 'border-ink-300 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-ink-500">{t.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-950/30">
                  <p className="font-semibold text-brand-900 dark:text-brand-100">
                    Melhorar textos com IA
                  </p>
                  <p className="mt-1 text-sm text-brand-800/80 dark:text-brand-200/80">
                    Opcional: corrige português e cria um resumo profissional.
                  </p>
                  <Button className="mt-3" variant="accent" loading={enhancing} onClick={runAI}>
                    <Sparkles className="size-4" />{' '}
                    {resume.aiEnhanced ? 'Melhorar novamente' : 'Melhorar com IA'}
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
                <Button loading={saving} onClick={goCheckout}>
                  Ir para pagamento Pix <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Prévia sticky no desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                  Pré-visualização
                </p>
                <span className="text-xs text-ink-400">
                  {TEMPLATES.find((t) => t.id === (resume.templateId === 'classico' ? 'classico' : 'moderno'))?.name}
                </span>
              </div>
              <ResumePreview data={resume} />
              <p className="text-xs text-ink-400">
                A prévia acompanha o que você digita. No Android e no PC o site se adapta sozinho.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={loadDemo}>
            Preencher demonstração
          </Button>
        </div>
      </Container>

      {/* Prévia em tela cheia no celular */}
      <AnimatePresence>
        {mobilePreview && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-ink-950/70 p-3 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-ink-50 dark:bg-ink-900">
              <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3 dark:border-ink-700">
                <p className="font-semibold">Prévia do currículo</p>
                <button
                  type="button"
                  aria-label="Fechar prévia"
                  className="rounded-lg p-2 hover:bg-ink-100 dark:hover:bg-ink-800"
                  onClick={() => setMobilePreview(false)}
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <ResumePreview data={resume} />
              </div>
              <div className="border-t border-ink-200 p-3 dark:border-ink-700">
                <Button className="w-full" onClick={() => setMobilePreview(false)}>
                  <EyeOff className="size-4" /> Continuar editando
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão flutuante Android/mobile */}
      <button
        type="button"
        onClick={() => setMobilePreview(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg lg:hidden"
      >
        <Eye className="size-4" /> Prévia
      </button>
    </div>
  )
}
