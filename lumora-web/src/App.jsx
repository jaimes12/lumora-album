import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// Landing components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import VideoSection from './components/VideoSection'
import Audience from './components/Audience'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import CTA from './components/CTA'
import Footer from './components/Footer'

// App layout
import AppLayout from './layouts/AppLayout'

// App pages
import DashboardPage from './pages/DashboardPage'
import EventosPage from './pages/EventosPage'
import EventoDetallePage from './pages/EventoDetallePage'
import ClientesPage from './pages/ClientesPage'
import ChatPage from './pages/ChatPage'
import ProveedoresPage from './pages/ProveedoresPage'
import VentasPage from './pages/VentasPage'
import ContratosPage from './pages/ContratosPage'
import CalendarioPage from './pages/CalendarioPage'
import ContactosPage from './pages/ContactosPage'
import PagoExitosoPage from './pages/PagoExitosoPage'
import LoginPage from './pages/LoginPage'
import PaquetesPage from './pages/PaquetesPage'
import ProductosPage from './pages/ProductosPage'
import ConfigPage        from './pages/ConfigPage'
import TrabajadoresPage  from './pages/TrabajadoresPage'
import SuperAdminPage    from './pages/SuperAdminPage'
import NotasPage         from './pages/NotasPage'

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <VideoSection />
        <Features />
        <HowItWorks />
        <Audience />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--text-muted)',
      fontSize: '14px',
      gap: '10px',
    }}>
      <div style={{
        width: 18, height: 18,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      Cargando…
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* App shell — protected */}
            <Route
              path="/app"
              element={<PrivateRoute><AppLayout /></PrivateRoute>}
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="eventos"     element={<EventosPage />} />
              <Route path="eventos/:id" element={<EventoDetallePage />} />
              <Route path="clientes"    element={<ClientesPage />} />
              <Route path="chats"       element={<ChatPage />} />
              <Route path="contactos"   element={<ContactosPage />} />
              <Route path="proveedores" element={<ProveedoresPage />} />
              <Route path="ventas"      element={<VentasPage />} />
              <Route path="notas"       element={<NotasPage />} />
              <Route path="contratos"   element={<ContratosPage />} />
              <Route path="calendario"  element={<CalendarioPage />} />
              <Route path="paquetes"      element={<PaquetesPage />} />
              <Route path="productos"     element={<ProductosPage />} />
              <Route path="pago-exitoso"    element={<PagoExitosoPage />} />
              <Route path="configuracion"   element={<ConfigPage />} />
              <Route path="trabajadores"   element={<TrabajadoresPage />} />
            </Route>

            {/* Super admin — own auth, independent of app session */}
            <Route path="/superadmin"     element={<SuperAdminPage />} />
            <Route path="/superadmin/:section" element={<SuperAdminPage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  )
}
