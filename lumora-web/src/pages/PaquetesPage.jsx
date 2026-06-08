import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './PaquetesPage.module.css'

const PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: 399,
    period: 'MXN/mes',
    desc: 'Para fotógrafos, DJs, decoradores y coordinadores independientes',
    color: '#2B6FD4',
    features: [
      '1 usuario',
      '20 eventos activos',
      '200 clientes',
      'Calendario y tareas',
      'Catálogo de productos',
      'Cotizaciones (hasta 15/mes)',
      'Contratos básicos',
      'Historial de pagos',
      '2 GB almacenamiento',
      'Soporte por correo',
    ],
  },
  {
    id: 'negocio',
    name: 'Negocio',
    price: 799,
    period: 'MXN/mes',
    desc: 'Para negocios con equipo: wedding planners, salones de eventos',
    color: '#C9A255',
    popular: true,
    features: [
      'Hasta 3 usuarios',
      'Eventos y clientes ilimitados',
      'Todo lo del plan Solo',
      'WhatsApp CRM',
      'Cotizaciones ilimitadas + PDF',
      'Contratos con firma digital',
      'Pipeline de ventas (Kanban)',
      'Reportes e ingresos',
      'Exportar Excel / PDF',
      '10 GB almacenamiento',
      'Soporte prioritario (24h)',
    ],
  },
  {
    id: 'agencia',
    name: 'Agencia',
    price: 1499,
    period: 'MXN/mes',
    desc: 'Para agencias y salones grandes con operaciones a escala',
    color: '#7c6af7',
    features: [
      'Hasta 10 usuarios',
      'Todo ilimitado',
      'Todo lo del plan Negocio',
      'Roles y permisos por usuario',
      'Reportes avanzados',
      'Importación masiva (CSV)',
      'API de integración',
      'Plantillas personalizadas',
      '50 GB almacenamiento',
      'Onboarding dedicado',
      'Soporte 24/7 por WhatsApp',
    ],
  },
]

const HISTORIAL_MOCK = [
  { fecha: '28 May 2026', monto: 999, estado: 'Pagado', metodo: 'Visa •••• 4242' },
  { fecha: '28 Abr 2026', monto: 999, estado: 'Pagado', metodo: 'Visa •••• 4242' },
  { fecha: '28 Mar 2026', monto: 999, estado: 'Pagado', metodo: 'Visa •••• 4242' },
  { fecha: '28 Feb 2026', monto: 999, estado: 'Pagado', metodo: 'Visa •••• 4242' },
  { fecha: '28 Ene 2026', monto: 999, estado: 'Pagado', metodo: 'Visa •••• 4242' },
]

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function PaquetesPage() {
  const { user, updatePlan } = useAuth()
  const [loading,       setLoading]       = useState(null)
  const [showChangePlan, setShowChangePlan] = useState(false)

  const currentPlan = user?.plan ?? 'free'
  const activePlan  = PLANS.find(p => p.id === currentPlan)

  const handleSelect = async (planId) => {
    if (planId === currentPlan) return
    setLoading(planId)
    try {
      await updatePlan(planId)
      setShowChangePlan(false)
    } catch {}
    finally { setLoading(null) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Mi plan</h1>
          <p className={styles.subtitle}>Gestiona tu suscripción y pagos</p>
        </div>
      </div>

      {/* ── Plan actual ── */}
      {activePlan ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Plan actual</h2>
          <div className={styles.currentCard} style={{ '--plan-color': activePlan.color }}>
            <div className={styles.currentCardLeft}>
              <div className={styles.currentPlanBadge} style={{ background: activePlan.color }}>
                {activePlan.name}
              </div>
              <div className={styles.currentPlanDesc}>{activePlan.desc}</div>
              <div className={styles.currentPriceRow}>
                <span className={styles.currentPrice}>${activePlan.price.toLocaleString('es-MX')}</span>
                <span className={styles.currentPeriod}> MXN/mes</span>
              </div>
              <div className={styles.currentNextBill}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Próximo cargo: <strong>28 Jun 2026</strong>
              </div>
            </div>
            <div className={styles.currentCardRight}>
              <ul className={styles.currentFeatures}>
                {activePlan.features.map(f => (
                  <li key={f} className={styles.currentFeature}>
                    <span style={{ color: activePlan.color }}><CheckIcon /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={styles.btnChangePlan}
                onClick={() => setShowChangePlan(v => !v)}
              >
                {showChangePlan ? 'Ocultar planes' : 'Cambiar plan'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.noPlan}>
            <p>No tienes un plan activo. Elige uno para comenzar.</p>
            <button className={styles.btnChangePlan} onClick={() => setShowChangePlan(true)}>
              Ver planes
            </button>
          </div>
        </section>
      )}

      {/* ── Cambiar plan ── */}
      {(showChangePlan || currentPlan === 'free') && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {currentPlan === 'free' ? 'Elige tu plan' : 'Cambiar plan'}
          </h2>
          <div className={styles.plansGrid}>
            {PLANS.map(plan => {
              const isActive  = currentPlan === plan.id
              const isLoading = loading === plan.id
              return (
                <div
                  key={plan.id}
                  className={`${styles.planCard} ${isActive ? styles.planCardActive : ''} ${plan.popular ? styles.planCardPopular : ''}`}
                >
                  {plan.popular && !isActive && (
                    <div className={styles.popularBadge} style={{ background: plan.color }}>⭐ Más popular</div>
                  )}
                  {isActive && (
                    <div className={styles.activeBadge}>✓ Plan actual</div>
                  )}
                  <div className={styles.planCardName} style={{ color: plan.color }}>{plan.name}</div>
                  <p className={styles.planCardDesc}>{plan.desc}</p>
                  <div className={styles.planCardPrice}>
                    <span className={styles.planCardPriceNum}>${plan.price.toLocaleString('es-MX')}</span>
                    <span className={styles.planCardPricePer}> MXN/mes</span>
                  </div>
                  <ul className={styles.planCardFeatures}>
                    {plan.features.map(f => (
                      <li key={f} className={styles.planCardFeature}>
                        <span style={{ color: plan.color }}><CheckIcon /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`${styles.btnSelect} ${isActive ? styles.btnSelectActive : ''}`}
                    style={!isActive ? { background: plan.color } : {}}
                    onClick={() => handleSelect(plan.id)}
                    disabled={isActive || !!loading}
                  >
                    {isLoading ? 'Cambiando…' : isActive ? 'Plan actual' : `Cambiar a ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>
          <p className={styles.note}>🔒 Cancela cuando quieras · Sin contratos de permanencia</p>
        </section>
      )}

      {/* ── Historial de pagos ── */}
      {currentPlan !== 'free' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Historial de mensualidades</h2>
          <div className={styles.historialTable}>
            <div className={styles.historialHeader}>
              <span>Fecha</span>
              <span>Método</span>
              <span>Monto</span>
              <span>Estado</span>
            </div>
            {HISTORIAL_MOCK.map((row, i) => (
              <div key={i} className={styles.historialRow}>
                <span className={styles.histFecha}>{row.fecha}</span>
                <span className={styles.histMetodo}>{row.metodo}</span>
                <span className={styles.histMonto}>${row.monto.toLocaleString('es-MX')}</span>
                <span className={styles.histEstado}>
                  <span className={styles.estadoDot} />
                  {row.estado}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
