import styles from './Hero.module.css'
import { useState } from 'react'
import RegisterModal from './RegisterModal'

const BG_ICONS = [
  { emoji: '💍', top: '7%',  left: '4%',  size: 32, delay: '0s',   dur: '9s'  },
  { emoji: '🌸', top: '14%', left: '87%', size: 28, delay: '1.4s', dur: '11s' },
  { emoji: '🎂', top: '44%', left: '2%',  size: 26, delay: '0.6s', dur: '10s' },
  { emoji: '✨', top: '22%', left: '93%', size: 20, delay: '2.1s', dur: '7s'  },
  { emoji: '🎊', top: '72%', left: '6%',  size: 28, delay: '1.9s', dur: '12s' },
  { emoji: '🌹', top: '82%', left: '91%', size: 24, delay: '0.9s', dur: '9s'  },
  { emoji: '🎈', top: '58%', left: '96%', size: 22, delay: '3.2s', dur: '13s' },
  { emoji: '🥂', top: '88%', left: '18%', size: 26, delay: '1.6s', dur: '8s'  },
  { emoji: '🎵', top: '11%', left: '48%', size: 18, delay: '2.7s', dur: '10s' },
  { emoji: '💐', top: '63%', left: '52%', size: 22, delay: '0.4s', dur: '9s'  },
  { emoji: '🎀', top: '33%', left: '80%', size: 20, delay: '1.1s', dur: '11s' },
  { emoji: '🕊️', top: '50%', left: '22%', size: 24, delay: '2.4s', dur: '14s' },
  { emoji: '⭐', top: '76%', left: '70%', size: 18, delay: '0.7s', dur: '8s'  },
  { emoji: '🎶', top: '28%', left: '10%', size: 20, delay: '3.5s', dur: '11s' },
]

const PAIN_POINTS = [
  'Clientes perdidos en WhatsApp',
  'Anticipos sin registrar',
  'Eventos en Excel',
  'Proveedores en diferentes chats',
  'Pagos pendientes olvidados',
]

const STATS = [
  { value: '2,400+', label: 'Eventos gestionados' },
  { value: '98%',   label: 'Satisfacción' },
  { value: '3×',    label: 'Más rápido que Excel' },
]

const NOTIFS = [
  { text: 'Boda García — Confirmada',      sub: 'hace 2 min',  color: '#34d399', delay: '0s',   pos: 'top' },
  { text: 'Nuevo mensaje de Ana López',    sub: 'WhatsApp',    color: '#38bdf8', delay: '1.8s', pos: 'mid' },
  { text: 'Pago registrado — $5,000',      sub: 'Transferencia', color: '#a78bfa', delay: '3.4s', pos: 'bot' },
]

/* Icons */
const IcoCalendar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcoPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IcoGuests = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IcoChat = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IcoDot = ({ color }) => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
)

