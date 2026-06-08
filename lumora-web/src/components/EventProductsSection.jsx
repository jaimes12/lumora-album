import { useState, useEffect } from 'react'
import { productosApi } from '../api/productosApi'
import styles from './EventProductsSection.module.css'

const fmt = (n) => n?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }) ?? '$0'

function AddProductModal({ eventId, catalog, onAdd, onClose }) {
  const [mode,    setMode]    = useState('catalog') // catalog | manual
  const [selId,   setSelId]   = useState('')
  const [qty,     setQty]     = useState(1)
  const [notes,   setNotes]   = useState('')
  // Manual form
  const [name,      setName]      = useState('')
  const [desc,      setDesc]      = useState('')
  const [price,     setPrice]     = useState('')
  const [manQty,    setManQty]    = useState(1)
  const [manNotes,  setManNotes]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const activeCatalog = catalog.filter(c => c.active)
  const selected = activeCatalog.find(c => c.id === selId)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    setSaving(true)
    try {
      let payload
      if (mode === 'catalog') {
        if (!selected) { setError('Selecciona un producto del catálogo.'); setSaving(false); return }
        payload = { productId: selected.id, name: selected.name, description: selected.description, qty, unitPrice: selected.price, notes }
      } else {
        if (!name.trim()) { setError('El nombre es obligatorio.'); setSaving(false); return }
        payload = { productId: null, name: name.trim(), description: desc.trim() || null, qty: manQty, unitPrice: parseFloat(price) || 0, notes: manNotes.trim() || null }
      }
      const item = await productosApi.addToEvent(eventId, payload)
      onAdd(item)
    } catch { setError('Error al agregar.') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Agregar al evento</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className={styles.modeToggle}>
          <button className={`${styles.modeBtn} ${mode === 'catalog' ? styles.modeBtnActive : ''}`} onClick={() => setMode('catalog')}>Del catálogo</button>
          <button className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`} onClick={() => setMode('manual')}>Manual</button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          {mode === 'catalog' ? (
            <>
              {activeCatalog.length === 0 ? (
                <p className={styles.noCatalog}>No hay productos en el catálogo. <a href="/app/productos">Agrégalos aquí</a>.</p>
              ) : (
                <div className={styles.catalogList}>
                  {activeCatalog.map(p => (
                    <div key={p.id} className={`${styles.catalogItem} ${selId === p.id ? styles.catalogItemSelected : ''}`} onClick={() => setSelId(p.id)}>
                      <div className={styles.catalogItemInfo}>
                        <span className={styles.catalogItemName}>{p.name}</span>
                        {p.description && <span className={styles.catalogItemDesc}>{p.description}</span>}
                      </div>
                      <span className={styles.catalogItemPrice}>{fmt(p.price)}<span className={styles.catalogItemUnit}> /{p.unit}</span></span>
                    </div>
                  ))}
                </div>
              )}
              {selected && (
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label>Cantidad</label>
                    <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value)||1)} />
                  </div>
                  <div className={styles.field}>
                    <label>Subtotal</label>
                    <span className={styles.subtotal}>{fmt(selected.price * qty)}</span>
                  </div>
                </div>
              )}
              <div className={styles.field}>
                <label>Notas (opcional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalles adicionales…" />
              </div>
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label>Nombre *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Sonido especial" required />
              </div>
              <div className={styles.field}>
                <label>Descripción</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Opcional" />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Precio unitario ($)</label>
                  <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
                </div>
                <div className={styles.field}>
                  <label>Cantidad</label>
                  <input type="number" min="1" value={manQty} onChange={e => setManQty(parseInt(e.target.value)||1)} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Notas</label>
                <input value={manNotes} onChange={e => setManNotes(e.target.value)} placeholder="Detalles adicionales…" />
              </div>
            </>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnSave} disabled={saving || (mode === 'catalog' && !selected && activeCatalog.length > 0)}>
              {saving ? 'Agregando…' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EventProductsSection({ eventId }) {
  const [items,   setItems]   = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [delId,   setDelId]   = useState(null)

  useEffect(() => {
    Promise.all([
      productosApi.getByEvent(eventId),
      productosApi.getAll(),
    ]).then(([evItems, cat]) => {
      setItems(evItems)
      setCatalog(cat)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  const total = items.reduce((s, i) => s + i.total, 0)

  const handleAdd = (item) => {
    setItems(prev => [...prev, item])
    setShowAdd(false)
  }

  const handleDelete = async (id) => {
    setDelId(id)
    try {
      await productosApi.deleteItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {}
    setDelId(null)
  }

  if (loading) return <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Cargando…</p>

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>📦 Productos y servicios</span>
        <button className={styles.btnAdd} onClick={() => setShowAdd(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>Sin productos asignados. <button className={styles.linkBtn} onClick={() => setShowAdd(true)}>Agregar uno</button></p>
      ) : (
        <>
          <div className={styles.itemsList}>
            {items.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.description && <span className={styles.itemDesc}>{item.description}</span>}
                  {item.notes && <span className={styles.itemNotes}>📝 {item.notes}</span>}
                </div>
                <div className={styles.itemRight}>
                  <div className={styles.itemPricing}>
                    <span className={styles.itemQty}>{item.qty}×</span>
                    <span className={styles.itemPrice}>{fmt(item.unitPrice)}</span>
                    <span className={styles.itemTotal}>{fmt(item.total)}</span>
                  </div>
                  <button className={styles.btnDel} onClick={() => handleDelete(item.id)} disabled={delId === item.id}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.totalRow}>
            <span>Total productos</span>
            <span className={styles.totalAmt}>{fmt(total)}</span>
          </div>
        </>
      )}

      {showAdd && (
        <AddProductModal
          eventId={eventId}
          catalog={catalog}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
