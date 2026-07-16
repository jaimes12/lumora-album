import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'
import styles from './ViajesLanding.module.css'
import logoFull  from '../assets/logo_elixe.jpeg'
import logoWhite from '../assets/logo_white_elixe.jpeg'

// ── Floating travel icons ────────────────────────────────────────────────────
const BG_ICONS = [
  { emoji: '✈️',  top: '8%',  left: '5%',  size: 30, delay: '0s',   dur: '10s'  },
  { emoji: '🌴',  top: '13%', left: '88%', size: 26, delay: '1.5s', dur: '12s'  },
  { emoji: '🗺️', top: '42%', left: '3%',  size: 24, delay: '0.7s', dur: '9s'   },
  { emoji: '🌊',  top: '22%', left: '94%', size: 20, delay: '2.2s', dur: '8s'   },
  { emoji: '🧳',  top: '70%', left: '6%',  size: 28, delay: '2.0s', dur: '11s'  },
  { emoji: '🏖️', top: '80%', left: '92%', size: 24, delay: '1.0s', dur: '10s'  },
  { emoji: '🌅',  top: '58%', left: '97%', size: 22, delay: '3.3s', dur: '13s'  },
  { emoji: '🚌',  top: '88%', left: '20%', size: 26, delay: '1.7s', dur: '9s'   },
  { emoji: '⛵',  top: '11%', left: '50%', size: 18, delay: '2.8s', dur: '11s'  },
  { emoji: '🗼',  top: '63%', left: '54%', size: 20, delay: '0.5s', dur: '8s'   },
  { emoji: '🏔️', top: '32%', left: '82%', size: 22, delay: '1.2s', dur: '10s'  },
  { emoji: '🌍',  top: '48%', left: '23%', size: 22, delay: '2.5s', dur: '14s'  },
]

const PAIN_POINTS = [
  'Pasajeros en grupos de WhatsApp',
  'Pagos sin registrar por pasajero',
  'Listas de viajes en Excel',
  'Depósitos sin controlar',
  'Costos del viaje desorganizados',
]

const STATS = [
  { value: '100+',  label: 'Agencias activas' },
  { value: '2,000+', label: 'Viajes gestionados' },
  { value: '5×', label: 'Más rápido que Excel' },
]

const NOTIFS = [
  { text: 'Cancún Dic — Confirmado',      sub: '24 pasajeros',    color: '#34d399', delay: '0s',   pos: 'Top' },
  { text: 'Nuevo pasajero — Ana López',   sub: 'hace 3 min',      color: '#38bdf8', delay: '1.8s', pos: 'Mid' },
  { text: 'Pago registrado — $3,500',     sub: 'Transferencia',   color: '#a78bfa', delay: '3.4s', pos: 'Bot' },
]

// ── Mock UIs ─────────────────────────────────────────────────────────────────

