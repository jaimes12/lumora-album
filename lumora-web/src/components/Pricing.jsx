import { useState, useEffect } from 'react'
import styles from './Pricing.module.css'
import RegisterModal from './RegisterModal'
import { getPublicPlans } from '../api/plansApi'

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const PLANS_FALLBACK = [
  {
    id: 'solo',
    name: 'Solo',
    price: 399,
    desc: 'Para fotógrafos, DJs, decoradores y coordinadores que trabajan solos.',
    color: '#2B6FD4',
    popular: false,
    features: [
      { text: '1 usuario',                      ok: true  },
      { text: '20 eventos activos',              ok: true  },
      { text: '200 clientes',                    ok: true  },
      { text: 'Calendario y tareas',             ok: true  },
      { text: 'Catálogo de productos',           ok: true  },
      { text: 'Directorio de proveedores',       ok: true  },
      { text: 'Cotizaciones (hasta 15/mes)',      ok: true  },
      { text: 'Contratos básicos',               ok: true  },
      { text: 'Historial de pagos',              ok: true  },
      { text: '2 GB almacenamiento',             ok: true  },
      { text: 'WhatsApp CRM',                    ok: false },
      { text: 'Pipeline de ventas',              ok: false },
      { text: 'Reportes y estadísticas',         ok: false },
    ],
  },
  {
    id: 'negocio',
    name: 'Negocio',
    price: 799,
    desc: 'Para negocios establecidos: wedding planners, salones y coordinadoras con equipo.',
    color: '#C9A255',
    popular: true,
    features: [
      { text: 'Hasta 3 usuarios',                ok: true  },
      { text: 'Eventos ilimitados',              ok: true  },
      { text: 'Clientes ilimitados',             ok: true  },
      { text: 'Todo lo del plan Solo',           ok: true  },
      { text: 'WhatsApp CRM',                    ok: true  },
      { text: 'Cotizaciones ilimitadas + PDF',   ok: true  },
      { text: 'Contratos con firma digital',     ok: true  },
      { text: 'Pipeline de ventas (Kanban)',     ok: true  },
      { text: 'Reportes e ingresos',             ok: true  },
      { text: 'Exportar datos Excel/PDF',        ok: true  },
      { text: '10 GB almacenamiento',            ok: true  },
      { text: 'Soporte prioritario (24h)',       ok: true  },
    ],
  },
  {
    id: 'agencia',
    name: 'Agencia',
    price: 1499,
    desc: 'Para agencias de eventos, salones grandes y equipos de 5 o más personas.',
    color: '#7c6af7',
    popular: false,
    features: [
      { text: 'Hasta 10 usuarios',               ok: true  },
      { text: 'Todo ilimitado',                  ok: true  },
      { text: 'Todo lo del plan Negocio',        ok: true  },
      { text: 'Roles y permisos por usuario',    ok: true  },
      { text: 'Reportes avanzados',              ok: true  },
      { text: 'Importación masiva (CSV)',        ok: true  },
      { text: 'API de integración',              ok: true  },
      { text: 'Plantillas personalizadas',       ok: true  },
      { text: '50 GB almacenamiento',            ok: true  },
      { text: 'Onboarding dedicado',             ok: true  },
      { text: 'Soporte 24/7 por WhatsApp',       ok: true  },
    ],
  },
]

export default function Pricing() {
  const [showRegister, setShowRegister] = useState(false)
  const [plans, setPlans] = useState(PLANS_FALLBACK)

  useEffect(() => {
    const PLAN_IDS = ['solo', 'negocio', 'agencia']
    getPublicPlans()
      .then(data => {
        if (!data?.length) return
        const byId = Object.fromEntries(data.map(p => [p.planId ?? p.id, {
          id: p.planId ?? p.id, name: p.name, price: p.price,
          desc: p.description ?? p.desc ?? '',
          color: p.color, popular: p.popular ?? false, features: p.features ?? [],
        }]))
        setPlans(PLAN_IDS.map(id => byId[id] ?? PLANS_FALLBACK.find(p => p.id === id)))
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      <section className={styles.section} id="pricing">
        <div className={styles.inner}>
          <div className={styles.header}>
            <span className={styles.label}>Precios</span>
            <h2 className={styles.title}>Elige el plan que<br />mejor te funcione.</h2>
            <p className={styles.sub}>
              Crea tu cuenta sin costo y elige un plan cuando estés listo.
              Sin contratos de permanencia.
            </p>
          </div>

          <div className={styles.grid}>
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`${styles.card} ${plan.popular ? styles.cardPopular : ''}`}
                style={{ '--plan-color': plan.color }}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>⭐ Más popular</div>
                )}

                <div className={styles.cardTop}>
                  <div className={styles.planName} style={{ color: plan.color }}>{plan.name}</div>
                  <p className={styles.planDesc}>{plan.desc}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.currency}>MXN$</span>
                    <span className={styles.price}>{plan.price.toLocaleString('es-MX')}</span>
                    <span className={styles.period}>/mes</span>
                  </div>
                </div>

                <ul className={styles.features}>
                  {(plan.features || []).map(f => (
                    <li key={f.text} className={`${styles.feature} ${!f.ok ? styles.featureLocked : ''}`}>
                      <span className={styles.featureIcon} style={f.ok ? { color: plan.color } : {}}>
                        {f.ok ? <CheckIcon /> : <LockIcon />}
                      </span>
                      {f.text}
                    </li>
                  ))}
                </ul>

                <button
                  className={`${styles.btn} ${plan.popular ? styles.btnPopular : ''}`}
                  style={plan.popular ? { background: plan.color } : { borderColor: plan.color, color: plan.color }}
                  onClick={() => setShowRegister(true)}
                >
                  Comenzar con {plan.name}
                </button>

                <div className={styles.cardGlow} />
              </div>
            ))}
          </div>

          <p className={styles.note}>
            🔒 Sin contratos · Cancela cuando quieras · Datos seguros en México
          </p>
        </div>
      </section>
    </>
  )
}
