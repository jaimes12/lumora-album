import { useState } from 'react'
import styles from './CTA.module.css'
import RegisterModal from './RegisterModal'

export default function CTA() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      <section className={styles.section}>
        <div className={styles.card}>
          <div className={styles.glow} />
          <div className={styles.glowBlue} />
          <span className={styles.label}>¿Listo para organizar mejor?</span>
          <h2 className={styles.title}>
            Tu negocio de eventos<br />
            merece una herramienta pro.
          </h2>
          <p className={styles.sub}>
            Crea tu cuenta sin costo. Elige el plan que mejor
            se adapte a tu negocio y cancela cuando quieras.
          </p>
          <div className={styles.btns}>
            <button className={styles.btnPrimary} onClick={() => setShowRegister(true)}>
              Crear cuenta gratis
            </button>
            <button className={styles.btnSecondary}>Hablar con ventas</button>
          </div>
          <p className={styles.hint}>+500 organizadores ya usan Elixe en México</p>
        </div>
      </section>
    </>
  )
}
