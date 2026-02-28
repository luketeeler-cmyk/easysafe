import { HashRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { AuthGate } from './components/auth/AuthGate'
import { Layout } from './components/layout/Layout'

import { Dashboard } from './pages/dashboard/Dashboard'
import { AmmunitionList } from './pages/ammunition/AmmunitionList'
import { AmmunitionForm } from './pages/ammunition/AmmunitionForm'
import { AmmunitionDetail } from './pages/ammunition/AmmunitionDetail'
import { FirearmList } from './pages/firearms/FirearmList'
import { FirearmForm } from './pages/firearms/FirearmForm'
import { FirearmDetail } from './pages/firearms/FirearmDetail'
import { SuppressorList } from './pages/suppressors/SuppressorList'
import { SuppressorForm } from './pages/suppressors/SuppressorForm'
import { SuppressorDetail } from './pages/suppressors/SuppressorDetail'
import { TrustDocumentList } from './pages/trust/TrustDocumentList'
import { TrustDocumentForm } from './pages/trust/TrustDocumentForm'

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <AuthGate>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ammunition" element={<AmmunitionList />} />
              <Route path="/ammunition/new" element={<AmmunitionForm />} />
              <Route path="/ammunition/:id" element={<AmmunitionDetail />} />
              <Route path="/ammunition/:id/edit" element={<AmmunitionForm />} />
              <Route path="/firearms" element={<FirearmList />} />
              <Route path="/firearms/new" element={<FirearmForm />} />
              <Route path="/firearms/:id" element={<FirearmDetail />} />
              <Route path="/firearms/:id/edit" element={<FirearmForm />} />
              <Route path="/suppressors" element={<SuppressorList />} />
              <Route path="/suppressors/new" element={<SuppressorForm />} />
              <Route path="/suppressors/:id" element={<SuppressorDetail />} />
              <Route path="/suppressors/:id/edit" element={<SuppressorForm />} />
              <Route path="/trust-documents" element={<TrustDocumentList />} />
              <Route path="/trust-documents/new" element={<TrustDocumentForm />} />
            </Route>
          </Routes>
        </AuthGate>
      </HashRouter>
    </ToastProvider>
  )
}
