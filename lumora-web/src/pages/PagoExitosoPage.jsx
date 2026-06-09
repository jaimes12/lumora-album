import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { paymentsApi } from '../api/paymentsApi'
import { useSettings } from '../context/SettingsContext'
import styles from './PagoExitosoPage.module.css'
import logoFull  from '../assets/elixe-logo.png'
import logoWhite from '../assets/elixe-logo-white.png'

const PLAN_NAMES = { solo: 'Solo', negocio: 'Negocio', agencia: 'Agencia' }

export default function PagoExitosoPage() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const { user, updatePlan } = useAuth()
  const { theme } = useSettings()
  const [status, setStatus] = useState('verifying') // verifying | success | error

  useEffect(() => {
    const sessionId = params.get('session_id')
    if (!sessionId) { setStatus('error'); return }

    paymentsApi.verifySession(sessionId)
      .then(res => {
        updatePlan(res.plan)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const plan = PLAN_NAMES[user?.plan] ?? user?.plan ?? ''

  return (
    <div className={styles.page}>
      <img src={theme === 'dark' ? logoWhite : logoFull} alt="Elixe" className={styles.logo} />

      {status === 'verifying' && (
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p className={styles.msg}>Verificando tu pago…</p>
        </div>
      )}

      {status === 'success' && (
        <div className={styles.card}>
          <div className={styles.checkCircle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className={styles.title}>¡Pago exitoso!</h1>
          <p className={styles.sub}>Tu plan <strong>{plan}</strong> ya está activo.</p>
          <p className={styles.hint}>Ahora tienes acceso completo a todas las funciones de tu plan.</p>
          <button className={styles.btn} onClick={() => navigate('/app/dashboard')}>
            Ir al dashboard →
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.card}>
          <div className={styles.errorCircle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h1 className={styles.title}>Algo salió mal</h1>
          <p className={styles.sub}>No pudimos verificar tu pago. Si ya se realizó el cargo contáctanos.</p>
          <button className={styles.btn} onClick={() => navigate('/app/paquetes')}>
            Volver a planes
          </button>
        </div>
      )}
    </div>
  )
}
