import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>L</div>
            <span className={styles.logoText}>Lumora</span>
          </div>
          <p className={styles.tagline}>La plataforma para organizadores de eventos.</p>
        </div>
        <div className={styles.links}>
          <div className={styles.col}>
            <span className={styles.colTitle}>Producto</span>
            <a href="#">Características</a>
            <a href="#">Precios</a>
            <a href="#">Actualizaciones</a>
          </div>
          <div className={styles.col}>
            <span className={styles.colTitle}>Empresa</span>
            <a href="#">Nosotros</a>
            <a href="#">Blog</a>
            <a href="#">Contacto</a>
          </div>
          <div className={styles.col}>
            <span className={styles.colTitle}>Legal</span>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© 2026 Lumora. Hecho en México 🇲🇽</p>
      </div>
    </footer>
  )
}
