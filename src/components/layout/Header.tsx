import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useAppStore } from '@/store/appStore'
import { clsx } from 'clsx'

const links = [
  { to: '/#beneficios', label: 'Benefícios' },
  { to: '/criar', label: 'Criar currículo' },
  { to: '/meus-curriculos', label: 'Meus currículos' },
]

export function Header() {
  const { darkMode, toggleDarkMode, user, logout } = useAppStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/70 bg-white/80 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="min-w-0">
          <BrandLogo size={40} />
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

          <button type="button" className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
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
            {user ? (
              <>
                {user.isAdmin && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOpen(false)
                      navigate('/admin')
                    }}
                  >
                    Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false)
                    logout()
                  }}
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setOpen(false)
                  navigate('/login')
                }}
              >
                Entrar
              </Button>
            )}
            <Button
              onClick={() => {
                setOpen(false)
                navigate('/criar')
              }}
            >
              Criar meu currículo
            </Button>
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
          <BrandLogo size={34} />
          <p className="mt-2 text-sm text-ink-500">Currículo profissional em minutos — Open Gráfica.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-ink-500">
          <Link to="/criar" className="hover:text-brand-600">
            Criar
          </Link>
          <Link to="/meus-curriculos" className="hover:text-brand-600">
            Meus currículos
          </Link>
          <Link to="/login" className="hover:text-brand-600">
            Entrar
          </Link>
        </div>
      </Container>
      <Container className="mt-6 text-xs text-ink-400">
        © {new Date().getFullYear()} Currículo OPEN • Open Gráfica. Todos os direitos reservados.
      </Container>
    </footer>
  )
}
