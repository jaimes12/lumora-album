import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import styles from './Navbar.module.css'
import logoFull  from '../assets/logo_elixe.jpeg'
import logoWhite from '../assets/logo_white_elixe.jpeg'
import RegisterModal from './RegisterModal'

export default function Navbar() {
  const navigate = useNavigate()
  const { theme } = useSettings()
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <img
            src={theme === 'dark' ? logoWhite : logoFull}
            alt="Elixe"
            className={styles.logoImg}
          />
        </div>
        <div className={styles.links}>
          <a href="#features">Características</a>
          <a href="#how">Cómo funciona</a>
          <a href="#pricing">Precios</a>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnLogin} onClick={() => navigate('/login')}>
            Acceder
          </button>
          <button className={styles.btnCta} onClick={() => setShowRegister(true)}>
            Comenzar gratis — 5 días
          </button>
        </div>
      </nav>
    </>
  )
}
