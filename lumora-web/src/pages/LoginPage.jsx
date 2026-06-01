import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'
import logoFull from '../assets/lumora-logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [mode, setMode]     = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({ orgName: '', name: '', email: '', password: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.orgName, form.name, form.email, form.password)
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
        <img src={logoFull} alt="Lumora" className={styles.logo} />

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
                <input placeholder="Ej: Lumora Events" value={form.orgName} onChange={set('orgName')} required />
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
            <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={8} />
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
