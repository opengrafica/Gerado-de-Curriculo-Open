import type { ReactNode } from 'react'
import { hasResumePhoto } from '@/lib/photo'
import type { ResumeData } from '@/types'

function formatBirth(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatPeriod(start: string, end: string, current?: boolean) {
  const fmt = (v: string) => {
    if (!v) return ''
    const [y, m] = v.split('-')
    return m ? `${m}/${y}` : y
  }
  return `${fmt(start) || '—'} — ${current ? 'Atual' : fmt(end) || '—'}`
}

export function ResumePreview({ data }: { data: ResumeData }) {
  const template = data.templateId === 'classico' ? 'classico' : 'moderno'
  const showPhoto = hasResumePhoto(data)

  if (template === 'classico') {
    return (
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white text-[10px] text-ink-900 shadow-lg dark:border-ink-700 sm:text-[11px]">
        <div className="relative bg-[#1c2026] px-4 py-4 text-white sm:px-5">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#b0894a]" />
          <div className={`flex items-start gap-3 ${showPhoto ? 'pr-16' : ''}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold tracking-tight sm:text-lg">
                {data.fullName || 'Seu Nome'}
              </p>
              <p className="mt-1 line-clamp-2 text-[9px] text-white/80 sm:text-[10px]">
                {[data.phone, data.email, data.address].filter(Boolean).join(' · ') || 'Telefone · E-mail · Endereço'}
              </p>
            </div>
            {showPhoto && data.photoDataUrl && (
              <img
                src={data.photoDataUrl}
                alt="Foto do currículo"
                className="absolute right-3 top-3 size-14 rounded-full border-2 border-white object-cover sm:size-16"
              />
            )}
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <p className="text-[9px] text-ink-500">
            {[
              data.birthDate ? `Nasc.: ${formatBirth(data.birthDate)}` : '',
              data.nationality,
              data.maritalStatus,
            ]
              .filter(Boolean)
              .join(' · ') || 'Dados pessoais'}
          </p>

          {data.professionalSummary && (
            <PreviewSection title="Perfil profissional" accent="gold">
              <p className="leading-relaxed text-ink-700">{data.professionalSummary}</p>
            </PreviewSection>
          )}

          {data.experiences.length > 0 && (
            <PreviewSection title="Experiência profissional" accent="gold">
              <div className="space-y-2">
                {data.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold">{exp.role || 'Cargo'}</p>
                      <p className="shrink-0 text-[9px] text-[#b0894a]">
                        {formatPeriod(exp.startDate, exp.endDate, exp.current)}
                      </p>
                    </div>
                    <p className="text-ink-500">{exp.company}</p>
                    {exp.description && <p className="mt-0.5 text-ink-600">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {data.education.length > 0 && (
            <PreviewSection title="Formação acadêmica" accent="gold">
              <div className="space-y-1.5">
                {data.education.map((ed) => (
                  <div key={ed.id}>
                    <p className="font-semibold">{ed.course || 'Formação'}</p>
                    <p className="text-ink-500">
                      {ed.institution}
                      {ed.year ? ` · ${ed.year}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {data.courses.length > 0 && (
            <PreviewSection title="Cursos" accent="gold">
              <ul className="space-y-1 text-ink-700">
                {data.courses.map((c) => (
                  <li key={c.id}>
                    • {c.name}
                    {c.institution ? ` — ${c.institution}` : ''}
                    {c.year ? ` (${c.year})` : ''}
                  </li>
                ))}
              </ul>
            </PreviewSection>
          )}

          {!data.professionalSummary && !data.experiences.length && !data.education.length && (
            <p className="py-8 text-center text-ink-400">Preencha os dados para ver a prévia.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[420px] overflow-hidden rounded-xl border border-ink-200 bg-white text-[10px] shadow-lg dark:border-ink-700 sm:min-h-[520px] sm:text-[11px]">
      <aside className="relative w-[34%] shrink-0 bg-[#00AEEF] px-2.5 py-3 text-white sm:w-[32%] sm:px-3 sm:py-4">
        <div className="absolute inset-y-0 left-0 w-1 bg-[#EC008C]" />
        {showPhoto && data.photoDataUrl && (
          <img
            src={data.photoDataUrl}
            alt="Foto do currículo"
            className="mx-auto mb-3 size-16 rounded-full border-[3px] border-white object-cover sm:size-20"
          />
        )}
        <p className="text-[9px] font-bold tracking-wide">CONTATO</p>
        <div className="mt-1.5 space-y-1 text-[8px] leading-snug text-white/95 sm:text-[9px]">
          <p className="break-words">{data.phone || 'Telefone'}</p>
          <p className="break-all">{data.email || 'E-mail'}</p>
          <p className="break-words">{data.address || 'Endereço'}</p>
        </div>
        <p className="mt-4 text-[9px] font-bold tracking-wide">PERFIL</p>
        <div className="mt-1.5 space-y-1 text-[8px] text-white/95 sm:text-[9px]">
          {data.birthDate && <p>Nasc.: {formatBirth(data.birthDate)}</p>}
          <p>{data.nationality || 'Nacionalidade'}</p>
          <p>{data.maritalStatus || 'Estado civil'}</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-3 p-3 sm:p-4">
        <div>
          <p className="text-base font-extrabold leading-tight text-ink-900 sm:text-xl">
            {data.fullName || 'Seu Nome'}
          </p>
          <div className="mt-2 flex gap-1">
            <span className="h-1 w-10 rounded-full bg-[#00AEEF]" />
            <span className="h-1 w-4 rounded-full bg-[#EC008C]" />
          </div>
        </div>

        {data.professionalSummary && (
          <PreviewSection title="Resumo profissional" accent="cyan">
            <p className="leading-relaxed text-ink-700">{data.professionalSummary}</p>
          </PreviewSection>
        )}

        {data.experiences.length > 0 && (
          <PreviewSection title="Experiência" accent="cyan">
            <div className="space-y-2">
              {data.experiences.map((exp) => (
                <div key={exp.id}>
                  <p className="font-semibold text-ink-900">{exp.role || 'Cargo'}</p>
                  <p className="text-ink-500">
                    {exp.company} · {formatPeriod(exp.startDate, exp.endDate, exp.current)}
                  </p>
                  {exp.description && <p className="mt-0.5 text-ink-600">{exp.description}</p>}
                </div>
              ))}
            </div>
          </PreviewSection>
        )}

        {data.education.length > 0 && (
          <PreviewSection title="Escolaridade" accent="cyan">
            <div className="space-y-1.5">
              {data.education.map((ed) => (
                <div key={ed.id}>
                  <p className="font-semibold">{ed.course || 'Formação'}</p>
                  <p className="text-ink-500">
                    {ed.institution}
                    {ed.year ? ` · ${ed.year}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </PreviewSection>
        )}

        {data.courses.length > 0 && (
          <PreviewSection title="Cursos" accent="cyan">
            <ul className="space-y-1 text-ink-700">
              {data.courses.map((c) => (
                <li key={c.id}>
                  {c.name}
                  {c.institution ? ` — ${c.institution}` : ''}
                  {c.year ? ` (${c.year})` : ''}
                </li>
              ))}
            </ul>
          </PreviewSection>
        )}

        {!data.professionalSummary && !data.experiences.length && !data.education.length && (
          <p className="py-10 text-center text-ink-400">Preencha os dados para ver a prévia.</p>
        )}
      </div>
    </div>
  )
}

function PreviewSection({
  title,
  children,
  accent,
}: {
  title: string
  children: ReactNode
  accent: 'cyan' | 'gold'
}) {
  return (
    <section>
      <p
        className={`text-[9px] font-bold tracking-wide uppercase ${
          accent === 'gold' ? 'text-[#1c2026]' : 'text-[#00AEEF]'
        }`}
      >
        {title}
      </p>
      <div
        className={`mb-1.5 mt-0.5 h-px ${accent === 'gold' ? 'bg-[#b0894a]' : 'bg-[#EC008C]/70'}`}
      />
      {children}
    </section>
  )
}
