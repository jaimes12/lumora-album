import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>L</div>
        <span className={styles.logoText}>Lumora</span>
      </div>
      <div className={styles.links}>
        <a href="#features">Características</a>
        <a href="#how">Cómo funciona</a>
        <a href="#pricing">Precios</a>
      </div>
      <div className={styles.actions}>
        <button className={styles.btnLogin}>Iniciar sesión</button>
        <button className={styles.btnCta}>Empezar gratis →</button>
      </div>
    </nav>
  )
}
