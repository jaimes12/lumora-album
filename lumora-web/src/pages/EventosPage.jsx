import { useState } from 'react'
import styles from './EventosPage.module.css'

/* ─── Mock data ─────────────────────────────────────────────── */
const CLIENTES = {
  c1: { id: 'c1', nombre: 'Fernanda García', telefono: '+52 55 1111 2222', email: 'fernanda@gmail.com', avatar: 'FG' },
  c2: { id: 'c2', nombre: 'Carlos Mendoza',  telefono: '+52 55 7788 9900', email: 'carlos@telmex.com',  avatar: 'CM' },
  c3: { id: 'c3', nombre: 'Ana López',        telefono: '+52 55 5555 1234', email: 'ana.lopez@gmail.com', avatar: 'AL' },
  c4: { id: 'c4', nombre: 'Roberto Sánchez',  telefono: '+52 55 3322 1100', email: 'roberto@itesm.mx',  avatar: 'RS' },
  c5: { id: 'c5', nombre: 'Mónica Reyes',     telefono: '+52 55 4455 6677', email: 'monica.reyes@gmail.com', avatar: 'MR' },
  c6: { id: 'c6', nombre: 'Valeria Torres',   telefono: '+52 55 1234 5678', email: 'valeria.t@gmail.com', avatar: 'VT' },
}

const PROVEEDORES = {
  p1: { id: 'p1', nombre: 'Foto Arte MX',       categoria: 'Fotografía',  telefono: '+52 55 9900 1122', rating: 4.9 },
  p2: { id: 'p2', nombre: 'Banquetes Gourmet',  categoria: 'Catering',    telefono: '+52 55 2233 4455', rating: 4.7 },
  p3: { id: 'p3', nombre: 'Flores & Diseño',    categoria: 'Decoración',  telefono: '+52 55 6677 8899', rating: 4.8 },
  p4: { id: 'p4', nombre: 'DJ Mango Sound',     categoria: 'Música',      telefono: '+52 55 1122 3344', rating: 4.6 },
  p5: { id: 'p5', nombre: 'Hacienda San Lucas', categoria: 'Venue',       telefono: '+52 55 5544 3322', rating: 4.9 },
  p6: { id: 'p6', nombre: 'Video Film Pro',     categoria: 'Video',       telefono: '+52 55 7766 5544', rating: 4.5 },
  p7: { id: 'p7', nombre: 'Transportes Elite',  categoria: 'Transporte',  telefono: '+52 55 8899 0011', rating: 4.4 },
  p8: { id: 'p8', nombre: 'Sabores del Norte',  categoria: 'Catering',    telefono: '+52 55 3344 5566', rating: 4.3 },
}

const EVENTOS_INIT = [
  {
    id: 1,
    nombre: 'Boda García & Ruiz',
    tipo: 'Boda',
    estado: 'confirmed',
    fecha: '14 Jun 2026',
    hora: '18:00',
    venue: 'Hacienda San Lucas, Querétaro',
    presupuesto: '$85,000',
    invitados: 180,
    notas: 'Ceremonia religiosa a las 18h, recepción a las 20h. Mesa principal para 10 personas.',
    clienteId: 'c1',
    proveedorIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
  },
  {
    id: 2,
    nombre: 'Corporativo Telmex Q3',
    tipo: 'Corporativo',
    estado: 'pending',
    fecha: '18 Jun 2026',
    hora: '09:00',
    venue: 'Centro Banamex, CDMX',
    presupuesto: '$42,000',
    invitados: 250,
    notas: 'Conferencia de resultados Q3. Requiere traducción simultánea inglés-español.',
    clienteId: 'c2',
    proveedorIds: ['p2', 'p7'],
  },
  {
    id: 3,
    nombre: 'XV Años Sofía López',
    tipo: 'XV Años',
    estado: 'confirmed',
    fecha: '22 Jun 2026',
    hora: '20:00',
    venue: 'Salón Versalles, Guadalajara',
    presupuesto: '$67,500',
    invitados: 220,
    notas: 'Tema: jardín encantado. Vals preparado con 14 chambelanes.',
    clienteId: 'c3',
    proveedorIds: ['p1', 'p3', 'p4', 'p6'],
  },
  {
    id: 4,
    nombre: 'Graduación ITESM',
    tipo: 'Graduación',
    estado: 'lead',
    fecha: '03 Jul 2026',
    hora: '11:00',
    venue: 'Auditorio ITESM Monterrey',
    presupuesto: '$28,000',
    invitados: 400,
    notas: 'Graduación generación 2026. Entrega de diplomas en 3 turnos.',
    clienteId: 'c4',
    proveedorIds: ['p8'],
  },
  {
    id: 5,
    nombre: 'Bautizo Sebastián Reyes',
    tipo: 'Bautizo',
    estado: 'confirmed',
    fecha: '08 Jul 2026',
    hora: '13:00',
    venue: 'Quinta Las Palmas, EDOMEX',
    presupuesto: '$18,500',
    invitados: 80,
    notas: 'Evento íntimo familiar. Buffet con menú infantil incluido.',
    clienteId: 'c5',
    proveedorIds: ['p2', 'p3'],
  },
  {
    id: 6,
    nombre: 'Boda Torres & Medina',
    tipo: 'Boda',
    estado: 'lead',
    fecha: '22 Jul 2026',
    hora: '17:00',
    venue: 'Por confirmar',
    presupuesto: '$110,000',
    invitados: 200,
    notas: 'Primera reunión el 5 de junio. Interesados en venue con jardín.',
    clienteId: 'c6',
    proveedorIds: [],
  },
]

