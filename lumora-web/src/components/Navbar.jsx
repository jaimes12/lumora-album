import styles from './Navbar.module.css'
import logoFull from '../assets/elixe-logo.png'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <img src={logoFull} alt="Elixe" className={styles.logoImg} />
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
