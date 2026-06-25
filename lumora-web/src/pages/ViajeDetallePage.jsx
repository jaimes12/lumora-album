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
const ESTADOS_PASAJERO = ['pendiente', 'confirmado', 'cancelado']

const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

function AgregarPasajeroModal({ viaje, onClose, onAdded }) {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [clienteSel, setClienteSel] = useState(null)
  const [asientos, setAsientos] = useState(1)
  const [costoCustom, setCostoCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // inline new-client form
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

          {/* ── Búsqueda / selección de cliente ── */}
          {!creandoCliente && (
            <>
              <div className={styles.field}>
                <label>
                  Buscar cliente
                  {clienteSel && <span className={styles.clienteSelBadge}>✓ {clienteSel.nombre}</span>}
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

          {/* ── Formulario inline para nuevo cliente ── */}
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
                  ← Volver
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={savingCliente || !nuevoNombre.trim()}>
                  {savingCliente ? 'Guardando…' : 'Crear y seleccionar'}
                </button>
              </div>
            </div>
          )}

          {/* ── Asientos y costo (siempre visible cuando hay cliente seleccionado o no se está creando) ── */}
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
                Precio por defecto: {fmtMoney(viaje.precioPorPersona)} × {asientos} = {fmtMoney(viaje.precioPorPersona * asientos)}
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
              <label>Método</label>
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

export default function ViajeDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [viaje, setViaje] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingStatus, setEditingStatus] = useState(false)
  const [showAddPax, setShowAddPax] = useState(false)
  const [pagoModal, setPagoModal] = useState(null) // pasajero object

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
    if (!confirm('¿Eliminar este pasajero?')) return
    try {
      await viajesApi.removePassenger(id, pasajeroId)
      setViaje(prev => ({ ...prev, pasajerosList: prev.pasajerosList.filter(p => p.id !== pasajeroId) }))
    } catch {}
  }

  const handleDeletePayment = async (pasajero, pagoId) => {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      await viajesApi.deletePayment(id, pasajero.id, pagoId)
      setViaje(prev => ({
        ...prev,
        pasajerosList: prev.pasajerosList.map(p =>
          p.id === pasajero.id
            ? { ...p, pagos: p.pagos.filter(x => x.id !== pagoId) }
            : p
        ),
      }))
    } catch {}
  }

  if (loading) return <div className={styles.loading}>Cargando viaje…</div>
  if (error || !viaje) return <div className={styles.loading}>{error || 'No encontrado'}</div>

  const ec = ESTADO_COLOR[viaje.estado] ?? ESTADO_COLOR.borrador
  const pasajerosList = viaje.pasajerosList ?? []
  const totalEsperado = pasajerosList.reduce((s, p) => s + p.costoTotal, 0)
  const totalCobrado  = pasajerosList.reduce((s, p) => s + p.pagado, 0)
  const totalPendiente = totalEsperado - totalCobrado
  const asientosOcupados = pasajerosList.reduce((s, p) => s + p.asientos, 0)

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
            Salida: <strong>{viaje.salida}</strong> &nbsp;·&nbsp; Regreso: <strong>{viaje.regreso}</strong>
          </div>
          {viaje.notas && <p className={styles.heroNotas}>{viaje.notas}</p>}
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
                <button className={styles.statusCancel} onClick={() => setEditingStatus(false)}>✕</button>
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
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{pasajerosList.length}</span>
          <span className={styles.statLbl}>Pasajeros</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{asientosOcupados} / {viaje.asientosTotal || '∞'}</span>
          <span className={styles.statLbl}>Lugares</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{fmtMoney(totalEsperado)}</span>
          <span className={styles.statLbl}>Total esperado</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum} style={{ color: '#16a34a' }}>{fmtMoney(totalCobrado)}</span>
          <span className={styles.statLbl}>Cobrado</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum} style={{ color: totalPendiente > 0 ? '#f59e0b' : '#16a34a' }}>{fmtMoney(totalPendiente)}</span>
          <span className={styles.statLbl}>Pendiente</span>
        </div>
      </div>

      {/* Passengers */}
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
            <p>No hay pasajeros registrados aún.</p>
            <button className={styles.btnPrimary} onClick={() => setShowAddPax(true)}>Agregar pasajero</button>
          </div>
        ) : (
          <div className={styles.paxList}>
            {pasajerosList.map(pax => {
              const pctPagado = pax.costoTotal > 0 ? Math.round((pax.pagado / pax.costoTotal) * 100) : 0
              return (
                <div key={pax.id} className={styles.paxCard}>
                  <div className={styles.paxHeader}>
                    <div className={styles.paxInfo}>
                      <span className={styles.paxNombre}>{pax.clienteNombre || 'Sin nombre'}</span>
                      {pax.clienteTelefono && <span className={styles.paxTel}>{pax.clienteTelefono}</span>}
                    </div>
                    <div className={styles.paxActions}>
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

                  <div className={styles.paxMoney}>
                    <div className={styles.paxMoneyItem}>
                      <span className={styles.paxMoneyLabel}>Asientos</span>
                      <span className={styles.paxMoneyVal}>{pax.asientos}</span>
                    </div>
                    <div className={styles.paxMoneyItem}>
                      <span className={styles.paxMoneyLabel}>Total</span>
                      <span className={styles.paxMoneyVal}>{fmtMoney(pax.costoTotal)}</span>
                    </div>
                    <div className={styles.paxMoneyItem}>
                      <span className={styles.paxMoneyLabel}>Pagado</span>
                      <span className={styles.paxMoneyVal} style={{ color: '#16a34a' }}>{fmtMoney(pax.pagado)}</span>
                    </div>
                    <div className={styles.paxMoneyItem}>
                      <span className={styles.paxMoneyLabel}>Pendiente</span>
                      <span className={styles.paxMoneyVal} style={{ color: pax.pendiente > 0 ? '#f59e0b' : '#16a34a' }}>{fmtMoney(pax.pendiente)}</span>
                    </div>
                  </div>

                  <div className={styles.paxProgress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${pctPagado}%` }} />
                    </div>
                    <span className={styles.progressLabel}>{pctPagado}% pagado</span>
                  </div>

                  {pax.pagos.length > 0 && (
                    <div className={styles.pagos}>
                      <p className={styles.pagosTitle}>Pagos registrados</p>
                      {pax.pagos.map(pago => (
                        <div key={pago.id} className={styles.pagoRow}>
                          <span className={styles.pagoConcepto}>{pago.concepto}</span>
                          <span className={styles.pagoMetodo}>{pago.metodo}</span>
                          <span className={styles.pagoFecha}>{pago.fecha}</span>
                          <span className={styles.pagoMonto}>{fmtMoney(pago.monto)}</span>
                          <button className={styles.pagoDelete} onClick={() => handleDeletePayment(pax, pago.id)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {pax.notas && <p className={styles.paxNotas}>{pax.notas}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

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
    </div>
  )
}
