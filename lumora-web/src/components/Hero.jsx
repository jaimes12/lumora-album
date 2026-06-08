import styles from './Hero.module.css'
import { useState } from 'react'
import RegisterModal from './RegisterModal'

const STATS = [
  { value: '2,400+', label: 'Eventos gestionados' },
  { value: '98%', label: 'Satisfacción de clientes' },
  { value: '3x', label: 'Más rápido que Excel' },
]

const MOCK_EVENTS = [
  { name: 'Boda García & Ruiz', date: 'Jun 14', status: 'confirmed', color: '#34d399' },
  { name: 'Corporativo Telmex', date: 'Jun 18', status: 'pending', color: '#fb923c' },
  { name: 'XV Años Sofía', date: 'Jun 22', status: 'confirmed', color: '#34d399' },
  { name: 'Graduación ITESM', date: 'Jul 03', status: 'quote', color: '#7c6af7' },
]

export default function Hero() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
    {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
    <section className={styles.hero}>
      <div className={styles.glow} />
      <div className={styles.glowRight} />

      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.dot} />
          Plataforma todo-en-uno para organizadores
        </div>

        <h1 className={styles.title}>
          Organiza eventos
          <br />
          <span className={styles.titleGrad}>extraordinarios.</span>
        </h1>

        <p className={styles.sub}>
          CRM de clientes, proveedores, calendario, ventas y WhatsApp
          en un solo lugar. Deja de usar Excel y empieza a crecer.
        </p>

        <div className={styles.btns}>
          <button className={styles.btnPrimary} onClick={() => setShowRegister(true)}>
            Crear cuenta gratis
          </button>
          <button className={styles.btnSecondary}>
            Ver demo en vivo →
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

      <div className={styles.mockup}>
        <div className={styles.mockupHeader}>
          <div className={styles.mockupDots}>
            <span /><span /><span />
          </div>
          <span className={styles.mockupTitle}>Dashboard — Junio 2026</span>
        </div>

        <div className={styles.mockupBody}>
          <div className={styles.mockupSection}>
            <p className={styles.mockupLabel}>Próximos eventos</p>
            <div className={styles.eventList}>
              {MOCK_EVENTS.map(e => (
                <div key={e.name} className={styles.eventRow}>
                  <div className={styles.eventDot} style={{ background: e.color }} />
                  <div className={styles.eventInfo}>
                    <span className={styles.eventName}>{e.name}</span>
                    <span className={styles.eventDate}>{e.date}</span>
                  </div>
                  <span className={styles.eventBadge} style={{ color: e.color }}>
                    {e.status === 'confirmed' ? 'Confirmado' : e.status === 'pending' ? 'Pendiente' : 'Cotización'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mockupRow2}>
            <div className={styles.miniCard}>
              <span className={styles.miniCardLabel}>Ingresos este mes</span>
              <span className={styles.miniCardVal}>$284,500</span>
              <span className={styles.miniCardTrend}>↑ 12% vs mes anterior</span>
            </div>
            <div className={styles.miniCard}>
              <span className={styles.miniCardLabel}>Clientes activos</span>
              <span className={styles.miniCardVal}>47</span>
              <span className={styles.miniCardTrend}>+8 nuevos</span>
            </div>
          </div>

          <div className={styles.barChart}>
            <p className={styles.mockupLabel}>Ventas por semana</p>
            <div className={styles.bars}>
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className={styles.barWrap}>
                  <div className={styles.bar} style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
