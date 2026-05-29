import styles from './Features.module.css'

const FEATURES = [
  {
    icon: '◉',
    color: '#7c6af7',
    title: 'Calendario de eventos',
    desc: 'Vista mensual, semanal y diaria. Asigna venues, equipos y recordatorios automáticos.',
  },
  {
    icon: '◈',
    color: '#34d399',
    title: 'CRM de clientes',
    desc: 'Historial completo por cliente, notas, seguimiento y etapas del pipeline de ventas.',
  },
  {
    icon: '⬡',
    color: '#fb923c',
    title: 'Gestión de proveedores',
    desc: 'Directorio de caterers, fotógrafos, venues y más. Calificaciones y disponibilidad.',
  },
  {
    icon: '◫',
    color: '#38bdf8',
    title: 'CRM de WhatsApp',
    desc: 'Centraliza todos tus chats de WhatsApp. Responde desde un solo lugar con tu equipo.',
  },
  {
    icon: '◑',
    color: '#f472b6',
    title: 'Cotizaciones y ventas',
    desc: 'Genera cotizaciones profesionales en segundos. Firma digital y seguimiento de pagos.',
  },
  {
    icon: '▣',
    color: '#a78bfa',
    title: 'Reportes y gráficas',
    desc: 'Dashboard con ingresos, eventos por mes, conversión de leads y métricas clave.',
  },
]

export default function Features() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.header}>
        <span className={styles.label}>Características</span>
        <h2 className={styles.title}>Todo lo que necesita<br />tu empresa de eventos.</h2>
        <p className={styles.sub}>
          Sin hojas de cálculo, sin WhatsApp mal organizado, sin perder clientes.
          Todo centralizado en Lumora.
        </p>
      </div>

      <div className={styles.grid}>
        {FEATURES.map(f => (
          <div key={f.title} className={styles.card}>
            <div className={styles.iconWrap} style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
              <span style={{ color: f.color, fontSize: 20 }}>{f.icon}</span>
            </div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