function TripListMock() {
  const trips = [
    { dest: 'Cancún', fecha: '12 Dic 2026', pax: 24, slots: 30, estado: 'confirmado', color: '#34d399', pct: 78 },
    { dest: 'Los Cabos', fecha: '8 Ene 2027', pax: 12, slots: 25, estado: 'borrador', color: '#fb923c', pct: 45 },
    { dest: 'Cuba', fecha: '22 Feb 2027', pax: 6, slots: 20, estado: 'borrador', color: '#38bdf8', pct: 28 },
  ]
  return (
    <div className={styles.tripListMock}>
      <div className={styles.mockHead}>
        <span className={styles.mockTitle}>Mis viajes</span>
        <span className={styles.mockBadge}>3 activos</span>
      </div>
      {trips.map((t, i) => (
        <div key={i} className={styles.tripMockRow}>
          <div className={styles.tripMockIcon}>✈️</div>
          <div className={styles.tripMockInfo}>
            <span className={styles.tripMockDest}>{t.dest}</span>
            <span className={styles.tripMockFecha}>{t.fecha}</span>
            <div className={styles.tripMockBar}>
              <div className={styles.tripMockBarFill} style={{ width: `${t.pct}%`, background: t.color }} />
            </div>
          </div>
          <div className={styles.tripMockRight}>
            <span className={styles.tripMockPax}>{t.pax}/{t.slots}</span>
            <span className={styles.tripMockEstado} style={{ color: t.color, background: t.color + '18' }}>{t.estado}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PaxPayMock() {
  const pax = [
    { name: 'María García',    pagado: 7000, total: 8500, pct: 82 },
    { name: 'Carlos Ramírez',  pagado: 4000, total: 8500, pct: 47 },
    { name: 'Ana López',       pagado: 8500, total: 8500, pct: 100 },
    { name: 'José Hernández',  pagado: 2000, total: 8500, pct: 24 },
  ]
  return (
    <div className={styles.paxPayMock}>
      <div className={styles.mockHead}>
        <span className={styles.mockTitle}>Pasajeros — Cancún Dic</span>
        <span className={styles.mockBadge}>24 pax</span>
      </div>
      {pax.map((p, i) => (
        <div key={i} className={styles.paxPayRow}>
          <div className={styles.paxPayAvatar}>{p.name[0]}</div>
          <div className={styles.paxPayInfo}>
            <span className={styles.paxPayName}>{p.name}</span>
            <div className={styles.paxPayBarWrap}>
              <div className={styles.paxPayBar}>
                <div
                  className={styles.paxPayFill}
                  style={{ width: `${p.pct}%`, background: p.pct === 100 ? '#34d399' : '#7c6af7' }}
                />
              </div>
              <span className={styles.paxPayPct}>{p.pct}%</span>
            </div>
          </div>
          <span className={styles.paxPayAmt} style={{ color: p.pct === 100 ? '#34d399' : '#ea580c' }}>
            ${(p.pagado / 1000).toFixed(0)}k
          </span>
        </div>
      ))}
    </div>
  )
}

function ChatMock() {
  const msgs = [
    { out: false, text: '¿Cuándo salen para Cancún?', time: '10:21' },
    { out: true,  text: 'Salimos el 12 de Diciembre. ¿Te apuntas?', time: '10:22' },
    { out: false, text: 'Sí! ¿Cuánto es el precio por persona?', time: '10:23' },
    { out: true,  text: '$8,500 por persona todo incluido 🌴✈️', time: '10:24' },
    { out: false, text: '¡Me interesa! ¿Cómo aparto mi lugar?', time: '10:25' },
  ]
  return (
    <div className={styles.chatMock}>
      <div className={styles.chatHead}>
        <div className={styles.chatAvatar}>CG</div>
        <div>
          <div className={styles.chatName}>Carlos González</div>
          <div className={styles.chatSub}>● En línea · WhatsApp</div>
        </div>
        <div className={styles.chatWaBadge}>WA</div>
      </div>
      <div className={styles.chatMsgs}>
        {msgs.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${m.out ? styles.bubbleOut : styles.bubbleIn}`}>
            <span className={styles.bubbleText}>{m.text}</span>
            <span className={styles.bubbleTime}>{m.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalMock() {
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const cells = [
    null, 1, 2, 3, 4, 5, 6,
    7, 8, 9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, null, null, null, null,
  ]
  const events = {
    8:  { name: '✈ Cancún — Salida', color: '#2563eb' },
    15: { name: '✈ Cuba — Salida',   color: '#7c6af7' },
    22: { name: '✈ Cabos — Regreso', color: '#0ea5e9' },
  }
  return (
    <div className={styles.calMock}>
      <div className={styles.calTop}>
        <span className={styles.calMonth}>Diciembre 2026</span>
        <div className={styles.calNav}>
          <button className={styles.calBtn}>‹</button>
          <button className={styles.calBtn}>›</button>
        </div>
      </div>
      <div className={styles.calGrid}>
        {days.map(d => <div key={d} className={styles.calDayName}>{d}</div>)}
        {cells.map((n, i) => (
          <div key={i} className={`${styles.calCell} ${n === 8 ? styles.calToday : ''}`}>
            {n && <span className={styles.calNum}>{n}</span>}
            {n && events[n] && (
              <div className={styles.calEvt} style={{ color: events[n].color, background: events[n].color + '18', borderColor: events[n].color + '40' }}>
                {events[n].name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function FinancialMock() {
  return (
    <div className={styles.financialMock}>
      <div className={styles.mockHead}>
        <span className={styles.mockTitle}>Resumen financiero</span>
        <span className={styles.mockBadge}>Cancún Dic</span>
      </div>
      <div className={styles.finStats}>
        <div className={styles.finStat}>
          <span className={styles.finVal} style={{ color: '#2B6FD4' }}>$204,000</span>
          <span className={styles.finLbl}>Ingresos esperados</span>
        </div>
        <div className={styles.finStat}>
          <span className={styles.finVal} style={{ color: '#34d399' }}>$159,000</span>
          <span className={styles.finLbl}>Cobrado</span>
        </div>
        <div className={styles.finStat}>
          <span className={styles.finVal} style={{ color: '#ea580c' }}>$45,000</span>
          <span className={styles.finLbl}>Pendiente</span>
        </div>
        <div className={styles.finStat}>
          <span className={styles.finVal} style={{ color: '#a78bfa' }}>$78,000</span>
          <span className={styles.finLbl}>Gastos del viaje</span>
        </div>
      </div>
      <div className={styles.finBarWrap}>
        <div className={styles.finBar}>
          <div className={styles.finBarCobrado} style={{ width: '78%' }} />
          <div className={styles.finBarPend} style={{ width: '22%' }} />
        </div>
        <div className={styles.finBarLabels}>
          <span style={{ color: '#34d399', fontSize: 11 }}>Cobrado 78%</span>
          <span style={{ color: '#ea580c', fontSize: 11 }}>Pendiente 22%</span>
        </div>
      </div>
      <div className={styles.finUtilidad}>
        <span>Utilidad estimada</span>
        <span className={styles.finUtilidadVal}>$81,000</span>
      </div>
    </div>
  )
}

// ── Feature spotlights ────────────────────────────────────────────────────────
const FEATURES = [
  {
    label: 'Viajes grupales',
    title: 'Todos tus viajes en un solo lugar.',
    desc: 'Crea viajes con destino, fechas, precio por persona y cupo disponible. Visualiza el estado de cada uno al instante.',
    bullets: ['Destino, fechas y cupos por viaje', 'Estados: borrador, confirmado, completado', 'Calendario de salidas y regresos'],
    color: '#2B6FD4',
    Mock: TripListMock,
    reverse: false,
  },
  {
    label: 'Control de pagos',
    title: 'Sabe quién debe y cuánto, al instante.',
    desc: 'Registra abonos y pagos por pasajero. Ve en barras de progreso cuánto ha pagado cada uno y cuánto le falta.',
    bullets: ['Pagos individuales por pasajero', 'Barra de progreso por cliente', 'Historial de pagos con método y fecha'],
    color: '#7c6af7',
    Mock: PaxPayMock,
    reverse: true,
  },
  {
    label: 'WhatsApp CRM',
    title: 'Atiende a tus viajeros desde el CRM.',
    desc: 'Conecta tu WhatsApp Business y responde cotizaciones de viajes directamente desde Elixe. Sin cambiar de app.',
    bullets: ['Recibe y responde mensajes en el CRM', 'Crea pasajeros desde el chat', 'Historial completo por cliente'],
    color: '#34d399',
    Mock: ChatMock,
    reverse: false,
  },
  {
    label: 'Calendario',
    title: 'Planifica sin conflictos de fechas.',
    desc: 'Visualiza todas las salidas y regresos en un calendario mensual. Detecta conflictos y organiza tu temporada.',
    bullets: ['Salidas y regresos en el calendario', 'Código de colores por destino', 'Navega fácil por mes y semana'],
    color: '#0ea5e9',
    Mock: CalMock,
    reverse: true,
  },
  {
    label: 'Gastos e ingresos',
    title: 'Conoce la utilidad real de cada viaje.',
    desc: 'Registra los gastos del viaje (autobús, hotel, guía) y contrasta con los ingresos. Ve tu utilidad en tiempo real.',
    bullets: ['Gastos por viaje (proveedores, logística)', 'Cobrado vs. pendiente por pasajero', 'Utilidad estimada en tiempo real'],
    color: '#a78bfa',
    Mock: FinancialMock,
    reverse: false,
  },
]

const STEPS = [
  { num: '01', icon: '🚀', title: 'Crea tu cuenta gratis', desc: 'Registro en menos de 2 minutos. Sin tarjeta. Selecciona "Agencia de viajes" y configura tu empresa.' },
  { num: '02', icon: '✈️', title: 'Crea tu primer viaje', desc: 'Agrega destino, fechas, precio por persona y cupos disponibles. Listo para recibir pasajeros.' },
  { num: '03', icon: '👥', title: 'Agrega pasajeros', desc: 'Busca o crea clientes como pasajeros. Registra sus abonos y lleva su estado de pago individual.' },
  { num: '04', icon: '💰', title: 'Cobra y crece', desc: 'Controla gastos del viaje, calcula tu utilidad y usa WhatsApp para atraer más viajeros.' },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function ViajesLanding() {
  const navigate  = useNavigate()
  const { theme } = useSettings()

  const goRegister = () => navigate('/login?industry=travel')

  return (
    <div className={styles.page}>
      {/* ── Navbar ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={theme === 'dark' ? logoWhite : logoFull} alt="Elixe" className={styles.navLogoImg} />
          <span className={styles.navBadge}>viajes</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#features">Características</a>
          <a href="#how">Cómo funciona</a>
          <a href="#pricing">Precios</a>
          <a onClick={() => navigate('/viajes/market')} style={{ cursor: 'pointer' }}>Marketplace</a>
        </div>
        <div className={styles.navActions}>
          <button className={styles.navLogin} onClick={() => navigate('/login')}>Acceder</button>
          <button className={styles.navCta} onClick={goRegister}>Comenzar gratis — 5 días</button>
        </div>
      </nav>

      {/* ── Dos caminos: agencia o viajero ── */}
      <section className={styles.pathsSection}>
        <div className={styles.pathsInner}>
          <button type="button" className={styles.pathCard} style={{ '--path': '#2B6FD4' }} onClick={goRegister}>
            <div className={styles.pathBeachBg} />
            <div className={styles.pathScrim} />
            <div className={styles.pathIcon}>🏢</div>
            <span className={styles.pathTag}>Para agencias</span>
            <h3 className={styles.pathTitle}>Publica y gestiona tus viajes gratis</h3>
            <p className={styles.pathDesc}>
              Sube tus viajes grupales al marketplace, controla pasajeros y pagos,
              y consigue clientes nuevos sin costo extra.
            </p>
            <span className={styles.pathCta}>Comenzar gratis →</span>
          </button>

          <button type="button" className={styles.pathCard} style={{ '--path': '#ea580c' }} onClick={() => navigate('/viajes/market')}>
            <div className={styles.pathBeachBg} />
            <div className={styles.pathScrim} />
            <div className={styles.pathIcon}>🧳</div>
            <span className={styles.pathTag}>Para viajeros</span>
            <h3 className={styles.pathTitle}>Encuentra tu próximo viaje grupal</h3>
            <p className={styles.pathDesc}>
              Explora destinos, fechas y precios publicados por agencias.
              Contacta directo por WhatsApp o mensaje, sin intermediarios.
            </p>
            <span className={styles.pathCta}>Ver viajes disponibles →</span>
          </button>
        </div>
      </section>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.gridBg} />
        <div className={styles.heroBgGrad} />
        {BG_ICONS.map((ic, i) => (
          <div key={i} className={styles.bgIcon} style={{ top: ic.top, left: ic.left, fontSize: ic.size, animationDelay: ic.delay, animationDuration: ic.dur }}>
            {ic.emoji}
          </div>
        ))}
        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />

        {/* Left top */}
        <div className={styles.contentTop}>
          <div className={styles.badge}>
            <span className={styles.dot} />
            Para agencias de viajes y tour operadores
          </div>
          <h1 className={styles.heroTitle}>
            Organiza tus viajes grupales,<br />
            <span className={styles.heroGrad}>cobra y crece sin caos.</span>
          </h1>
          <p className={styles.heroProfessions}>
            Ideal para <strong>Agencias de viajes</strong>, <strong>Tour operadores</strong>,{' '}
            <strong>Grupos escolares</strong> y <strong>Viajes religiosos</strong>.
          </p>
          <p className={styles.heroSub}>
            Controla pasajeros, abonos, gastos y reservaciones desde un solo lugar.
            Deja los grupos de WhatsApp y el Excel atrás.
          </p>
        </div>

        {/* Left bottom */}
        <div className={styles.contentBot}>
          <div className={styles.painPoints}>
            <p className={styles.painTitle}>¿Te pasa esto?</p>
            <ul className={styles.painList}>
              {PAIN_POINTS.map(p => (
                <li key={p} className={styles.painItem}><span className={styles.painX}>❌</span> {p}</li>
              ))}
            </ul>
            <p className={styles.painCta}>Elixe Viajes centraliza todo en una sola plataforma.</p>
          </div>

          <div className={styles.heroBtns}>
            <button className={styles.btnPrimary} onClick={goRegister}>Comenzar 5 días gratis →</button>
            <button className={styles.btnSecondary} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver características
            </button>
          </div>
          <p className={styles.trialNote}>Sin tarjeta de crédito · Cancela cuando quieras</p>

          <div className={styles.stats}>
            {STATS.map(s => (
              <div key={s.value} className={styles.stat}>
                <span className={styles.statVal}>{s.value}</span>
                <span className={styles.statLbl}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right mockup */}
        <div className={styles.mockupWrap}>
          {NOTIFS.map((n, i) => (
            <div key={i} className={`${styles.notif} ${styles['notif' + n.pos]}`} style={{ animationDelay: n.delay }}>
              <span className={styles.notifDot} style={{ background: n.color }} />
              <div className={styles.notifContent}>
                <span className={styles.notifText}>{n.text}</span>
                <span className={styles.notifSub}>{n.sub}</span>
              </div>
            </div>
          ))}
          <div className={styles.device}>
            <div className={styles.deviceBar}>
              <div className={styles.dots}><span /><span /><span /></div>
              <span className={styles.deviceTitle}>elixe.mx/app/viajes</span>
              <div className={styles.devicePill}>En vivo</div>
            </div>
            <div className={styles.deviceContent}>
              <TripListMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Características</span>
          <h2 className={styles.sectionTitle}>
            Las herramientas que tu agencia<br />de viajes necesita.
          </h2>
          <p className={styles.sectionSub}>
            Sin hojas de cálculo, sin grupos de WhatsApp caóticos, sin clientes perdidos.
            Todo centralizado en Elixe Viajes.
          </p>
        </div>

        <div className={styles.spotlights}>
          {FEATURES.map(f => (
            <div key={f.label} className={`${styles.spotlight} ${f.reverse ? styles.reverse : ''}`} style={{ '--feat': f.color }}>
              <div className={styles.spotText}>
                <span className={styles.spotLabel}>{f.label}</span>
                <h3 className={styles.spotTitle}>{f.title}</h3>
                <p className={styles.spotDesc}>{f.desc}</p>
                <ul className={styles.bullets}>
                  {f.bullets.map(b => (
                    <li key={b} className={styles.bullet}>
                      <span className={styles.bulletDot} style={{ background: f.color }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.spotMock}>
                <div className={styles.spotMockCard}><f.Mock /></div>
                <div className={styles.spotGlow} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.howSection} id="how">
        <div className={styles.howInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Cómo funciona</span>
            <h2 className={styles.sectionTitle}>
              De cero a tu primer viaje<br />en minutos.
            </h2>
            <p className={styles.sectionSub}>
              Elixe te acompaña en cada etapa: desde el primer mensaje de un cliente hasta el viaje completado.
            </p>
          </div>

          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={s.num} className={styles.step}>
                <div className={styles.stepIconWrap}>
                  <span className={styles.stepIcon}>{s.icon}</span>
                  <span className={styles.stepNum}>{s.num}</span>
                </div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className={styles.stepArrow}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.howCta}>
            <button className={styles.btnPrimary} onClick={goRegister}>Crear mi cuenta →</button>
            <p className={styles.trialNote}>Cuenta gratuita · Sin tarjeta · Configura en 10 min</p>
          </div>
        </div>
      </section>

      {/* ── Pricing (shared) ── */}
      <div id="pricing">
        <Pricing />
      </div>

      {/* ── Bottom CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaGlow} />
          <span className={styles.sectionLabel}>¿Listo para organizar mejor?</span>
          <h2 className={styles.ctaTitle}>
            Tu agencia de viajes merece<br />una herramienta pro.
          </h2>
          <p className={styles.ctaSub}>
            Crea tu cuenta sin costo. Elige el plan que mejor se adapte y cancela cuando quieras.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.btnPrimary} onClick={goRegister}>Crear cuenta gratis</button>
          </div>
          <p className={styles.ctaHint}>+100 agencias ya usan Elixe en México</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
