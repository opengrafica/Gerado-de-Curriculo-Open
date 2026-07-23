import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
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
import { AffiliatesPage } from '@/pages/AffiliatesPage'
import { ForgotPasswordPage, LoginPage, RegisterPage } from '@/pages/AuthPages'
import { useAppStore } from '@/store/appStore'

function AffiliateCapture() {
  const [params] = useSearchParams()
  const setAffiliateCode = useAppStore((s) => s.setAffiliateCode)
  useEffect(() => {
    const ref = params.get('ref')
    if (ref) setAffiliateCode(ref.toUpperCase())
  }, [params, setAffiliateCode])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AffiliateCapture />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="criar" element={<CreateResumePage />} />
          <Route path="pagamento" element={<PaymentPage />} />
          <Route path="pagamento/sucesso" element={<PaymentSuccessPage />} />
          <Route path="pagamento/erro" element={<PaymentErrorPage />} />
          <Route path="sucesso" element={<FinalSuccessPage />} />
          <Route path="meus-curriculos" element={<MyResumesPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="afiliados" element={<AffiliatesPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="cadastro" element={<RegisterPage />} />
          <Route path="recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