/* Event detail mock */
function EventDetailMock() {
  return (
    <div className={styles.evtMock}>
      {/* Event header */}
      <div className={styles.evtHeader}>
        <div className={styles.evtHeaderLeft}>
          <div className={styles.evtEmoji}>🌸</div>
          <div>
            <div className={styles.evtName}>XV Años Naomi</div>
            <div className={styles.evtMeta}>
              <span className={styles.evtMetaItem}><IcoCalendar /> 13 Dic 2026</span>
              <span className={styles.evtMetaItem}><IcoPin /> Salón Real</span>
              <span className={styles.evtMetaItem}><IcoGuests /> 150 invitados</span>
            </div>
          </div>
        </div>
        <span className={styles.evtTypePill}>XV Años</span>
      </div>

      <div className={styles.evtBody}>
        {/* Left column */}
        <div className={styles.evtCol}>
          {/* Finances */}
          <div className={styles.evtCard}>
            <div className={styles.evtCardLabel}>Resumen financiero</div>
            <div className={styles.finRow}>
              <div className={styles.finItem}>
                <span className={styles.finItemLabel}>Total</span>
                <span className={styles.finItemVal}>$20,000</span>
              </div>
              <div className={styles.finItem}>
                <span className={styles.finItemLabel}>Abonado</span>
                <span className={styles.finItemVal} style={{ color: '#34d399' }}>$5,000</span>
              </div>
              <div className={styles.finItem}>
                <span className={styles.finItemLabel}>Por liquidar</span>
                <span className={styles.finItemVal} style={{ color: '#fb923c' }}>$15,000</span>
              </div>
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '25%' }} />
              </div>
              <span className={styles.progressLabel}>25% cobrado</span>
            </div>
            <div className={styles.paymentRow}>
              <div>
                <div className={styles.paymentName}>Anticipo</div>
                <div className={styles.paymentMeta}>06 Jun · Transferencia</div>
              </div>
              <span className={styles.paymentAmt}>+$5,000</span>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.evtCard}>
            <div className={styles.evtCardLabel}>Notas del evento</div>
            <p className={styles.notesText}>3 mesas de 50 sillas, todo rosa. Arco de flores en entrada.</p>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.evtCol}>
          {/* Client */}
          <div className={styles.evtCard}>
            <div className={styles.evtCardLabel}>Cliente</div>
            <div className={styles.clientRow}>
              <div className={styles.clientAvatar}>N</div>
              <div className={styles.clientInfo}>
                <span className={styles.clientName}>Naomi López</span>
                <span className={styles.clientEmail}>naomi@mail.com</span>
              </div>
              <button className={styles.chatBtn}><IcoChat /></button>
            </div>
          </div>

          {/* Providers */}
          <div className={styles.evtCard}>
            <div className={styles.evtCardLabel}>Proveedores</div>
            {[
              { name: 'Flores Cristal', role: 'Decoración', color: '#f472b6' },
              { name: 'Foto Estudio MX', role: 'Fotografía', color: '#38bdf8' },
              { name: 'DJ Kevin Sound', role: 'Entretenimiento', color: '#a78bfa' },
            ].map(p => (
              <div key={p.name} className={styles.provRow}>
                <IcoDot color={p.color} />
                <div className={styles.provInfo}>
                  <span className={styles.provName}>{p.name}</span>
                  <span className={styles.provRole}>{p.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}

      <section className={styles.hero}>
        <div className={styles.gridBg} />
        <div className={styles.heroBgGrad} />
        {BG_ICONS.map((ic, i) => (
          <div
            key={i}
            className={styles.bgIcon}
            style={{
              top: ic.top, left: ic.left,
              fontSize: ic.size,
              animationDelay: ic.delay,
              animationDuration: ic.dur,
            }}
          >
            {ic.emoji}
          </div>
        ))}
        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />

        {/* ── Left: copy ── */}
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.dot} />
            Plataforma todo-en-uno para organizadores de eventos
          </div>

          <h1 className={styles.title}>
            El CRM para organizadores<br />
            <span className={styles.grad}>que reemplaza Excel y WhatsApp.</span>
          </h1>

          <p className={styles.professions}>
            Ideal para <strong>Wedding Planners</strong>, <strong>Salones</strong>,{' '}
            <strong>Fotógrafos</strong>, <strong>DJs</strong> y <strong>Banquetes</strong>.
          </p>

          <p className={styles.sub}>
            Controla clientes, pagos, proveedores y eventos desde un solo lugar.
            Organiza todo tu negocio en minutos.
          </p>

          <div className={styles.painPoints}>
            <p className={styles.painTitle}>¿Te pasa esto?</p>
            <ul className={styles.painList}>
              {PAIN_POINTS.map(p => (
                <li key={p} className={styles.painItem}>
                  <span className={styles.painX}>❌</span> {p}
                </li>
              ))}
            </ul>
            <p className={styles.painCta}>Elixe centraliza todo en una sola plataforma.</p>
          </div>

          <div className={styles.btns}>
            <button className={styles.btnPrimary} onClick={() => setShowRegister(true)}>
              Crear cuenta gratis →
            </button>
            <button className={styles.btnSecondary} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver demo en vivo
            </button>
          </div>

          <div className={styles.stats}>
            {STATS.map(s => (
              <div key={s.value} className={styles.stat}>
                <span className={styles.statVal}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: 3D mockup ── */}
        <div className={styles.mockupWrap}>
          {NOTIFS.map((n, i) => (
            <div
              key={i}
              className={`${styles.notif} ${styles['notif' + n.pos.charAt(0).toUpperCase() + n.pos.slice(1)]}`}
              style={{ animationDelay: n.delay }}
            >
              <IcoDot color={n.color} />
              <div className={styles.notifContent}>
                <span className={styles.notifText}>{n.text}</span>
                <span className={styles.notifSub}>{n.sub}</span>
              </div>
            </div>
          ))}

          <div className={styles.device}>
            <div className={styles.deviceBar}>
              <div className={styles.dots}>
                <span /><span /><span />
              </div>
              <span className={styles.deviceTitle}>Elixe — Detalle del evento</span>
              <div className={styles.devicePill}>En vivo</div>
            </div>
            <EventDetailMock />
          </div>
        </div>
      </section>
    </>
  )
}
