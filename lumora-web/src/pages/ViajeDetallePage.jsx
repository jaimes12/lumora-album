import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { viajesApi } from '../api/viajesApi'
import { clientesApi } from '../api/clientesApi'
import styles from './ViajeDetallePage.module.css'

const ESTADOS_VIAJE = ['borrador', 'confirmado', 'completado', 'cancelado']
const ESTADO_COLOR = {
  borrador:   { bg: 'var(--bg-1)', color: 'var(--text-muted)', border: 'var(--border)' },
  confirmado: { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  completado: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  cancelado:  { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}
const ESTADO_PAX_COLOR = {
  pendiente:  { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
  confirmado: { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  cancelado:  { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}

const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

function whatsappUrl(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const full = digits.length === 10 ? `52${digits}` : digits
  return `https://wa.me/${full}`
}

// ── Agregar Pasajero Modal ─────────────────────────────────────────────────────
function AgregarPasajeroModal({ viaje, onClose, onAdded }) {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [clienteSel, setClienteSel] = useState(null)
  const [asientos, setAsientos] = useState(1)
  const [costoCustom, setCostoCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTel, setNuevoTel] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [savingCliente, setSavingCliente] = useState(false)

  useEffect(() => {
    clientesApi.getAll().then(setClientes).catch(() => {})
  }, [])

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono || '').includes(busqueda)
  )

  const costoTotal = costoCustom !== '' ? parseFloat(costoCustom) : (viaje.precioPorPersona * asientos)

  const handleCrearCliente = async (e) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) return
    setSavingCliente(true); setError('')
    try {
      const nuevo = await clientesApi.create({
        name: nuevoNombre.trim(),
        phone: nuevoTel.trim() || null,
        email: nuevoEmail.trim() || null,
        stage: 'client',
      })
      setClientes(prev => [...prev, nuevo])
      setClienteSel(nuevo)
      setBusqueda(nuevo.nombre)
      setCreandoCliente(false)
    } catch (err) {
      setError(err.message || 'Error al crear cliente')
    } finally {
      setSavingCliente(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clienteSel) { setError('Selecciona un pasajero'); return }
    setSaving(true); setError('')
    try {
      const nuevo = await viajesApi.addPassenger(viaje.id, {
        clientId: clienteSel.id,
        seats: asientos,
        totalCost: costoTotal,
      })
      onAdded(nuevo)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al agregar pasajero')
    } finally {
      setSaving(false)
    }
  }

  const showNoResults = busqueda.length > 0 && clientesFiltrados.length === 0 && !creandoCliente

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3>Agregar pasajero</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={creandoCliente ? handleCrearCliente : handleSubmit} className={styles.modalBody}>
          {!creandoCliente && (
            <>
              <div className={styles.field}>
                <label>
                  Buscar cliente
                  {clienteSel && <span className={styles.clienteSelBadge}>&#10003; {clienteSel.nombre}</span>}
                </label>
                <input
                  placeholder="Escribe nombre o teléfono…"
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setClienteSel(null) }}
                  autoFocus
                />
              </div>
              {busqueda.length > 0 && !clienteSel && (
                <div className={styles.clienteList}>
                  {clientesFiltrados.slice(0, 6).map(c => (
                    <button
                      key={c.id} type="button"
                      className={`${styles.clienteRow} ${clienteSel?.id === c.id ? styles.clienteRowSel : ''}`}
                      onClick={() => { setClienteSel(c); setBusqueda(c.nombre) }}
                    >
                      <span className={styles.clienteNombre}>{c.nombre}</span>
                      {c.telefono && <span className={styles.clienteTel}>{c.telefono}</span>}
                    </button>
                  ))}
                  {showNoResults && (
                    <div className={styles.noResultsWrap}>
                      <p className={styles.noResults}>Sin resultados para "{busqueda}"</p>
                      <button
                        type="button"
                        className={styles.btnCrearCliente}
                        onClick={() => { setNuevoNombre(busqueda); setCreandoCliente(true) }}
                      >
                        + Crear cliente "{busqueda}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {creandoCliente && (
            <div className={styles.nuevoClienteWrap}>
              <p className={styles.nuevoClienteTitle}>Nuevo cliente</p>
              <div className={styles.field}>
                <label>Nombre *</label>
                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required autoFocus />
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Teléfono</label>
                  <input type="tel" placeholder="55 1234 5678" value={nuevoTel} onChange={e => setNuevoTel(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" placeholder="correo@ejemplo.com" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} />
                </div>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => { setCreandoCliente(false); setError('') }}>
                  Volver
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={savingCliente || !nuevoNombre.trim()}>
                  {savingCliente ? 'Guardando…' : 'Crear y seleccionar'}
                </button>
              </div>
            </div>
          )}

          {!creandoCliente && (
            <>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Asientos</label>
                  <input type="number" min="1" value={asientos} onChange={e => setAsientos(parseInt(e.target.value) || 1)} />
                </div>
                <div className={styles.field}>
                  <label>Costo total ($)</label>
                  <input
                    type="number" min="0" step="0.01"
                    placeholder={`${costoTotal}`}
                    value={costoCustom}
                    onChange={e => setCostoCustom(e.target.value)}
                  />
                </div>
              </div>
              <p className={styles.costoHint}>
                Precio por defecto: {fmtMoney(viaje.precioPorPersona)} x {asientos} = {fmtMoney(viaje.precioPorPersona * asientos)}
              </p>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving || !clienteSel}>
                  {saving ? 'Guardando…' : clienteSel ? 'Agregar pasajero' : 'Selecciona un cliente'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Registrar Pago Modal ───────────────────────────────────────────────────────
function RegistrarPagoModal({ viaje, pasajero, onClose, onAdded }) {
  const [form, setForm] = useState({ concepto: 'Pago viaje', monto: '', metodo: 'transfer' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.monto || parseFloat(form.monto) <= 0) { setError('Ingresa un monto válido'); return }
    setSaving(true); setError('')
    try {
      const nuevo = await viajesApi.addPayment(viaje.id, pasajero.id, {
        concept: form.concepto,
        amount: parseFloat(form.monto),
        method: form.metodo,
      })
      onAdded(nuevo)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3>Registrar pago — {pasajero.clienteNombre}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.pendienteBanner}>
            Pendiente: <strong>{fmtMoney(pasajero.pendiente)}</strong>
          </div>
          <div className={styles.field}>
            <label>Concepto</label>
            <input value={form.concepto} onChange={setF('concepto')} required />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Monto ($)</label>
              <input type="number" min="0.01" step="0.01" value={form.monto} onChange={setF('monto')} required autoFocus />
            </div>
            <div className={styles.field}>
              <label>Metodo</label>
              <select value={form.metodo} onChange={setF('metodo')}>
                <option value="transfer">Transferencia</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="oxxo">OXXO</option>
              </select>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Trip Modal ────────────────────────────────────────────────────────────
function EditTripModal({ viaje, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: viaje.nombre,
    destino: viaje.destino,
    salida: viaje.salidaISO,
    regreso: viaje.regresoISO,
    precio: viaje.precioPorPersona,
    asientos: viaje.asientosTotal,
    notas: viaje.notas,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const updated = await viajesApi.update(viaje.id, {
        name: form.nombre,
        destination: form.destino,
        departureDate: form.salida,
        returnDate: form.regreso,
        pricePerPerson: parseFloat(form.precio),
        seatsTotal: parseInt(form.asientos),
        notes: form.notas,
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3>Editar viaje</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.field}>
            <label>Nombre del viaje *</label>
            <input value={form.nombre} onChange={setF('nombre')} required autoFocus />
          </div>
          <div className={styles.field}>
            <label>Destino *</label>
            <input value={form.destino} onChange={setF('destino')} required />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Fecha de salida</label>
              <input type="date" value={form.salida} onChange={setF('salida')} />
            </div>
            <div className={styles.field}>
              <label>Fecha de regreso</label>
              <input type="date" value={form.regreso} onChange={setF('regreso')} />
            </div>
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Precio por persona ($)</label>
              <input type="number" min="0" step="0.01" value={form.precio} onChange={setF('precio')} />
            </div>
            <div className={styles.field}>
              <label>Lugares totales</label>
              <input type="number" min="0" value={form.asientos} onChange={setF('asientos')} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Notas</label>
            <input value={form.notas} onChange={setF('notas')} placeholder="Informacion adicional…" />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Marketplace section ─────────────────────────────────────────────────────
function MarketplaceSection({ viaje, onUpdate }) {
  const [descripcion, setDescripcion] = useState(viaje.descripcion ?? '')
  const [savingToggle, setSavingToggle] = useState(false)
  const [savingDesc, setSavingDesc] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleToggle = async () => {
    setSavingToggle(true); setError('')
    try {
      const updated = await viajesApi.update(viaje.id, { isPublic: !viaje.publico })
      onUpdate({ publico: updated.publico })
    } catch (err) {
      setError(err.message || 'No se pudo actualizar')
    } finally {
      setSavingToggle(false)
    }
  }

  const handleSaveDesc = async () => {
    setSavingDesc(true); setError('')
    try {
      const updated = await viajesApi.update(viaje.id, { description: descripcion })
      onUpdate({ descripcion: updated.descripcion ?? '' })
    } catch (err) {
      setError(err.message || 'No se pudo guardar la descripción')
    } finally {
      setSavingDesc(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true); setError('')
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const base64 = dataUrl.split(',')[1]
      const photo = await viajesApi.addPhoto(viaje.id, { imageData: base64 })
      onUpdate({ fotos: [...(viaje.fotos ?? []), { id: photo.id, url: photo.url, caption: photo.caption }] })
    } catch (err) {
      setError(err.message || 'No se pudo subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    try {
      await viajesApi.deletePhoto(viaje.id, photoId)
      onUpdate({ fotos: (viaje.fotos ?? []).filter(f => f.id !== photoId) })
    } catch {}
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Marketplace</h2>
        {viaje.publico && (
          <a href={`/viajes/market/${viaje.id}`} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
            Ver en el marketplace ↗
          </a>
        )}
      </div>

      <div className={styles.marketplaceToggleRow}>
        <label className={styles.switch}>
          <input type="checkbox" checked={!!viaje.publico} disabled={savingToggle} onChange={handleToggle} />
          <span className={styles.switchSlider} />
        </label>
        <div>
          <p className={styles.marketplaceToggleLabel}>Publicar en el marketplace</p>
          <p className={styles.marketplaceToggleSub}>Gratis con tu cuenta. Cualquiera podrá ver este viaje en /viajes/market y contactarte.</p>
        </div>
      </div>

      <div className={styles.field} style={{ marginTop: 14 }}>
        <label>Descripción para el marketplace</label>
        <textarea
          rows={4}
          placeholder="Incluye qué incluye el viaje, itinerario, hospedaje, transporte…"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
        />
        <button
          type="button"
          className={styles.btnSecondary}
          style={{ alignSelf: 'flex-start', marginTop: 6 }}
          onClick={handleSaveDesc}
          disabled={savingDesc || descripcion === (viaje.descripcion ?? '')}
        >
          {savingDesc ? 'Guardando…' : 'Guardar descripción'}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <p className={styles.marketplaceToggleLabel}>Fotos</p>
        <div className={styles.photoGrid}>
          {(viaje.fotos ?? []).map(f => (
            <div key={f.id} className={styles.photoThumb}>
              <img src={f.url} alt="" />
              <button type="button" className={styles.photoDelete} onClick={() => handleDeletePhoto(f.id)}>×</button>
            </div>
          ))}
          <label className={styles.photoAdd}>
            {uploading ? '…' : '+'}
            <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
          </label>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ViajeDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [viaje, setViaje] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingStatus, setEditingStatus] = useState(false)
  const [showAddPax, setShowAddPax] = useState(false)
  const [pagoModal, setPagoModal] = useState(null)
  const [showEditTrip, setShowEditTrip] = useState(false)
  const [showAddGasto, setShowAddGasto] = useState(false)
  const [gastoForm, setGastoForm] = useState({ concepto: '', monto: '', pagado: false })
  const [savingGasto, setSavingGasto] = useState(false)
  const [gastoError, setGastoError] = useState('')
  const [expandedPax, setExpandedPax] = useState({})
  const [editandoPago, setEditandoPago] = useState(null) // { pasajeroId, pagoId, concepto, monto, metodo }

  const load = async () => {
    try {
      const data = await viajesApi.getById(id)
      setViaje(data)
    } catch (err) {
      setError('No se pudo cargar el viaje')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  const handleStatusChange = async (newStatus) => {
    setEditingStatus(false)
    try {
      const updated = await viajesApi.update(id, { status: newStatus })
      setViaje(prev => ({ ...prev, estado: updated.estado }))
    } catch {}
  }

  const handleRemovePax = async (pasajeroId) => {
    if (!confirm('Eliminar este pasajero?')) return
    try {
      await viajesApi.removePassenger(id, pasajeroId)
      setViaje(prev => ({ ...prev, pasajerosList: prev.pasajerosList.filter(p => p.id !== pasajeroId) }))
    } catch {}
  }

  const handleDeletePayment = async (pasajero, pagoId) => {
    if (!confirm('Eliminar este pago?')) return
    try {
      await viajesApi.deletePayment(id, pasajero.id, pagoId)
      setViaje(prev => ({
        ...prev,
        pasajerosList: prev.pasajerosList.map(p => {
          if (p.id !== pasajero.id) return p
          const pagos = p.pagos.filter(x => x.id !== pagoId)
          const pagado = pagos.reduce((s, x) => s + x.monto, 0)
          return { ...p, pagos, pagado, pendiente: p.costoTotal - pagado }
        }),
      }))
    } catch {}
  }

  const handleEditPayment = async (pasajero, pagoId) => {
    if (!editandoPago) return
    const { concepto, monto, metodo } = editandoPago
    if (!concepto.trim() || !monto) return
    try {
      const updated = await viajesApi.updatePayment(id, pasajero.id, pagoId, {
        concept: concepto.trim(),
        amount: parseFloat(monto),
        method: metodo,
      })
      setViaje(prev => ({
        ...prev,
        pasajerosList: prev.pasajerosList.map(p => {
          if (p.id !== pasajero.id) return p
          const pagos = p.pagos.map(x => x.id !== pagoId ? x : {
            ...x,
            concepto: updated.concept,
            monto: updated.amount,
            metodo: updated.method,
          })
          const pagado = pagos.reduce((s, x) => s + x.monto, 0)
          return { ...p, pagos, pagado, pendiente: p.costoTotal - pagado }
        }),
      }))
      setEditandoPago(null)
    } catch {}
  }

  const handleAddGasto = async (e) => {
    e.preventDefault()
    if (!gastoForm.concepto.trim() || !gastoForm.monto) { setGastoError('Completa los campos requeridos'); return }
    setSavingGasto(true); setGastoError('')
    try {
      const nuevo = await viajesApi.addExpense(id, {
        concept: gastoForm.concepto.trim(),
        amount: parseFloat(gastoForm.monto),
        paid: gastoForm.pagado,
      })
      setViaje(prev => ({
        ...prev,
        gastos: [...(prev.gastos ?? []), {
          id: nuevo.id,
          concepto: nuevo.concept,
          monto: nuevo.amount,
          pagado: nuevo.paid,
          notas: nuevo.notes ?? '',
        }],
      }))
      setGastoForm({ concepto: '', monto: '', pagado: false })
      setShowAddGasto(false)
    } catch (err) {
      setGastoError(err.message || 'Error al agregar gasto')
    } finally {
      setSavingGasto(false)
    }
  }

  const handleToggleGastoPagado = async (gasto) => {
    try {
      await viajesApi.updateExpense(id, gasto.id, { paid: !gasto.pagado })
      setViaje(prev => ({
        ...prev,
        gastos: prev.gastos.map(g => g.id === gasto.id ? { ...g, pagado: !g.pagado } : g),
      }))
    } catch {}
  }

  const handleDeleteGasto = async (gastoId) => {
    if (!confirm('Eliminar este gasto?')) return
    try {
      await viajesApi.deleteExpense(id, gastoId)
      setViaje(prev => ({ ...prev, gastos: prev.gastos.filter(g => g.id !== gastoId) }))
    } catch {}
  }

  if (loading) return <div className={styles.loading}>Cargando viaje...</div>
  if (error || !viaje) return <div className={styles.loading}>{error || 'No encontrado'}</div>

  const ec = ESTADO_COLOR[viaje.estado] ?? ESTADO_COLOR.borrador
  const pasajerosList = viaje.pasajerosList ?? []
  const gastosList = viaje.gastos ?? []

  const totalEsperado    = pasajerosList.reduce((s, p) => s + p.costoTotal, 0)
  const totalCobrado     = pasajerosList.reduce((s, p) => s + p.pagado, 0)
  const totalPendiente   = totalEsperado - totalCobrado
  const asientosOcupados = pasajerosList.reduce((s, p) => s + p.asientos, 0)
  const totalGastos      = gastosList.reduce((s, g) => s + g.monto, 0)
  const gastosPagados    = gastosList.filter(g => g.pagado).reduce((s, g) => s + g.monto, 0)
  const gastosPorPagar   = totalGastos - gastosPagados
  const utilidad         = totalCobrado - totalGastos
  const pctCobrado       = totalEsperado > 0 ? Math.round((totalCobrado / totalEsperado) * 100) : 0
  const pctOcupacion     = viaje.asientosTotal > 0 ? Math.round((asientosOcupados / viaje.asientosTotal) * 100) : 0

  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate('/app/viajes')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Viajes
      </button>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroDestino}>{viaje.destino}</div>
          <h1 className={styles.heroTitle}>{viaje.nombre}</h1>
          <div className={styles.heroDates}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Salida: <strong>{viaje.salida}</strong> &nbsp;&middot;&nbsp; Regreso: <strong>{viaje.regreso}</strong>
          </div>
          {viaje.notas && <p className={styles.heroNotas}>{viaje.notas}</p>}
          {viaje.createdByName && <p className={styles.heroCreatedBy}>Creado por {viaje.createdByName}</p>}
        </div>
        <div className={styles.heroRight}>
          <div className={styles.statusWrap}>
            {editingStatus ? (
              <div className={styles.statusPicker}>
                {ESTADOS_VIAJE.map(st => (
                  <button
                    key={st}
                    className={styles.statusOption}
                    style={st === viaje.estado ? { background: ec.bg, color: ec.color, border: `1px solid ${ec.border}` } : {}}
                    onClick={() => handleStatusChange(st)}
                  >
                    {st}
                  </button>
                ))}
                <button className={styles.statusCancel} onClick={() => setEditingStatus(false)}>x</button>
              </div>
            ) : (
              <button
                className={styles.estadoBadge}
                style={{ background: ec.bg, color: ec.color, border: `1px solid ${ec.border}` }}
                onClick={() => setEditingStatus(true)}
                title="Cambiar estado"
              >
                {viaje.estado}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:4}}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            )}
          </div>
          <button className={styles.editBtn} onClick={() => setShowEditTrip(true)} title="Editar viaje">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryStats}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryNum}>{pasajerosList.length}</span>
            <span className={styles.summaryLbl}>Pasajeros</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryNum}>{asientosOcupados} / {viaje.asientosTotal || 'inf'}</span>
            <span className={styles.summaryLbl}>Ocupacion</span>
            {viaje.asientosTotal > 0 && (
              <div className={styles.miniBar}>
                <div className={styles.miniBarFill} style={{ width: `${pctOcupacion}%`, background: 'var(--accent)' }} />
              </div>
            )}
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryNum}>{fmtMoney(totalEsperado)}</span>
            <span className={styles.summaryLbl}>Ingresos esperados</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryNum} style={{ color: '#16a34a' }}>{fmtMoney(totalCobrado)}</span>
            <span className={styles.summaryLbl}>Cobrado</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryNum} style={{ color: totalPendiente > 0 ? '#ea580c' : '#16a34a' }}>{fmtMoney(totalPendiente)}</span>
            <span className={styles.summaryLbl}>Pendiente</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryNum} style={{ color: 'var(--text-muted)' }}>{fmtMoney(totalGastos)}</span>
            <span className={styles.summaryLbl}>Gastos</span>
          </div>
          <div className={`${styles.summaryStat} ${styles.summaryStatLast}`}>
            <span className={styles.summaryNum} style={{ color: utilidad >= 0 ? '#16a34a' : '#dc2626' }}>{fmtMoney(utilidad)}</span>
            <span className={styles.summaryLbl}>Utilidad</span>
          </div>
        </div>

        {totalEsperado > 0 && (
          <div className={styles.summaryProgressWrap}>
            <div className={styles.summaryProgress}>
              <div
                className={styles.summaryProgressCobrado}
                style={{ width: `${pctCobrado}%` }}
              />
              <div
                className={styles.summaryProgressPendiente}
                style={{ width: `${100 - pctCobrado}%` }}
              />
            </div>
            <div className={styles.summaryProgressLabels}>
              <span style={{ color: '#16a34a' }}>Cobrado {pctCobrado}%</span>
              <span style={{ color: '#ea580c' }}>Pendiente {100 - pctCobrado}%</span>
            </div>
          </div>
        )}
      </div>

      <MarketplaceSection
        viaje={viaje}
        onUpdate={(patch) => setViaje(prev => ({ ...prev, ...patch }))}
      />

      <div className={styles.twoColGrid}>
      {/* Passengers Section */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Pasajeros</h2>
          <button className={styles.btnPrimary} onClick={() => setShowAddPax(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar pasajero
          </button>
        </div>

        {pasajerosList.length === 0 ? (
          <div className={styles.emptyPax}>
            <p>No hay pasajeros registrados aun.</p>
            <button className={styles.btnPrimary} onClick={() => setShowAddPax(true)}>Agregar pasajero</button>
          </div>
        ) : (
          <div className={styles.paxList}>
            {pasajerosList.map(pax => {
              const pctPagado = pax.costoTotal > 0 ? Math.round((pax.pagado / pax.costoTotal) * 100) : 0
              const paxEc = ESTADO_PAX_COLOR[pax.estado] ?? ESTADO_PAX_COLOR.pendiente
              const waUrl = whatsappUrl(pax.clienteTelefono)
              const isExpanded = expandedPax[pax.id] ?? false

              return (
                <div key={pax.id} className={styles.paxCard}>
                  {/* Header row */}
                  <div className={styles.paxHeader}>
                    <div className={styles.paxInfo}>
                      <div className={styles.paxNameRow}>
                        <span className={styles.paxNombre}>{pax.clienteNombre || 'Sin nombre'}</span>
                        <span
                          className={styles.paxEstadoBadge}
                          style={{ background: paxEc.bg, color: paxEc.color, border: `1px solid ${paxEc.border}` }}
                        >
                          {pax.estado}
                        </span>
                      </div>
                      {pax.clienteTelefono && <span className={styles.paxTel}>{pax.clienteTelefono}</span>}
                      <span className={styles.paxAsientos}>{pax.asientos} asiento{pax.asientos !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.paxActions}>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.waBtn}
                          title="Enviar WhatsApp"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                          WhatsApp
                        </a>
                      )}
                      <button
                        className={styles.pagoBtn}
                        onClick={() => setPagoModal(pax)}
                        title="Registrar pago"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        Pago
                      </button>
                      <button className={styles.removeBtn} onClick={() => handleRemovePax(pax.id)} title="Eliminar pasajero">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Payment progress bar */}
                  <div className={styles.paxProgressSection}>
                    <div className={styles.paxProgressBar}>
                      <div
                        className={styles.paxProgressCobrado}
                        style={{ width: `${pctPagado}%` }}
                      />
                      <div
                        className={styles.paxProgressPendiente}
                        style={{ width: `${100 - pctPagado}%` }}
                      />
                    </div>
                    <div className={styles.paxProgressAmounts}>
                      <span style={{ color: '#16a34a' }}>Pagado {fmtMoney(pax.pagado)}</span>
                      <span style={{ color: '#ea580c' }}>Pendiente {fmtMoney(pax.pendiente)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Total {fmtMoney(pax.costoTotal)}</span>
                    </div>
                  </div>

                  {/* Payments list collapsible */}
                  {pax.pagos.length > 0 && (
                    <div className={styles.pagos}>
                      <button
                        className={styles.pagosToggle}
                        onClick={() => setExpandedPax(prev => ({ ...prev, [pax.id]: !isExpanded }))}
                      >
                        <span>{pax.pagos.length} pago{pax.pagos.length !== 1 ? 's' : ''} registrado{pax.pagos.length !== 1 ? 's' : ''}</span>
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className={styles.pagosListInner}>
                          {pax.pagos.map(pago => {
                            const isEditing = editandoPago?.pagoId === pago.id && editandoPago?.pasajeroId === pax.id
                            if (isEditing) return (
                              <div key={pago.id} className={styles.pagoRowEdit}>
                                <input
                                  className={styles.pagoEditInput}
                                  value={editandoPago.concepto}
                                  onChange={e => setEditandoPago(p => ({ ...p, concepto: e.target.value }))}
                                  placeholder="Concepto"
                                />
                                <input
                                  className={styles.pagoEditInputSm}
                                  type="number" min="0.01" step="0.01"
                                  value={editandoPago.monto}
                                  onChange={e => setEditandoPago(p => ({ ...p, monto: e.target.value }))}
                                />
                                <select
                                  className={styles.pagoEditSelect}
                                  value={editandoPago.metodo}
                                  onChange={e => setEditandoPago(p => ({ ...p, metodo: e.target.value }))}
                                >
                                  <option value="transfer">Transferencia</option>
                                  <option value="cash">Efectivo</option>
                                  <option value="card">Tarjeta</option>
                                  <option value="oxxo">OXXO</option>
                                </select>
                                <button className={styles.pagoSaveBtn} onClick={() => handleEditPayment(pax, pago.id)}>✓</button>
                                <button className={styles.pagoDelete} onClick={() => setEditandoPago(null)}>✕</button>
                              </div>
                            )
                            return (
                              <div key={pago.id} className={styles.pagoRow}>
                                <span className={styles.pagoConcepto}>{pago.concepto}</span>
                                <span className={styles.pagoMetodo}>{pago.metodo}</span>
                                <span className={styles.pagoFecha}>{pago.fecha}</span>
                                <span className={styles.pagoMonto}>{fmtMoney(pago.monto)}</span>
                                <button className={styles.pagoEditBtn} onClick={() => setEditandoPago({ pasajeroId: pax.id, pagoId: pago.id, concepto: pago.concepto, monto: String(pago.monto), metodo: pago.metodo })}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button className={styles.pagoDelete} onClick={() => handleDeletePayment(pax, pago.id)}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {pax.notas && <p className={styles.paxNotas}>{pax.notas}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Gastos del viaje</h2>
          <button className={styles.btnPrimary} onClick={() => setShowAddGasto(v => !v)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar gasto
          </button>
        </div>

        {totalGastos > 0 && (
          <div className={styles.gastosSummary}>
            <span>Total gastos: <strong>{fmtMoney(totalGastos)}</strong></span>
            <span className={styles.gastosSummaryDot}>&#183;</span>
            <span style={{ color: '#16a34a' }}>Pagados: <strong>{fmtMoney(gastosPagados)}</strong></span>
            <span className={styles.gastosSummaryDot}>&#183;</span>
            <span style={{ color: '#ea580c' }}>Por pagar: <strong>{fmtMoney(gastosPorPagar)}</strong></span>
          </div>
        )}

        {showAddGasto && (
          <form onSubmit={handleAddGasto} className={styles.gastoForm}>
            <div className={styles.gastoFormInner}>
              <div className={styles.field} style={{ flex: 2 }}>
                <label>Concepto *</label>
                <input
                  value={gastoForm.concepto}
                  onChange={e => setGastoForm(f => ({ ...f, concepto: e.target.value }))}
                  placeholder="Ej: Autobus, Hotel, Guia..."
                  required
                  autoFocus
                />
              </div>
              <div className={styles.field} style={{ flex: 1 }}>
                <label>Monto ($) *</label>
                <input
                  type="number" min="0" step="0.01"
                  value={gastoForm.monto}
                  onChange={e => setGastoForm(f => ({ ...f, monto: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
              <div className={styles.field}>
                <label style={{ visibility: 'hidden' }}>_</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={gastoForm.pagado}
                    onChange={e => setGastoForm(f => ({ ...f, pagado: e.target.checked }))}
                  />
                  Pagado
                </label>
              </div>
            </div>
            {gastoError && <p className={styles.error}>{gastoError}</p>}
            <div className={styles.gastoFormActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => { setShowAddGasto(false); setGastoError('') }}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={savingGasto}>
                {savingGasto ? 'Guardando...' : 'Agregar gasto'}
              </button>
            </div>
          </form>
        )}

        {gastosList.length === 0 && !showAddGasto ? (
          <div className={styles.emptyGastos}>
            <p>No hay gastos registrados. Agrega los costos del viaje para tu agencia.</p>
          </div>
        ) : (
          <div className={styles.gastosList}>
            {gastosList.map(gasto => (
              <div key={gasto.id} className={`${styles.gastoRow} ${gasto.pagado ? styles.gastoRowPagado : ''}`}>
                <span className={styles.gastoConcepto}>{gasto.concepto}</span>
                <span className={styles.gastoMonto}>{fmtMoney(gasto.monto)}</span>
                <label className={styles.gastoPagadoLabel}>
                  <input
                    type="checkbox"
                    checked={gasto.pagado}
                    onChange={() => handleToggleGastoPagado(gasto)}
                  />
                  <span className={gasto.pagado ? styles.gastoPagadoBadge : styles.gastoPorPagarBadge}>
                    {gasto.pagado ? 'Pagado' : 'Por pagar'}
                  </span>
                </label>
                <button className={styles.pagoDelete} onClick={() => handleDeleteGasto(gasto.id)}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>{/* end twoColGrid */}

      {/* Modals */}
      {showAddPax && (
        <AgregarPasajeroModal
          viaje={viaje}
          onClose={() => setShowAddPax(false)}
          onAdded={(nuevo) => {
            const p = {
              id: nuevo.id,
              clienteId: nuevo.clientId,
              clienteNombre: nuevo.clientName ?? '',
              clienteTelefono: nuevo.clientPhone ?? '',
              asientos: nuevo.seats,
              costoTotal: nuevo.totalCost,
              pagado: 0,
              pendiente: nuevo.totalCost,
              estado: nuevo.status,
              notas: nuevo.notes ?? '',
              pagos: [],
            }
            setViaje(prev => ({ ...prev, pasajerosList: [...(prev.pasajerosList ?? []), p] }))
          }}
        />
      )}
      {pagoModal && (
        <RegistrarPagoModal
          viaje={viaje}
          pasajero={pagoModal}
          onClose={() => setPagoModal(null)}
          onAdded={(nuevoPago) => {
            setViaje(prev => ({
              ...prev,
              pasajerosList: prev.pasajerosList.map(p => {
                if (p.id !== pagoModal.id) return p
                const pago = {
                  id: nuevoPago.id,
                  pasajeroId: nuevoPago.passengerId,
                  concepto: nuevoPago.concept,
                  monto: nuevoPago.amount,
                  metodo: nuevoPago.method,
                  fecha: new Date(nuevoPago.paidAt).toLocaleDateString('es-MX'),
                }
                const pagado = p.pagado + nuevoPago.amount
                return { ...p, pagos: [...p.pagos, pago], pagado, pendiente: p.costoTotal - pagado }
              }),
            }))
          }}
        />
      )}
      {showEditTrip && (
        <EditTripModal
          viaje={viaje}
          onClose={() => setShowEditTrip(false)}
          onSaved={(updated) => setViaje(prev => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  )
}
