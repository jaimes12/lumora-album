import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'

// Landing components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
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

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <SettingsProvider>
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* App shell */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"   element={<DashboardPage />} />
          <Route path="eventos"     element={<EventosPage />} />
          <Route path="eventos/:id" element={<EventoDetallePage />} />
          <Route path="clientes"    element={<ClientesPage />} />
          <Route path="chats"       element={<ChatPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="ventas"      element={<VentasPage />} />
          <Route path="contratos"   element={<ContratosPage />} />
          <Route path="calendario"  element={<CalendarioPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </SettingsProvider>
  )
}
