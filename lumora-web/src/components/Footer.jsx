import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>Lumora</span>
          </div>
          <p className={styles.tagline}>Guarda los momentos que importan.</p>
        </div>
        <div className={styles.links}>
          <span className={styles.col}>
            <a href="#">Características</a>
            <a href="#">Precios</a>
            <a href="#">Demo</a>
          </span>
          <span className={styles.col}>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Contacto</a>
          </span>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© 2026 Lumora. Hecho con cariño.</p>
      </div>
    </footer>
  )
}
