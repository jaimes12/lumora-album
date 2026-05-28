import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>✦</span>
        <span className={styles.logoText}>Lumora</span>
      </div>
      <div className={styles.actions}>
        <a href="#features" className={styles.link}>Características</a>
        <a href="#how" className={styles.link}>Cómo funciona</a>
        <button className={styles.cta}>Crear álbum</button>
      </div>
    </nav>
  )
}
