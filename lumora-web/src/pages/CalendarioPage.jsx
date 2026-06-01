import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EVENTOS, CLIENTES, ESTADO_META, TIPO_EMOJI, fmt } from '../data/eventosData'
import styles from './CalendarioPage.module.css'

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const MONTH_MAP = {
  Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5,
  Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11,
}

function parseEventDate(dateStr) {
  const [day, mon, year] = dateStr.split(' ')
  return new Date(+year, MONTH_MAP[mon], +day)
}

function EventModal({ ev, onClose, onDetalle }) {
  const meta = ESTADO_META[ev.estado] || {}
  const cliente = CLIENTES[ev.clienteId]

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <span className={styles.modalEmoji}>{TIPO_EMOJI[ev.tipo] || '📅'}</span>
            <div>
              <h2 className={styles.modalTitle}>{ev.nombre}</h2>
              <span className={styles.modalTipo}>{ev.tipo}</span>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Status badge */}
        <span className={styles.modalBadge} style={{ color: meta.color, background: meta.bg }}>
          {meta.label}
        </span>

        {/* Info rows */}
        <div className={styles.modalInfo}>
          <div className={styles.modalRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{ev.fecha} · {ev.hora}</span>
          </div>
          <div className={styles.modalRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{ev.venue}</span>
          </div>
          <div className={styles.modalRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>{ev.invitados} invitados</span>
          </div>
          {cliente && (
            <div className={styles.modalRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>{cliente.nombre}</span>
            </div>
          )}
          {ev.presupuestoTotal > 0 && (
            <div className={styles.modalRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>{fmt(ev.presupuestoTotal)}</span>
            </div>
          )}
          {ev.notas && (
            <p className={styles.modalNotas}>{ev.notas}</p>
          )}
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button className={styles.modalBtnSecondary} onClick={onClose}>Cerrar</button>
          <button className={styles.modalBtnPrimary} onClick={onDetalle}>Ver más detalles →</button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarioPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [current, setCurrent] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })

  const { year, month } = current

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const ev of EVENTOS) {
      const d = parseEventDate(ev.fecha)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [])

  const prevMonth = () =>
    setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  const nextMonth = () =>
    setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })
  const goToday = () =>
    setCurrent({ year: today.getFullYear(), month: today.getMonth() })

  // Build cells: nulls for leading empty days, then day numbers
  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Upcoming events this month (from today forward)
  const upcomingThisMonth = useMemo(() => {
    return EVENTOS.filter(ev => {
      const d = parseEventDate(ev.fecha)
      return d.getFullYear() === year && d.getMonth() === month && d >= today
    }).sort((a, b) => parseEventDate(a.fecha) - parseEventDate(b.fecha))
  }, [year, month])

  return (
    <div className={styles.page}>
      {selectedEvent && (
        <EventModal
          ev={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDetalle={() => navigate(`/app/eventos/${selectedEvent.id}`)}
        />
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendario</h1>
          <p className={styles.sub}>Gestiona y visualiza todos tus eventos</p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Month navigation */}
        <div className={styles.calNav}>
          <div className={styles.calNavLeft}>
            <button className={styles.arrowBtn} onClick={prevMonth} aria-label="Mes anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className={styles.monthLabel}>{MONTHS_ES[month]} {year}</span>
            <button className={styles.arrowBtn} onClick={nextMonth} aria-label="Mes siguiente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          <button className={styles.todayBtn} onClick={goToday}>Hoy</button>
        </div>

        {/* Day headers */}
        <div className={styles.grid}>
          {DAYS_ES.map(d => (
            <div key={d} className={styles.dayHead}>{d}</div>
          ))}

          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className={styles.cellEmpty} />

            const key = `${year}-${month}-${day}`
            const events = eventsByDate[key] || []
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear()

            return (
              <div key={day} className={`${styles.cell} ${isToday ? styles.cellToday : ''}`}>
                <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ''}`}>
                  {day}
                </span>
                <div className={styles.eventList}>
                  {events.slice(0, 3).map(ev => {
                    const meta = ESTADO_META[ev.estado] || {}
                    return (
                      <button
                        key={ev.id}
                        className={styles.eventPill}
                        style={{
                          background: meta.bg,
                          borderLeft: `3px solid ${meta.color}`,
                          color: meta.color,
                        }}
                        onClick={() => setSelectedEvent(ev)}
                        title={ev.nombre}
                      >
                        {ev.nombre}
                      </button>
                    )
                  })}
                  {events.length > 3 && (
                    <span className={styles.morePill}>+{events.length - 3} más</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming events this month */}
      {upcomingThisMonth.length > 0 && (
        <div className={styles.upcoming}>
          <h2 className={styles.upcomingTitle}>Próximos Eventos</h2>
          <div className={styles.upcomingList}>
            {upcomingThisMonth.map(ev => {
              const meta = ESTADO_META[ev.estado] || {}
              const d = parseEventDate(ev.fecha)
              const daysLeft = Math.ceil((d - today) / 86400000)
              return (
                <button
                  key={ev.id}
                  className={styles.upcomingCard}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div className={styles.upcomingLeft}>
                    <div className={styles.upcomingDate}>
                      <span className={styles.upcomingDay}>{d.getDate()}</span>
                      <span className={styles.upcomingMon}>{MONTHS_ES[d.getMonth()].slice(0, 3)}</span>
                    </div>
                    <div className={styles.upcomingInfo}>
                      <span className={styles.upcomingNombre}>{ev.nombre}</span>
                      <span className={styles.upcomingVenue}>{ev.hora} · {ev.venue}</span>
                    </div>
                  </div>
                  <div className={styles.upcomingRight}>
                    <span className={styles.upcomingBadge} style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                    {daysLeft === 0
                      ? <span className={styles.upcomingDays} style={{ color: '#34d399' }}>Hoy</span>
                      : <span className={styles.upcomingDays}>{daysLeft}d</span>
                    }
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
