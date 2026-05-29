import { useState } from 'react'
import styles from './EventosPage.module.css'

const EVENTOS = [
  { id: 1, nombre: 'Boda García & Ruiz', cliente: 'Fernanda García', tipo: 'Boda', fecha: '14 Jun 2026', estado: 'confirmed', presupuesto: '$85,000' },
  { id: 2, nombre: 'Corporativo Telmex Q3', cliente: 'Carlos Mendoza', tipo: 'Corporativo', fecha: '18 Jun 2026', estado: 'pending', presupuesto: '$42,000' },
  { id: 3, nombre: 'XV Años Sofía López', cliente: 'Ana López', tipo: 'XV Años', fecha: '22 Jun 2026', estado: 'confirmed', presupuesto: '$67,500' },
  { id: 4, nombre: 'Graduación ITESM', cliente: 'Roberto Sánchez', tipo: 'Graduación', fecha: '03 Jul 2026', estado: 'lead', presupuesto: '$28,000' },
  { id: 5, nombre: 'Bautizo Sebastián Reyes', cliente: 'Mónica Reyes', tipo: 'Bautizo', fecha: '08 Jul 2026', estado: 'confirmed', presupuesto: '$18,500' },
  { id: 6, nombre: 'Aniversario Grupo Alfa', cliente: 'Héctor Villanueva', tipo: 'Corporativo', fecha: '15 Jul 2026', estado: 'cancelled', presupuesto: '$95,000' },
  { id: 7, nombre: 'Boda Torres & Medina', cliente: 'Valeria Torres', tipo: 'Boda', fecha: '22 Jul 2026', estado: 'lead', presupuesto: '$110,000' },
]

const ESTADO_META = {
  confirmed: { label: 'Confirmado', cls: 'confirmed' },
  pending:   { label: 'Pendiente',  cls: 'pending'   },
  lead:      { label: 'Prospecto',  cls: 'lead'       },
  cancelled: { label: 'Cancelado',  cls: 'cancelled'  },
}

export default function EventosPage() {
  const [filter, setFilter] = useState('todos')

  const filtered = filter === 'todos'
    ? EVENTOS
    : EVENTOS.filter(e => e.estado === filter)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Eventos</h1>
          <p className={styles.sub}>{EVENTOS.length} eventos registrados este mes</p>
        </div>
        <button className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo evento
        </button>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {['todos', 'confirmed', 'pending', 'lead', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
          >
            {f === 'todos' ? 'Todos' : ESTADO_META[f]?.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre del evento</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Presupuesto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const meta = ESTADO_META[e.estado]
              return (
                <tr key={e.id} className={styles.row}>
                  <td className={styles.eventName}>{e.nombre}</td>
                  <td className={styles.muted}>{e.cliente}</td>
                  <td>
                    <span className={styles.tipoBadge}>{e.tipo}</span>
                  </td>
                  <td className={styles.muted}>{e.fecha}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${meta.cls}`]}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className={styles.presupuesto}>{e.presupuesto}</td>
                  <td>
                    <button className={styles.actionBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
