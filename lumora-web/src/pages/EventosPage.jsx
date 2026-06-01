import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventosApi } from '../api/eventosApi'
import { clientesApi } from '../api/clientesApi'
import { ESTADO_META, TIPO_EMOJI } from '../data/eventosData'
import styles from './EventosPage.module.css'

const TIPOS = ['Boda', 'XV Años', 'Corporativo', 'Graduación', 'Bautizo', 'Cumpleaños', 'Reunión', 'Otro']

function NuevoEventoModal({ onClose, onCreated }) {
  const [clientes,  setClientes]  = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [form, setForm] = useState({
    nombre: '', tipo: 'Boda', clienteId: '', fecha: '', hora: '18:00',
    venue: '', invitados: '', presupuesto: '', notas: '',
  })

  useEffect(() => {
    clientesApi.getAll().then(setClientes).catch(() => {})
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre || !form.fecha || !form.clienteId) {
      setError('Nombre, fecha y cliente son obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      const eventDate = new Date(`${form.fecha}T${form.hora || '12:00'}:00`)
      const nuevo = await eventosApi.create({
        name: form.nombre,
        type: form.tipo,
        clientId: form.clienteId,
        eventDate: eventDate.toISOString(),
        budget: parseFloat(form.presupuesto) || 0,
        guestCount: parseInt(form.invitados) || 0,
        venueId: form.venue || null,
        notes: form.notas || null,
      })
      onCreated(nuevo)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al crear evento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nuevo evento</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.modalGrid}>
            <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
              <label>Nombre del evento *</label>
              <input placeholder="Ej: Boda García & Ruiz" value={form.nombre} onChange={set('nombre')} required />
            </div>
            <div className={styles.modalField}>
              <label>Tipo</label>
              <select value={form.tipo} onChange={set('tipo')}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Cliente *</label>
              <select value={form.clienteId} onChange={set('clienteId')} required>
                <option value="">— Seleccionar —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Fecha *</label>
              <input type="date" value={form.fecha} onChange={set('fecha')} required />
            </div>
            <div className={styles.modalField}>
              <label>Hora</label>
              <input type="time" value={form.hora} onChange={set('hora')} />
            </div>
            <div className={styles.modalField}>
              <label>Venue</label>
              <input placeholder="Hacienda San Lucas..." value={form.venue} onChange={set('venue')} />
            </div>
            <div className={styles.modalField}>
              <label>Invitados</label>
              <input type="number" placeholder="150" min="1" value={form.invitados} onChange={set('invitados')} />
            </div>
            <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
              <label>Presupuesto ($)</label>
              <input type="number" placeholder="85000" min="0" value={form.presupuesto} onChange={set('presupuesto')} />
            </div>
            <div className={styles.modalField} style={{ gridColumn: '1/-1' }}>
              <label>Notas</label>
              <textarea placeholder="Detalles importantes del evento..." value={form.notas} onChange={set('notas')} rows={3} />
            </div>
          </div>
          {error && <p className={styles.modalError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalBtnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.modalBtnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : 'Crear evento →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EventosPage() {
  const [eventos,     setEventos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('todos')
  const [showCreate,  setShowCreate]  = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    eventosApi.getAll()
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'todos' ? eventos : eventos.filter(e => e.estado === filter)

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

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Eventos</h1>
          <p className={styles.sub}>{eventos.length} eventos · {counts.confirmed} confirmados</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo evento
        </button>
      </div>

      <div className={styles.filters}>
        {['todos', 'confirmed', 'pending', 'lead', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}>
            {f === 'todos' ? 'Todos' : ESTADO_META[f]?.label}
            <span className={styles.filterCount}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={styles.card} style={{ opacity: 0.3, minHeight: 160 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>Sin eventos{filter !== 'todos' ? ` con estado "${ESTADO_META[filter]?.label}"` : ''}</p>
          <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>+ Crear primer evento</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(ev => {
            const meta = ESTADO_META[ev.estado] ?? ESTADO_META.lead
            return (
              <div key={ev.id} className={styles.card} onClick={() => navigate(`/app/eventos/${ev.id}`)}>
                <div className={styles.cardTop}>
                  <span className={styles.tipoEmoji}>{TIPO_EMOJI[ev.tipo] || '📅'}</span>
                  <span className={styles.estadoBadge} style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>
                <h3 className={styles.cardNombre}>{ev.nombre}</h3>
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
                  <div className={styles.clientChip}>
                    <div className={styles.clientAvatar}>
                      {(ev.clienteNombre || '?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                    </div>
                    <span>{ev.clienteNombre || ev.clienteId}</span>
                  </div>
                  <span className={styles.presupuesto}>${Number(ev.presupuestoTotal).toLocaleString('es-MX')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
