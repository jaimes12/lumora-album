import styles from './Features.module.css'

/* ── Mock: Calendar ── */
function CalMock() {
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  // June 2026: starts on Monday → 1 blank before day 1
  const cells = [
    null, 1, 2, 3, 4, 5, 6,
    7, 8, 9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, null, null, null, null,
  ]
  const events = {
    3:  { name: 'Boda García', color: '#34d399' },
    11: { name: 'Telmex',     color: '#fb923c' },
    14: { name: 'XV Sofía',   color: '#f472b6' },
    22: { name: 'Graduación', color: '#7c6af7' },
    28: { name: 'Bautizo',    color: '#38bdf8' },
  }

  return (
    <div className={styles.calMock}>
      <div className={styles.calTop}>
        <span className={styles.calMonth}>Junio 2026</span>
        <div className={styles.calNav}>
          <button className={styles.calBtn}>‹</button>
          <button className={styles.calBtn}>›</button>
        </div>
      </div>
      <div className={styles.calGrid}>
        {days.map(d => (
          <div key={d} className={styles.calDayName}>{d}</div>
        ))}
        {cells.map((n, i) => (
          <div key={i} className={`${styles.calCell} ${n === 8 ? styles.calToday : ''}`}>
            {n && <span className={styles.calNum}>{n}</span>}
            {n && events[n] && (
              <div
                className={styles.calEvt}
                style={{ color: events[n].color, background: events[n].color + '1A', borderColor: events[n].color + '40' }}
              >
                {events[n].name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Mock: Chat ── */
function ChatMock() {
  const msgs = [
    { out: false, text: 'Hola! Me interesa cotizar una boda para marzo', time: '10:21' },
    { out: true,  text: '¡Claro! ¿Para cuántas personas aproximadamente?', time: '10:22' },
    { out: false, text: 'Serían unas 150 personas, salón interior', time: '10:23' },
    { out: true,  text: 'Perfecto, te enviamos la cotización en minutos 🎊', time: '10:24' },
    { out: false, text: 'Muchas gracias, lo esperamos 🙏', time: '10:25' },
  ]

  return (
    <div className={styles.chatMock}>
      <div className={styles.chatHead}>
        <div className={styles.chatAvatar}>MG</div>
        <div>
          <div className={styles.chatName}>María González</div>
          <div className={styles.chatSub}>● En línea · WhatsApp</div>
        </div>
        <div className={styles.chatWaBadge}>WA</div>
      </div>
      <div className={styles.chatMsgs}>
        {msgs.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${m.out ? styles.bubbleOut : styles.bubbleIn}`}>
            <span className={styles.bubbleText}>{m.text}</span>
            <span className={styles.bubbleTime}>{m.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Mock: Tasks ── */
function TasksMock() {
  const tasks = [
    { done: true,  text: 'Confirmar floristería — Boda García', tag: 'Proveedor', tc: '#34d399' },
    { done: true,  text: 'Enviar contrato a González',          tag: 'Contrato',  tc: '#38bdf8' },
    { done: false, text: 'Revisar menú con el caterer',         tag: 'Pendiente', tc: '#fb923c' },
    { done: false, text: 'Pago fotógrafo — Jun 14',             tag: 'Pago',      tc: '#f472b6' },
    { done: false, text: 'Llamar al DJ para confirmación',      tag: 'Pendiente', tc: '#fb923c' },
  ]

  return (
    <div className={styles.tasksMock}>
      <div className={styles.tasksHead}>
        <span className={styles.tasksTitle}>Tareas pendientes</span>
        <span className={styles.tasksBadge}>3 por hacer</span>
      </div>
      {tasks.map((t, i) => (
        <div key={i} className={`${styles.tasksRow} ${t.done ? styles.tasksRowDone : ''}`}>
          <div className={`${styles.tasksCheck} ${t.done ? styles.tasksChecked : ''}`}>
            {t.done && '✓'}
          </div>
          <span className={styles.tasksText}>{t.text}</span>
          <span className={styles.tasksTag} style={{ color: t.tc, background: t.tc + '18' }}>{t.tag}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Mock: Proveedores ── */
function ProveedoresMock() {
  const vendors = [
    { emoji: '🌸', name: 'Flores Cristal',    cat: 'Decoración',     stars: 5, phone: '55-1234-5678', color: '#f472b6' },
    { emoji: '📷', name: 'Foto Estudio MX',   cat: 'Fotografía',     stars: 5, phone: '55-8765-4321', color: '#38bdf8' },
    { emoji: '🎵', name: 'DJ Kevin Sound',    cat: 'Entretenimiento', stars: 4, phone: '55-4567-8901', color: '#a78bfa' },
    { emoji: '🍽️', name: 'Catering Deluxe',  cat: 'Banquetes',      stars: 4, phone: '55-2345-6789', color: '#34d399' },
  ]
  return (
    <div className={styles.vendorMock}>
      <div className={styles.vendorHead}>
        <span className={styles.vendorHeadTitle}>Directorio de proveedores</span>
        <span className={styles.vendorCount}>{vendors.length} contactos</span>
      </div>
      {vendors.map((v, i) => (
        <div key={i} className={styles.vendorRow}>
          <div className={styles.vendorEmoji}>{v.emoji}</div>
          <div className={styles.vendorInfo}>
            <span className={styles.vendorName}>{v.name}</span>
            <span className={styles.vendorCat} style={{ color: v.color, background: v.color + '18' }}>{v.cat}</span>
          </div>
          <div className={styles.vendorRight}>
            <span className={styles.vendorStars}>{'★'.repeat(v.stars)}{'☆'.repeat(5 - v.stars)}</span>
            <span className={styles.vendorPhone}>{v.phone}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Mock: Notas compartidas ── */
function NotasMock() {
  const notes = [
    { color: '#fef08a', border: '#facc15', text: 'Pedir flores blancas para la entrada del salón 🌸', author: 'Ana', reactions: [{ e: '👍', n: 2 }] },
    { color: '#bbf7d0', border: '#4ade80', text: 'El DJ llega a las 6pm — confirmar estacionamiento', author: 'Miguel', reactions: [{ e: '✅', n: 1 }] },
    { color: '#bae6fd', border: '#38bdf8', text: 'Mesa de pasteles en la esquina norte, no junto al AC', author: 'Lucía', reactions: [{ e: '🔥', n: 3 }, { e: '❤️', n: 1 }] },
  ]
  return (
    <div className={styles.notesMock}>
      {notes.map((n, i) => (
        <div key={i} className={styles.noteMockCard} style={{ background: n.color, borderColor: n.border }}>
          <p className={styles.noteMockText}>{n.text}</p>
          <div className={styles.noteMockFooter}>
            <div className={styles.noteMockAuthorRow}>
              <div className={styles.noteMockAvatar} style={{ borderColor: n.border }}>{n.author[0]}</div>
              <span className={styles.noteMockAuthor}>{n.author}</span>
            </div>
            <div className={styles.noteMockReactions}>
              {n.reactions.map(r => (
                <span key={r.e} className={styles.noteMockChip}>{r.e} {r.n}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Mock: Ventas ── */
function VentasMock() {
  const bars = [
    { month: 'Ene', val: 42000, h: 52 },
    { month: 'Feb', val: 58000, h: 68 },
    { month: 'Mar', val: 51000, h: 61 },
    { month: 'Abr', val: 73000, h: 84 },
    { month: 'May', val: 66000, h: 76 },
    { month: 'Jun', val: 89000, h: 100, active: true },
  ]
  return (
    <div className={styles.salesMock}>
      <div className={styles.salesTop}>
        <div>
          <div className={styles.salesTotalLabel}>Ingresos — 2026</div>
          <div className={styles.salesTotalVal}>$379,000</div>
        </div>
        <div className={styles.salesTrend}>↑ 34% vs año anterior</div>
      </div>
      <div className={styles.salesChart}>
        {bars.map(b => (
          <div key={b.month} className={styles.salesBarWrap}>
            <div className={`${styles.salesBar} ${b.active ? styles.salesBarActive : ''}`} style={{ height: `${b.h}%` }} />
            <span className={styles.salesBarLabel}>{b.month}</span>
          </div>
        ))}
      </div>
      <div className={styles.salesLegend}>
        <div className={styles.salesLegendRow}>
          <span className={styles.salesDot} style={{ background: '#a78bfa' }} />
          <span>Eventos confirmados</span>
          <span className={styles.salesLegendVal}>$261,000</span>
        </div>
        <div className={styles.salesLegendRow}>
          <span className={styles.salesDot} style={{ background: '#f472b6' }} />
          <span>Anticipos recibidos</span>
          <span className={styles.salesLegendVal}>$118,000</span>
        </div>
      </div>
    </div>
  )
}

/* ── Feature spotlights ── */
const FEATURES = [
  {
    label: 'Calendario',
    title: 'Nunca más pierdas un evento.',
    desc: 'Vista mensual y semanal de todos tus eventos. Asigna venues, equipos y recibe alertas antes del gran día. Sin conflictos de fechas.',
    bullets: ['Vista por día, semana y mes', 'Colores por tipo de evento', 'Alertas de conflictos automáticas'],
    color: '#7c6af7',
    Mock: CalMock,
    reverse: false,
  },
  {
    label: 'WhatsApp CRM',
    title: 'Todos tus clientes en un solo lugar.',
    desc: 'Conecta tu WhatsApp Business y maneja todas las conversaciones desde Elixe. Asigna chats, crea notas y nunca pierdas un lead.',
    bullets: ['Conexión directa a WhatsApp Business', 'Asignación de chats al equipo', 'Historial completo por cliente'],
    color: '#34d399',
    Mock: ChatMock,
    reverse: true,
  },
  {
    label: 'Tareas',
    title: 'Tu equipo siempre sincronizado.',
    desc: 'Crea y asigna tareas por evento o generales. Prioridades, fechas límite, etiquetas y seguimiento — todo en un panel limpio.',
    bullets: ['Tareas ligadas a cada evento', 'Asignación a tu equipo', 'Filtros por prioridad y estado'],
    color: '#fb923c',
    Mock: TasksMock,
    reverse: false,
  },
  {
    label: 'Proveedores',
    title: 'Tu red de proveedores, siempre a la mano.',
    desc: 'Guarda fotógrafos, decoradores, caterers, DJs y más. Califica su desempeño, guarda su contacto y asígnalos directamente a tus eventos.',
    bullets: ['Directorio por categoría', 'Calificaciones y notas por proveedor', 'Asignación directa a eventos'],
    color: '#38bdf8',
    Mock: ProveedoresMock,
    reverse: true,
  },
  {
    label: 'Notas compartidas',
    title: 'Colabora con tu equipo en tiempo real.',
    desc: 'Publica notas tipo post-it que todo tu equipo puede ver y reaccionar. Ideas, recordatorios, instrucciones — todo en un solo tablero compartido.',
    bullets: ['Notas visibles para todo el equipo', 'Reacciones con emojis', 'Colores para organizar por tema'],
    color: '#f472b6',
    Mock: NotasMock,
    reverse: false,
  },
  {
    label: 'Ventas',
    title: 'Conoce el rendimiento de tu negocio.',
    desc: 'Visualiza ingresos por mes, eventos confirmados, anticipos y pagos pendientes. Toma decisiones con datos reales de tu negocio.',
    bullets: ['Gráfica de ingresos mensual', 'Desglose por tipo de evento', 'Comparativa año a año'],
    color: '#a78bfa',
    Mock: VentasMock,
    reverse: true,
  },
]

export default function Features() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.header}>
        <span className={styles.label}>Características</span>
        <h2 className={styles.title}>
          Las herramientas que tu negocio<br />
          de eventos necesita.
        </h2>
        <p className={styles.sub}>
          Sin hojas de cálculo, sin WhatsApp mal organizado, sin clientes perdidos.
          Todo centralizado en Elixe.
        </p>
      </div>

      <div className={styles.spotlights}>
        {FEATURES.map(f => (
          <div
            key={f.label}
            className={`${styles.spotlight} ${f.reverse ? styles.reverse : ''}`}
            style={{ '--feat': f.color }}
          >
            {/* Text */}
            <div className={styles.spotText}>
              <span className={styles.spotLabel}>{f.label}</span>
              <h3 className={styles.spotTitle}>{f.title}</h3>
              <p className={styles.spotDesc}>{f.desc}</p>
              <ul className={styles.bullets}>
                {f.bullets.map(b => (
                  <li key={b} className={styles.bullet}>
                    <span className={styles.bulletDot} style={{ background: f.color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock UI */}
            <div className={styles.spotMock}>
              <div className={styles.spotMockCard}>
                <f.Mock />
              </div>
              <div className={styles.spotGlow} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
