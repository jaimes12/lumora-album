import styles from './CTA.module.css'

export default function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.glow} />
        <div className={styles.glowBlue} />
        <span className={styles.label}>¿Listo para organizar mejor?</span>
        <h2 className={styles.title}>
          Tu negocio de eventos
          <br />
          merece una herramienta pro.
        </h2>
        <p className={styles.sub}>
          14 días gratis, sin tarjeta de crédito.
          Configura en menos de 10 minutos.
        </p>
        <div className={styles.btns}>
          <button className={styles.btnPrimary}>Crear cuenta gratis</button>
          <button className={styles.btnSecondary}>Hablar con ventas</button>
        </div>
        <p className={styles.hint}>+500 organizadores ya usan Lumora en México</p>
      </div>
    </section>
  )
}
