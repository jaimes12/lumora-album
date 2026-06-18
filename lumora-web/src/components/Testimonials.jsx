import styles from './Testimonials.module.css'

const TESTIMONIALS = [
  {
    name: 'Sofía Ramírez',
    role: 'Wedding Planner',
    city: 'CDMX',
    initials: 'SR',
    color: '#f472b6',
    quote: 'Antes perdía clientes en WhatsApp y llevaba todo en Excel. Desde que uso Elixe, mis eventos son más organizados y mis clientes lo notan. Es increíble lo rápido que puedes empezar.',
  },
  {
    name: 'Roberto Medina',
    role: 'Salón de eventos',
    city: 'Guadalajara',
    initials: 'RM',
    color: '#38bdf8',
    quote: 'El control de anticipos y pagos me cambió la vida. Antes no sabía exactamente cuánto me debían hasta el día del evento. Ahora tengo claridad total desde el primer depósito.',
  },
  {
    name: 'Valeria Torres',
    role: 'Organizadora de XV años',
    city: 'Monterrey',
    initials: 'VT',
    color: '#a78bfa',
    quote: 'Lo que más me gustó es el directorio de proveedores. Ya no tengo que buscar entre 10 chats de WhatsApp para encontrar el teléfono del fotógrafo. Todo está en un solo lugar.',
  },
]

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
)

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.label}>Testimonios</span>
        <h2 className={styles.title}>
          Más de 200 organizadores de eventos<br />
          ya usan Elixe.
        </h2>
        <p className={styles.sub}>
          Profesionales del sector que dejaron atrás el caos del Excel y WhatsApp.
        </p>
      </div>

      <div className={styles.grid}>
        {TESTIMONIALS.map(t => (
          <div key={t.name} className={styles.card}>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <span key={i} className={styles.star}><StarIcon /></span>
              ))}
            </div>
            <p className={styles.quote}>"{t.quote}"</p>
            <div className={styles.author}>
              <div className={styles.avatar} style={{ background: t.color + '22', color: t.color, borderColor: t.color + '44' }}>
                {t.initials}
              </div>
              <div>
                <div className={styles.name}>{t.name}</div>
                <div className={styles.meta}>{t.role} · {t.city}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.trust}>
        <div className={styles.trustStat}>
          <span className={styles.trustNum}>200+</span>
          <span className={styles.trustLabel}>organizadores activos</span>
        </div>
        <div className={styles.trustDivider} />
        <div className={styles.trustStat}>
          <span className={styles.trustNum}>4,000+</span>
          <span className={styles.trustLabel}>eventos gestionados</span>
        </div>
        <div className={styles.trustDivider} />
        <div className={styles.trustStat}>
          <span className={styles.trustNum}>98%</span>
          <span className={styles.trustLabel}>recomendarían Elixe</span>
        </div>
      </div>
    </section>
  )
}
