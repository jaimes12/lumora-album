import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './EventoDetallePage.module.css'
import {
  EVENTOS, CLIENTES, PROVEEDORES,
  ESTADO_META, TIPO_EMOJI, CAT_COLOR, fmt
} from '../data/eventosData'

/* ─── Mock conversations ──────────────────────────────────── */
const CHATS = {
  c1: [
    { id: 1, texto: '¡Hola! ¿Ya confirmaron los 8 meseros para el cóctel?', tipo: 'in',  hora: '10:30 am' },
    { id: 2, texto: 'Sí Fernanda, ya están confirmados. 8 para cóctel y 12 para recepción.', tipo: 'out', hora: '10:38 am' },
    { id: 3, texto: 'Perfecto 🙌 ¿Y el pastel ya está listo con la pastelería?', tipo: 'in',  hora: '10:40 am' },
    { id: 4, texto: 'Sí, confirmado con Dulce Arte. Te comparto el diseño mañana.', tipo: 'out', hora: '10:45 am' },
    { id: 5, texto: '¡Gracias! Ya estoy muy emocionada 💍', tipo: 'in',  hora: '10:46 am' },
  ],
  c2: [
    { id: 1, texto: 'Buenos días, ¿ya está lista la propuesta para el evento Q3?', tipo: 'in',  hora: '9:00 am' },
    { id: 2, texto: 'Buenos días Carlos. Sí, te la envío en un momento.', tipo: 'out', hora: '9:05 am' },
    { id: 3, texto: '¿Pueden enviarme la factura antes del viernes?', tipo: 'in',  hora: '9:15 am' },
  ],
  c3: [
    { id: 1, texto: 'Ya revisamos la cotización. Todo bien con el menú.', tipo: 'in',  hora: 'Ayer 3:00 pm' },
    { id: 2, texto: 'Perfecto Ana, queda confirmado el menú degustación.', tipo: 'out', hora: 'Ayer 3:10 pm' },
    { id: 3, texto: 'Muchas gracias 🙏 Sofía está muy emocionada', tipo: 'in',  hora: 'Ayer 6:30 pm' },
  ],
  c4: [
    { id: 1, texto: 'Buen día, ¿ya tienen presupuesto para la graduación?', tipo: 'in',  hora: 'Lun 10:00 am' },
    { id: 2, texto: 'Sí Roberto, estamos preparando la cotización.', tipo: 'out', hora: 'Lun 10:30 am' },
  ],
  c5: [
    { id: 1, texto: 'Ya hice el depósito del 100% ✓', tipo: 'in',  hora: 'Ayer 5:00 pm' },
    { id: 2, texto: 'Confirmado Mónica, todo listo para el 8 de julio 🎉', tipo: 'out', hora: 'Ayer 5:10 pm' },
  ],
  c6: [
    { id: 1, texto: 'Hola! Cuándo podemos vernos para ver opciones de venue?', tipo: 'in',  hora: 'Hoy 11:00 am' },
    { id: 2, texto: 'Hola Valeria, te propongo el miércoles a las 4pm.', tipo: 'out', hora: 'Hoy 11:20 am' },
    { id: 3, texto: 'Me viene perfecto, ahí nos vemos 😊', tipo: 'in',  hora: 'Hoy 11:25 am' },
  ],
  p1: [
    { id: 1, texto: 'Buenos días, les confirmo disponibilidad para el 14 de junio.', tipo: 'in',  hora: 'Lun 9:00 am' },
    { id: 2, texto: 'Perfecto! Quedamos confirmados entonces.', tipo: 'out', hora: 'Lun 9:15 am' },
    { id: 3, texto: '¿A qué hora llego para el montaje?', tipo: 'in',  hora: 'Lun 9:20 am' },
    { id: 4, texto: 'A las 3pm para que estés listo a las 6pm.', tipo: 'out', hora: 'Lun 9:25 am' },
  ],
  p2: [
    { id: 1, texto: 'El menú está listo. ¿Confirman 180 personas?', tipo: 'in',  hora: 'Mar 2:00 pm' },
    { id: 2, texto: 'Sí, 180 confirmados. Incluye mesa de niños para 20.', tipo: 'out', hora: 'Mar 2:10 pm' },
  ],
  p3: [
    { id: 1, texto: 'Las flores que pidieron ya están apartadas 🌸', tipo: 'in',  hora: 'Hoy 8:00 am' },
    { id: 2, texto: 'Excelente! ¿Confirmas el tono de rosas?', tipo: 'out', hora: 'Hoy 8:30 am' },
    { id: 3, texto: 'Rosa pálido con blanco, como acordamos.', tipo: 'in',  hora: 'Hoy 8:35 am' },
  ],
  p4: [
    { id: 1, texto: 'Ya tengo el setlist listo para revisar.', tipo: 'in',  hora: 'Ayer 7:00 pm' },
    { id: 2, texto: 'Mándalo por aquí y lo vemos.', tipo: 'out', hora: 'Ayer 7:10 pm' },
  ],
  p5: [
    { id: 1, texto: 'El salón principal está reservado para ustedes.', tipo: 'in',  hora: 'Vie 10:00 am' },
    { id: 2, texto: 'Gracias, ¿incluye el área del jardín también?', tipo: 'out', hora: 'Vie 10:15 am' },
    { id: 3, texto: 'Sí, jardín y terraza sin costo adicional.', tipo: 'in',  hora: 'Vie 10:20 am' },
  ],
}

