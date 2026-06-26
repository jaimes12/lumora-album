import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './EventoDetallePage.module.css'
import { eventosApi } from '../api/eventosApi'
import { clientesApi } from '../api/clientesApi'
import { proveedoresApi } from '../api/proveedoresApi'
import { api } from '../api/apiClient'
import { ESTADO_META, CAT_COLOR, fmt } from '../data/eventosData'
import { useSettings } from '../context/SettingsContext'
import EventoTipoIcon from '../components/EventoTipoIcon'
import { findOrCreateLeadByPhone, findLeadByPhone, leadsApi } from '../api/leadsApi'
import { ChatModal } from './ChatPage'
import { useStages } from '../hooks/useStages'
import EventProductsSection from '../components/EventProductsSection'

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

const TIPOS = [
  'Boda', 'XV Años', 'Bautizo', 'Primera Comunión', 'Graduación',
  'Cumpleaños', 'Baby Shower', 'Revelación de Sexo', 'Aniversario',
  'Despedida de Soltera', 'Corporativo', 'Conferencia',
  'Lanzamiento de Producto', 'Inauguración', 'Empresarial', 'Reunión', 'Otro',
]

/* ─── Edit modal ─────────────────────────────────────────── */
function EditEventModal({ evento, onSave, onClose }) {
  const [form, setForm] = useState({
    nombre:      evento.nombre,
    tipo:        evento.tipo,
    fecha:       evento.dateISO,
    hora:        evento.hora,
    createdAt:   evento.createdAtISO,
    venue:       evento.venue,
    invitados:   String(evento.invitados),
    presupuesto: String(evento.presupuestoTotal),
    notas:       evento.notas,
    createdById: evento.createdById ?? '',
  })
  const [team,   setTeam]   = useState([])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    api.get('/api/workers/team').then(setTeam).catch(() => {})
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    try {
      const eventDate   = new Date(`${form.fecha}T${form.hora || '00:00'}`)
      const createdDate = form.createdAt ? new Date(`${form.createdAt}T12:00:00`) : undefined
      const updated = await eventosApi.update(evento.id, {
        name:        form.nombre.trim(),
        type:        form.tipo,
        venueId:     form.venue.trim() || null,
        eventDate:   eventDate.toISOString(),
        budget:      parseFloat(form.presupuesto) || 0,
        guestCount:  parseInt(form.invitados)     || 0,
        notes:       form.notas.trim()            || null,
        createdAt:   createdDate?.toISOString(),
        createdById: form.createdById || null,
      })
      onSave(updated)
    } catch { setError('Error al guardar los cambios.') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.editOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.editModal}>
        <div className={styles.editModalHeader}>
          <h3 className={styles.editModalTitle}>Editar evento</h3>
          <button className={styles.editModalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className={styles.editModalBody} onSubmit={handleSubmit}>
          {error && <div className={styles.editError}>{error}</div>}

          <div className={styles.editRow}>
            <div className={styles.editField} style={{ flex: 2 }}>
              <label>Nombre del evento *</label>
              <input value={form.nombre} onChange={set('nombre')} required />
            </div>
            <div className={styles.editField}>
              <label>Tipo</label>
              <select value={form.tipo} onChange={set('tipo')}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.editRow}>
            <div className={styles.editField}>
              <label>Fecha del evento</label>
              <input type="date" value={form.fecha} onChange={set('fecha')} />
            </div>
            <div className={styles.editField}>
              <label>Hora</label>
              <input type="time" value={form.hora} onChange={set('hora')} />
            </div>
          </div>

          <div className={styles.editField}>
            <label>Fecha de registro</label>
            <input type="date" value={form.createdAt} onChange={set('createdAt')} />
          </div>

          {team.length > 0 && (
            <div className={styles.editField}>
              <label>Agregado por</label>
              <select value={form.createdById} onChange={set('createdById')}>
                <option value="">— Sin asignar —</option>
                {team.map(u => (
                  <option key={u.id} value={u.id}>{u.name}{u.role === 'admin' ? ' (admin)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.editField}>
            <label>Lugar / Venue</label>
            <input value={form.venue} onChange={set('venue')} placeholder="Nombre o dirección del lugar" />
          </div>

          <div className={styles.editRow}>
            <div className={styles.editField}>
              <label>Invitados</label>
              <input type="number" min="0" value={form.invitados} onChange={set('invitados')} placeholder="0" />
            </div>
            <div className={styles.editField}>
              <label>Presupuesto total ($)</label>
              <input type="number" min="0" step="0.01" value={form.presupuesto} onChange={set('presupuesto')} placeholder="0" />
            </div>
          </div>

          <div className={styles.editField}>
            <label>Notas</label>
            <textarea value={form.notas} onChange={set('notas')} rows={3} placeholder="Observaciones del evento…" />
          </div>

          <div className={styles.editActions}>
            <button type="button" className={styles.editBtnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.editBtnSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main page ───────────────────────────────────────────── */
export default function EventoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fmtMoney, currency } = useSettings()

  const [evento,        setEvento]        = useState(null)
  const [cliente,       setCliente]       = useState(null)
  const [proveedores,   setProveedores]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [showAddPago,   setShowAddPago]   = useState(false)
  const [nuevoPago,     setNuevoPago]     = useState({ concepto: '', monto: '', metodo: 'transfer' })
  const [savingPago,    setSavingPago]    = useState(false)
  const [editandoPago,  setEditandoPago]  = useState(null) // { pagoId, concepto, monto, metodo }
  const [linkedIds,     setLinkedIds]     = useState([])
  const [openingChat,   setOpeningChat]   = useState(false)
  const [chatLead,      setChatLead]      = useState(null)
  const [clienteLead,   setClienteLead]   = useState(null)
  const [stages]                          = useStages()
  // Photos
  const [fotos,         setFotos]         = useState([])
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const fotoInputRef = useRef(null)

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

  // Find WhatsApp lead for the client (no create)
  useEffect(() => {
    const phone = cliente?.telefono
    if (!phone) return
    findLeadByPhone(phone).then(setClienteLead).catch(() => {})
  }, [cliente?.telefono])

  // Hooks must all be before any conditional returns
  useEffect(() => {
    if (id) eventosApi.getPhotos(id).then(setFotos).catch(() => {})
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

  const eliminarPago = async (pagoId) => {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      await eventosApi.deletePayment(id, pagoId)
      setEvento(e => ({ ...e, pagos: e.pagos.filter(p => p.id !== pagoId) }))
    } catch {
      alert('Error al eliminar el pago')
    }
  }

  const guardarEdicionPago = async () => {
    if (!editandoPago || !editandoPago.concepto.trim() || !editandoPago.monto) return
    try {
      const updated = await eventosApi.updatePayment(id, editandoPago.pagoId, {
        concept: editandoPago.concepto.trim(),
        amount: parseFloat(editandoPago.monto),
        method: editandoPago.metodo,
      })
      setEvento(e => ({
        ...e,
        pagos: e.pagos.map(p => p.id !== editandoPago.pagoId ? p : {
          ...p,
          concepto: updated.concept,
          monto: updated.amount,
          metodo: updated.method,
        }),
      }))
      setEditandoPago(null)
    } catch {
      alert('Error al guardar el pago')
    }
  }

  const cambiarEstado = async (nuevoEstado) => {
    setEvento(e => ({ ...e, estado: nuevoEstado }))
    await eventosApi.update(id, { status: nuevoEstado }).catch(() => {})
  }

  const handleEditSave = (updated) => {
    setEvento(prev => ({ ...prev, ...updated }))
    setShowEditModal(false)
  }

  const abrirChat = async (phone, name) => {
    if (!phone) return
    setOpeningChat(true)
    try {
      const lead = await findOrCreateLeadByPhone(phone, name)
      setChatLead(lead)
    } catch { alert('No se pudo abrir el chat') }
    finally { setOpeningChat(false) }
  }

  const abrirChatCliente   = () => abrirChat(cliente?.telefono, cliente?.nombre ?? evento?.clienteNombre)
  const abrirChatProveedor = (p) => abrirChat(p.telefono, p.nombre)

  const subirFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadingFoto(true)
    try {
      // Compress via canvas before sending
      const dataUrl = await new Promise(resolve => {
        const img = new Image(); const url = URL.createObjectURL(file)
        img.onload = () => {
          const max = 1600; let { width, height } = img
          if (Math.max(width, height) > max) {
            const r = max / Math.max(width, height); width = Math.round(width*r); height = Math.round(height*r)
          }
          const c = document.createElement('canvas'); c.width = width; c.height = height
          c.getContext('2d').drawImage(img, 0, 0, width, height)
          URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.85))
        }
        img.src = url
      })
      const base64 = dataUrl.split(',')[1]
      const foto = await eventosApi.addPhoto(id, base64)
      setFotos(prev => [foto, ...prev])
    } catch { alert('No se pudo subir la foto') }
    finally { setUploadingFoto(false) }
  }

  const eliminarFoto = async (photoId) => {
    if (!window.confirm('¿Eliminar esta foto?')) return
    await eventosApi.deletePhoto(id, photoId).catch(() => {})
    setFotos(prev => prev.filter(f => f.id !== photoId))
  }

  return (
    <div className={styles.page}>
      {/* ── Real Chat Modal ── */}
      {chatLead && (
        <ChatModal
          lead={chatLead}
          stages={DEFAULT_STAGES}
          onClose={() => setChatLead(null)}
          onLeadUpdate={() => {}}
        />
      )}

      {/* ── Edit modal ── */}
      {showEditModal && (
        <EditEventModal
          evento={evento}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
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
          <select className={styles.statusSelect} value={evento.estado}
            style={{ color: meta.color, borderColor: meta.color + '44', background: meta.bg }}
            onChange={e => cambiarEstado(e.target.value)}>
            {Object.entries(ESTADO_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button className={styles.btnEdit} onClick={() => setShowEditModal(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <EventoTipoIcon tipo={evento.tipo} size={28} />
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
          {evento.createdByName && (
            <span className={styles.createdBy}>Agregado por {evento.createdByName}</span>
          )}
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
                <span className={styles.finTotal}>{fmtMoney(evento.presupuestoTotal)}</span>
              </div>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Abonado</span>
                <span className={styles.finAbonado}>{fmtMoney(abonado)}</span>
              </div>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Por liquidar</span>
                <span className={`${styles.finPendiente} ${pendiente === 0 ? styles.finPagado : ''}`}>
                  {pendiente === 0 ? '✓ Liquidado' : fmtMoney(pendiente)}
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
                  {evento.pagos.map(p => {
                    const isEditing = editandoPago?.pagoId === p.id
                    if (isEditing) return (
                      <div key={p.id} className={styles.pagoRowEdit}>
                        <input
                          className={styles.pagoEditInput}
                          value={editandoPago.concepto}
                          onChange={e => setEditandoPago(prev => ({ ...prev, concepto: e.target.value }))}
                          placeholder="Concepto"
                        />
                        <input
                          className={styles.pagoEditInputSm}
                          type="number" min="0.01" step="0.01"
                          value={editandoPago.monto}
                          onChange={e => setEditandoPago(prev => ({ ...prev, monto: e.target.value }))}
                        />
                        <select
                          className={styles.pagoEditSelect}
                          value={editandoPago.metodo}
                          onChange={e => setEditandoPago(prev => ({ ...prev, metodo: e.target.value }))}
                        >
                          <option value="transfer">Transferencia</option>
                          <option value="cash">Efectivo</option>
                          <option value="card">Tarjeta</option>
                          <option value="check">Cheque</option>
                        </select>
                        <button className={styles.pagoSaveBtn} onClick={guardarEdicionPago}>✓</button>
                        <button className={styles.pagoDeleteBtn} onClick={() => setEditandoPago(null)}>✕</button>
                      </div>
                    )
                    return (
                      <div key={p.id} className={styles.pagoRow}>
                        <div className={styles.pagoInfo}>
                          <span className={styles.pagoConcepto}>{p.concepto}</span>
                          <span className={styles.pagoFechaMetodo}>{p.fecha} · {p.metodo}</span>
                        </div>
                        <span className={styles.pagoMonto}>{fmtMoney(p.monto)}</span>
                        <div className={styles.pagoRowBtns}>
                          <button className={styles.pagoEditBtn} onClick={() => setEditandoPago({ pagoId: p.id, concepto: p.concepto, monto: String(p.monto), metodo: p.metodo })} title="Editar">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className={styles.pagoDeleteBtn} onClick={() => eliminarPago(p.id)} title="Eliminar">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
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

          {/* ── Productos y servicios del evento ── */}
          <section className={styles.card}>
            <EventProductsSection eventId={id} />
          </section>

          {/* ── Fotos de referencia ── */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>🖼️ Fotos de referencia</span>
              <button
                className={styles.btnLink}
                onClick={() => fotoInputRef.current?.click()}
                disabled={uploadingFoto}
              >
                {uploadingFoto ? 'Subiendo…' : '+ Subir foto'}
              </button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={subirFoto}
              />
            </div>
            {fotos.length === 0
              ? <p className={styles.sinPagos}>Sin fotos de referencia aún</p>
              : <div className={styles.fotosGrid}>
                  {fotos.map(f => (
                    <div key={f.id} className={styles.fotoCard}>
                      <a href={f.url} target="_blank" rel="noreferrer">
                        <img src={f.url} alt={f.caption || 'Referencia'} className={styles.fotoImg} loading="lazy" />
                      </a>
                      {f.caption && <p className={styles.fotoCaption}>{f.caption}</p>}
                      <button
                        className={styles.fotoDeleteBtn}
                        onClick={() => eliminarFoto(f.id)}
                        title="Eliminar"
                      >✕</button>
                    </div>
                  ))}
                </div>
            }
          </section>
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
            {clienteLead && (() => {
              const stageColor = stages.find(s => s.id === clienteLead.stage)?.color ?? '#64748b'
              return (
                <div className={styles.leadStageRow}>
                  <span className={styles.leadStageLabel}>Embudo</span>
                  <select
                    className={styles.leadStageSelect}
                    value={clienteLead.stage}
                    style={{ borderColor: stageColor, color: stageColor }}
                    onChange={async e => {
                      const newStage = e.target.value
                      setClienteLead(prev => ({ ...prev, stage: newStage }))
                      await leadsApi.update(clienteLead.id, { stage: newStage }).catch(() => {})
                    }}
                  >
                    {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              )
            })()}
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
