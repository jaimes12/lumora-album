import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './EventoDetallePage.module.css'
import { eventosApi } from '../api/eventosApi'
import { clientesApi } from '../api/clientesApi'
import { proveedoresApi } from '../api/proveedoresApi'
import { ESTADO_META, TIPO_EMOJI, CAT_COLOR, fmt } from '../data/eventosData'
import { findOrCreateLeadByPhone } from '../api/leadsApi'

function ChatBtn({ onClick }) {
  return (
    <button className={styles.chatBtn} onClick={onClick} title="Abrir chat">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  )
}

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

  const [evento,        setEvento]        = useState(null)
  const [cliente,       setCliente]       = useState(null)
  const [proveedores,   setProveedores]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [showAddPago,   setShowAddPago]   = useState(false)
  const [nuevoPago,     setNuevoPago]     = useState({ concepto: '', monto: '', metodo: 'transfer' })
  const [savingPago,    setSavingPago]    = useState(false)
  const [linkedIds,     setLinkedIds]     = useState([])
  const [openingChat,   setOpeningChat]   = useState(false)

  useEffect(() => {
    Promise.all([
      eventosApi.getById(id),
      proveedoresApi.getAll(),
    ]).then(([ev, provs]) => {
      setEvento(ev)
      setProveedores(provs)
      if (ev?.clienteId) {
        clientesApi.getById(ev.clienteId)
          .then(setCliente)
          .catch(() => setCliente({ nombre: ev.clienteNombre ?? ev.clienteId, email: '', telefono: '', avatar: (ev.clienteNombre ?? 'C')[0] }))
      }
    }).catch(() => setEvento(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: 14 }}>
      Cargando evento…
    </div>
  )

  if (!evento) return (
    <div className={styles.notFound}>
      <p>Evento no encontrado.</p>
      <button onClick={() => navigate('/app/eventos')}>← Volver</button>
    </div>
  )

  const meta      = ESTADO_META[evento.estado] ?? ESTADO_META.lead
  const abonado   = evento.pagos.reduce((s, p) => s + p.monto, 0)
  const pendiente = evento.presupuestoTotal - abonado
  const pct       = evento.presupuestoTotal > 0 ? Math.min(100, Math.round((abonado / evento.presupuestoTotal) * 100)) : 0

  // vendors linked to this event (we manage locally for now since backend doesn't have event-vendor relation yet)
  const linkedProvs  = proveedores.filter(p => linkedIds.includes(p.id))
  const disponibles  = proveedores.filter(p => !linkedIds.includes(p.id))

  const agregarProveedor = (pid) => { setLinkedIds(ids => [...ids, pid]); setShowAddVendor(false) }
  const quitarProveedor  = (pid) => setLinkedIds(ids => ids.filter(i => i !== pid))

  const agregarPago = async () => {
    if (!nuevoPago.concepto || !nuevoPago.monto) return
    setSavingPago(true)
    try {
      const saved = await eventosApi.addPayment(id, {
        concept: nuevoPago.concepto,
        amount: parseFloat(nuevoPago.monto),
        method: nuevoPago.metodo,
      })
      const pagoFront = {
        id: saved.id,
        concepto: saved.concept,
        monto: saved.amount,
        fecha: new Date(saved.paidAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
        metodo: saved.method,
      }
      setEvento(e => ({ ...e, pagos: [...e.pagos, pagoFront] }))
      setNuevoPago({ concepto: '', monto: '', metodo: 'transfer' })
      setShowAddPago(false)
    } catch {
      alert('Error al guardar el pago')
    } finally {
      setSavingPago(false)
    }
  }

  const cambiarEstado = async (nuevoEstado) => {
    setEvento(e => ({ ...e, estado: nuevoEstado }))
    await eventosApi.update(id, { status: nuevoEstado }).catch(() => {})
  }

  const abrirChat = async (phone, name) => {
    if (!phone) return
    setOpeningChat(true)
    try {
      const lead = await findOrCreateLeadByPhone(phone, name)
      navigate('/app/chats', { state: { openLeadId: lead.id } })
    } catch { alert('No se pudo abrir el chat') }
    finally { setOpeningChat(false) }
  }

  const abrirChatCliente   = () => abrirChat(cliente?.telefono, cliente?.nombre ?? evento?.clienteNombre)
  const abrirChatProveedor = (p) => abrirChat(p.telefono, p.nombre)

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/app/eventos')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Eventos
        </button>
        <div className={styles.topActions}>
          <select className={styles.statusSelect} value={evento.estado}
            style={{ color: meta.color, borderColor: meta.color + '44', background: meta.bg }}
            onChange={e => cambiarEstado(e.target.value)}>
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
              {evento.venue || 'Por confirmar'}
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
                  <option value="transfer">Transferencia</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="check">Cheque</option>
                </select>
                <button className={styles.btnGuardarPago} onClick={agregarPago} disabled={savingPago}>
                  {savingPago ? 'Guardando…' : 'Guardar'}
                </button>
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
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>👤 Cliente</span>
              <button className={styles.btnLink}>Ver perfil →</button>
            </div>
            <div className={styles.clienteWrap}>
              <div className={styles.clienteAvatar}>
                {(cliente?.nombre ?? evento.clienteNombre ?? 'C').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
              </div>
              <div className={styles.clienteInfo}>
                <span className={styles.clienteNombre}>{cliente?.nombre ?? evento.clienteNombre}</span>
                {cliente?.email && <a className={styles.clienteContact} href={`mailto:${cliente.email}`}>{cliente.email}</a>}
                {cliente?.telefono && <a className={styles.clienteContact} href={`tel:${cliente.telefono}`}>{cliente.telefono}</a>}
              </div>
              <ChatBtn onClick={abrirChatCliente} />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>
                🏪 Proveedores
                <span className={styles.badge}>{linkedProvs.length}</span>
              </span>
              <button className={styles.btnLink} onClick={() => setShowAddVendor(v => !v)}>+ Vincular</button>
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

            {linkedProvs.length === 0
              ? <p className={styles.sinProveedores}>Sin proveedores vinculados</p>
              : <div className={styles.vendorList}>
                  {linkedProvs.map(p => (
                    <div key={p.id} className={styles.vendorCard}>
                      <div className={styles.vendorIcon}
                        style={{ background: (CAT_COLOR[p.categoria] || '#7c6af7') + '22', color: CAT_COLOR[p.categoria] || '#7c6af7' }}>
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
                        <div className={styles.vendorActions}>
                          <ChatBtn onClick={() => abrirChatProveedor(p)} />
                          <button className={styles.vendorRemove} onClick={() => quitarProveedor(p.id)} title="Quitar">✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </section>
        </div>
      </div>
    </div>
  )
}
