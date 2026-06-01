import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventosApi } from '../api/eventosApi'
import { ESTADO_META, TIPO_EMOJI } from '../data/eventosData'
import styles from './EventosPage.module.css'

export default function EventosPage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('todos')
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
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Eventos</h1>
          <p className={styles.sub}>{eventos.length} eventos · {counts.confirmed} confirmados</p>
        </div>
        <button className={styles.btnPrimary}>
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
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0', fontSize: 14 }}>
          Sin eventos{filter !== 'todos' ? ` con estado "${ESTADO_META[filter]?.label}"` : ''}
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
