import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './EventoDetallePage.module.css'
import {
  EVENTOS, CLIENTES, PROVEEDORES,
  ESTADO_META, TIPO_EMOJI, CAT_COLOR, fmt
} from '../data/eventosData'

function StarRating({ val }) {
  return (
    <span className={styles.stars}>
      {'★'.repeat(Math.round(val))}{'☆'.repeat(5 - Math.round(val))}
      <span className={styles.starVal}>{val}</span>
    </span>
  )
}

export default function EventoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const eventoInit = EVENTOS.find(e => e.id === id)

  const [evento, setEvento] = useState(eventoInit)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [showAddPago, setShowAddPago] = useState(false)
  const [nuevoPago, setNuevoPago] = useState({ concepto: '', monto: '', metodo: 'Transferencia' })

  if (!evento) return (
    <div className={styles.notFound}>
      <p>Evento no encontrado.</p>
      <button onClick={() => navigate('/app/eventos')}>← Volver</button>
    </div>
  )

  const cliente  = CLIENTES[evento.clienteId]
  const meta     = ESTADO_META[evento.estado]
  const abonado  = evento.pagos.reduce((s, p) => s + p.monto, 0)
  const pendiente = evento.presupuestoTotal - abonado
  const pct      = Math.min(100, Math.round((abonado / evento.presupuestoTotal) * 100))
  const disponibles = Object.values(PROVEEDORES).filter(p => !evento.proveedorIds.includes(p.id))

  const quitarProveedor = (pid) =>
    setEvento(e => ({ ...e, proveedorIds: e.proveedorIds.filter(id => id !== pid) }))

  const agregarProveedor = (pid) => {
    setEvento(e => ({ ...e, proveedorIds: [...e.proveedorIds, pid] }))
    setShowAddVendor(false)
  }

  const agregarPago = () => {
    if (!nuevoPago.concepto || !nuevoPago.monto) return
    const pago = {
      id: `p_${Date.now()}`,
      concepto: nuevoPago.concepto,
      monto: parseFloat(nuevoPago.monto),
      fecha: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
      metodo: nuevoPago.metodo,
    }
    setEvento(e => ({ ...e, pagos: [...e.pagos, pago] }))
    setNuevoPago({ concepto: '', monto: '', metodo: 'Transferencia' })
    setShowAddPago(false)
  }

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/app/eventos')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Eventos
        </button>
        <div className={styles.topActions}>
          <select
            className={styles.statusSelect}
            value={evento.estado}
            style={{ color: meta.color, borderColor: meta.color + '44', background: meta.bg }}
            onChange={e => setEvento(ev => ({ ...ev, estado: e.target.value }))}
          >
            {Object.entries(ESTADO_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button className={styles.btnEdit}>Editar</button>
          <button className={styles.btnCotizar}>Crear cotización</button>
        </div>
      </div>

      {/* ── Hero header ── */}
      <div className={styles.hero}>
        <span className={styles.heroEmoji}>{TIPO_EMOJI[evento.tipo] || '📅'}</span>
        <div className={styles.heroInfo}>
          <div className={styles.heroTitleRow}>
            <h1 className={styles.heroTitle}>{evento.nombre}</h1>
          </div>
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {evento.fecha} · {evento.hora}
            </span>
            <span className={styles.heroMetaItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {evento.venue}
            </span>
            <span className={styles.heroMetaItem}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              {evento.invitados} invitados
            </span>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className={styles.mainGrid}>

        {/* ── LEFT COLUMN ── */}
        <div className={styles.leftCol}>

          {/* Financiero */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>💰 Resumen financiero</span>
            </div>

            <div className={styles.finGrid}>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Total del evento</span>
                <span className={styles.finTotal}>{fmt(evento.presupuestoTotal)}</span>
              </div>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Abonado</span>
                <span className={styles.finAbonado}>{fmt(abonado)}</span>
              </div>
              <div className={styles.finStat}>
                <span className={styles.finLabel}>Por liquidar</span>
                <span className={`${styles.finPendiente} ${pendiente === 0 ? styles.finPagado : ''}`}>
                  {pendiente === 0 ? '✓ Liquidado' : fmt(pendiente)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.progressPct}>{pct}% cobrado</span>
            </div>

            {/* Pagos table */}
            <div className={styles.pagosHeader}>
              <span className={styles.pagosTitle}>Historial de pagos</span>
              <button className={styles.btnAddPago} onClick={() => setShowAddPago(v => !v)}>
                + Registrar pago
              </button>
            </div>

            {showAddPago && (
              <div className={styles.pagoForm}>
                <input
                  className={styles.pagoInput}
                  placeholder="Concepto (ej. Anticipo 50%)"
                  value={nuevoPago.concepto}
                  onChange={e => setNuevoPago(p => ({ ...p, concepto: e.target.value }))}
                />
                <input
                  className={styles.pagoInput}
                  type="number"
                  placeholder="Monto en $"
                  value={nuevoPago.monto}
                  onChange={e => setNuevoPago(p => ({ ...p, monto: e.target.value }))}
                />
                <select
                  className={styles.pagoSelect}
                  value={nuevoPago.metodo}
                  onChange={e => setNuevoPago(p => ({ ...p, metodo: e.target.value }))}
                >
                  {['Transferencia', 'Efectivo', 'Tarjeta', 'CoDi', 'Cheque'].map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <button className={styles.btnGuardarPago} onClick={agregarPago}>Guardar</button>
              </div>
            )}

            {evento.pagos.length === 0 ? (
              <p className={styles.sinPagos}>Sin pagos registrados aún</p>
            ) : (
              <div className={styles.pagosList}>
                {evento.pagos.map(p => (
                  <div key={p.id} className={styles.pagoRow}>
                    <div className={styles.pagoInfo}>
                      <span className={styles.pagoConcepto}>{p.concepto}</span>
                      <span className={styles.pagoFechaMetodo}>{p.fecha} · {p.metodo}</span>
                    </div>
                    <span className={styles.pagoMonto}>{fmt(p.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notas */}
          {evento.notas && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>📝 Notas del evento</span>
              </div>
              <p className={styles.notasText}>{evento.notas}</p>
            </section>
          )}

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className={styles.rightCol}>

          {/* Cliente */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>👤 Cliente</span>
              <button className={styles.btnLink}>Ver perfil →</button>
            </div>
            <div className={styles.clienteWrap}>
              <div className={styles.clienteAvatar}>{cliente?.avatar}</div>
              <div className={styles.clienteInfo}>
                <span className={styles.clienteNombre}>{cliente?.nombre}</span>
                <a className={styles.clienteContact} href={`mailto:${cliente?.email}`}>{cliente?.email}</a>
                <a className={styles.clienteContact} href={`tel:${cliente?.telefono}`}>{cliente?.telefono}</a>
              </div>
            </div>
          </section>

          {/* Proveedores */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>
                🏪 Proveedores
                <span className={styles.badge}>{evento.proveedorIds.length}</span>
              </span>
              <button className={styles.btnLink} onClick={() => setShowAddVendor(v => !v)}>
                + Vincular
              </button>
            </div>

            {showAddVendor && disponibles.length > 0 && (
              <div className={styles.vendorPicker}>
                {disponibles.map(p => (
                  <button key={p.id} className={styles.pickerItem} onClick={() => agregarProveedor(p.id)}>
                    <span className={styles.pickerDot} style={{ background: CAT_COLOR[p.categoria] || '#64748b' }} />
                    <span className={styles.pickerNombre}>{p.nombre}</span>
                    <span className={styles.pickerCat}>{p.categoria}</span>
                  </button>
                ))}
              </div>
            )}

            {evento.proveedorIds.length === 0 ? (
              <p className={styles.sinProveedores}>Sin proveedores vinculados</p>
            ) : (
              <div className={styles.vendorList}>
                {evento.proveedorIds.map(pid => {
                  const p = PROVEEDORES[pid]
                  if (!p) return null
                  return (
                    <div key={pid} className={styles.vendorCard}>
                      <div
                        className={styles.vendorIcon}
                        style={{ background: CAT_COLOR[p.categoria] + '22', color: CAT_COLOR[p.categoria] }}
                      >
                        {p.categoria[0]}
                      </div>
                      <div className={styles.vendorInfo}>
                        <span className={styles.vendorNombre}>{p.nombre}</span>
                        <div className={styles.vendorMeta}>
                          <span className={styles.vendorCat} style={{ color: CAT_COLOR[p.categoria] }}>
                            {p.categoria}
                          </span>
                          <StarRating val={p.rating} />
                        </div>
                        <span className={styles.vendorTel}>{p.telefono}</span>
                      </div>
                      <div className={styles.vendorRight}>
                        <span className={styles.vendorPrecio}>{fmt(p.precio)}</span>
                        <button className={styles.vendorRemove} onClick={() => quitarProveedor(pid)} title="Quitar">✕</button>
                      </div>
                    </div>
                  )
                })}
                {/* Costo proveedores */}
                <div className={styles.vendorTotal}>
                  <span>Costo estimado proveedores</span>
                  <span className={styles.vendorTotalVal}>
                    {fmt(evento.proveedorIds.reduce((s, pid) => s + (PROVEEDORES[pid]?.precio || 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
