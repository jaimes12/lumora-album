import { useState, useEffect, useCallback } from 'react'
import { gastosApi } from '../api/gastosApi'
import { eventosApi } from '../api/eventosApi'
import styles from './FinanzasPage.module.css'

const CATEGORIAS = [
  { key: 'general',    label: 'General' },
  { key: 'proveedor',  label: 'Proveedor' },
  { key: 'renta',      label: 'Renta' },
  { key: 'personal',   label: 'Personal' },
  { key: 'marketing',  label: 'Marketing' },
  { key: 'otro',       label: 'Otro' },
]

const METODO_LABEL = { transfer: 'Transferencia', cash: 'Efectivo', card: 'Tarjeta', check: 'Cheque' }

function fmtMXN(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

/* ── GastoModal ─────────────────────────────────────────────── */
function GastoModal({ gasto, eventos, onSave, onClose }) {
  const isEdit = !!gasto
  const [form, setForm] = useState({
    descripcion: gasto?.descripcion ?? '',
    monto:       gasto?.monto != null ? String(gasto.monto) : '',
    categoria:   gasto?.categoria ?? 'general',
    fecha:       gasto?.fechaISO ?? new Date().toISOString().slice(0, 10),
    eventId:     gasto?.eventId ?? '',
    notas:       gasto?.notas ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.descripcion.trim()) { setError('Escribe una descripción'); return }
    if (!form.monto || isNaN(parseFloat(form.monto))) { setError('Monto inválido'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        descripcion: form.descripcion.trim(),
        monto:       parseFloat(form.monto),
        categoria:   form.categoria,
        fecha:       form.fecha ? new Date(form.fecha + 'T12:00:00').toISOString() : null,
        eventId:     form.eventId || null,
        notas:       form.notas.trim() || null,
      }
      const saved = isEdit
        ? await gastosApi.update(gasto.id, payload)
        : await gastosApi.create(payload)
      onSave(saved, isEdit)
      onClose()
    } catch (err) { setError(err.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Editar gasto' : 'Nuevo gasto'}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          {error && <p className={styles.modalError}>{error}</p>}
          <div className={styles.modalGrid}>
            <div className={styles.modalField}>
              <label>Descripción *</label>
              <input value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: Pago a DJ, renta de sillas..." />
            </div>
            <div className={styles.modalField}>
              <label>Monto *</label>
              <input type="number" min="0" step="0.01" value={form.monto} onChange={set('monto')} placeholder="0.00" />
            </div>
            <div className={styles.modalField}>
              <label>Categoría</label>
              <select value={form.categoria} onChange={set('categoria')}>
                {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={set('fecha')} />
            </div>
            <div className={styles.modalField}>
              <label>Evento (opcional)</label>
              <select value={form.eventId} onChange={set('eventId')}>
                <option value="">— Sin evento —</option>
                {eventos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Notas</label>
              <input value={form.notas} onChange={set('notas')} placeholder="Notas opcionales" />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function FinanzasPage() {
  const [tab, setTab] = useState(() => sessionStorage.getItem('fin_tab') || 'ingresos')

  const [ingresos, setIngresos] = useState([])
  const [gastos,   setGastos]   = useState([])
  const [eventos,  setEventos]  = useState([])

  const [loadingI, setLoadingI] = useState(true)
  const [loadingG, setLoadingG] = useState(true)

  const [desde, setDesde] = useState(() => sessionStorage.getItem('fin_desde') || '')
  const [hasta, setHasta] = useState(() => sessionStorage.getItem('fin_hasta') || '')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('todas')

  const [showModal, setShowModal] = useState(false)
  const [editGasto, setEditGasto] = useState(null)

  useEffect(() => { sessionStorage.setItem('fin_tab',   tab)   }, [tab])
  useEffect(() => { sessionStorage.setItem('fin_desde', desde) }, [desde])
  useEffect(() => { sessionStorage.setItem('fin_hasta', hasta) }, [hasta])

  const loadIngresos = useCallback(() => {
    setLoadingI(true)
    gastosApi.getIngresos({ desde: desde || undefined, hasta: hasta || undefined })
      .then(setIngresos).catch(() => {}).finally(() => setLoadingI(false))
  }, [desde, hasta])

  const loadGastos = useCallback(() => {
    setLoadingG(true)
    gastosApi.getAll({ desde: desde || undefined, hasta: hasta || undefined })
      .then(setGastos).catch(() => {}).finally(() => setLoadingG(false))
  }, [desde, hasta])

  useEffect(() => { loadIngresos() }, [loadIngresos])
  useEffect(() => { loadGastos()   }, [loadGastos])
  useEffect(() => { eventosApi.getAll().then(setEventos).catch(() => {}) }, [])

  const filteredIngresos = ingresos.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.eventoNombre.toLowerCase().includes(q) ||
           p.clienteNombre.toLowerCase().includes(q) ||
           p.concepto.toLowerCase().includes(q)
  })

  const filteredGastos = gastos.filter(g => {
    if (catFilter !== 'todas' && g.categoria !== catFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return g.descripcion.toLowerCase().includes(q) ||
           (g.eventoNombre || '').toLowerCase().includes(q) ||
           (g.notas || '').toLowerCase().includes(q)
  })

  const totalIngresos = filteredIngresos.reduce((s, p) => s + p.monto, 0)
  const totalGastos   = filteredGastos.reduce((s, g) => s + g.monto, 0)
  const saldo         = totalIngresos - totalGastos

  const handleSaveGasto = (saved, isEdit) => {
    if (isEdit) setGastos(prev => prev.map(g => g.id === saved.id ? saved : g))
    else setGastos(prev => [saved, ...prev])
  }

  const handleDeleteGasto = async id => {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      await gastosApi.delete(id)
      setGastos(prev => prev.filter(g => g.id !== id))
    } catch { alert('Error al eliminar') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Finanzas</h1>
          <p className={styles.sub}>Ingresos por eventos y gastos de operación</p>
        </div>
        {tab === 'gastos' && (
          <button className={styles.btnPrimary} onClick={() => { setEditGasto(null); setShowModal(true) }}>
            + Nuevo gasto
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Ingresos</span>
          <span className={styles.summaryValue} style={{ color: '#22c55e' }}>{fmtMXN(totalIngresos)}</span>
          <span className={styles.summaryMeta}>{filteredIngresos.length} pagos</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Gastos</span>
          <span className={styles.summaryValue} style={{ color: '#ef4444' }}>{fmtMXN(totalGastos)}</span>
          <span className={styles.summaryMeta}>{filteredGastos.length} registros</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Saldo</span>
          <span className={styles.summaryValue} style={{ color: saldo >= 0 ? '#22c55e' : '#ef4444' }}>{fmtMXN(saldo)}</span>
          <span className={styles.summaryMeta}>Ingresos − Gastos</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button className={tab === 'ingresos' ? styles.tabActive : styles.tab} onClick={() => setTab('ingresos')}>Ingresos</button>
          <button className={tab === 'gastos'   ? styles.tabActive : styles.tab} onClick={() => setTab('gastos')}>Gastos</button>
        </div>
        <div className={styles.toolbarRight}>
          <input
            className={styles.searchInput}
            placeholder="Buscar…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.dateRange}>
            <input type="date" className={styles.dateInput} value={desde} onChange={e => setDesde(e.target.value)} title="Desde" />
            <span className={styles.dateSep}>—</span>
            <input type="date" className={styles.dateInput} value={hasta} onChange={e => setHasta(e.target.value)} title="Hasta" />
            {(desde || hasta) && (
              <button className={styles.clearDate} onClick={() => { setDesde(''); setHasta('') }} title="Limpiar fechas">✕</button>
            )}
          </div>
          {tab === 'gastos' && (
            <select className={styles.catSelect} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="todas">Todas las categorías</option>
              {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Ingresos table */}
      {tab === 'ingresos' && (
        <div className={styles.tableWrap}>
          {loadingI ? (
            <p className={styles.empty}>Cargando…</p>
          ) : filteredIngresos.length === 0 ? (
            <p className={styles.empty}>Sin ingresos registrados</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Evento</th>
                  <th>Cliente</th>
                  <th>Concepto</th>
                  <th>Método</th>
                  <th className={styles.thRight}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngresos.map(p => (
                  <tr key={p.id}>
                    <td className={styles.tdDate}>{fmtDate(p.fecha)}</td>
                    <td>{p.eventoNombre}</td>
                    <td className={styles.tdMuted}>{p.clienteNombre}</td>
                    <td>{p.concepto}</td>
                    <td><span className={styles.metodo}>{METODO_LABEL[p.metodo] ?? p.metodo}</span></td>
                    <td className={styles.tdAmount}>{fmtMXN(p.monto)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className={styles.tfootLabel}>Total</td>
                  <td className={styles.tfootTotal}>{fmtMXN(totalIngresos)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Gastos table */}
      {tab === 'gastos' && (
        <div className={styles.tableWrap}>
          {loadingG ? (
            <p className={styles.empty}>Cargando…</p>
          ) : filteredGastos.length === 0 ? (
            <p className={styles.empty}>Sin gastos registrados — agrega uno con el botón de arriba</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Evento</th>
                  <th>Notas</th>
                  <th className={styles.thRight}>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredGastos.map(g => (
                  <tr key={g.id}>
                    <td className={styles.tdDate}>{fmtDate(g.fecha)}</td>
                    <td>{g.descripcion}</td>
                    <td><span className={`${styles.catBadge} ${styles[`cat_${g.categoria}`]}`}>{CATEGORIAS.find(c => c.key === g.categoria)?.label ?? g.categoria}</span></td>
                    <td className={styles.tdMuted}>{g.eventoNombre || '—'}</td>
                    <td className={styles.tdMuted}>{g.notas || '—'}</td>
                    <td className={styles.tdAmount}>{fmtMXN(g.monto)}</td>
                    <td className={styles.tdActions}>
                      <button className={styles.iconBtn} onClick={() => { setEditGasto(g); setShowModal(true) }} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDeleteGasto(g.id)} title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className={styles.tfootLabel}>Total</td>
                  <td className={styles.tfootTotal}>{fmtMXN(totalGastos)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <GastoModal
          gasto={editGasto}
          eventos={eventos}
          onSave={handleSaveGasto}
          onClose={() => { setShowModal(false); setEditGasto(null) }}
        />
      )}
    </div>
  )
}
