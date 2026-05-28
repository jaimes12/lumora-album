import styles from './Features.module.css'

const FEATURES = [
  {
    icon: '⬡',
    title: 'Álbum compartido',
    desc: 'Genera un link o QR code. Tus invitados suben fotos sin necesidad de crear cuenta.',
  },
  {
    icon: '◈',
    title: 'Tiempo real',
    desc: 'Las fotos aparecen al instante en el álbum. Todo el mundo lo ve al mismo tiempo.',
  },
  {
    icon: '◉',
    title: 'Descarga todo',
    desc: 'Al final del evento descarga todas las fotos en un ZIP. Sin perder ni una.',
  },
  {
    icon: '◫',
    title: 'Privado y seguro',
    desc: 'Solo quienes tienen el link pueden ver y subir. Tú controlas el acceso.',
  },
]

export default function Features() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.header}>
        <span className={styles.label}>Características</span>
        <h2 className={styles.title}>Todo lo que necesitas,<br />nada más.</h2>
        <p className={styles.sub}>Diseñado para ser simple. Funciona en cualquier dispositivo, sin instalación.</p>
      </div>

      <div className={styles.grid}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.card}>
            <div className={styles.iconWrap}>
              <span className={styles.icon}>{f.icon}</span>
            </div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
