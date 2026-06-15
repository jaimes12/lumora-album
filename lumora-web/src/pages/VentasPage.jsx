import { useState, useEffect } from 'react'
import { ventasApi } from '../api/ventasApi'
import { clientesApi } from '../api/clientesApi'
import { eventosApi } from '../api/eventosApi'
import { ventasStatsApi } from '../api/ventasStatsApi'
import styles from './VentasPage.module.css'

// ── NuevoDocModal ──────────────────────────────────────────────────────────
function NuevoDocModal({ type = 'quote', onClose, onCreated }) {
  const [clientes, setClientes] = useState([])
  const [eventos,  setEventos]  = useState([])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [items,    setItems]    = useState([{ descripcion: '', cantidad: 1, precio: '' }])
  const [form, setForm] = useState({ clienteId: '', eventoId: '', notas: '', impuesto: '0' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const isQuote = type === 'quote'

  useEffect(() => {
    clientesApi.getAll().then(setClientes).catch(() => {})
    eventosApi.getAll().then(setEventos).catch(() => {})
  }, [])

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1, precio: '' }])
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.precio) || 0) * (parseInt(it.cantidad) || 1), 0)
  const tax = parseFloat(form.impuesto) || 0

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.clienteId) { setError('Selecciona un cliente'); return }
    if (items.every(it => !it.descripcion)) { setError('Agrega al menos un concepto'); return }
    setSaving(true); setError('')
    try {
      const apiItems = items.filter(it => it.descripcion).map((it, i) => ({
        description: it.descripcion,
        quantity: parseInt(it.cantidad) || 1,
        unitPrice: parseFloat(it.precio) || 0,
        sortOrder: i,
      }))
      const nueva = await ventasApi.create({
        clientId: form.clienteId,
        eventId: form.eventoId || null,
        type,
        items: apiItems,
        tax,
        notes: form.notas || null,
      })
      onCreated(nueva)
      onClose()
    } catch (err) { setError(err.message || 'Error al crear') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isQuote ? 'Nueva cotización' : 'Nueva factura'}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.modalGrid}>
            <div className={styles.modalField}>
              <label>Cliente *</label>
              <select value={form.clienteId} onChange={set('clienteId')} required>
                <option value="">— Seleccionar —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Evento (opcional)</label>
              <select value={form.eventoId} onChange={set('eventoId')}>
                <option value="">— Ninguno —</option>
                {eventos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <span className={styles.itemsLabel}>Conceptos</span>
              <button type="button" className={styles.addItemBtn} onClick={addItem}>+ Agregar</button>
            </div>
            {items.map((it, i) => (
              <div key={i} className={styles.itemRow}>
                <input className={styles.itemDesc} placeholder="Descripción del servicio" value={it.descripcion}
                  onChange={e => setItem(i, 'descripcion', e.target.value)} />
                <input className={styles.itemNum} type="number" placeholder="Cant." min="1" value={it.cantidad}
                  onChange={e => setItem(i, 'cantidad', e.target.value)} />
                <input className={styles.itemNum} type="number" placeholder="Precio" min="0" value={it.precio}
                  onChange={e => setItem(i, 'precio', e.target.value)} />
                {items.length > 1 && (
                  <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(i)}>✕</button>
                )}
              </div>
            ))}
            <div className={styles.itemsTotal}>
              <span>Subtotal: <strong>${subtotal.toLocaleString('es-MX')}</strong></span>
              <div className={styles.taxRow}>
                <label>IVA / impuesto ($):</label>
                <input className={styles.taxInput} type="number" min="0" value={form.impuesto} onChange={set('impuesto')} />
              </div>
              <span>Total: <strong>${(subtotal + tax).toLocaleString('es-MX')}</strong></span>
            </div>
          </div>

          <div className={styles.modalField}>
            <label>Notas</label>
            <textarea placeholder="Condiciones, validez, etc." value={form.notas} onChange={set('notas')} rows={2} />
          </div>

          {error && <p className={styles.modalError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalBtnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.modalBtnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : isQuote ? 'Crear cotización →' : 'Crear factura →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Chart helpers ──────────────────────────────────────────────────────────
function niceMax(val) {
  if (val <= 0) return 100
  const mag = Math.pow(10, Math.floor(Math.log10(val)))
  const f = val / mag
  if (f <= 1) return mag
  if (f <= 2) return 2 * mag
  if (f <= 5) return 5 * mag
  return 10 * mag
}

function fmtY(v) {
  if (v === 0) return '0'
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `${Math.round(v / 1000)}k`
  return v.toString()
}

const PIE_COLORS = ['#c9a227', '#34d399', '#38bdf8', '#a78bfa', '#fb923c', '#f472b6']

function BarChart({ data = [], color = 'var(--accent)', emptyText = 'Sin datos para este período' }) {
  if (!data.length) return <div className={styles.chartEmpty}>{emptyText}</div>
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const nMax   = niceMax(maxVal)

  return (
    <div className={styles.barChartWrap}>
      <div className={styles.barChartRow}>
        <div className={styles.yAxis}>
          {[1, 0.75, 0.5, 0.25, 0].map(p => (
            <span key={p}>{fmtY(Math.round(nMax * p))}</span>
          ))}
        </div>
        <div className={styles.plotArea}>
          {[0, 0.25, 0.5, 0.75, 1].map(p => (
            <div key={p} className={styles.gridLine} style={{ bottom: `${p * 100}%` }} />
          ))}
          <div className={styles.barsRow}>
            {data.map(d => (
              <div key={d.label} className={styles.barItem}>
                <div
                  className={styles.barFill}
                  style={{ height: `${Math.max(d.value / nMax * 100, d.value > 0 ? 2 : 0)}%`, background: color }}
                  title={`$${Number(d.value).toLocaleString('es-MX')}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.xRow}>
        <div className={styles.xSpacer} />
        <div className={styles.xLabels}>
          {data.map(d => <span key={d.label}>{d.label}</span>)}
        </div>
      </div>
    </div>
  )
}

function PieChart({ data = [] }) {
  const total = data.reduce((s, d) => s + Number(d.value), 0)
  if (!data.length || total === 0)
    return <div className={styles.chartEmpty}>Sin pagos registrados</div>

  let cumDeg = -90
  const slices = data.map((d, i) => {
    const pct   = d.value / total
    const start = cumDeg
    cumDeg += pct * 360
    return { ...d, pct, start, end: cumDeg, color: PIE_COLORS[i % PIE_COLORS.length] }
  })

  const arc = (start, end, r = 80) => {
    const cx = 100, cy = 100
    if (end - start >= 359.9) return `M${cx},${cy - r} A${r},${r},0,1,1,${cx - 0.01},${cy - r} Z`
    const sR = (start * Math.PI) / 180
    const eR = (end   * Math.PI) / 180
    const x1 = cx + r * Math.cos(sR), y1 = cy + r * Math.sin(sR)
    const x2 = cx + r * Math.cos(eR), y2 = cy + r * Math.sin(eR)
    return `M${cx},${cy} L${x1},${y1} A${r},${r},0,${end - start > 180 ? 1 : 0},1,${x2},${y2} Z`
  }

  return (
    <div className={styles.pieWrap}>
      <svg viewBox="0 0 200 200" className={styles.pieSvg}>
        {slices.map(s => <path key={s.method} d={arc(s.start, s.end)} fill={s.color} />)}
      </svg>
      <div className={styles.pieLegend}>
        {slices.map(s => (
          <div key={s.method} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: s.color }} />
            <div className={styles.legendText}>
              <span className={styles.legendLabel}>{s.label}</span>
              <span className={styles.legendPct}>{(s.pct * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VentasStats({ stats, loading }) {
  const f = v => '$' + Number(v ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const cards = [
    { label: 'Ventas de Hoy',          value: f(stats?.todaySales),    sub: 'eventos de hoy',        color: '#7c6af7' },
    { label: 'Total Ventas (Eventos)',  value: f(stats?.totalSales),    sub: `${stats?.totalEvents ?? 0} eventos`, color: '#c9a227' },
    { label: 'Total Pagos Recibidos',   value: f(stats?.totalPayments), sub: 'pagos registrados',      color: '#34d399' },
    { label: 'Promedio Diario',         value: f(stats?.dailyAverage),  sub: 'Últimos 30 días',        color: '#38bdf8' },
    { label: 'Eventos Totales',         value: String(stats?.totalEvents ?? 0), sub: 'en el período',  color: '#a78bfa' },
  ]

  return (
    <div className={styles.statsPanel}>
      <div className={styles.statsCardsRow}>
        {cards.map(c => (
          <div key={c.label} className={styles.statCard}>
            <span className={styles.statCardLabel}>{c.label}</span>
            <span className={styles.statCardValue} style={{ color: c.color }}>
              {loading ? '—' : c.value}
            </span>
            <span className={styles.statCardSub}>{c.sub}</span>
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <span className={styles.chartCardTitle}>Ventas por Mes</span>
            <span className={styles.chartCardSub}>Presupuesto de eventos (MXN)</span>
          </div>
          {loading ? <div className={styles.chartSkeleton} /> : (
            <BarChart data={stats?.byMonth ?? []} color="#c9a227" emptyText="Sin eventos en los últimos 12 meses" />
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <span className={styles.chartCardTitle}>Ventas Diarias</span>
            <span className={styles.chartCardSub}>Últimos 30 días</span>
          </div>
          {loading ? <div className={styles.chartSkeleton} /> : (
            <BarChart data={stats?.byDay ?? []} color="#7c6af7" emptyText="Sin ventas en los últimos 30 días" />
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <span className={styles.chartCardTitle}>Ventas Semanales</span>
            <span className={styles.chartCardSub}>Últimas 12 semanas</span>
          </div>
          {loading ? <div className={styles.chartSkeleton} /> : (
            <BarChart data={stats?.byWeek ?? []} color="#34d399" emptyText="Sin ventas en las últimas 12 semanas" />
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <span className={styles.chartCardTitle}>Ventas por Método de Pago</span>
            <span className={styles.chartCardSub}>Distribución de pagos</span>
          </div>
          {loading ? <div className={styles.chartSkeleton} /> : (
            <PieChart data={stats?.byMethod ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Status maps ────────────────────────────────────────────────────────────
const COT_META = {
  approved: { label: 'Aprobada',  cls: 'approved' },
  signed:   { label: 'Aprobada',  cls: 'approved' },
  sent:     { label: 'Enviada',   cls: 'pending'  },
  pending:  { label: 'Pendiente', cls: 'pending'  },
  draft:    { label: 'Borrador',  cls: 'draft'    },
  cancelled:{ label: 'Cancelada', cls: 'draft'    },
}

const FAC_META = {
  paid:     { label: 'Pagada',    cls: 'paid'    },
  sent:     { label: 'Enviada',   cls: 'pending' },
  pending:  { label: 'Pendiente', cls: 'pending' },
  draft:    { label: 'Borrador',  cls: 'draft'   },
  overdue:  { label: 'Vencida',   cls: 'overdue' },
  cancelled:{ label: 'Cancelada', cls: 'draft'   },
}

// Actions available per type+status
const COT_ACTIONS = {
  draft:     [
    { label: 'Marcar enviada',    status: 'sent',      cls: 'secondary' },
    { label: 'Aprobar',           status: 'approved',  cls: 'success'   },
    { label: 'Cancelar doc.',     status: 'cancelled', cls: 'dangerOut' },
  ],
  sent:      [
    { label: 'Marcar aprobada',   status: 'approved',  cls: 'success'   },
    { label: 'Cancelar doc.',     status: 'cancelled', cls: 'dangerOut' },
  ],
  approved:  [
    { label: 'Convertir a factura', action: 'convert', cls: 'primary'   },
    { label: 'Cancelar doc.',       status: 'cancelled', cls: 'dangerOut' },
  ],
  signed:    [
    { label: 'Convertir a factura', action: 'convert', cls: 'primary'   },
    { label: 'Cancelar doc.',       status: 'cancelled', cls: 'dangerOut' },
  ],
  cancelled: [],
}

const FAC_ACTIONS = {
  draft:     [
    { label: 'Marcar enviada',    status: 'sent',      cls: 'secondary' },
  ],
  sent:      [
    { label: 'Marcar como pagada', status: 'paid',     cls: 'success'   },
    { label: 'Cancelar doc.',      status: 'cancelled', cls: 'dangerOut' },
  ],
  paid:      [],
  overdue:   [
    { label: 'Marcar como pagada', status: 'paid',     cls: 'success'   },
    { label: 'Cancelar doc.',      status: 'cancelled', cls: 'dangerOut' },
  ],
  cancelled: [],
}

// ── VentaDetailModal ───────────────────────────────────────────────────────
function VentaDetailModal({ item, onClose, onUpdated, onDeleted, onCreated }) {
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')
  const [confirmDelete,  setConfirmDelete]  = useState(false)

  const isCot    = item.tipo === 'quote'
  const meta     = isCot ? COT_META : FAC_META
  const m        = meta[item.estado] ?? { label: item.estado, cls: 'draft' }
  const actions  = isCot ? (COT_ACTIONS[item.estado] ?? []) : (FAC_ACTIONS[item.estado] ?? [])
  const canDelete = ['draft', 'cancelled'].includes(item.estado)

  const fmt = n => '$' + Number(n).toLocaleString('es-MX')

  const handleAction = async (action) => {
    if (action.action === 'convert') {
      setSaving(true); setError('')
      try {
        const invoice = await ventasApi.create({
          clientId: item.cliente,
          eventId: item.eventoId || null,
          type: 'invoice',
          items: item.items.map(it => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            sortOrder: it.sortOrder,
          })),
          tax: item.impuesto,
          notes: item.notas || null,
        })
        const updatedQuote = await ventasApi.update(item.id, { status: 'signed' })
        onUpdated(updatedQuote)
        onCreated(invoice)
        onClose()
      } catch (err) { setError(err.message || 'Error al convertir') }
      finally { setSaving(false) }
      return
    }
    setSaving(true); setError('')
    try {
      const updated = await ventasApi.update(item.id, { status: action.status })
      onUpdated(updated)
      onClose()
    } catch (err) { setError(err.message || 'Error al actualizar') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await ventasApi.delete(item.id)
      onDeleted(item.id)
      onClose()
    } catch { setError('Error al eliminar') }
    finally { setSaving(false) }
  }

  const clsForAction = cls => {
    if (cls === 'primary')    return styles.modalBtnPrimary
    if (cls === 'success')    return styles.btnSuccess
    if (cls === 'dangerOut')  return styles.btnDangerOutline
    return styles.modalBtnSecondary
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.detailModal}`}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.detailTitleRow}>
            <h2 className={styles.modalTitle}>{item.numero}</h2>
            <span className={`${styles.badge} ${styles[`badge_${m.cls}`]}`}>{m.label}</span>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Meta info */}
        <div className={styles.detailMeta}>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>Cliente</span>
            <span className={styles.detailMetaValue}>{item.clienteNombre}</span>
          </div>
          {item.eventoNombre && (
            <div className={styles.detailMetaItem}>
              <span className={styles.detailMetaLabel}>Evento</span>
              <span className={styles.detailMetaValue}>{item.eventoNombre}</span>
            </div>
          )}
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>Fecha</span>
            <span className={styles.detailMetaValue}>{item.fecha}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>Tipo</span>
            <span className={styles.detailMetaValue}>{item.tipo === 'quote' ? 'Cotización' : 'Factura'}</span>
          </div>
        </div>

        {/* Items table */}
        <div className={styles.detailItemsWrap}>
          <table className={styles.detailItemsTable}>
            <thead>
              <tr>
                <th>Concepto</th>
                <th className={styles.numTh}>Cant.</th>
                <th className={styles.numTh}>P. Unit.</th>
                <th className={styles.numTh}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(item.items || []).map((it, i) => (
                <tr key={it.id ?? i}>
                  <td className={styles.detailConceptoTd}>{it.description}</td>
                  <td className={styles.numTd}>{it.quantity}</td>
                  <td className={styles.numTd}>{fmt(it.unitPrice)}</td>
                  <td className={styles.numTd}><strong>{fmt(it.total)}</strong></td>
                </tr>
              ))}
              {(item.items || []).length === 0 && (
                <tr><td colSpan={4} className={styles.detailEmptyItems}>Sin conceptos</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={styles.detailTotals}>
          <div className={styles.detailTotalRow}>
            <span>Subtotal</span>
            <span>{fmt(item.subtotal)}</span>
          </div>
          {item.impuesto > 0 && (
            <div className={styles.detailTotalRow}>
              <span>IVA / Impuesto</span>
              <span>{fmt(item.impuesto)}</span>
            </div>
          )}
          <div className={`${styles.detailTotalRow} ${styles.detailTotalFinal}`}>
            <span>Total</span>
            <span>{item.total}</span>
          </div>
          {item.tipo === 'invoice' && item.pagado > 0 && (
            <div className={`${styles.detailTotalRow} ${styles.detailTotalPaid}`}>
              <span>Pagado</span>
              <span>{fmt(item.pagado)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {item.notas && (
          <div className={styles.detailNotes}>
            <span className={styles.detailNotesLabel}>Notas</span>
            <p className={styles.detailNotesText}>{item.notas}</p>
          </div>
        )}

        {error && <p className={styles.modalError}>{error}</p>}

        {/* Footer actions */}
        <div className={styles.detailFooter}>
          <div className={styles.detailFooterLeft}>
            {canDelete && (
              confirmDelete ? (
                <div className={styles.deleteConfirm}>
                  <span>¿Eliminar definitivamente?</span>
                  <button className={styles.btnDanger} onClick={handleDelete} disabled={saving}>
                    Sí, eliminar
                  </button>
                  <button className={styles.modalBtnSecondary} onClick={() => setConfirmDelete(false)}>
                    No
                  </button>
                </div>
              ) : (
                <button className={styles.btnDanger} onClick={() => setConfirmDelete(true)} disabled={saving}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Eliminar
                </button>
              )
            )}
          </div>
          <div className={styles.detailFooterRight}>
            <button className={styles.modalBtnSecondary} onClick={onClose}>Cerrar</button>
            {actions.map(action => (
              <button
                key={action.label}
                className={clsForAction(action.cls)}
                onClick={() => handleAction(action)}
                disabled={saving}
              >
                {saving ? '…' : action.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── VentasPage ─────────────────────────────────────────────────────────────
export default function VentasPage() {
  const [ventas,      setVentas]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('estadisticas')
  const [search,      setSearch]      = useState('')
  const [showCreate,  setShowCreate]  = useState(null)
  const [detailItem,  setDetailItem]  = useState(null)

  const [stats,        setStats]        = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [mesFilter,    setMesFilter]    = useState('all')

  const currentYear = new Date().getFullYear()
  const MES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const allMeses = MES_NOMBRES.map((name, i) => ({
    value: `${currentYear}-${String(i + 1).padStart(2, '0')}`,
    label: `${name} ${currentYear}`,
  }))

  useEffect(() => {
    ventasApi.getAll()
      .then(setVentas)
      .catch(() => setVentas([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setLoadingStats(true)
    ventasStatsApi.getStats(mesFilter === 'all' ? null : mesFilter)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false))
  }, [mesFilter])

  const cotizaciones = ventas.filter(v => v.tipo === 'quote')
  const facturas     = ventas.filter(v => v.tipo === 'invoice')
  const q = search.trim().toLowerCase()
  const applySearch = (list) => q
    ? list.filter(v =>
        (v.clienteNombre || '').toLowerCase().includes(q) ||
        (v.numero || '').toLowerCase().includes(q) ||
        (v.eventoNombre || '').toLowerCase().includes(q)
      )
    : list
  const data         = applySearch(tab === 'cotizaciones' ? cotizaciones : facturas)
  const meta         = tab === 'cotizaciones' ? COT_META : FAC_META

  const totalAprobado = cotizaciones
    .filter(c => ['approved', 'signed'].includes(c.estado))
    .reduce((s, c) => s + c.totalNum, 0)

  const totalPagado = facturas
    .filter(f => f.estado === 'paid')
    .reduce((s, f) => s + f.totalNum, 0)

  const totalPendiente = facturas
    .filter(f => !['paid', 'cancelled'].includes(f.estado))
    .reduce((s, f) => s + f.totalNum, 0)

  const handleUpdated = updated => setVentas(prev => prev.map(v => v.id === updated.id ? updated : v))
  const handleDeleted = id      => setVentas(prev => prev.filter(v => v.id !== id))
  const handleCreated = v       => setVentas(prev => [v, ...prev])

  return (
    <div className={styles.page}>
      {showCreate && (
        <NuevoDocModal
          type={showCreate}
          onClose={() => setShowCreate(null)}
          onCreated={v => { handleCreated(v); setShowCreate(null) }}
        />
      )}
      {detailItem && (
        <VentaDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ventas</h1>
          <p className={styles.sub}>
            {tab === 'estadisticas' ? 'Análisis de ingresos por eventos' : 'Cotizaciones y facturación'}
          </p>
        </div>
        <div className={styles.headerActions}>
          {tab === 'estadisticas' ? (
            <select
              className={styles.mesFilter}
              value={mesFilter}
              onChange={e => setMesFilter(e.target.value)}
            >
              <option value="all">Todos los meses</option>
              {allMeses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          ) : (
            <>
              <button className={styles.btnSecondaryHdr} onClick={() => setShowCreate('invoice')}>
                Nueva factura
              </button>
              <button className={styles.btnPrimary} onClick={() => setShowCreate('quote')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nueva cotización
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <div className={styles.mainTabsRow}>
        <button
          className={`${styles.mainTab} ${tab === 'estadisticas' ? styles.mainTabActive : ''}`}
          onClick={() => setTab('estadisticas')}
        >
          Estadísticas
        </button>
        <button
          className={`${styles.mainTab} ${tab === 'cotizaciones' ? styles.mainTabActive : ''}`}
          onClick={() => { setTab('cotizaciones'); setSearch('') }}
        >
          Cotizaciones <span className={styles.tabCount}>{ventas.filter(v => v.tipo === 'quote').length}</span>
        </button>
        <button
          className={`${styles.mainTab} ${tab === 'facturas' ? styles.mainTabActive : ''}`}
          onClick={() => { setTab('facturas'); setSearch('') }}
        >
          Facturas <span className={styles.tabCount}>{ventas.filter(v => v.tipo === 'invoice').length}</span>
        </button>
      </div>

      {tab === 'estadisticas' && <VentasStats stats={stats} loading={loadingStats} />}

      {tab !== 'estadisticas' && (
      <>
      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Cotizaciones aprobadas</span>
          <span className={styles.summaryValue}>${totalAprobado.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>
            {cotizaciones.filter(c => ['approved','signed'].includes(c.estado)).length} cotizaciones
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total cobrado</span>
          <span className={styles.summaryValue} style={{ color: '#34d399' }}>
            ${totalPagado.toLocaleString('es-MX')}
          </span>
          <span className={styles.summaryMeta}>
            {facturas.filter(f => f.estado === 'paid').length} facturas pagadas
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pendiente de cobro</span>
          <span className={styles.summaryValue} style={{ color: '#fb923c' }}>
            ${totalPendiente.toLocaleString('es-MX')}
          </span>
          <span className={styles.summaryMeta}>
            {facturas.filter(f => !['paid','cancelled'].includes(f.estado)).length} facturas pendientes
          </span>
        </div>
      </div>

      {/* Search */}
      <div className={styles.tabsRow}>
        <div />
        <div className={styles.searchBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por cliente, número o evento…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Limpiar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && data.map(item => {
              const m = meta[item.estado] ?? { label: item.estado, cls: 'draft' }
              return (
                <tr
                  key={item.id}
                  className={styles.row}
                  onClick={() => setDetailItem(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.idCol}>{item.numero}</td>
                  <td className={styles.clienteCol}>{item.clienteNombre}</td>
                  <td className={styles.muted}>{item.eventoNombre || '—'}</td>
                  <td className={styles.totalCol}>{item.total}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${m.cls}`]}`}>{m.label}</span>
                  </td>
                  <td className={styles.muted}>{item.fecha}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.actionBtn}
                        title="Ver detalle"
                        onClick={() => setDetailItem(item)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && data.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:14 }}>
            Sin {tab} registradas
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}
