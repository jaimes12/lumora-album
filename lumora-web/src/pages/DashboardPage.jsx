import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../api/dashboardApi'
import { ESTADO_META } from '../data/eventosData'
import styles from './DashboardPage.module.css'


const ICONS = {
  eventos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  ingresos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  clientes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  cotizaciones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
}

const MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const STEPS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: '#7c6af7',
    title: 'Crea tu primer evento',
    desc: 'Registra los datos del evento: tipo, fecha, cliente y precio.',
    href: '/app/eventos',
    cta: 'Crear evento →',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    color: '#34d399',
    title: 'Genera el contrato',
    desc: 'Desde el evento puedes crear el contrato con las cláusulas listas.',
    href: '/app/contratos',
    cta: 'Ver contratos →',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: '#25D366',
    title: 'Conecta WhatsApp',
    desc: 'Envía recordatorios y mensajes a tus clientes directo desde Elixe.',
    href: null,
    cta: 'Conectar en el menú lateral →',
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const now = new Date()

  useEffect(() => {
    dashboardApi.getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const nombre = user?.name?.split(' ')[0] ?? 'allí'

  const isNewUser = !loading && stats !== null
    && (stats.eventsThisMonth ?? 0) === 0
    && (stats.revenueThisMonth ?? 0) === 0
    && (stats.pendingSales ?? 0) === 0
    && (!stats.upcomingEvents || stats.upcomingEvents.length === 0)

  const statCards = stats ? [
    { label: 'Eventos este mes', value: String(stats.eventsThisMonth ?? 0), trendUp: true,  color: '#7c6af7', icon: ICONS.eventos,      trend: 'este mes' },
    { label: 'Ingresos del mes', value: '$' + Number(stats.revenueThisMonth ?? 0).toLocaleString('es-MX'), trendUp: true,  color: '#34d399', icon: ICONS.ingresos,    trend: 'cobrado este mes' },
    { label: 'Clientes nuevos',  value: String(stats.newClientsThisMonth ?? 0), trendUp: true,  color: '#a78bfa', icon: ICONS.clientes,    trend: 'este mes' },
    { label: 'Ventas pendientes',value: String(stats.pendingSales ?? 0),         trendUp: false, color: '#fb923c', icon: ICONS.cotizaciones, trend: 'sin cerrar' },
  ] : []

  if (isNewUser) {
    return (
      <div className={styles.page}>
        <div className={styles.welcomeWrap}>
          <div className={styles.welcomeTop}>
            <span className={styles.welcomeEmoji}>👋</span>
            <div>
              <h1 className={styles.welcomeTitle}>¡Bienvenido, {nombre}!</h1>
              <p className={styles.welcomeSub}>Tu cuenta está lista. Sigue estos pasos para aprovechar Elixe al máximo.</p>
            </div>
          </div>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <div key={i} className={styles.stepCard}>
                <div className={styles.stepNum} style={{ background: `${s.color}1a`, color: s.color }}>{i + 1}</div>
                <div className={styles.stepIconWrap} style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
                {s.href && (
                  <button className={styles.stepBtn} style={{ background: s.color }} onClick={() => navigate(s.href)}>
                    {s.cta}
                  </button>
                )}
                {!s.href && <p className={styles.stepHint}>{s.cta}</p>}
              </div>
            ))}
          </div>
          <button className={styles.welcomeCta} onClick={() => navigate('/app/eventos')}>
            Crear mi primer evento →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Bienvenido de vuelta, {nombre}. Aquí está tu resumen de {MES[now.getMonth()]}.</p>
        </div>
        <div className={styles.dateChip}>{MES[now.getMonth()]} {now.getFullYear()}</div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className={styles.statCard} style={{ opacity: 0.4, minHeight: 100 }} />)
          : statCards.map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{s.label}</span>
                <div className={styles.statIconWrap} style={{ background: `${s.color}1a`, color: s.color }}>
                  {s.icon}
                </div>
              </div>
              <span className={styles.statValue}>{s.value}</span>
              <span className={`${styles.statTrend} ${s.trendUp ? styles.trendUp : styles.trendDown}`}>
                {s.trend}
              </span>
            </div>
          ))
        }
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Actividad semanal</span>
            <span className={styles.chartSub}>en miles de pesos</span>
          </div>
          <div className={styles.barChart}>
            {loading
              ? Array(7).fill(0).map((_, i) => (
                  <div key={i} className={styles.barCol}>
                    <div className={styles.barTrack}><div className={styles.bar} style={{ height: '20%', opacity: 0.2 }} /></div>
                    <span className={styles.barLabel} style={{ opacity: 0.3 }}>···</span>
                  </div>
                ))
              : (() => {
                  const bars = stats?.weeklyActivity ?? []
                  const maxVal = Math.max(...bars.map(d => d.value), 1)
                  return bars.map(d => (
                    <div key={d.label} className={styles.barCol}>
                      <div className={styles.barTrack}>
                        <div className={styles.bar} style={{ height: `${Math.max((d.value / maxVal) * 100, d.value > 0 ? 4 : 0)}%` }} />
                      </div>
                      <span className={styles.barLabel}>{d.label}</span>
                    </div>
                  ))
                })()
            }
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Próximos eventos</span>
            <a href="/app/eventos" className={styles.chartLink}>Ver todos →</a>
          </div>
          <div className={styles.eventList}>
            {loading && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Cargando…</div>
            )}
            {!loading && (!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Sin eventos próximos</div>
            )}
            {!loading && (stats?.upcomingEvents ?? []).map(e => {
              const estado = e.status === 'confirmed' ? 'confirmed' : e.status === 'in_progress' ? 'pending' : e.status
              const meta = ESTADO_META[estado] ?? ESTADO_META.lead
              const fecha = new Date(e.eventDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
              return (
                <div key={e.id} className={styles.eventRow}>
                  <div className={`${styles.eventDot}`} style={{ background: meta.color }} />
                  <div className={styles.eventInfo}>
                    <span className={styles.eventName}>{e.name}</span>
                    <span className={styles.eventMeta}>{e.type} · {fecha}</span>
                  </div>
                  <span className={styles.badge} style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
