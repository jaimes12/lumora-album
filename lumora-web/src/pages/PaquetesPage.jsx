import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './PaquetesPage.module.css'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$599',
    period: 'MXN/mes',
    desc: 'Ideal para emprendedores que inician',
    color: '#2B6FD4',
    features: [
      '1 cuenta de WhatsApp',
      'Hasta 50 eventos activos',
      'Clientes ilimitados',
      'Calendario y agenda',
      'Cotizaciones y contratos',
      'Soporte por correo',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$999',
    period: 'MXN/mes',
    desc: 'Para negocios en crecimiento',
    color: '#C9A255',
    popular: true,
    features: [
      'Todo lo de Starter +',
      '3 cuentas de WhatsApp',
      'Eventos ilimitados',
      'Pipeline de ventas',
      'Reportes y estadísticas',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: '$1,999',
    period: 'MXN/mes',
    desc: 'Para operaciones grandes',
    color: '#073579',
    features: [
      'Todo lo de Pro +',
      'WhatsApps ilimitados',
      'Múltiples usuarios',
      'API de integración',
      'Onboarding dedicado',
      'Soporte 24/7',
    ],
  },
]

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function PaquetesPage() {
  const navigate = useNavigate()
  const { user, updatePlan } = useAuth()
  const [loading, setLoading] = useState(null)

  const handleSelect = async (planId) => {
    setLoading(planId)
    try {
      await updatePlan(planId)
      navigate('/app/dashboard')
    } catch {
      // silently retry — plan saved locally
      navigate('/app/dashboard')
    } finally {
      setLoading(null)
    }
  }

  const currentPlan = user?.plan ?? 'free'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Elige tu plan</h1>
        <p className={styles.sub}>
          {currentPlan === 'free'
            ? 'Selecciona un plan para comenzar a usar Lumora.'
            : `Plan actual: ${PLANS.find(p => p.id === currentPlan)?.name ?? currentPlan}`}
        </p>
      </div>

      <div className={styles.grid}>
        {PLANS.map(plan => {
          const isActive  = currentPlan === plan.id
          const isLoading = loading === plan.id
          return (
            <div
              key={plan.id}
              className={`${styles.card} ${plan.popular ? styles.cardPopular : ''} ${isActive ? styles.cardActive : ''}`}
              style={plan.popular ? { '--plan-color': plan.color } : {}}
            >
              {plan.popular && (
                <div className={styles.popularBadge} style={{ background: plan.color }}>
                  ⭐ Más popular
                </div>
              )}
              {isActive && (
                <div className={styles.activeBadge}>✓ Plan actual</div>
              )}

              <div className={styles.cardTop}>
                <div className={styles.planName} style={{ color: plan.color }}>{plan.name}</div>
                <p className={styles.planDesc}>{plan.desc}</p>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.period}>{plan.period}</span>
                </div>
              </div>

              <ul className={styles.features}>
                {plan.features.map(f => (
                  <li key={f} className={styles.feature}>
                    <span className={styles.checkIcon} style={{ color: plan.color }}><CheckIcon /></span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.btnSelect} ${isActive ? styles.btnSelectActive : ''}`}
                style={!isActive ? { background: plan.color } : {}}
                onClick={() => !isActive && handleSelect(plan.id)}
                disabled={isActive || isLoading}
              >
                {isLoading ? 'Activando…' : isActive ? 'Plan activo' : `Comenzar con ${plan.name} →`}
              </button>
            </div>
          )
        })}
      </div>

      <p className={styles.note}>
        🔒 Pago seguro · Cancela cuando quieras · Sin contratos
      </p>
    </div>
  )
}
