import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Field, Input } from '@/components/ui/Input'
import { useAppStore } from '@/store/appStore'
import { getSupabase } from '@/lib/supabase'
import { ensureProfile, fetchUserProfile, isSuperAdminEmail } from '@/lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)
  const [email, setEmail] = useState('opengraficaoficial@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabase()
      if (supabase) {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        const user = data.user!
        await ensureProfile({
          id: user.id,
          email: user.email || email,
          fullName: user.user_metadata?.full_name,
        })
        const profile = await fetchUserProfile(user.id, user.email || email)
        const isAdmin = Boolean(profile.isAdmin) || isSuperAdminEmail(user.email || email)
        setUser({
          id: user.id,
          email: user.email || email,
          fullName: profile.fullName || user.user_metadata?.full_name || email.split('@')[0],
          phone: profile.phone,
          isAdmin,
          affiliateCode: profile.affiliateCode,
          commissionPercent: profile.commissionPercent,
          pixKey: profile.pixKey,
          totalEarned: profile.totalEarned,
          totalPaid: profile.totalPaid,
          createdAt: user.created_at,
        })
        navigate(isAdmin ? '/admin' : '/meus-curriculos')
        return
      }

      // Fallback local (sem Supabase)
      if (password.length < 4) throw new Error('Senha inválida')
      const isAdmin = isSuperAdminEmail(email) || email.startsWith('admin')
      setUser({
        id: isAdmin ? 'super-admin' : crypto.randomUUID(),
        email,
        fullName: isAdmin ? 'Open Gráfica' : email.split('@')[0],
        isAdmin,
        affiliateCode: isAdmin ? 'OPENGRAFICA' : 'LOCAL' + Math.floor(Math.random() * 999),
        commissionPercent: 30,
        totalEarned: 0,
        totalPaid: 0,
        createdAt: new Date().toISOString(),
      })
      navigate(isAdmin ? '/admin' : '/meus-curriculos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-16">
      <Container className="max-w-md">
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Entrar</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">Acesse sua conta CurrículoJá.</p>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
          <Field label="E-mail">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" loading={loading} type="submit">Entrar</Button>
          <p className="text-center text-sm text-ink-500">
            <Link to="/recuperar-senha" className="text-brand-700 hover:underline">Esqueci minha senha</Link>
            {' · '}
            <Link to="/cadastro" className="text-brand-700 hover:underline">Criar conta</Link>
          </p>
        </form>
      </Container>
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)
  const affiliateCode = useAppStore((s) => s.affiliateCode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = getSupabase()
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              referred_by: affiliateCode || null,
            },
          },
        })
        if (error) throw error
        if (data.user) {
          await ensureProfile({ id: data.user.id, email, fullName })
          const profile = await fetchUserProfile(data.user.id, email)
          setUser({
            id: data.user.id,
            email,
            fullName,
            isAdmin: Boolean(profile.isAdmin),
            affiliateCode: profile.affiliateCode,
            commissionPercent: profile.commissionPercent ?? 30,
            totalEarned: 0,
            totalPaid: 0,
            createdAt: data.user.created_at,
          })
        }
      } else {
        setUser({
          id: crypto.randomUUID(),
          email,
          fullName,
          createdAt: new Date().toISOString(),
          affiliateCode: fullName.slice(0, 3).toUpperCase() + Math.floor(Math.random() * 999),
          commissionPercent: 30,
          totalEarned: 0,
          totalPaid: 0,
        })
      }
      navigate('/criar')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro no cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-16">
      <Container className="max-w-md">
        <h1 className="text-3xl font-bold">Criar conta</h1>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
          <Field label="Nome completo"><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Senha"><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {affiliateCode && (
            <p className="text-xs text-brand-700">Indicação detectada: {affiliateCode}</p>
          )}
          <Button className="w-full" loading={loading} type="submit">Cadastrar</Button>
          <p className="text-center text-sm"><Link to="/login" className="text-brand-700">Já tenho conta</Link></p>
        </form>
      </Container>
    </div>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = getSupabase()
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        })
        if (error) throw error
      }
      setSent(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-16">
      <Container className="max-w-md">
        <h1 className="text-3xl font-bold">Recuperar senha</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">Enviaremos um link para redefinir sua senha.</p>
        {sent ? (
          <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-6 text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
            Se o e-mail existir, você receberá as instruções em instantes.
            {!getSupabase() && ' (Modo demo: e-mail simulado.)'}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
            <Field label="E-mail">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button className="w-full" loading={loading} type="submit">Enviar link</Button>
          </form>
        )}
      </Container>
    </div>
  )
}
