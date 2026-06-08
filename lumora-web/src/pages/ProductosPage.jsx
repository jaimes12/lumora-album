import { useState, useEffect } from 'react'
import { productosApi } from '../api/productosApi'
import styles from './ProductosPage.module.css'

const UNITS = ['pieza', 'hora', 'paquete', 'día', 'persona', 'evento', 'mes', 'servicio']
const CATS  = [{ value: 'servicio', label: 'Servicio' }, { value: 'producto', label: 'Producto' }]

const fmt = (n) => n?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }) ?? '$0'

function ProductModal({ item, onSave, onClose }) {
  const editing = !!item
  const [form, setForm] = useState({
    name:        item?.name        ?? '',
    description: item?.description ?? '',
    price:       item?.price       ?? '',
    unit:        item?.unit        ?? 'pieza',
    category:    item?.category    ?? 'servicio',
    active:      item?.active      ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price) || 0 }
      const result = editing
        ? await productosApi.update(item.id, payload)
        : await productosApi.create(payload)
      onSave(result, editing)
    } catch { setError('Error al guardar.') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{editing ? 'Editar' : 'Nuevo'} producto / servicio</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Categoría</label>
              <select value={form.category} onChange={set('category')}>
                {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className={styles.field} style={{flex: 2}}>
              <label>Nombre *</label>
              <input value={form.name} onChange={set('name')} placeholder="Ej: Fotografía premium" required />
            </div>
          </div>
          <div className={styles.field}>
            <label>Descripción</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Descripción breve (opcional)" />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Precio ($)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="5000" />
            </div>
            <div className={styles.field}>
              <label>Unidad</label>
              <select value={form.unit} onChange={set('unit')}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {editing && (
            <label className={styles.checkRow}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              Activo en el catálogo
            </label>
          )}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductosPage() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('todos')
  const [modalItem, setModalItem] = useState(null) // null=closed, undefined=new, obj=edit
  const [deleting,  setDeleting]  = useState(null)

  useEffect(() => {
    productosApi.getAll()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(it => {
    const q = search.toLowerCase()
    const matchSearch = !q || it.name.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q)
    const matchCat = catFilter === 'todos' || it.category === catFilter
    return matchSearch && matchCat
  })

  const handleSave = (item, editing) => {
    setItems(prev => editing ? prev.map(i => i.id === item.id ? item : i) : [item, ...prev])
    setModalItem(null)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await productosApi.delete(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {}
    setDeleting(null)
  }

  const totalActivos = items.filter(i => i.active).length

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Productos y servicios</h1>
          <p className={styles.subtitle}>{totalActivos} activo{totalActivos !== 1 ? 's' : ''} en catálogo</p>
        </div>
        <button className={styles.btnNew} onClick={() => setModalItem(undefined)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input className={styles.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre…" />
        <div className={styles.segmented}>
          {['todos', 'servicio', 'producto'].map(c => (
            <button key={c} className={`${styles.seg} ${catFilter === c ? styles.segActive : ''}`} onClick={() => setCatFilter(c)}>
              {c === 'todos' ? 'Todos' : c === 'servicio' ? 'Servicios' : 'Productos'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <p>{search || catFilter !== 'todos' ? 'Sin resultados para este filtro' : 'Sin productos aún. ¡Agrega el primero!'}</p>
          {!search && catFilter === 'todos' && <button className={styles.btnNew} onClick={() => setModalItem(undefined)}>Agregar producto</button>}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(item => (
            <div key={item.id} className={`${styles.card} ${!item.active ? styles.cardInactive : ''}`}>
              <div className={styles.cardTop}>
                <span className={`${styles.catBadge} ${item.category === 'producto' ? styles.catBadgeProduct : styles.catBadgeService}`}>
                  {item.category === 'producto' ? '📦 Producto' : '⚙️ Servicio'}
                </span>
                {!item.active && <span className={styles.inactiveBadge}>Inactivo</span>}
              </div>
              <h3 className={styles.cardName}>{item.name}</h3>
              {item.description && <p className={styles.cardDesc}>{item.description}</p>}
              <div className={styles.cardFooter}>
                <span className={styles.cardPrice}>{fmt(item.price)} <span className={styles.cardUnit}>/ {item.unit}</span></span>
                <div className={styles.cardActions}>
                  <button className={styles.btnEdit} onClick={() => setModalItem(item)} title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className={styles.btnDel} onClick={() => handleDelete(item.id)} disabled={deleting === item.id} title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalItem !== null && (
        <ProductModal
          item={modalItem === undefined ? null : modalItem}
          onSave={handleSave}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  )
}
