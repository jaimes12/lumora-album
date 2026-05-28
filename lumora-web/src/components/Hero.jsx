import styles from './Hero.module.css'

const PHOTOS = [
  { id: 1, bg: '#1c1410', delay: '0s', row: 1 },
  { id: 2, bg: '#101418', delay: '0.15s', row: 1 },
  { id: 3, bg: '#141018', delay: '0.3s', row: 1 },
  { id: 4, bg: '#181410', delay: '0.45s', row: 1 },
  { id: 5, bg: '#101814', delay: '0.6s', row: 2 },
  { id: 6, bg: '#181014', delay: '0.75s', row: 2 },
  { id: 7, bg: '#141810', delay: '0.9s', row: 2 },
  { id: 8, bg: '#101418', delay: '1.05s', row: 2 },
]

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} />

      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Álbumes digitales para tus momentos
        </div>

        <h1 className={styles.title}>
          Cada foto cuenta
          <br />
          <span className={styles.titleAccent}>una historia.</span>
        </h1>

        <p className={styles.sub}>
          Crea un álbum compartido para tu boda, cumpleaños o reunión.
          <br />
          Tus invitados suben fotos en tiempo real. Sin apps, sin complicaciones.
        </p>

        <div className={styles.btns}>
          <button className={styles.btnPrimary}>
            Crear mi álbum gratis
            <span className={styles.btnArrow}>→</span>
          </button>
          <button className={styles.btnSecondary}>Ver demo</button>
        </div>

        <p className={styles.hint}>Sin tarjeta de crédito · Gratis para siempre en eventos pequeños</p>
      </div>

      <div className={styles.grid}>
        {PHOTOS.map((p) => (
          <div
            key={p.id}
            className={styles.photoCard}
            style={{ '--delay': p.delay, '--bg': p.bg }}
          />
        ))}
        <div className={styles.uploadCard}>
          <div className={styles.uploadIcon}>↑</div>
          <span>Subir foto</span>
        </div>
      </div>
    </section>
  )
}
