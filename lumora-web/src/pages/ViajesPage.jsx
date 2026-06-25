import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { viajesApi } from '../api/viajesApi'
import { clientesApi } from '../api/clientesApi'
import styles from './ViajesPage.module.css'

const ESTADOS = [
  { key: null,        label: 'Todos' },
  { key: 'borrador',   label: 'Borrador' },
  { key: 'confirmado', label: 'Confirmado' },
  { key: 'completado', label: 'Completado' },
  { key: 'cancelado',  label: 'Cancelado' },
]

const ESTADO_COLOR = {
  borrador:   { bg: 'var(--bg-1)', color: 'var(--text-muted)', border: 'var(--border)' },
  confirmado: { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  completado: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  cancelado:  { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}

function NuevoViajeModal({ onClose, onCreated }) {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', destino: '', salida: '', regreso: '',
    precioPorPersona: '', asientosTotal: '', notas: '',
  })

  useEffect(() => {
    clientesApi.getAll().then(setClientes).catch(() => {})
  }, [])

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.destino || !form.salida || !form.regreso) {
      setError('Nombre, destino y fechas son obligatorios')
      return
    }
    setSaving(true); setError('')
    try {
      const nuevo = await viajesApi.create({
        name: form.nombre,
        destination: form.destino,
        departureDate: new Date(form.salida).toISOString(),
        returnDate: new Date(form.regreso).toISOString(),
        pricePerPerson: parseFloat(form.precioPorPersona) || 0,
        seatsTotal: parseInt(form.asientosTotal) || 0,
        notes: form.notas || null,
      })
      onCreated(nuevo)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al crear viaje')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nuevo viaje</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Nombre del viaje *</label>
            <input placeholder="Ej: Cancún Semana Santa 2026" value={form.nombre} onChange={setF('nombre')} required />
          </div>
          <div className={styles.field}>
            <label>Destino *</label>
            <input placeholder="Ej: Cancún, Quintana Roo" value={form.destino} onChange={setF('destino')} required />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Fecha de salida *</label>
              <input type="date" value={form.salida} onChange={setF('salida')} required />
            </div>
            <div className={styles.field}>
              <label>Fecha de regreso *</label>
              <input type="date" value={form.regreso} onChange={setF('regreso')} required />
            </div>
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Precio por persona ($)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.precioPorPersona} onChange={setF('precioPorPersona')} />
            </div>
            <div className={styles.field}>
              <label>Lugares disponibles</label>
              <input type="number" min="0" step="1" placeholder="0" value={form.asientosTotal} onChange={setF('asientosTotal')} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Notas (opcional)</label>
            <textarea placeholder="Incluye vuelo, traslados, hotel 4*…" value={form.notas} onChange={setF('notas')} rows={3} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Creando…' : 'Crear viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ViajesPage() {
  const navigate = useNavigate()
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await viajesApi.getAll()
      setViajes(data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = viajes.filter(v => {
    if (filtro && v.estado !== filtro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return v.nombre.toLowerCase().includes(q) || v.destino.toLowerCase().includes(q)
    }
    return true
  })

  const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Viajes</h1>
          <p className={styles.sub}>{viajes.length} viaje{viajes.length !== 1 ? 's' : ''} registrado{viajes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo viaje
        </button>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.filters}>
          {ESTADOS.map(e => (
            <button
              key={e.key ?? 'todos'}
              className={`${styles.filterBtn} ${filtro === e.key ? styles.filterBtnActive : ''}`}
              onClick={() => setFiltro(e.key)}
            >
              {e.label}
            </button>
          ))}
        </div>
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Buscar por nombre o destino…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.3}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <p className={styles.emptyTitle}>Sin viajes{filtro ? ` con estado "${filtro}"` : ''}</p>
          <p className={styles.emptySub}>Crea tu primer viaje grupal para empezar.</p>
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>Nuevo viaje</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(viaje => {
            const ec = ESTADO_COLOR[viaje.estado] ?? ESTADO_COLOR.borrador
            const pct = viaje.asientosTotal > 0 ? Math.round((viaje.asientosOcupados / viaje.asientosTotal) * 100) : 0
            return (
              <div key={viaje.id} className={styles.card} onClick={() => navigate(`/app/viajes/${viaje.id}`)}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardDestino}>{viaje.destino}</div>
                  <span className={styles.estadoBadge} style={{ background: ec.bg, color: ec.color, border: `1px solid ${ec.border}` }}>
                    {viaje.estado}
                  </span>
                </div>
                <h3 className={styles.cardNombre}>{viaje.nombre}</h3>
                <div className={styles.cardDates}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {viaje.salida} → {viaje.regreso}
                </div>

                <div className={styles.cardStats}>
                  <div className={styles.stat}>
                    <span className={styles.statVal}>{viaje.pasajeros}</span>
                    <span className={styles.statLabel}>pasajeros</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statVal}>{fmtMoney(viaje.precioPorPersona)}</span>
                    <span className={styles.statLabel}>por persona</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statVal}>{fmtMoney(viaje.ingresos)}</span>
                    <span className={styles.statLabel}>cobrado</span>
                  </div>
                </div>

                {viaje.asientosTotal > 0 && (
                  <div className={styles.progress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.progressLabel}>{viaje.asientosOcupados}/{viaje.asientosTotal} lugares</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <NuevoViajeModal
          onClose={() => setShowModal(false)}
          onCreated={v => setViajes(prev => [v, ...prev])}
        />
      )}
    </div>
  )
}
