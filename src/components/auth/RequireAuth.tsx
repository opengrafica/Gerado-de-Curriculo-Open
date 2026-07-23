import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAppStore } from '@/store/appStore'

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (!user.isAdmin) {
    return <Navigate to="/meus-curriculos" replace />
  }
  return <>{children}</>
}
