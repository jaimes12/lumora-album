import styles from './CTA.module.css'

export default function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.glow} />
        <span className={styles.label}>¿Tienes un evento pronto?</span>
        <h2 className={styles.title}>
          Guarda cada momento.
          <br />
          Para siempre.
        </h2>
        <p className={styles.sub}>
          Crea tu álbum en menos de un minuto. Sin tarjeta de crédito.
        </p>
        <div className={styles.btns}>
          <button className={styles.btnPrimary}>
            Crear álbum gratis
          </button>
          <button className={styles.btnSecondary}>Ver un ejemplo</button>
        </div>
      </div>
    </section>
  )
}
