import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { EVENTOS, ESTADO_META } from '../data/eventosData'
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

export default function CalendarioPage() {
  const navigate = useNavigate()
  const today = new Date()
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
                        onClick={() => navigate(`/app/eventos/${ev.id}`)}
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
                  onClick={() => navigate(`/app/eventos/${ev.id}`)}
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
