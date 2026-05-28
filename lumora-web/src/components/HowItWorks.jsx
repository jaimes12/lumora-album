import styles from './HowItWorks.module.css'

const STEPS = [
  {
    num: '01',
    title: 'Crea tu álbum',
    desc: 'Dale un nombre al evento, elige la fecha y personaliza con tu estilo.',
  },
  {
    num: '02',
    title: 'Comparte el link',
    desc: 'Envía el link o muestra el QR en tu evento. Sin descargas, sin cuentas.',
  },
  {
    num: '03',
    title: 'Disfruta el momento',
    desc: 'Tus invitados suben fotos desde su teléfono. El álbum crece solo.',
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.label}>Cómo funciona</span>
          <h2 className={styles.title}>
            Listo en
            <br />
            3 pasos.
          </h2>
          <p className={styles.sub}>
            No necesitas saber de tecnología. Si puedes compartir un link, puedes usar Lumora.
          </p>
          <button className={styles.btn}>Empezar ahora →</button>
        </div>

        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s.num} className={styles.step}>
              <div className={styles.stepNum}>{s.num}</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <div className={styles.connector} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
