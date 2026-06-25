import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/apiClient'
import styles from './RegisterModal.module.css'

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function RegisterModal({ onClose }) {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [step,      setStep]      = useState('email')   // email | password | profile | login
  const [email,     setEmail]     = useState('')
  const [pass,      setPass]      = useState('')
  const [pass2,     setPass2]     = useState('')
  const [name,      setName]      = useState('')
  const [orgName,   setOrgName]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const handleEmail = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { exists } = await api.post('/api/auth/check-email', { email })
      setStep(exists ? 'login' : 'password')
    } catch (err) {
      const msg = err?.message ?? ''
      setError(msg && !msg.startsWith('HTTP') ? msg : 'Error al verificar el correo. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handlePassword = (e) => {
    e.preventDefault()
    setError('')
    if (pass.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (pass !== pass2)  { setError('Las contraseñas no coinciden.'); return }
    setStep('profile')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !orgName.trim()) { setError('Por favor completa todos los campos.'); return }
    setLoading(true)
    try {
      await register(orgName.trim(), name.trim(), email, pass)
      if (window.fbq) {
        fbq('track', 'CompleteRegistration', { content_name: 'Elixe', currency: 'MXN', value: 0 })
      }
      onClose()
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, pass)
      if (window.fbq) {
        fbq('track', 'Lead', { content_name: 'Elixe Login' })
      }
      onClose()
      navigate(user.plan === 'free' ? '/app/paquetes' : '/app/dashboard')
    } catch {
      setError('Contraseña incorrecta.')
    } finally {
      setLoading(false)
    }
  }

  const STEP_TITLE = {
    email:    'Comienza gratis',
    password: 'Crea tu contraseña',
    profile:  'Cuéntanos sobre ti',
    login:    'Bienvenido de vuelta',
  }

  const STEP_SUB = {
    email:    'Ingresa tu correo para comenzar.',
    password: 'Usa al menos 8 caracteres.',
    profile:  'Solo unos datos más y listo.',
    login:    `Iniciando sesión como ${email}`,
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{STEP_TITLE[step]}</h2>
            <p className={styles.sub}>{STEP_SUB[step]}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><XIcon /></button>
        </div>

        {/* Progress dots */}
        <div className={styles.dots}>
          {['email','password','profile'].map((s, i) => (
            <div key={s} className={`${styles.dot} ${
              (step === 'email' && i === 0) ||
              (step === 'password' && i <= 1) ||
              (step === 'profile' && i <= 2) ||
              (step === 'login' && i === 0) ? styles.dotActive : ''
            }`} />
          ))}
        </div>

        {/* Step: email */}
        {step === 'email' && (
          <form className={styles.form} onSubmit={handleEmail}>
            <div className={styles.field}>
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.btnSubmit} type="submit" disabled={loading}>
              {loading ? 'Verificando…' : 'Continuar →'}
            </button>
          </form>
        )}

        {/* Step: password (new user) */}
        {step === 'password' && (
          <form className={styles.form} onSubmit={handlePassword}>
            <div className={styles.field}>
              <label>Contraseña</label>
              <div className={styles.passWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  autoFocus
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Confirmar contraseña</label>
              <div className={styles.passWrap}>
                <input
                  type={showPass2 ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={pass2}
                  onChange={e => setPass2(e.target.value)}
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass2(p => !p)}>
                  <EyeIcon open={showPass2} />
                </button>
              </div>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formBtns}>
              <button type="button" className={styles.btnBack} onClick={() => { setStep('email'); setError('') }}>
                ← Atrás
              </button>
              <button className={styles.btnSubmit} type="submit">
                Siguiente →
              </button>
            </div>
          </form>
        )}

        {/* Step: profile (new user) */}
        {step === 'profile' && (
          <form className={styles.form} onSubmit={handleRegister}>
            <div className={styles.field}>
              <label>Tu nombre</label>
              <input
                type="text"
                placeholder="Ej: María González"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className={styles.field}>
              <label>Nombre de tu negocio</label>
              <input
                type="text"
                placeholder="Ej: Eventos Glamour"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formBtns}>
              <button type="button" className={styles.btnBack} onClick={() => { setStep('password'); setError('') }}>
                ← Atrás
              </button>
              <button className={styles.btnSubmit} type="submit" disabled={loading}>
                {loading ? 'Creando cuenta…' : 'Crear cuenta 🎉'}
              </button>
            </div>
          </form>
        )}

        {/* Step: login (existing user) */}
        {step === 'login' && (
          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.field}>
              <label>Contraseña</label>
              <div className={styles.passWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  autoFocus
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formBtns}>
              <button type="button" className={styles.btnBack} onClick={() => { setStep('email'); setPass(''); setError('') }}>
                ← Atrás
              </button>
              <button className={styles.btnSubmit} type="submit" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar →'}
              </button>
            </div>
          </form>
        )}

        <p className={styles.footer}>
          Al continuar aceptas nuestros <a href="#">Términos de servicio</a> y <a href="#">Política de privacidad</a>.
        </p>
      </div>
    </div>
  )
}
