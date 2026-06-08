import { useNavigate } from 'react-router-dom'
import styles from './PlanGate.module.css'
import { PLAN_NAMES } from '../config/planConfig'

const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

/**
 * PlanGate — full-page upgrade wall.
 *
 * Props:
 *  feature     string   — Human-readable feature name e.g. "WhatsApp CRM"
 *  requiredPlan string  — Plan id required e.g. "negocio"
 *  description string   — Explain what they're missing
 */
export default function PlanGate({ feature, requiredPlan = 'negocio', description }) {
  const navigate = useNavigate()
  const planName = PLAN_NAMES[requiredPlan] ?? requiredPlan

  return (
    <div className={styles.wall}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <LockIcon />
        </div>

        <div className={styles.planBadge}>Plan {planName}</div>

        <h2 className={styles.title}>{feature}</h2>

        <p className={styles.desc}>
          {description || `Esta función está disponible a partir del Plan ${planName}. Actualiza tu suscripción para desbloquearla.`}
        </p>

        <div className={styles.btns}>
          <button
            className={styles.btnUpgrade}
            onClick={() => navigate('/app/paquetes')}
          >
            Ver planes →
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * PlanGateModal — inline modal version (for limit warnings).
 * Shows when a user tries to create something but is at the limit.
 */
export function PlanGateModal({ feature, requiredPlan = 'negocio', description, onClose }) {
  const navigate = useNavigate()
  const planName = PLAN_NAMES[requiredPlan] ?? requiredPlan

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className={styles.modal}>
        <div className={styles.modalIcon}>
          <LockIcon />
        </div>

        <div className={styles.planBadge}>Plan {planName}</div>

        <h3 className={styles.modalTitle}>Límite alcanzado</h3>

        <p className={styles.modalDesc}>
          {description || `Actualiza al Plan ${planName} para continuar usando ${feature} sin límites.`}
        </p>

        <div className={styles.modalBtns}>
          <button
            className={styles.btnUpgrade}
            onClick={() => navigate('/app/paquetes')}
          >
            Ver planes →
          </button>
          <button className={styles.btnClose} onClick={onClose}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
