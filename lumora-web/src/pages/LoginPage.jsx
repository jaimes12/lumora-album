import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import styles from './LoginPage.module.css'
import logoFull  from '../assets/logo_elixe.jpeg'
import logoWhite from '../assets/logo_white_elixe.jpeg'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const { theme } = useSettings()
  const industryParam = new URLSearchParams(location.search).get('industry') ?? 'events'
  const [mode, setMode]     = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({ orgName: '', name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.orgName, form.name, form.email, form.password, industryParam)
      }
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src={theme === 'dark' ? logoWhite : logoFull} alt="Elixe" className={styles.logo} />

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => { setMode('login'); setError('') }}>
            Iniciar sesión
          </button>
          <button className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`} onClick={() => { setMode('register'); setError('') }}>
            Registrarse
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className={styles.field}>
                <label>Nombre de la empresa</label>
                <input placeholder="Ej: Elixe Events" value={form.orgName} onChange={set('orgName')} required />
              </div>
              <div className={styles.field}>
                <label>Tu nombre</label>
                <input placeholder="Angel Jaimes" value={form.name} onChange={set('name')} required />
              </div>
            </>
          )}
          <div className={styles.field}>
            <label>Correo electrónico</label>
            <input type="email" placeholder="correo@empresa.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className={styles.field}>
            <label>Contraseña</label>
            <div className={styles.passWrap}>
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={8} />
              <button type="button" className={styles.passToggle} onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}>
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btnSubmit} type="submit" disabled={loading}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
          </button>
        </form>
      </div>
    </div>
  )
}
