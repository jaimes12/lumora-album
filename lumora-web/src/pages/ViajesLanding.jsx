import { useNavigate } from 'react-router-dom'
import styles from './ViajesLanding.module.css'

const PAIN_POINTS = [
  { icon: '📋', text: 'Listas de pasajeros en Excel' },
  { icon: '💸', text: 'Pagos sin registrar' },
  { icon: '📱', text: 'Clientes en WhatsApp' },
  { icon: '🏦', text: 'Depósitos sin controlar' },
  { icon: '🗂️', text: 'Itinerarios desorganizados' },
]

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    title: 'Viajes grupales',
    desc: 'Registra cada viaje con destino, fechas, precio y lugares disponibles.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Lista de pasajeros',
    desc: 'Agrega clientes como pasajeros, asigna asientos y lleva su estado de pago.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Control de pagos',
    desc: 'Registra abonos y pagos por pasajero. Sabe al instante quién debe y cuánto.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'WhatsApp integrado',
    desc: 'Recibe y responde mensajes de tus clientes directamente desde el CRM.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Calendario de salidas',
    desc: 'Visualiza todos tus viajes en un calendario para planificar sin conflictos.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    title: 'Dashboard en tiempo real',
    desc: 'Ve tus ingresos, viajes activos y cobros pendientes de un vistazo.',
  },
]

export default function ViajesLanding() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <button className={styles.navLogo} onClick={() => navigate('/')}>
          <span className={styles.navLogoText}>elixe</span>
          <span className={styles.navLogoBadge}>viajes</span>
        </button>
        <button className={styles.navCta} onClick={() => navigate('/login?industry=travel')}>
          Comenzar gratis
        </button>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Para agencias de viajes y tour operadores
        </div>
        <h1 className={styles.heroTitle}>
          Organiza tus viajes grupales<br />
          <span className={styles.heroAccent}>sin caos</span>
        </h1>
        <p className={styles.heroSub}>
          Controla clientes, pagos y reservaciones desde un solo lugar.
          Ideal para agencias de viajes y tour operadores.
        </p>
        <button className={styles.heroCta} onClick={() => navigate('/login?industry=travel')}>
          Comenzar 5 días gratis
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
        <p className={styles.heroNote}>Sin tarjeta de crédito &nbsp;·&nbsp; Configuración en 2 minutos</p>
      </section>

      {/* Pain points */}
      <section className={styles.painSection}>
        <h2 className={styles.painTitle}>¿Te identificas con esto?</h2>
        <div className={styles.painGrid}>
          {PAIN_POINTS.map((p, i) => (
            <div key={i} className={styles.painCard}>
              <span className={styles.painIcon}>{p.icon}</span>
              <span className={styles.painText}>{p.text}</span>
            </div>
          ))}
        </div>
        <p className={styles.painCta}>Con Elixe Viajes, todo esto queda resuelto.</p>
      </section>

      {/* Features */}
      <section className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>Todo lo que necesitas en un solo lugar</h2>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Empieza hoy. Es gratis los primeros 5 días.</h2>
        <p className={styles.ctaSub}>Sin compromisos. Cancela cuando quieras.</p>
        <button className={styles.heroCta} onClick={() => navigate('/login?industry=travel')}>
          Crear cuenta gratis
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Elixe · <button className={styles.footerLink} onClick={() => navigate('/')}>Para organizadores de eventos</button></p>
      </footer>
    </div>
  )
}
