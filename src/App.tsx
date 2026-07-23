import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { CreateResumePage } from '@/pages/CreateResumePage'
import { PaymentPage } from '@/pages/PaymentPage'
import {
  FinalSuccessPage,
  PaymentErrorPage,
  PaymentSuccessPage,
} from '@/pages/PaymentResultPages'
import { MyResumesPage } from '@/pages/MyResumesPage'
import { AdminPage } from '@/pages/AdminPage'
import { ForgotPasswordPage, LoginPage, RegisterPage } from '@/pages/AuthPages'
import { RequireAdmin, RequireAuth } from '@/components/auth/RequireAuth'
import { captureTrafficAttribution } from '@/lib/traffic'

function TrafficCapture() {
  useEffect(() => {
    captureTrafficAttribution()
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <TrafficCapture />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route
            path="criar"
            element={
              <RequireAuth>
                <CreateResumePage />
              </RequireAuth>
            }
          />
          <Route
            path="pagamento"
            element={
              <RequireAuth>
                <PaymentPage />
              </RequireAuth>
            }
          />
          <Route
            path="pagamento/sucesso"
            element={
              <RequireAuth>
                <PaymentSuccessPage />
              </RequireAuth>
            }
          />
          <Route path="pagamento/erro" element={<PaymentErrorPage />} />
          <Route
            path="sucesso"
            element={
              <RequireAuth>
                <FinalSuccessPage />
              </RequireAuth>
            }
          />
          <Route
            path="meus-curriculos"
            element={
              <RequireAuth>
                <MyResumesPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          <Route path="afiliados" element={<Navigate to="/" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="cadastro" element={<RegisterPage />} />
          <Route path="recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
