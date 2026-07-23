import { clsx } from 'clsx'
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

const fieldClass =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-ink-900 dark:border-ink-700 dark:text-ink-100'

interface FieldWrapProps {
  label: string
  error?: string
  children: ReactNode
  hint?: string
}

export function Field({ label, error, children, hint }: FieldWrapProps) {
  return (
    <div className="block space-y-1.5">
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-400">{hint}</span>}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldClass, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldClass, 'min-h-[96px] resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(fieldClass, className)} {...props}>
      {children}
    </select>
  )
}