/* ─── Helpers ───────────────────────────────────────────────── */
const ESTADO_META = {
  confirmed:  { label: 'Confirmado',  color: '#34d399', bg: 'rgba(52,211,153,0.12)'   },
  pending:    { label: 'Pendiente',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)'   },
  lead:       { label: 'Prospecto',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'   },
  cancelled:  { label: 'Cancelado',   color: '#f87171', bg: 'rgba(248,113,113,0.12)'  },
}

const TIPO_EMOJI = {
  Boda: '💍', 'XV Años': '🌸', Corporativo: '🏢',
  Graduación: '🎓', Bautizo: '✝️', Cumpleaños: '🎂',
}

const CAT_COLOR = {
  Fotografía: '#a78bfa', Catering: '#fb923c', Decoración: '#f472b6',
  Música: '#34d399', Venue: '#38bdf8', Video: '#fbbf24',
  Transporte: '#94a3b8', Otro: '#64748b',
}

function StarRating({ val }) {
  return (
    <span className={styles.stars}>
      {'★'.repeat(Math.round(val))}{'☆'.repeat(5 - Math.round(val))}
      <span className={styles.starVal}>{val}</span>
    </span>
  )
}

/* ─── Component ─────────────────────────────────────────────── */
export default function EventosPage() {
  const [filter, setFilter] = useState('todos')
  const [eventoActivo, setEventoActivo] = useState(null)
  const [eventos, setEventos] = useState(EVENTOS_INIT)
  const [showAddVendor, setShowAddVendor] = useState(false)

  const filtered = filter === 'todos'
    ? eventos
    : eventos.filter(e => e.estado === filter)

  const counts = {
    todos: eventos.length,
    confirmed: eventos.filter(e => e.estado === 'confirmed').length,
    pending:   eventos.filter(e => e.estado === 'pending').length,
    lead:      eventos.filter(e => e.estado === 'lead').length,
    cancelled: eventos.filter(e => e.estado === 'cancelled').length,
  }

  const eventoActivoData = eventoActivo
    ? eventos.find(e => e.id === eventoActivo)
    : null

  const quitarProveedor = (provId) => {
    setEventos(prev => prev.map(e =>
      e.id === eventoActivo
        ? { ...e, proveedorIds: e.proveedorIds.filter(id => id !== provId) }
        : e
    ))
  }

  const agregarProveedor = (provId) => {
    setEventos(prev => prev.map(e =>
      e.id === eventoActivo && !e.proveedorIds.includes(provId)
        ? { ...e, proveedorIds: [...e.proveedorIds, provId] }
        : e
    ))
    setShowAddVendor(false)
  }

  const disponibles = eventoActivoData
    ? Object.values(PROVEEDORES).filter(p => !eventoActivoData.proveedorIds.includes(p.id))
    : []

  return (
    <div className={styles.page}>

      {/* Header */}
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

      {/* Filters */}
      <div className={styles.filters}>
        {['todos', 'confirmed', 'pending', 'lead', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
          >
            {f === 'todos' ? 'Todos' : ESTADO_META[f]?.label}
            <span className={styles.filterCount}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className={styles.grid}>
        {filtered.map(ev => {
          const meta = ESTADO_META[ev.estado]
          const cliente = CLIENTES[ev.clienteId]
          const isActive = eventoActivo === ev.id
          return (
            <div
              key={ev.id}
              className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
              onClick={() => setEventoActivo(isActive ? null : ev.id)}
            >
              {/* Top row */}
              <div className={styles.cardTop}>
                <span className={styles.tipoEmoji}>{TIPO_EMOJI[ev.tipo] || '📅'}</span>
                <span
                  className={styles.estadoBadge}
                  style={{ color: meta.color, background: meta.bg }}
                >
                  {meta.label}
                </span>
              </div>

              {/* Name */}
              <h3 className={styles.cardNombre}>{ev.nombre}</h3>

              {/* Date + venue */}
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
                  {ev.venue}
                </span>
              </div>

              {/* Footer */}
              <div className={styles.cardFooter}>
                {/* Client */}
                <div className={styles.clientChip}>
                  <div className={styles.clientAvatar}>{cliente?.avatar}</div>
                  <span>{cliente?.nombre}</span>
                </div>

                {/* Vendors + budget */}
                <div className={styles.cardRight}>
                  {ev.proveedorIds.length > 0 && (
                    <div className={styles.vendorPills}>
                      {ev.proveedorIds.slice(0, 3).map(pid => (
                        <span
                          key={pid}
                          className={styles.vendorDot}
                          style={{ background: CAT_COLOR[PROVEEDORES[pid]?.categoria] || '#64748b' }}
                          title={PROVEEDORES[pid]?.nombre}
                        />
                      ))}
                      {ev.proveedorIds.length > 3 && (
                        <span className={styles.vendorMore}>+{ev.proveedorIds.length - 3}</span>
                      )}
                    </div>
                  )}
                  <span className={styles.presupuesto}>{ev.presupuesto}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Detail panel ─────────────────────────────────────── */}
      {eventoActivoData && (() => {
        const ev = eventoActivoData
        const meta = ESTADO_META[ev.estado]
        const cliente = CLIENTES[ev.clienteId]
        return (
          <div className={styles.panel}>
            {/* Panel header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleRow}>
                <span className={styles.panelEmoji}>{TIPO_EMOJI[ev.tipo] || '📅'}</span>
                <div className={styles.panelTitleInfo}>
                  <h2 className={styles.panelTitle}>{ev.nombre}</h2>
                  <span className={styles.panelTipo}>{ev.tipo}</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setEventoActivo(null)}>✕</button>
            </div>

            <div className={styles.panelBody}>

              {/* Status + budget */}
              <div className={styles.panelStatRow}>
                <div className={styles.panelStat}>
                  <span className={styles.panelStatLabel}>Estado</span>
                  <span className={styles.estadoBadge} style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.panelStatLabel}>Presupuesto</span>
                  <span className={styles.panelStatVal}>{ev.presupuesto}</span>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.panelStatLabel}>Invitados</span>
                  <span className={styles.panelStatVal}>{ev.invitados}</span>
                </div>
              </div>

              {/* Info fields */}
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Fecha</span>
                  <span className={styles.infoVal}>{ev.fecha} a las {ev.hora}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>Venue</span>
                  <span className={styles.infoVal}>{ev.venue}</span>
                </div>
                {ev.notas && (
                  <div className={`${styles.infoField} ${styles.infoFieldFull}`}>
                    <span className={styles.infoLabel}>Notas</span>
                    <span className={styles.infoVal}>{ev.notas}</span>
                  </div>
                )}
              </div>

              {/* ── Cliente vinculado ── */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>Cliente</span>
                </div>
                <div className={styles.clienteCard}>
                  <div className={styles.clienteAvatar}>{cliente?.avatar}</div>
                  <div className={styles.clienteInfo}>
                    <span className={styles.clienteNombre}>{cliente?.nombre}</span>
                    <span className={styles.clienteContact}>{cliente?.email}</span>
                    <span className={styles.clienteContact}>{cliente?.telefono}</span>
                  </div>
                  <button className={styles.clienteBtn}>Ver perfil →</button>
                </div>
              </div>

              {/* ── Proveedores vinculados ── */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>
                    Proveedores
                    <span className={styles.sectionCount}>{ev.proveedorIds.length}</span>
                  </span>
                  <button
                    className={styles.btnAddVendor}
                    onClick={() => setShowAddVendor(v => !v)}
                  >
                    + Vincular
                  </button>
                </div>

                {/* Add vendor picker */}
                {showAddVendor && disponibles.length > 0 && (
                  <div className={styles.vendorPicker}>
                    {disponibles.map(p => (
                      <button
                        key={p.id}
                        className={styles.vendorPickItem}
                        onClick={() => agregarProveedor(p.id)}
                      >
                        <span
                          className={styles.catDot}
                          style={{ background: CAT_COLOR[p.categoria] || '#64748b' }}
                        />
                        <span className={styles.vendorPickName}>{p.nombre}</span>
                        <span className={styles.vendorPickCat}>{p.categoria}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Vendor list */}
                <div className={styles.vendorList}>
                  {ev.proveedorIds.length === 0 ? (
                    <p className={styles.emptyVendors}>Sin proveedores vinculados</p>
                  ) : (
                    ev.proveedorIds.map(pid => {
                      const p = PROVEEDORES[pid]
                      if (!p) return null
                      return (
                        <div key={pid} className={styles.vendorCard}>
                          <div
                            className={styles.vendorIcon}
                            style={{ background: `${CAT_COLOR[p.categoria]}22`, color: CAT_COLOR[p.categoria] || '#64748b' }}
                          >
                            {p.categoria[0]}
                          </div>
                          <div className={styles.vendorInfo}>
                            <span className={styles.vendorNombre}>{p.nombre}</span>
                            <div className={styles.vendorMeta}>
                              <span
                                className={styles.vendorCat}
                                style={{ color: CAT_COLOR[p.categoria] || '#64748b' }}
                              >
                                {p.categoria}
                              </span>
                              <StarRating val={p.rating} />
                            </div>
                            <span className={styles.vendorTel}>{p.telefono}</span>
                          </div>
                          <button
                            className={styles.vendorRemove}
                            onClick={() => quitarProveedor(pid)}
                            title="Quitar proveedor"
                          >✕</button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Panel footer */}
            <div className={styles.panelFooter}>
              <button className={styles.btnEdit}>Editar evento</button>
              <button className={styles.btnCotizar}>Crear cotización</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
