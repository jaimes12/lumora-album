import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { paymentsApi } from '../api/paymentsApi'
import { getPublicPlans } from '../api/plansApi'
import { CURRENCY_RATES, CURRENCY_SYMBOLS } from '../data/eventosData'
import styles from './PaquetesPage.module.css'

const CURRENCY_OPTIONS = [
  { code: 'MXN', flag: '🇲🇽', label: 'MXN' },
  { code: 'USD', flag: '🇺🇸', label: 'USD' },
  { code: 'EUR', flag: '🇪🇺', label: 'EUR' },
]

function fmtPlanPrice(mxnPrice, currency) {
  const rate      = CURRENCY_RATES[currency]   ?? 1
  const symbol    = CURRENCY_SYMBOLS[currency] ?? '$'
  const converted = mxnPrice * rate
  const decimals  = currency === 'MXN' ? 0 : 2
  const locale    = currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'es-MX'
  return `${symbol}${converted.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function periodLabel(currency) {
  return currency === 'MXN' ? 'MXN/mes' : currency === 'USD' ? 'USD/mes' : 'EUR/mes'
}

const PLANS_FALLBACK = [
  {
    id: 'solo', name: 'Solo', price: 399, period: 'MXN/mes',
    desc: 'Para fotógrafos, DJs, decoradores y coordinadores independientes',
    color: '#2B6FD4',
    features: ['1 usuario','20 eventos activos','200 clientes','Calendario y tareas','Catálogo de productos','Cotizaciones (hasta 15/mes)','Contratos básicos','Historial de pagos','2 GB almacenamiento','Soporte por correo'],
  },
  {
    id: 'negocio', name: 'Negocio', price: 799, period: 'MXN/mes',
    desc: 'Para negocios con equipo: wedding planners, salones de eventos',
    color: '#C9A255', popular: true,
    features: ['Hasta 3 usuarios','Eventos y clientes ilimitados','Todo lo del plan Solo','WhatsApp CRM','Cotizaciones ilimitadas + PDF','Contratos con firma digital','Pipeline de ventas (Kanban)','Reportes e ingresos','Exportar Excel / PDF','10 GB almacenamiento','Soporte prioritario (24h)'],
  },
  {
    id: 'agencia', name: 'Agencia', price: 1499, period: 'MXN/mes',
    desc: 'Para agencias y salones grandes con operaciones a escala',
    color: '#7c6af7',
    features: ['Hasta 10 usuarios','Todo ilimitado','Todo lo del plan Negocio','Roles y permisos por usuario','Reportes avanzados','Importación masiva (CSV)','API de integración','Plantillas personalizadas','50 GB almacenamiento','Onboarding dedicado','Soporte 24/7 por WhatsApp'],
  },
]

function adaptPlan(p) {
  return {
    id:      p.planId ?? p.id,
    name:    p.name,
    price:   p.price,
    period:  'MXN/mes',
    desc:    p.description ?? p.desc ?? '',
    color:   p.color ?? '#2B6FD4',
    popular: p.popular ?? false,
    features: (p.features ?? []).map(f =>
      typeof f === 'string' ? f : (f.text ?? f.Text ?? '')
    ).filter(Boolean),
  }
}


const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function PaquetesPage() {
  const { user, updatePlan, startTrial } = useAuth()
  const { currency, setCurrency } = useSettings()
  const [plans,          setPlans]          = useState(PLANS_FALLBACK)
  const [loading,        setLoading]        = useState(null)
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [promoCode,      setPromoCode]      = useState('')
  const [promoLoading,   setPromoLoading]   = useState(false)
  const [promoMsg,       setPromoMsg]       = useState(null)
  const [historial,      setHistorial]      = useState([])
  const [histLoading,    setHistLoading]    = useState(false)
  const [subInfo,        setSubInfo]        = useState(null)
  const [subLoading,     setSubLoading]     = useState(false)
  const [trialLoading,   setTrialLoading]   = useState(false)

  useEffect(() => {
    const PLAN_IDS = ['solo', 'negocio', 'agencia']
    getPublicPlans()
      .then(data => {
        if (!data?.length) return
        const byId = Object.fromEntries(data.map(p => [p.planId ?? p.id, adaptPlan(p)]))
        setPlans(PLAN_IDS.map(id => byId[id] ?? PLANS_FALLBACK.find(p => p.id === id)))
      })
      .catch(() => {})
  }, [])

  const currentPlan  = user?.plan ?? 'free'
  const activePlan   = plans.find(p => p.id === currentPlan)
  const TRIAL_DAYS   = 5
  const trialStarted = user?.trialStartedAt ? new Date(user.trialStartedAt) : null
  const trialDaysLeft = trialStarted
    ? Math.max(0, TRIAL_DAYS - Math.floor((Date.now() - trialStarted.getTime()) / 86_400_000))
    : null
  const inTrial = currentPlan === 'free' && trialDaysLeft !== null && trialDaysLeft > 0
  const trialExpired = currentPlan === 'free' && trialDaysLeft === 0 && trialStarted !== null
  const noTrial = currentPlan === 'free' && trialStarted === null

  const handleStartTrial = async () => {
    setTrialLoading(true)
    try { await startTrial() }
    catch {}
    finally { setTrialLoading(false) }
  }

  useEffect(() => {
    if (currentPlan === 'free') return
    setHistLoading(true)
    paymentsApi.getHistory()
      .then(setHistorial)
      .catch(() => setHistorial([]))
      .finally(() => setHistLoading(false))
    setSubLoading(true)
    paymentsApi.getSubscription()
      .then(setSubInfo)
      .catch(() => setSubInfo(null))
      .finally(() => setSubLoading(false))
  }, [currentPlan])

  const handleSelect = async (planId) => {
    if (planId === currentPlan) return
    setLoading(planId)
    try {
      const res = await paymentsApi.createCheckout(planId)
      window.location.href = res.url
    } catch (err) {
      alert(err.message || 'Error al iniciar el pago')
    } finally {
      setLoading(null)
    }
  }

  const handleApplyPromo = async (e) => {
    e.preventDefault()
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoMsg(null)
    try {
      const res = await paymentsApi.applyPromo(promoCode.trim())
      await updatePlan(res.plan)
      const planName = plans.find(p => p.id === res.plan)?.name ?? res.plan
      setPromoMsg({ type: 'ok', text: `¡Código aplicado! Plan ${planName} activado.` })
      setPromoCode('')
      setShowChangePlan(false)
    } catch (err) {
      setPromoMsg({ type: 'err', text: err.message || 'Código inválido' })
    } finally {
      setPromoLoading(false)
    }
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
                <span className={styles.currentPrice}>{fmtPlanPrice(activePlan.price, currency)}</span>
                <span className={styles.currentPeriod}> {periodLabel(currency)}</span>
              </div>
              <div className={styles.currentNextBill}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {subLoading
                  ? 'Cargando…'
                  : subInfo?.isStripe
                    ? <>Vigente: <strong>{subInfo.startDate}</strong> → <strong>{subInfo.nextBillingDate}</strong></>
                    : 'Plan activado con código — Sin renovación automática'}
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
          {noTrial ? (
            <div className={styles.trialCard}>
              <div className={styles.trialCardEmoji}>🎉</div>
              <div className={styles.trialCardBody}>
                <h3 className={styles.trialCardTitle}>Activa tu prueba gratuita de 5 días</h3>
                <p className={styles.trialCardDesc}>
                  Accede a todas las funciones de Elixe sin costo. Sin tarjeta de crédito requerida.
                </p>
                <button
                  className={styles.trialCardBtn}
                  onClick={handleStartTrial}
                  disabled={trialLoading}
                >
                  {trialLoading ? 'Activando…' : '🚀 Activar 5 días gratis'}
                </button>
              </div>
            </div>
          ) : inTrial ? (
            <div className={styles.trialCard} style={{ '--trial-color': '#22c55e' }}>
              <div className={styles.trialCardEmoji}>✅</div>
              <div className={styles.trialCardBody}>
                <h3 className={styles.trialCardTitle}>Prueba activa — {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}</h3>
                <p className={styles.trialCardDesc}>Estás usando Elixe con acceso completo. Elige un plan antes de que expire.</p>
                <button className={styles.btnChangePlan} onClick={() => setShowChangePlan(true)}>Ver planes</button>
              </div>
            </div>
          ) : trialExpired ? (
            <div className={styles.trialCard} style={{ '--trial-color': '#f87171' }}>
              <div className={styles.trialCardEmoji}>⏰</div>
              <div className={styles.trialCardBody}>
                <h3 className={styles.trialCardTitle}>Tu prueba gratuita expiró</h3>
                <p className={styles.trialCardDesc}>Contrata un plan para seguir usando Elixe y no perder tu información.</p>
                <button className={styles.btnChangePlan} onClick={() => setShowChangePlan(true)}>Ver planes →</button>
              </div>
            </div>
          ) : (
            <div className={styles.noPlan}>
              <p>No tienes un plan activo. Elige uno para comenzar.</p>
              <button className={styles.btnChangePlan} onClick={() => setShowChangePlan(true)}>Ver planes</button>
            </div>
          )}
        </section>
      )}

      {/* ── Cambiar plan ── */}
      {(showChangePlan || currentPlan === 'free') && (
        <section className={styles.section}>
          <div className={styles.plansSectionHead}>
            <h2 className={styles.sectionTitle}>
              {currentPlan === 'free' ? 'Elige tu plan' : 'Cambiar plan'}
            </h2>
            <div className={styles.currencyPicker}>
              {CURRENCY_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  className={`${styles.currencyBtn} ${currency === opt.code ? styles.currencyBtnActive : ''}`}
                  onClick={() => setCurrency(opt.code)}
                >
                  {opt.flag} {opt.label}
                </button>
              ))}
            </div>
          </div>
          {currency !== 'MXN' && (
            <p className={styles.currencyNote}>
              🔒 Los pagos con Stripe se procesan siempre en pesos mexicanos (MXN)
            </p>
          )}
          <div className={styles.plansGrid}>
            {plans.map(plan => {
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
                    <span className={styles.planCardPriceNum}>{fmtPlanPrice(plan.price, currency)}</span>
                    <span className={styles.planCardPricePer}> {periodLabel(currency)}</span>
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

          {/* Promo code */}
          <div className={styles.promoSection}>
            <p className={styles.promoLabel}>¿Tienes un código de descuento?</p>
            <form className={styles.promoForm} onSubmit={handleApplyPromo}>
              <input
                className={styles.promoInput}
                type="text"
                placeholder="Ej: ELIXE2026"
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoMsg(null) }}
                maxLength={30}
              />
              <button
                type="submit"
                className={styles.promoBtn}
                disabled={promoLoading || !promoCode.trim()}
              >
                {promoLoading ? 'Aplicando…' : 'Aplicar'}
              </button>
            </form>
            {promoMsg && (
              <p className={`${styles.promoMsg} ${promoMsg.type === 'ok' ? styles.promoMsgOk : styles.promoMsgErr}`}>
                {promoMsg.text}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Historial de pagos ── */}
      {currentPlan !== 'free' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Historial de mensualidades</h2>
          {histLoading ? (
            <div className={styles.histLoading}>Cargando historial…</div>
          ) : historial.length === 0 ? (
            <div className={styles.histEmpty}>
              {subInfo?.isStripe === false
                ? 'Tu plan fue activado con un código promocional. No tienes cobros registrados en Stripe.'
                : 'Aún no hay pagos registrados. Aparecerán aquí después de tu primer cobro.'}
            </div>
          ) : (
            <div className={styles.historialTable}>
              <div className={styles.historialHeader}>
                <span>Fecha</span>
                <span>Método</span>
                <span>Monto</span>
                <span>Estado</span>
              </div>
              {historial.map((row, i) => (
                <div key={i} className={styles.historialRow}>
                  <span className={styles.histFecha}>{row.date}</span>
                  <span className={styles.histMetodo}>{row.method}</span>
                  <span className={styles.histMonto}>${row.amount.toLocaleString('es-MX')}</span>
                  <span className={styles.histEstado}>
                    <span className={styles.estadoDot} />
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
