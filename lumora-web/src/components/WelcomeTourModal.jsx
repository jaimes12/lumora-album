import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './WelcomeTourModal.module.css'

const PlaneIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
)

const STEPS = ['welcome', 'crear']

export default function WelcomeTourModal() {
  const navigate = useNavigate()
  const { completeOnboarding } = useAuth()
  const [step, setStep] = useState(0)

  const handleSkip = () => {
    completeOnboarding()
  }

  const handleCrearViaje = () => {
    completeOnboarding()
    navigate('/app/viajes', { state: { autoOpenNewTrip: true } })
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.iconWrap}><PlaneIcon /></div>

        <div className={styles.dots}>
          {STEPS.map((s, i) => (
            <div key={s} className={`${styles.dot} ${i <= step ? styles.dotActive : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className={styles.title}>¡Bienvenido a Elixe!</h2>
            <p className={styles.text}>
              Aquí organizas los viajes grupales de tu agencia: destinos, fechas, pasajeros,
              pagos y hasta tu propio marketplace público para conseguir clientes nuevos.
            </p>
            <p className={styles.text}>
              Vamos a crear tu primer viaje juntos, paso a paso.
            </p>
            <button className={styles.btnPrimary} onClick={() => setStep(1)}>
              Comenzar →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className={styles.title}>Crea tu primer viaje</h2>
            <p className={styles.text}>
              Un viaje agrupa el destino, las fechas, el precio por persona y los pasajeros
              que se van a inscribir. Da clic aquí para crear el tuyo — luego solo llenas los datos.
            </p>
            <button className={styles.btnPrimary} onClick={handleCrearViaje}>
              Da clic aquí para crear tu viaje →
            </button>
          </>
        )}

        <button type="button" className={styles.skipBtn} onClick={handleSkip}>
          Omitir intro
        </button>
      </div>
    </div>
  )
}
