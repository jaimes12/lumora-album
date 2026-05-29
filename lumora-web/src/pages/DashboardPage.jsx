import styles from './DashboardPage.module.css'

const STATS = [
  {
    label: 'Eventos este mes',
    value: '14',
    trend: '+3 vs mes anterior',
    trendUp: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    color: '#7c6af7',
  },
  {
    label: 'Ingresos del mes',
    value: '$284,500',
    trend: '↑ 12% vs mayo',
    trendUp: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    color: '#34d399',
  },
  {
    label: 'Clientes nuevos',
    value: '8',
    trend: '+2 esta semana',
    trendUp: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    color: '#a78bfa',
  },
  {
    label: 'Cotizaciones pendientes',
    value: '6',
    trend: '2 por vencer hoy',
    trendUp: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    color: '#fb923c',
  },
]

const BAR_DATA = [
  { label: 'Lun', value: 55 },
  { label: 'Mar', value: 72 },
  { label: 'Mié', value: 48 },
  { label: 'Jue', value: 85 },
  { label: 'Vie', value: 63 },
  { label: 'Sáb', value: 91 },
  { label: 'Dom', value: 40 },
]

const PROXIMOS = [
  { nombre: 'Boda García & Ruiz', cliente: 'Fernanda García', tipo: 'Boda', fecha: 'Jun 14, 2026', estado: 'confirmed' },
  { nombre: 'Corporativo Telmex', cliente: 'Carlos Mendoza', tipo: 'Corporativo', fecha: 'Jun 18, 2026', estado: 'pending' },
  { nombre: 'XV Años Sofía López', cliente: 'Ana López', tipo: 'XV Años', fecha: 'Jun 22, 2026', estado: 'confirmed' },
  { nombre: 'Graduación ITESM', cliente: 'Roberto Sánchez', tipo: 'Graduación', fecha: 'Jul 03, 2026', estado: 'quote' },
  { nombre: 'Bautizo Sebastián', cliente: 'Mónica Reyes', tipo: 'Bautizo', fecha: 'Jul 08, 2026', estado: 'confirmed' },
]

const ESTADO_LABEL = { confirmed: 'Confirmado', pending: 'Pendiente', quote: 'Cotización' }

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Bienvenido de vuelta, Angel. Aquí está tu resumen de junio.</p>
        </div>
        <div className={styles.dateChip}>Junio 2026</div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {STATS.map(s => (
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
        ))}
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Bar chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Ventas por día (esta semana)</span>
            <span className={styles.chartSub}>en miles de pesos</span>
          </div>
          <div className={styles.barChart}>
            {BAR_DATA.map(d => (
              <div key={d.label} className={styles.barCol}>
                <div className={styles.barTrack}>
                  <div className={styles.bar} style={{ height: `${d.value}%` }} />
                </div>
                <span className={styles.barLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos eventos */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Próximos eventos</span>
            <a href="/app/eventos" className={styles.chartLink}>Ver todos →</a>
          </div>
          <div className={styles.eventList}>
            {PROXIMOS.map(e => (
              <div key={e.nombre} className={styles.eventRow}>
                <div className={`${styles.eventDot} ${styles[e.estado]}`} />
                <div className={styles.eventInfo}>
                  <span className={styles.eventName}>{e.nombre}</span>
                  <span className={styles.eventMeta}>{e.tipo} · {e.fecha}</span>
                </div>
                <span className={`${styles.badge} ${styles[`badge_${e.estado}`]}`}>
                  {ESTADO_LABEL[e.estado]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
