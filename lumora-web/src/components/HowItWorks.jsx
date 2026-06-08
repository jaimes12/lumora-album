import styles from './HowItWorks.module.css'
import { useState } from 'react'
import RegisterModal from './RegisterModal'

const STEPS = [
  {
    num: '01',
    icon: '🚀',
    title: 'Crea tu cuenta gratis',
    desc: 'Registro en menos de 2 minutos. Sin tarjeta de crédito. Configura el nombre de tu empresa y listo.',
  },
  {
    num: '02',
    icon: '📋',
    title: 'Agrega clientes y eventos',
    desc: 'Importa tus contactos o agrégalos uno a uno. Crea eventos con fecha, venue, tipo y presupuesto.',
  },
  {
    num: '03',
    icon: '💬',
    title: 'Conecta tu WhatsApp',
    desc: 'Vincula tu número en minutos. Todos los mensajes llegan al CRM y los asignas a tu equipo.',
  },
  {
    num: '04',
    icon: '💰',
    title: 'Cotiza, cobra y crece',
    desc: 'Genera cotizaciones profesionales, recibe firma digital y lleva el control de todos tus pagos.',
  },
]

export default function HowItWorks() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      <section className={styles.section} id="how">
        <div className={styles.inner}>
          <div className={styles.header}>
            <span className={styles.label}>Cómo funciona</span>
            <h2 className={styles.title}>
              De cero a tu primer evento<br />en minutos.
            </h2>
            <p className={styles.sub}>
              Elixe te acompaña en cada etapa: desde el primer contacto hasta
              el evento exitoso y la última factura.
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
                  <div className={styles.arrow}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.cta}>
            <button className={styles.ctaBtn} onClick={() => setShowRegister(true)}>
              Crear mi cuenta →
            </button>
            <p className={styles.ctaHint}>Cuenta gratuita · Sin tarjeta · Configura en 10 min</p>
          </div>
        </div>
      </section>
    </>
  )
}
