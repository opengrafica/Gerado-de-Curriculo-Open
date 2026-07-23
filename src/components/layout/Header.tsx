import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FileText, Moon, Sun, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useAppStore } from '@/store/appStore'
import { clsx } from 'clsx'

const links = [
  { to: '/#beneficios', label: 'Benefícios' },
  { to: '/criar', label: 'Criar currículo' },
  { to: '/meus-curriculos', label: 'Meus currículos' },
  { to: '/afiliados', label: 'Afiliados' },
]

export function Header() {
  const { darkMode, toggleDarkMode, user, logout } = useAppStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/70 bg-white/80 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-ink-900 dark:text-white">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <FileText className="size-5" />
          </span>
          <span className="text-lg tracking-tight">
            Currículo<span className="text-brand-600">Já</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Alternar tema"
            onClick={toggleDarkMode}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-ink-600 dark:text-ink-300">{user.fullName.split(' ')[0]}</span>
              {user.isAdmin && (
                <Button size="sm" variant="secondary" onClick={() => navigate('/admin')}>
                  Admin
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={logout}>
                Sair
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}

          <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/criar')}>
            Criar agora
          </Button>

          <button
            type="button"
            className="rounded-lg p-2 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-ink-200 bg-white px-4 py-4 dark:border-ink-800 dark:bg-ink-950 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Button onClick={() => { setOpen(false); navigate('/criar') }}>Criar meu currículo</Button>
          </div>
        </div>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white/60 py-10 dark:border-ink-800 dark:bg-ink-950/60">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-ink-900 dark:text-white">
            Currículo<span className="text-brand-600">Já</span>
          </p>
          <p className="mt-1 text-sm text-ink-500">Currículo profissional com IA em 2 minutos.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-ink-500">
          <Link to="/criar" className="hover:text-brand-600">Criar</Link>
          <Link to="/afiliados" className="hover:text-brand-600">Afiliados</Link>
          <Link to="/login" className="hover:text-brand-600">Entrar</Link>
          <Link to="/recuperar-senha" className="hover:text-brand-600">Recuperar senha</Link>
        </div>
      </Container>
      <Container className="mt-6 text-xs text-ink-400">
        © {new Date().getFullYear()} CurrículoJá. Todos os direitos reservados.
      </Container>
    </footer>
  )
}
