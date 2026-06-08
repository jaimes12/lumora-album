import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { whatsappApi } from '../api/whatsappApi'
import styles from './AppLayout.module.css'
import logoFull from '../assets/lumora-logo.png'
import logoMini from '../assets/lumora-mini-logo.png'

const NAV_KEYS = [
  {
    to: '/app/dashboard', key: 'dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    to: '/app/paquetes', key: 'paquetes',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  },
  {
    to: '/app/clientes', key: 'clientes',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    to: '/app/eventos', key: 'eventos',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    to: '/app/calendario', key: 'calendario',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5" strokeLinecap="round"/><line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  },
  {
    to: '/app/chats', key: 'chats',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    to: '/app/ventas', key: 'ventas',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
  {
    to: '/app/contratos', key: 'contratos',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M12 13h4"/><path d="M12 17h4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></svg>,
  },
  {
    to: '/app/proveedores', key: 'proveedores',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    to: '/app/contactos', key: 'contactos',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>,
  },
]

const SunIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

/* ── WhatsApp Connect Modal ── */
function WhatsAppModal({ onClose, onConnect }) {
  // state: loading | qr | ready | disconnected | error
  const [waState, setWaState] = useState('loading')
  const [qrCode,  setQrCode]  = useState(null)
  const [error,   setError]   = useState('')
  const pollRef = useRef(null)

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  const poll = async () => {
    try {
      const status = await whatsappApi.getStatus()
      setWaState(status.state)
      setQrCode(status.qrCode ?? null)
      if (status.connected) {
        stopPolling()
        onConnect()
      }
    } catch {
      // keep polling; server may be momentarily unreachable
    }
  }

  useEffect(() => {
    // Kick off connection on the WA server then start polling
    whatsappApi.connect().catch(() => {})
    poll() // immediate first check
    pollRef.current = setInterval(poll, 2500)
    return stopPolling
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stateLabel = {
    loading:      'Iniciando conexión…',
    qr:           'Escanea el código QR con tu WhatsApp',
    ready:        '¡Conectado!',
    disconnected: 'Desconectado — reconectando…',
    error:        'Error al conectar',
  }[waState] ?? 'Conectando…'

  return (
    <div className={styles.waOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.waModal}>
        <div className={styles.waHeader}>
          <div className={styles.waHeaderLeft}>
            <div className={styles.waIconWrap}><WhatsAppIcon /></div>
            <span className={styles.waTitle}>Conectar WhatsApp</span>
          </div>
          <button className={styles.waClose} onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.waBody}>
          {waState === 'ready' ? (
            <div className={styles.waSuccess}>
              <div className={styles.waSuccessIcon}>✓</div>
              <h3 className={styles.waSuccessTitle}>¡WhatsApp conectado!</h3>
              <p className={styles.waSuccessText}>Tus mensajes de WhatsApp estarán disponibles en el CRM de Chats.</p>
              <button className={styles.waBtn} onClick={onClose}>Empezar a usar →</button>
            </div>
          ) : waState === 'qr' && qrCode ? (
            <div className={styles.waQrWrap}>
              <img src={qrCode} alt="QR WhatsApp" className={styles.waQrImg} />
              <p className={styles.waQrText}>Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
              <div className={styles.waSpinner} />
              <p className={styles.waScanning}>Esperando escaneo…</p>
            </div>
          ) : (
            <div className={styles.waQrWrap}>
              <div className={styles.waSpinner} />
              <p className={styles.waScanning}>{stateLabel}</p>
              {(waState === 'loading' || waState === 'disconnected') && (
                <p className={styles.waHint}>El QR aparecerá en unos segundos.<br/>Puede tardar hasta 30s la primera vez.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Plan data (mock) ── */
const PLAN = {
  nombre: 'Pro',
  precio: 599,
  ciclo: 'mensual',
  proximoPago: '28 Jun 2026',
  eventos: { usados: 14, limite: 50 },
  almacenamiento: { usados: 3.2, limite: 10 },
  features: ['Eventos ilimitados hasta 50/mes', 'CRM de clientes', 'Gestión de proveedores', 'Contratos digitales', 'WhatsApp integrado', 'Soporte prioritario'],
  historial: [
    { fecha: '28 May 2026', monto: 599, estado: 'Pagado',   metodo: 'Visa •••• 4242' },
    { fecha: '28 Abr 2026', monto: 599, estado: 'Pagado',   metodo: 'Visa •••• 4242' },
    { fecha: '28 Mar 2026', monto: 599, estado: 'Pagado',   metodo: 'Visa •••• 4242' },
    { fecha: '28 Feb 2026', monto: 599, estado: 'Pagado',   metodo: 'Visa •••• 4242' },
    { fecha: '28 Ene 2026', monto: 599, estado: 'Pagado',   metodo: 'Visa •••• 4242' },
  ],
}

function PlanModal({ onClose }) {
  const usedPct  = Math.round((PLAN.eventos.usados / PLAN.eventos.limite) * 100)
  const storePct = Math.round((PLAN.almacenamiento.usados / PLAN.almacenamiento.limite) * 100)

  return (
    <div className={styles.planOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.planModal}>

        {/* Header */}
        <div className={styles.planHeader}>
          <div className={styles.planHeaderLeft}>
            <div className={styles.planIconWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span className={styles.planModalTitle}>Mi Plan</span>
          </div>
          <button className={styles.waClose} onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.planBody}>

          {/* Plan badge + price */}
          <div className={styles.planTop}>
            <div className={styles.planNameWrap}>
              <span className={styles.planBadge}>{PLAN.nombre}</span>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>${PLAN.precio}</span>
                <span className={styles.planCiclo}>/ {PLAN.ciclo}</span>
              </div>
            </div>
            <div className={styles.planNextBill}>
              <span className={styles.planNextLabel}>Próximo pago</span>
              <span className={styles.planNextDate}>{PLAN.proximoPago}</span>
            </div>
          </div>

          {/* Usage bars */}
          <div className={styles.planUsage}>
            <div className={styles.planUsageRow}>
              <div className={styles.planUsageLabels}>
                <span>Eventos</span>
                <span>{PLAN.eventos.usados} / {PLAN.eventos.limite}</span>
              </div>
              <div className={styles.planBar}>
                <div className={styles.planBarFill} style={{ width: `${usedPct}%`, background: usedPct > 80 ? '#fb923c' : 'var(--accent, #a78bfa)' }} />
              </div>
            </div>
            <div className={styles.planUsageRow}>
              <div className={styles.planUsageLabels}>
                <span>Almacenamiento</span>
                <span>{PLAN.almacenamiento.usados} GB / {PLAN.almacenamiento.limite} GB</span>
              </div>
              <div className={styles.planBar}>
                <div className={styles.planBarFill} style={{ width: `${storePct}%`, background: 'var(--accent, #a78bfa)' }} />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className={styles.planBodySection}>
            <p className={styles.planSectionTitle}>Incluido en tu plan</p>
            <ul className={styles.planFeatures}>
              {PLAN.features.map((f, i) => (
                <li key={i} className={styles.planFeatureItem}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment history */}
          <div className={styles.planBodySection}>
            <p className={styles.planSectionTitle}>Historial de pagos</p>
            <div className={styles.planHistorial}>
              {PLAN.historial.map((p, i) => (
                <div key={i} className={styles.planHistRow}>
                  <div className={styles.planHistLeft}>
                    <span className={styles.planHistFecha}>{p.fecha}</span>
                    <span className={styles.planHistMetodo}>{p.metodo}</span>
                  </div>
                  <div className={styles.planHistRight}>
                    <span className={styles.planHistMonto}>${p.monto}</span>
                    <span className={styles.planHistEstado}>{p.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button className={styles.planUpgradeBtn}>
            Actualizar plan →
          </button>

        </div>
      </div>
    </div>
  )
}

/* ── Layout ── */
export default function AppLayout() {
  const navigate = useNavigate()
  const { theme, lang, toggleTheme, toggleLang, i18n } = useSettings()
  const { user, logout } = useAuth()
  const isLocked = !user?.plan || user.plan === 'free'
  const [waConnected,        setWaConnected]        = useState(false)
  const [showWaModal,        setShowWaModal]        = useState(false)
  const [sidebarOpen,        setSidebarOpen]        = useState(false)
  const [planOpen,           setPlanOpen]           = useState(false)
  const [confirmDisconnect,  setConfirmDisconnect]  = useState(false)
  const [confirmLogout,      setConfirmLogout]      = useState(false)

  // Restore WA connected state on mount
  useEffect(() => {
    whatsappApi.getStatus()
      .then(s => { if (s.connected) setWaConnected(true) })
      .catch(() => {})
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [navigate])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleConnect = () => {
    setWaConnected(true)
  }

  const handleDisconnect = async () => {
    await whatsappApi.disconnect().catch(() => {})
    setWaConnected(false)
    setConfirmDisconnect(false)
  }

  return (
    <div className={styles.shell}>
      {showWaModal && (
        <WhatsAppModal
          onClose={() => setShowWaModal(false)}
          onConnect={handleConnect}
        />
      )}
      {planOpen && <PlanModal onClose={() => setPlanOpen(false)} />}

      {/* Mobile top bar */}
      <div className={styles.topBar}>
        <button className={styles.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <img src={logoFull} alt="Lumora" className={styles.topBarLogo} />
        <div style={{width: 40}} />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarInner}>

          {/* Logo */}
          <div className={styles.logoArea}>
            <img src={logoMini} alt="Lumora" className={styles.logoMini} />
            <img src={logoFull} alt="Lumora" className={styles.logoFull} />
            <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className={styles.nav}>
            {NAV_KEYS.map(item => {
              const locked = isLocked && item.key !== 'dashboard' && item.key !== 'paquetes'
              if (locked) {
                return (
                  <div key={item.key} className={`${styles.navItem} ${styles.navItemLocked}`}
                    onClick={() => { setSidebarOpen(false); navigate('/app/paquetes') }}
                    title="Elige un plan para acceder"
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{i18n[item.key]}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto',opacity:0.4}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                )
              }
              return (
                <NavLink key={item.to} to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{i18n[item.key]}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* ── WhatsApp section ── */}
          <div className={styles.waSection}>
            <div className={styles.waSectionHead}>
              <span className={styles.waSectionLabel}>WhatsApp</span>
            </div>
            {waConnected ? (
              <div className={styles.waConnected}>
                {confirmDisconnect ? (
                  <div className={styles.waConfirm}>
                    <span className={styles.waConfirmText}>¿Cerrar sesión de WhatsApp?</span>
                    <div className={styles.waConfirmBtns}>
                      <button className={styles.waConfirmYes} onClick={handleDisconnect}>Sí</button>
                      <button className={styles.waConfirmNo}  onClick={() => setConfirmDisconnect(false)}>No</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.waConnectedLeft}>
                      <span className={styles.waGreenDot} />
                      <div className={styles.waConnectedInfo}>
                        <span className={styles.waConnectedText}>Conectado</span>
                      </div>
                    </div>
                    <button className={styles.waDisconnectBtn} onClick={() => setConfirmDisconnect(true)}>
                      Desconectar
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button className={styles.waConnectBtn} onClick={() => setShowWaModal(true)}>
                <div className={styles.waConnectIcon}><WhatsAppIcon /></div>
                <span>Conectar WhatsApp</span>
              </button>
            )}
          </div>

          {/* Mi Plan */}
          <div className={styles.planSection}>
            <div className={styles.planSectionHead}>
              <span className={styles.planSectionLabel}>Mi Plan</span>
            </div>
            <button className={styles.planWidget} onClick={() => setPlanOpen(true)}>
              <div className={styles.planWidgetTop}>
                <span className={styles.planWidgetName}>{PLAN.nombre}</span>
                <span className={styles.planWidgetPrice}>${PLAN.precio}/mes</span>
              </div>
              <div className={styles.planWidgetBar}>
                <div
                  className={styles.planWidgetBarFill}
                  style={{ width: `${Math.round((PLAN.eventos.usados / PLAN.eventos.limite) * 100)}%` }}
                />
              </div>
              <div className={styles.planWidgetMeta}>
                <span>{PLAN.eventos.usados}/{PLAN.eventos.limite} eventos</span>
                <span className={styles.planWidgetManage}>Gestionar →</span>
              </div>
            </button>
          </div>

          {/* Settings */}
          <div className={styles.settingsArea}>
            <button className={styles.toggleBtn} onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span>{theme === 'dark' ? i18n.lightMode : i18n.darkMode}</span>
            </button>
            <button className={styles.toggleBtn} onClick={toggleLang}>
              <span className={styles.langFlag}>{lang === 'es' ? '🇲🇽' : '🇺🇸'}</span>
              <span>{lang === 'es' ? 'English' : 'Español'}</span>
              <span className={styles.langBadge}>{lang.toUpperCase()}</span>
            </button>
          </div>

          {/* User */}
          <div className={styles.userArea}>
            {confirmLogout ? (
              <div className={styles.logoutConfirm}>
                <span className={styles.logoutConfirmText}>¿Cerrar sesión?</span>
                <div className={styles.logoutConfirmBtns}>
                  <button
                    className={styles.logoutConfirmYes}
                    onClick={() => { logout(); navigate('/') }}
                  >
                    Sí, salir
                  </button>
                  <button
                    className={styles.logoutConfirmNo}
                    onClick={() => setConfirmLogout(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.avatar}>
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'LU'}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.name ?? 'Usuario'}</span>
                  <span className={styles.userRole}>{i18n.admin}</span>
                </div>
                <button
                  className={styles.logoutBtn}
                  onClick={() => setConfirmLogout(true)}
                  title={i18n.logout}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </>
            )}
          </div>

        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
