import styles from './HowItWorks.module.css'

const STEPS = [
  {
    num: '01',
    title: 'Agrega tus clientes y eventos',
    desc: 'Importa tus contactos o agrégalos uno a uno. Crea eventos con toda la info: fecha, venue, tipo, presupuesto.',
  },
  {
    num: '02',
    title: 'Conecta tu WhatsApp',
    desc: 'Vincula tu número en minutos. Todos los mensajes de tus clientes llegan al CRM y los asignas a tu equipo.',
  },
  {
    num: '03',
    title: 'Cotiza y cobra',
    desc: 'Genera cotizaciones con tu logo, envíalas por link, recibe firma digital y lleva el control de pagos.',
  },
  {
    num: '04',
    title: 'Analiza y crece',
    desc: 'Mira qué eventos son más rentables, cuáles proveedores convienen más y cuánto creció tu negocio.',
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.label}>Cómo funciona</span>
          <h2 className={styles.title}>
            De la cotización
            <br />
            al evento exitoso.
          </h2>
          <p className={styles.sub}>
            Lumora te acompaña en cada etapa del proceso. Desde el primer
            contacto hasta la última factura.
          </p>
          <button className={styles.btn}>Empezar ahora — es gratis →</button>
        </div>

        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s.num} className={styles.step}>
              <div className={styles.stepLeft}>
                <div className={styles.stepNum}>{s.num}</div>
                {i < STEPS.length - 1 && <div className={styles.line} />}
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
