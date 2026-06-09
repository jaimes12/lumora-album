import { useState, useEffect } from 'react'
import { ventasApi } from '../api/ventasApi'
import { clientesApi } from '../api/clientesApi'
import { eventosApi } from '../api/eventosApi'
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
  const [tab,         setTab]         = useState('cotizaciones')
  const [search,      setSearch]      = useState('')
  const [showCreate,  setShowCreate]  = useState(null)   // null | 'quote' | 'invoice'
  const [detailItem,  setDetailItem]  = useState(null)

  useEffect(() => {
    ventasApi.getAll()
      .then(setVentas)
      .catch(() => setVentas([]))
      .finally(() => setLoading(false))
  }, [])

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
          <p className={styles.sub}>Cotizaciones y facturación</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondaryHdr} onClick={() => setShowCreate('invoice')}>
            Nueva factura
          </button>
          <button className={styles.btnPrimary} onClick={() => setShowCreate('quote')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva cotización
          </button>
        </div>
      </div>

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

      {/* Tabs + Search */}
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'cotizaciones' ? styles.tabActive : ''}`}
            onClick={() => { setTab('cotizaciones'); setSearch('') }}
          >
            Cotizaciones <span className={styles.tabCount}>{cotizaciones.length}</span>
          </button>
          <button
            className={`${styles.tab} ${tab === 'facturas' ? styles.tabActive : ''}`}
            onClick={() => { setTab('facturas'); setSearch('') }}
          >
            Facturas <span className={styles.tabCount}>{facturas.length}</span>
          </button>
        </div>
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
    </div>
  )
}
