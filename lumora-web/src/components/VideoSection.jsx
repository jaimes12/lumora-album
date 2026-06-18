import { useState } from 'react'
import styles from './VideoSection.module.css'

// Cambia esta URL por el embed de YouTube cuando tengas el video
const VIDEO_URL = null // ej: 'https://www.youtube.com/embed/XXXX?autoplay=1'

export default function VideoSection() {
  const [playing, setPlaying] = useState(false)

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>Demo</span>
          <h2 className={styles.title}>
            Así organiza un Wedding Planner<br />
            un evento completo con Elixe.
          </h2>
          <p className={styles.sub}>60 segundos. Sin instalaciones. Sin tarjeta de crédito.</p>
        </div>

        <div className={styles.videoWrap}>
          {playing && VIDEO_URL ? (
            <iframe
              className={styles.iframe}
              src={VIDEO_URL}
              title="Demo Elixe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className={styles.thumb} onClick={() => VIDEO_URL && setPlaying(true)}>
              <div className={styles.thumbGrad} />
              <div className={styles.thumbIcons}>
                <span>💍</span><span>📋</span><span>💳</span><span>📅</span><span>🎊</span>
              </div>
              <div className={styles.thumbBrand}>
                <span className={styles.thumbApp}>Elixe</span>
                <span className={styles.thumbAppSub}>Gestión de eventos</span>
              </div>
              <button
                className={styles.playBtn}
                onClick={() => VIDEO_URL ? setPlaying(true) : null}
                aria-label="Reproducir video"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              </button>
              {!VIDEO_URL && (
                <div className={styles.comingSoon}>Video próximamente</div>
              )}
            </div>
          )}
        </div>

        <div className={styles.bullets}>
          <div className={styles.bullet}>
            <span className={styles.bulletIco}>✅</span>
            <span>Crea un evento y asigna proveedores</span>
          </div>
          <div className={styles.bullet}>
            <span className={styles.bulletIco}>✅</span>
            <span>Registra anticipos y pagos en segundos</span>
          </div>
          <div className={styles.bullet}>
            <span className={styles.bulletIco}>✅</span>
            <span>Gestiona clientes desde WhatsApp</span>
          </div>
        </div>
      </div>
    </section>
  )
}