const getChat = (id) => CHATS[id] || []

/* ─── Chat Modal ──────────────────────────────────────────── */
function ChatModal({ contacto, onClose }) {
  const [msgs, setMsgs]   = useState(getChat(contacto.id))
  const [texto, setTexto] = useState('')
  const bottomRef         = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const enviar = () => {
    if (!texto.trim()) return
    setMsgs(m => [...m, { id: Date.now(), texto, tipo: 'out', hora: 'Ahora' }])
    setTexto('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar} style={contacto.avatarStyle}>
            {contacto.avatar}
          </div>
          <div className={styles.modalContactInfo}>
            <span className={styles.modalNombre}>{contacto.nombre}</span>
            <span className={styles.modalSub}>{contacto.sub}</span>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className={styles.modalMsgs}>
          {msgs.length === 0 && (
            <div className={styles.modalEmpty}>
              Sin mensajes aún. ¡Inicia la conversación!
            </div>
          )}
          {msgs.map(m => (
            <div key={m.id} className={`${styles.msgWrap} ${m.tipo === 'out' ? styles.msgOut : ''}`}>
              <div className={`${styles.bubble} ${m.tipo === 'out' ? styles.bubbleOut : styles.bubbleIn}`}>
                <p>{m.texto}</p>
                <span className={styles.bubbleHora}>{m.hora}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.modalInput}>
          <textarea
            className={styles.modalTextarea}
            placeholder="Escribe un mensaje..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button className={styles.modalSend} onClick={enviar} disabled={!texto.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

/* ─── Chat button ─────────────────────────────────────────── */
function ChatBtn({ onClick }) {
  return (
    <button className={styles.chatBtn} onClick={onClick} title="Abrir chat">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  )
}

/* ─── Helpers ─────────────────────────────────────────────── */
function StarRating({ val }) {
  return (
    <span className={styles.stars}>
      {'★'.repeat(Math.round(val))}{'☆'.repeat(5 - Math.round(val))}
      <span className={styles.starVal}>{val}</span>
    </span>
  )
}

/* ─── Main page ───────────────────────────────────────────── */
export default function EventoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const eventoInit = EVENTOS.find(e => e.id === id)

  const [evento,       setEvento]       = useState(eventoInit)
  const [showAddVendor,setShowAddVendor]= useState(false)
  const [showAddPago,  setShowAddPago]  = useState(false)
  const [nuevoPago,    setNuevoPago]    = useState({ concepto: '', monto: '', metodo: 'Transferencia' })
  const [chatContacto, setChatContacto] = useState(null)

  if (!evento) return (
    <div className={styles.notFound}>
      <p>Evento no encontrado.</p>
      <button onClick={() => navigate('/app/eventos')}>← Volver</button>
    </div>
  )

  const cliente    = CLIENTES[evento.clienteId]
  const meta       = ESTADO_META[evento.estado]
  const abonado    = evento.pagos.reduce((s, p) => s + p.monto, 0)
  const pendiente  = evento.presupuestoTotal - abonado
  const pct        = Math.min(100, Math.round((abonado / evento.presupuestoTotal) * 100))
  const disponibles = Object.values(PROVEEDORES).filter(p => !evento.proveedorIds.includes(p.id))

  const abrirChatCliente = () => setChatContacto({
    id: evento.clienteId,
    nombre: cliente.nombre,
    avatar: cliente.avatar,
    sub: cliente.telefono,
    avatarStyle: { background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' },
  })

  const abrirChatProveedor = (p) => setChatContacto({
    id: p.id,
    nombre: p.nombre,
    avatar: p.categoria[0],
    sub: `${p.categoria} · ${p.telefono}`,
    avatarStyle: { background: CAT_COLOR[p.categoria] + '33', color: CAT_COLOR[p.categoria] },
  })

  const quitarProveedor = (pid) =>
    setEvento(e => ({ ...e, proveedorIds: e.proveedorIds.filter(id => id !== pid) }))

  const agregarProveedor = (pid) => {
    setEvento(e => ({ ...e, proveedorIds: [...e.proveedorIds, pid] }))
    setShowAddVendor(false)
  }

  const agregarPago = () => {
    if (!nuevoPago.concepto || !nuevoPago.monto) return
    const pago = {
      id: `p_${Date.now()}`,
      concepto: nuevoPago.concepto,
      monto: parseFloat(nuevoPago.monto),
      fecha: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
      metodo: nuevoPago.metodo,
    }
    setEvento(e => ({ ...e, pagos: [...e.pagos, pago] }))
    setNuevoPago({ concepto: '', monto: '', metodo: 'Transferencia' })
    setShowAddPago(false)
  }

  return (
    <div className={styles.page}>

      {/* Chat modal */}
      {chatContacto && (
        <ChatModal contacto={chatContacto} onClose={() => setChatContacto(null)} />
      )}

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/app/eventos')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Eventos
        </button>
        <div className={styles.topActions}>
          <select
            className={styles.statusSelect}
            value={evento.estado}
            style={{ color: meta.color, borderColor: meta.color + '44', background: meta.bg }}
            onChange={e => setEvento(ev => ({ ...ev, estado: e.target.value }))}
          >
            {Object.entries(ESTADO_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button className={styles.btnEdit}>Editar</button>
          <button className={styles.btnCotizar}>Crear cotización</button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <span className={styles.heroEmoji}>{TIPO_EMOJI[evento.tipo] || '📅'}</span>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroTitle}>{evento.nombre}</h1>
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {evento.fecha} · {evento.hora}
            </span>
            <span className={styles.heroMetaItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {evento.venue}
            </span>
            <span className={styles.heroMetaItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              {evento.invitados} invitados
            </span>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className={styles.mainGrid}>

        {/* LEFT */}
        <div className={styles.leftCol}>

          {/* Financiero */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>💰 Resumen financiero</span>
            </div>
            <div className={styles.finGrid}>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Total del evento</span>
                <span className={styles.finTotal}>{fmt(evento.presupuestoTotal)}</span>
              </div>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Abonado</span>
                <span className={styles.finAbonado}>{fmt(abonado)}</span>
              </div>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Por liquidar</span>
                <span className={`${styles.finPendiente} ${pendiente === 0 ? styles.finPagado : ''}`}>
                  {pendiente === 0 ? '✓ Liquidado' : fmt(pendiente)}
                </span>
              </div>
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.progressPct}>{pct}% cobrado</span>
            </div>
            <div className={styles.pagosHeader}>
              <span className={styles.pagosTitle}>Historial de pagos</span>
              <button className={styles.btnAddPago} onClick={() => setShowAddPago(v => !v)}>
                + Registrar pago
              </button>
            </div>
            {showAddPago && (
              <div className={styles.pagoForm}>
                <input className={styles.pagoInput} placeholder="Concepto (ej. Anticipo 50%)"
                  value={nuevoPago.concepto} onChange={e => setNuevoPago(p => ({ ...p, concepto: e.target.value }))} />
                <input className={styles.pagoInput} type="number" placeholder="Monto en $"
                  value={nuevoPago.monto} onChange={e => setNuevoPago(p => ({ ...p, monto: e.target.value }))} />
                <select className={styles.pagoSelect} value={nuevoPago.metodo}
                  onChange={e => setNuevoPago(p => ({ ...p, metodo: e.target.value }))}>
                  {['Transferencia', 'Efectivo', 'Tarjeta', 'CoDi', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                </select>
                <button className={styles.btnGuardarPago} onClick={agregarPago}>Guardar</button>
              </div>
            )}
            {evento.pagos.length === 0
              ? <p className={styles.sinPagos}>Sin pagos registrados aún</p>
              : <div className={styles.pagosList}>
                  {evento.pagos.map(p => (
                    <div key={p.id} className={styles.pagoRow}>
                      <div className={styles.pagoInfo}>
                        <span className={styles.pagoConcepto}>{p.concepto}</span>
                        <span className={styles.pagoFechaMetodo}>{p.fecha} · {p.metodo}</span>
                      </div>
                      <span className={styles.pagoMonto}>{fmt(p.monto)}</span>
                    </div>
                  ))}
                </div>
            }
          </section>

          {evento.notas && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>📝 Notas del evento</span>
              </div>
              <p className={styles.notasText}>{evento.notas}</p>
            </section>
          )}
        </div>

        {/* RIGHT */}
        <div className={styles.rightCol}>

          {/* Cliente */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>👤 Cliente</span>
              <button className={styles.btnLink}>Ver perfil →</button>
            </div>
            <div className={styles.clienteWrap}>
              <div className={styles.clienteAvatar}>{cliente?.avatar}</div>
              <div className={styles.clienteInfo}>
                <span className={styles.clienteNombre}>{cliente?.nombre}</span>
                <a className={styles.clienteContact} href={`mailto:${cliente?.email}`}>{cliente?.email}</a>
                <a className={styles.clienteContact} href={`tel:${cliente?.telefono}`}>{cliente?.telefono}</a>
              </div>
              <ChatBtn onClick={abrirChatCliente} />
            </div>
          </section>

          {/* Proveedores */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>
                🏪 Proveedores
                <span className={styles.badge}>{evento.proveedorIds.length}</span>
              </span>
              <button className={styles.btnLink} onClick={() => setShowAddVendor(v => !v)}>
                + Vincular
              </button>
            </div>

            {showAddVendor && disponibles.length > 0 && (
              <div className={styles.vendorPicker}>
                {disponibles.map(p => (
                  <button key={p.id} className={styles.pickerItem} onClick={() => agregarProveedor(p.id)}>
                    <span className={styles.pickerDot} style={{ background: CAT_COLOR[p.categoria] || '#64748b' }} />
                    <span className={styles.pickerNombre}>{p.nombre}</span>
                    <span className={styles.pickerCat}>{p.categoria}</span>
                  </button>
                ))}
              </div>
            )}

            {evento.proveedorIds.length === 0
              ? <p className={styles.sinProveedores}>Sin proveedores vinculados</p>
              : <div className={styles.vendorList}>
                  {evento.proveedorIds.map(pid => {
                    const p = PROVEEDORES[pid]
                    if (!p) return null
                    return (
                      <div key={pid} className={styles.vendorCard}>
                        <div className={styles.vendorIcon}
                          style={{ background: CAT_COLOR[p.categoria] + '22', color: CAT_COLOR[p.categoria] }}>
                          {p.categoria[0]}
                        </div>
                        <div className={styles.vendorInfo}>
                          <span className={styles.vendorNombre}>{p.nombre}</span>
                          <div className={styles.vendorMeta}>
                            <span className={styles.vendorCat} style={{ color: CAT_COLOR[p.categoria] }}>{p.categoria}</span>
                            <StarRating val={p.rating} />
                          </div>
                          <span className={styles.vendorTel}>{p.telefono}</span>
                        </div>
                        <div className={styles.vendorRight}>
                          <span className={styles.vendorPrecio}>{fmt(p.precio)}</span>
                          <div className={styles.vendorActions}>
                            <ChatBtn onClick={() => abrirChatProveedor(p)} />
                            <button className={styles.vendorRemove} onClick={() => quitarProveedor(pid)} title="Quitar">✕</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className={styles.vendorTotal}>
                    <span>Costo estimado proveedores</span>
                    <span className={styles.vendorTotalVal}>
                      {fmt(evento.proveedorIds.reduce((s, pid) => s + (PROVEEDORES[pid]?.precio || 0), 0))}
                    </span>
                  </div>
                </div>
            }
          </section>

        </div>
      </div>
    </div>
  )
}
