import styles from './Audience.module.css'

/* Minimal SVG icons */
const Icons = {
  wedding: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  salon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="1"/>
      <path d="M17 7V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="17"/>
      <line x1="9" y1="14.5" x2="15" y2="14.5"/>
    </svg>
  ),
  organizer: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 16 11 18 15 14"/>
    </svg>
  ),
  decorator: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  photo: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  dj: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
}

const AUDIENCES = [
  {
    icon: Icons.wedding,
    title: 'Wedding Planners',
    desc: 'Coordina proveedores, venues, presupuestos y el timeline del gran día desde un solo panel.',
    color: '#f472b6',
  },
  {
    icon: Icons.salon,
    title: 'Dueños de salones',
    desc: 'Administra reservaciones, contratos y pagos de tu salón de eventos sin complicaciones.',
    color: '#38bdf8',
  },
  {
    icon: Icons.organizer,
    title: 'Organizadores de eventos',
    desc: 'Desde fiestas privadas hasta eventos corporativos. Lleva el control de cada detalle.',
    color: '#a78bfa',
  },
  {
    icon: Icons.decorator,
    title: 'Decoradores',
    desc: 'Gestiona proyectos, clientes y catálogo de productos y servicios desde un solo lugar.',
    color: '#34d399',
  },
  {
    icon: Icons.photo,
    title: 'Fotógrafos y videógrafos',
    desc: 'Agenda sesiones, envía cotizaciones y da seguimiento a cada cliente en tu pipeline.',
    color: '#fb923c',
  },
  {
    icon: Icons.dj,
    title: 'DJs y entretenimiento',
    desc: 'Controla tus reservaciones, contratos y comunicación con clientes en tiempo real.',
    color: '#e879f9',
  },
]

export default function Audience() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>Hecho para ti</span>
          <h2 className={styles.title}>¿Para quién es Elixe?</h2>
          <p className={styles.sub}>
            No importa en qué parte de la industria de eventos estés.
            Elixe se adapta a tu negocio y flujo de trabajo.
          </p>
        </div>

        <div className={styles.grid}>
          {AUDIENCES.map(a => (
            <div
              key={a.title}
              className={styles.card}
              style={{ '--card-color': a.color }}
            >
              <div className={styles.cardGlow} />
              <div className={styles.iconWrap} style={{ color: a.color, background: a.color + '14', border: `1px solid ${a.color}28` }}>
                {a.icon}
              </div>
              <h3 className={styles.cardTitle}>{a.title}</h3>
              <p className={styles.cardDesc}>{a.desc}</p>
              <div className={styles.cardAccent} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
