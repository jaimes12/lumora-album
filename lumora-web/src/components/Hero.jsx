import styles from './Hero.module.css'
import { useState } from 'react'
import RegisterModal from './RegisterModal'
import heroVideo from '../assets/elixe_landing.mp4'

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
  { value: '200+',  label: 'Organizadores activos' },
  { value: '4,000+', label: 'Eventos gestionados' },
  { value: '3×',    label: 'Más rápido que Excel' },
]

const NOTIFS = [
  { text: 'Boda García — Confirmada',      sub: 'hace 2 min',  color: '#34d399', delay: '0s',   pos: 'top' },
  { text: 'Nuevo mensaje de Ana López',    sub: 'WhatsApp',    color: '#38bdf8', delay: '1.8s', pos: 'mid' },
  { text: 'Pago registrado — $5,000',      sub: 'Transferencia', color: '#a78bfa', delay: '3.4s', pos: 'bot' },
]

const IcoDot = ({ color }) => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
)

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

        {/* ── Left top: badge + title + sub ── */}
        <div className={styles.contentTop}>
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
        </div>

        {/* ── Left bottom: pain points + CTA + stats ── */}
        <div className={styles.contentBot}>
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
              Comenzar 5 días gratis →
            </button>
            <button className={styles.btnSecondary} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver demo en vivo
            </button>
          </div>
          <p className={styles.trialNote}>Sin tarjeta de crédito · Cancela cuando quieras</p>

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
              <span className={styles.deviceTitle}>elixe.mx</span>
              <div className={styles.devicePill}>En vivo</div>
            </div>
            <video
              className={styles.deviceVideo}
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </section>
    </>
  )
}
