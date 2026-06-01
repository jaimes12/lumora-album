import { useState, useEffect } from 'react'
import { ventasApi } from '../api/ventasApi'
import { clientesApi } from '../api/clientesApi'
import { eventosApi } from '../api/eventosApi'
import styles from './VentasPage.module.css'

function NuevaCotizacionModal({ onClose, onCreated }) {
  const [clientes,  setClientes]  = useState([])
  const [eventos,   setEventos]   = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [items,     setItems]     = useState([{ descripcion: '', cantidad: 1, precio: '' }])
  const [form, setForm] = useState({ clienteId: '', eventoId: '', notas: '', impuesto: '0' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

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
        type: 'quote',
        items: apiItems,
        tax,
        notes: form.notas || null,
      })
      onCreated(nueva); onClose()
    } catch (err) { setError(err.message || 'Error al crear cotización') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nueva cotización</h2>
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
            <button type="submit" className={styles.modalBtnPrimary} disabled={saving}>{saving ? 'Guardando…' : 'Crear cotización →'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

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

export default function VentasPage() {
  const [ventas,      setVentas]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('cotizaciones')
  const [showCreate,  setShowCreate]  = useState(false)

  useEffect(() => {
    ventasApi.getAll()
      .then(setVentas)
      .catch(() => setVentas([]))
      .finally(() => setLoading(false))
  }, [])

  const cotizaciones = ventas.filter(v => v.tipo === 'quote')
  const facturas     = ventas.filter(v => v.tipo === 'invoice')
  const data         = tab === 'cotizaciones' ? cotizaciones : facturas
  const meta         = tab === 'cotizaciones' ? COT_META : FAC_META

  const totalAprobado = cotizaciones
    .filter(c => ['approved', 'signed'].includes(c.estado))
    .reduce((s, c) => s + c.totalNum, 0)

  const totalPagado = facturas
    .filter(f => f.estado === 'paid')
    .reduce((s, f) => s + f.totalNum, 0)

  const totalPendiente = facturas
    .filter(f => f.estado !== 'paid')
    .reduce((s, f) => s + f.totalNum, 0)

  return (
    <div className={styles.page}>
      {showCreate && (
        <NuevaCotizacionModal
          onClose={() => setShowCreate(false)}
          onCreated={v => setVentas(prev => [v, ...prev])}
        />
      )}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ventas</h1>
          <p className={styles.sub}>Cotizaciones y facturación</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva cotización
        </button>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Cotizaciones aprobadas</span>
          <span className={styles.summaryValue}>${totalAprobado.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{cotizaciones.filter(c => ['approved','signed'].includes(c.estado)).length} cotizaciones</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total cobrado</span>
          <span className={styles.summaryValue} style={{ color: '#34d399' }}>${totalPagado.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{facturas.filter(f => f.estado === 'paid').length} facturas pagadas</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pendiente de cobro</span>
          <span className={styles.summaryValue} style={{ color: '#fb923c' }}>${totalPendiente.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{facturas.filter(f => f.estado !== 'paid').length} facturas pendientes</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'cotizaciones' ? styles.tabActive : ''}`} onClick={() => setTab('cotizaciones')}>
          Cotizaciones <span className={styles.tabCount}>{cotizaciones.length}</span>
        </button>
        <button className={`${styles.tab} ${tab === 'facturas' ? styles.tabActive : ''}`} onClick={() => setTab('facturas')}>
          Facturas <span className={styles.tabCount}>{facturas.length}</span>
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>#</th><th>Cliente</th><th>Evento</th><th>Total</th><th>Estado</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Cargando…</td></tr>
            )}
            {!loading && data.map(item => {
              const m = meta[item.estado] ?? { label: item.estado, cls: 'draft' }
              return (
                <tr key={item.id} className={styles.row}>
                  <td className={styles.idCol}>{item.numero}</td>
                  <td className={styles.clienteCol}>{item.clienteNombre}</td>
                  <td className={styles.muted}>{item.evento || '—'}</td>
                  <td className={styles.totalCol}>{item.total}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${m.cls}`]}`}>{m.label}</span>
                  </td>
                  <td className={styles.muted}>{item.fecha}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.actionBtn} title="Ver">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className={styles.actionBtn} title="Descargar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
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
