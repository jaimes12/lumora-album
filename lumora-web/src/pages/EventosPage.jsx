import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventosApi } from '../api/eventosApi'
import { clientesApi } from '../api/clientesApi'
import { ESTADO_META } from '../data/eventosData'
import EventoTipoIcon from '../components/EventoTipoIcon'
import { useAuth } from '../context/AuthContext'
import { PlanGateModal } from '../components/PlanGate'
import { underLimit } from '../config/planConfig'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import styles from './EventosPage.module.css'

const TIPOS = [
  'Boda', 'XV Años', 'Bautizo', 'Primera Comunión', 'Graduación',
  'Cumpleaños', 'Baby Shower', 'Revelación de Sexo', 'Aniversario',
  'Despedida de Soltera', 'Corporativo', 'Conferencia',
  'Lanzamiento de Producto', 'Inauguración', 'Empresarial', 'Reunión', 'Otro',
]

function NuevoEventoModal({ onClose, onCreated }) {
  const [step,        setStep]        = useState(1) // 1 = cliente, 2 = evento
  const [clientes,    setClientes]    = useState([])
  const [loadingC,    setLoadingC]    = useState(true)
  const [busqueda,    setBusqueda]    = useState('')
  const [clienteSel,  setClienteSel]  = useState(null) // { id, nombre, email, telefono }
  const [modoNuevo,   setModoNuevo]   = useState(false) // crear cliente inline
  const [nuevoCliente,setNuevoCliente]= useState({ nombre: '', email: '', telefono: '', empresa: '' })
  const [savingC,     setSavingC]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [form, setForm] = useState({
    nombre: '', tipo: 'Boda', fecha: '', hora: '18:00',
    venue: '', invitados: '', presupuesto: '', notas: '',
  })

  useEffect(() => {
    clientesApi.getAll()
      .then(setClientes)
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [])

  const setF  = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setNC = k => e => setNuevoCliente(f => ({ ...f, [k]: e.target.value }))

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono || '').includes(busqueda)
  )

  // ── Step 1: guardar nuevo cliente ──
  const crearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSavingC(true); setError('')
    try {
      const c = await clientesApi.create({
        name: nuevoCliente.nombre,
        email: nuevoCliente.email || null,
        phone: nuevoCliente.telefono || null,
        company: nuevoCliente.empresa || null,
      })
      setClientes(prev => [c, ...prev])
      setClienteSel(c)
      setModoNuevo(false)
      setStep(2)
    } catch (err) { setError(err.message || 'Error al crear cliente') }
    finally { setSavingC(false) }
  }

  // ── Step 2: guardar evento ──
  const crearEvento = async e => {
    e.preventDefault()
    if (!form.nombre || !form.fecha) { setError('Nombre y fecha son obligatorios'); return }
    setSaving(true); setError('')
    try {
      const eventDate = new Date(`${form.fecha}T${form.hora || '12:00'}:00`)
      const nuevo = await eventosApi.create({
        name: form.nombre,
        type: form.tipo,
        clientId: clienteSel.id,
        eventDate: eventDate.toISOString(),
        budget: parseFloat(form.presupuesto) || 0,
        guestCount: parseInt(form.invitados) || 0,
        venueId: form.venue || null,
        notes: form.notas || null,
      })
      onCreated(nuevo)
      onClose()
    } catch (err) { setError(err.message || 'Error al crear evento') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header con steps */}
        <div className={styles.modalHeader}>
          <div className={styles.modalSteps}>
            <span className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ''}`}>1</span>
            <span className={styles.stepLine} />
            <span className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ''}`}>2</span>
          </div>
          <h2 className={styles.modalTitle}>
            {step === 1 ? 'Seleccionar cliente' : `Datos del evento`}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── STEP 1: Cliente ── */}
        {step === 1 && !modoNuevo && (
          <div className={styles.stepBody}>
            <div className={styles.clienteSearch}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Buscar cliente por nombre, email o teléfono..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.clienteList}>
              {loadingC && <p className={styles.clienteHint}>Cargando clientes…</p>}
              {!loadingC && clientesFiltrados.length === 0 && (
                <p className={styles.clienteHint}>
                  {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin clientes aún'}
                </p>
              )}
              {clientesFiltrados.map(c => (
                <button
                  key={c.id}
                  className={`${styles.clienteRow} ${clienteSel?.id === c.id ? styles.clienteRowSelected : ''}`}
                  onClick={() => setClienteSel(c)}
                >
                  <div className={styles.clienteRowAvatar}>{c.avatar}</div>
                  <div className={styles.clienteRowInfo}>
                    <span className={styles.clienteRowNombre}>{c.nombre}</span>
                    <span className={styles.clienteRowSub}>{c.email || c.telefono || 'Sin contacto'}</span>
                  </div>
                  {clienteSel?.id === c.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {error && <p className={styles.modalError}>{error}</p>}

            <div className={styles.step1Actions}>
              <button className={styles.btnNuevoCliente} onClick={() => { setModoNuevo(true); setError('') }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Crear nuevo cliente
              </button>
              <button
                className={styles.modalBtnPrimary}
                disabled={!clienteSel}
                onClick={() => { setError(''); setStep(2) }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1b: Formulario nuevo cliente inline ── */}
        {step === 1 && modoNuevo && (
          <div className={styles.stepBody}>
            <p className={styles.clienteHint} style={{ marginBottom: 4 }}>Completa los datos del nuevo cliente:</p>
            <div className={styles.modalGrid}>
              <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
                <label>Nombre completo *</label>
                <input placeholder="Fernanda García Reyes" value={nuevoCliente.nombre} onChange={setNC('nombre')} autoFocus />
              </div>
              <div className={styles.modalField}>
                <label>Email</label>
                <input type="email" placeholder="correo@email.com" value={nuevoCliente.email} onChange={setNC('email')} />
              </div>
              <div className={styles.modalField}>
                <label>Teléfono</label>
                <input placeholder="+52 55 1234 5678" value={nuevoCliente.telefono} onChange={setNC('telefono')} />
              </div>
              <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
                <label>Empresa / Familia</label>
                <input placeholder="Familia García" value={nuevoCliente.empresa} onChange={setNC('empresa')} />
              </div>
            </div>
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={() => { setModoNuevo(false); setError('') }}>
                ← Regresar
              </button>
              <button className={styles.modalBtnPrimary} disabled={savingC} onClick={crearCliente}>
                {savingC ? 'Guardando…' : 'Crear y continuar →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Datos del evento ── */}
        {step === 2 && (
          <form className={styles.stepBody} onSubmit={crearEvento}>
            {/* Cliente seleccionado (chip) */}
            <div className={styles.clienteChipSel}>
              <div className={styles.clienteRowAvatar} style={{ width: 28, height: 28, fontSize: 10 }}>{clienteSel.avatar}</div>
              <span>{clienteSel.nombre}</span>
              <button type="button" className={styles.cambiarClienteBtn} onClick={() => { setStep(1); setError('') }}>
                Cambiar
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
                <label>Nombre del evento *</label>
                <input placeholder="Ej: Boda García & Ruiz" value={form.nombre} onChange={setF('nombre')} required autoFocus />
              </div>
              <div className={styles.modalField}>
                <label>Tipo</label>
                <select value={form.tipo} onChange={setF('tipo')}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className={styles.modalField}>
                <label>Fecha *</label>
                <input type="date" value={form.fecha} onChange={setF('fecha')} required />
              </div>
              <div className={styles.modalField}>
                <label>Hora</label>
                <input type="time" value={form.hora} onChange={setF('hora')} />
              </div>
              <div className={styles.modalField}>
                <label>Venue</label>
                <input placeholder="Hacienda San Lucas..." value={form.venue} onChange={setF('venue')} />
              </div>
              <div className={styles.modalField}>
                <label>Invitados</label>
                <input type="number" placeholder="150" min="1" value={form.invitados} onChange={setF('invitados')} />
              </div>
              <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
                <label>Presupuesto ($)</label>
                <input type="number" placeholder="85000" min="0" value={form.presupuesto} onChange={setF('presupuesto')} />
              </div>
              <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
                <label>Notas</label>
                <textarea placeholder="Detalles importantes..." value={form.notas} onChange={setF('notas')} rows={3} />
              </div>
            </div>
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalBtnSecondary} onClick={() => { setStep(1); setError('') }}>
                ← Regresar
              </button>
              <button type="submit" className={styles.modalBtnPrimary} disabled={saving}>
                {saving ? 'Guardando…' : 'Crear evento →'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}

export default function EventosPage() {
  const { user } = useAuth()
  const [eventos,     setEventos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('todos')
  const [search,      setSearch]      = useState('')
  const [showCreate,  setShowCreate]  = useState(false)
  const [showGate,    setShowGate]    = useState(false)
  const navigate = useNavigate()

  const handleNewEvento = () => {
    if (!underLimit(user?.plan, 'eventos', eventos.length)) {
      setShowGate(true)
      return
    }
    setShowCreate(true)
  }

  useEffect(() => {
    eventosApi.getAll()
      .then(evs => [...evs].sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO)))
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const byStatus  = filter === 'todos' ? eventos : eventos.filter(e => e.estado === filter)
  const filtered  = q
    ? byStatus.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        e.clienteNombre.toLowerCase().includes(q) ||
        (e.clientePhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (e.tipo || '').toLowerCase().includes(q) ||
        (e.venue || '').toLowerCase().includes(q)
      )
    : byStatus

  const { visible, hasMore, sentinelRef, reset } = useInfiniteScroll(filtered, 10)

  useEffect(() => { reset() }, [filter, search, reset])

  const counts = {
    todos:     eventos.length,
    confirmed: eventos.filter(e => e.estado === 'confirmed').length,
    pending:   eventos.filter(e => e.estado === 'pending').length,
    lead:      eventos.filter(e => e.estado === 'lead').length,
    cancelled: eventos.filter(e => e.estado === 'cancelled').length,
  }

  return (
    <div className={styles.page}>
      {showCreate && (
        <NuevoEventoModal
          onClose={() => setShowCreate(false)}
          onCreated={ev => setEventos(prev => [ev, ...prev])}
        />
      )}
      {showGate && (
        <PlanGateModal
          feature="eventos"
          requiredPlan="negocio"
          description={`El plan Solo permite hasta 20 eventos activos. Actualiza al Plan Negocio para tener eventos ilimitados.`}
          onClose={() => setShowGate(false)}
        />
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Eventos</h1>
          <p className={styles.sub}>{eventos.length} eventos · {counts.confirmed} confirmados</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleNewEvento}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo evento
        </button>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.filters}>
          {['todos', 'confirmed', 'pending', 'lead', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}>
              {f === 'todos' ? 'Todos' : ESTADO_META[f]?.label}
              <span className={styles.filterCount}>{counts[f]}</span>
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar evento, cliente o teléfono…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={styles.card} style={{ opacity: 0.3, minHeight: 160 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {q
              ? `Sin resultados para "${search}"`
              : `Sin eventos${filter !== 'todos' ? ` con estado "${ESTADO_META[filter]?.label}"` : ''}`
            }
          </p>
          {!q && <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>+ Crear primer evento</button>}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {visible.map(ev => {
              const meta = ESTADO_META[ev.estado] ?? ESTADO_META.lead
              return (
                <div key={ev.id} className={styles.card} onClick={() => navigate(`/app/eventos/${ev.id}`)}>
                  <div className={styles.cardTop}>
                    <EventoTipoIcon tipo={ev.tipo} size={18} />
                    <span className={styles.estadoBadge} style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                  </div>
                  <h3 className={styles.cardNombre}>{ev.nombre}</h3>
                  <span className={styles.cardCliente}>{ev.clienteNombre || '—'}</span>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardMetaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {ev.fecha} · {ev.hora}
                    </span>
                    <span className={styles.cardMetaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {ev.venue || 'Por confirmar'}
                    </span>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardRegistro}>Registrado: {ev.createdAtISO}</span>
                    <span className={styles.presupuesto}>${Number(ev.presupuestoTotal).toLocaleString('es-MX')}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {hasMore && (
            <div className={styles.loadingMore}>Cargando más eventos…</div>
          )}
          {!hasMore && filtered.length > 10 && (
            <div className={styles.listEnd}>{filtered.length} eventos</div>
          )}
        </>
      )}
    </div>
  )
}
