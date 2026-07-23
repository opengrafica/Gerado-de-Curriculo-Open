import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { Select } from '@/components/ui/Input'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function parseISODate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { y: '', m: '', d: '' }
  const [y, m, d] = value.split('-')
  return { y, m, d }
}

function parseMonthYear(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return { y: '', m: '' }
  const [y, m] = value.split('-')
  return { y, m }
}

function yearOptions(from: number, to: number) {
  const years: number[] = []
  for (let y = from; y >= to; y -= 1) years.push(y)
  return years
}

const selectClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100'

/** Data completa: Dia / Mês / Ano + calendário rápido */
export function BirthDatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (iso: string) => void
}) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const [draft, setDraft] = useState(() => parseISODate(value))
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => Number(parseISODate(value).y) || currentYear - 25)
  const [viewMonth, setViewMonth] = useState(() => Number(parseISODate(value).m) || now.getMonth() + 1)

  useEffect(() => {
    const next = parseISODate(value)
    setDraft(next)
    if (next.y) setViewYear(Number(next.y))
    if (next.m) setViewMonth(Number(next.m))
  }, [value])

  const years = useMemo(() => yearOptions(currentYear - 14, currentYear - 80), [currentYear])
  const maxDay = draft.y && draft.m ? daysInMonth(Number(draft.y), Number(draft.m)) : 31

  const commit = (y: string, m: string, d: string) => {
    let day = d
    if (y && m && day) {
      const max = daysInMonth(Number(y), Number(m))
      if (Number(day) > max) day = pad(max)
    }
    setDraft({ y, m, d: day })
    if (y && m && day) onChange(`${y}-${m}-${day}`)
    else onChange('')
  }

  const setPart = (part: 'y' | 'm' | 'd', next: string) => {
    const y = part === 'y' ? next : draft.y
    const m = part === 'm' ? next : draft.m
    const d = part === 'd' ? next : draft.d
    commit(y, m, d)
  }

  const pickDay = (day: number) => {
    commit(String(viewYear), pad(viewMonth), pad(day))
    setOpen(false)
  }

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay()
    const total = daysInMonth(viewYear, viewMonth)
    const cells: Array<number | null> = []
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
    for (let d = 1; d <= total; d += 1) cells.push(d)
    return cells
  }, [viewYear, viewMonth])

  const shiftMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(date.getFullYear())
    setViewMonth(date.getMonth() + 1)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-2">
        <Select className="px-3 py-2.5 text-sm" value={draft.d} aria-label="Dia" onChange={(e) => setPart('d', e.target.value)}>
          <option value="">Dia</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={pad(d)}>
              {d}
            </option>
          ))}
        </Select>
        <Select
          className="px-3 py-2.5 text-sm"
          value={draft.m}
          aria-label="Mês"
          onChange={(e) => {
            setPart('m', e.target.value)
            if (e.target.value) setViewMonth(Number(e.target.value))
          }}
        >
          <option value="">Mês</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={pad(i + 1)}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          className="px-3 py-2.5 text-sm"
          value={draft.y}
          aria-label="Ano"
          onChange={(e) => {
            setPart('y', e.target.value)
            if (e.target.value) setViewYear(Number(e.target.value))
          }}
        >
          <option value="">Ano</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </Select>
        <button
          type="button"
          aria-label="Abrir calendário"
          onClick={() => {
            if (draft.y) setViewYear(Number(draft.y))
            if (draft.m) setViewMonth(Number(draft.m))
            setOpen((v) => !v)
          }}
          className={clsx(
            'inline-flex items-center justify-center rounded-xl border px-3 transition',
            open
              ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40'
              : 'border-ink-200 bg-white text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200',
          )}
        >
          <CalendarDays className="size-5" />
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-950/60">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" className="rounded-lg p-2 hover:bg-white dark:hover:bg-ink-800" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <select
                className={clsx(selectClass, 'max-w-[140px] py-1.5')}
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className={clsx(selectClass, 'max-w-[100px] py-1.5')}
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="rounded-lg p-2 hover:bg-white dark:hover:bg-ink-800" onClick={() => shiftMonth(1)}>
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-400">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <span key={`e-${idx}`} />
              const iso = `${viewYear}-${pad(viewMonth)}-${pad(day)}`
              const selected = value === iso
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={clsx(
                    'aspect-square rounded-lg text-sm font-medium transition',
                    selected
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-ink-800 hover:bg-brand-50 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[18, 20, 25, 30, 35, 40].map((age) => {
              const y = currentYear - age
              return (
                <button
                  key={age}
                  type="button"
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-ink-600 shadow-sm dark:bg-ink-800 dark:text-ink-200"
                  onClick={() => {
                    setViewYear(y)
                    const day = Math.min(Number(draft.d) || 1, daysInMonth(y, viewMonth))
                    commit(String(y), pad(viewMonth), pad(day))
                  }}
                >
                  {age} anos
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** Mês / Ano para experiências e escolaridade */
export function MonthYearPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (ym: string) => void
  disabled?: boolean
}) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const parsed = parseMonthYear(value)
  const years = useMemo(() => yearOptions(currentYear, currentYear - 50), [currentYear])
  const [open, setOpen] = useState(false)

  if (disabled) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950/40">
        Em andamento
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] gap-2">
        <Select
          className="px-3 py-2.5 text-sm"
          value={parsed.m}
          aria-label="Mês"
          onChange={(e) => {
            const m = e.target.value
            const y = parsed.y || String(currentYear)
            onChange(m ? `${y}-${m}` : '')
          }}
        >
          <option value="">Mês</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={pad(i + 1)}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          className="px-3 py-2.5 text-sm"
          value={parsed.y}
          aria-label="Ano"
          onChange={(e) => {
            const y = e.target.value
            const m = parsed.m || pad(currentMonth)
            onChange(y ? `${y}-${m}` : '')
          }}
        >
          <option value="">Ano</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </Select>
        <button
          type="button"
          aria-label="Atalhos de data"
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            'inline-flex items-center justify-center rounded-xl border px-3 transition',
            open
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-ink-200 bg-white text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200',
          )}
        >
          <CalendarDays className="size-5" />
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-950/60">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Escolha rápida</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={() => {
                onChange(`${currentYear}-${pad(currentMonth)}`)
                setOpen(false)
              }}
            >
              Este mês
            </button>
            {[1, 2, 3, 5].map((n) => {
              const d = new Date(currentYear, currentMonth - 1 - n * 12, 1)
              const ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
              return (
                <button
                  key={n}
                  type="button"
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm dark:bg-ink-800 dark:text-ink-200"
                  onClick={() => {
                    onChange(ym)
                    setOpen(false)
                  }}
                >
                  Há {n} {n === 1 ? 'ano' : 'anos'}
                </button>
              )
            })}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Mês</p>
          <div className="mb-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {MONTHS_SHORT.map((label, i) => {
              const m = pad(i + 1)
              const y = parsed.y || String(currentYear)
              const selected = parsed.m === m
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange(`${y}-${m}`)}
                  className={clsx(
                    'rounded-lg py-2 text-xs font-semibold transition',
                    selected
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-ink-700 hover:bg-brand-50 dark:bg-ink-900 dark:text-ink-200',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Ano</p>
          <div className="grid max-h-36 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-5">
            {years.map((y) => {
              const selected = parsed.y === String(y)
              const m = parsed.m || pad(currentMonth)
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(`${y}-${m}`)
                    setOpen(false)
                  }}
                  className={clsx(
                    'rounded-lg py-2 text-xs font-semibold transition',
                    selected
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-ink-700 hover:bg-brand-50 dark:bg-ink-900 dark:text-ink-200',
                  )}
                >
                  {y}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** Só o ano (cursos) */
export function YearPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (year: string) => void
}) {
  const currentYear = new Date().getFullYear()
  const years = useMemo(() => yearOptions(currentYear, currentYear - 40), [currentYear])

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Ano">
      <option value="">Ano</option>
      {years.map((y) => (
        <option key={y} value={String(y)}>
          {y}
        </option>
      ))}
    </Select>
  )
}
