import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import styles from './Navbar.module.css'
import logoFull  from '../assets/logo_elixe.jpeg'
import logoWhite from '../assets/logo_white_elixe.jpeg'
import RegisterModal from './RegisterModal'

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

export default function Navbar() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useSettings()
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
          <button className={styles.themeBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className={styles.btnLogin} onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
          <button className={styles.btnCta} onClick={() => setShowRegister(true)}>
            Crear cuenta gratis →
          </button>
        </div>
      </nav>
    </>
  )
}
