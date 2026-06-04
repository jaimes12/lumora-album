import { useState, useEffect } from 'react'
import { proveedoresApi } from '../api/proveedoresApi'
import { findOrCreateLeadByPhone } from '../api/leadsApi'
import { ChatModal, DEFAULT_STAGES } from './ChatPage'
import styles from './ProveedoresPage.module.css'

const CATEGORIAS_BASE = ['Todas','Decoración','Música','Catering','Fotografía','Iluminación','Transporte','Pastelería','Venue','Entretenimiento']
const CATS_FORM = CATEGORIAS_BASE.slice(1)

function NuevoProveedorModal({ onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form, setForm] = useState({ nombre: '', categoria: 'Catering', telefono: '', email: '', descripcion: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    try {
      const nuevo = await proveedoresApi.create({ name: form.nombre, category: form.categoria, phone: form.telefono || null, email: form.email || null, notes: form.descripcion || null })
      onCreated(nuevo); onClose()
    } catch (err) { setError(err.message || 'Error al crear proveedor') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.createOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.createModal}>
        <div className={styles.createHeader}>
          <h2 className={styles.createTitle}>Nuevo proveedor</h2>
          <button className={styles.createClose} onClick={onClose}>✕</button>
        </div>
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <div className={styles.createGrid}>
            <div className={styles.createField} style={{ gridColumn:'1/-1' }}>
              <label>Nombre *</label>
              <input placeholder="Florería Primavera" value={form.nombre} onChange={set('nombre')} required />
            </div>
            <div className={styles.createField}>
              <label>Categoría</label>
              <select value={form.categoria} onChange={set('categoria')}>
                {CATS_FORM.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.createField}>
              <label>Teléfono</label>
              <input placeholder="+52 55 1234 5678" value={form.telefono} onChange={set('telefono')} />
            </div>
            <div className={styles.createField} style={{ gridColumn:'1/-1' }}>
              <label>Email</label>
              <input type="email" placeholder="proveedor@email.com" value={form.email} onChange={set('email')} />
            </div>
            <div className={styles.createField} style={{ gridColumn:'1/-1' }}>
              <label>Descripción</label>
              <textarea placeholder="Especialistas en..." value={form.descripcion} onChange={set('descripcion')} rows={3} />
            </div>
          </div>
          {error && <p className={styles.createError}>{error}</p>}
          <div className={styles.createActions}>
            <button type="button" className={styles.createBtnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.createBtnPrimary} disabled={saving}>{saving ? 'Guardando…' : 'Crear proveedor →'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CAT_COLOR = {
  Decoración:'#f472b6', Música:'#34d399', Catering:'#fb923c', Fotografía:'#a78bfa',
  Iluminación:'#fbbf24', Transporte:'#94a3b8', Pastelería:'#f9a8d4', Venue:'#38bdf8',
  Entretenimiento:'#c084fc',
}


function Stars({ rating }) {
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i<=rating ? '#fbbf24' : 'none'} stroke={i<=rating ? '#fbbf24' : '#4a4a5a'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default function ProveedoresPage() {
  const [proveedores,  setProveedores]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [catActiva,    setCatActiva]    = useState('Todas')
  const [chatLead,     setChatLead]     = useState(null)
  const [openingChat,  setOpeningChat]  = useState(null) // id del proveedor abriendo
  const [showCreate,   setShowCreate]   = useState(false)

  const abrirChat = async (p) => {
    if (!p.telefono) return alert('Este proveedor no tiene teléfono registrado')
    setOpeningChat(p.id)
    try {
      const lead = await findOrCreateLeadByPhone(p.telefono, p.nombre)
      setChatLead(lead)
    } catch { alert('No se pudo abrir el chat') }
    finally { setOpeningChat(null) }
  }

  useEffect(() => {
    proveedoresApi.getAll()
      .then(setProveedores)
      .catch(() => setProveedores([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = catActiva === 'Todas' ? proveedores : proveedores.filter(p => p.categoria === catActiva)

  // Build categories from loaded data
  const categorias = ['Todas', ...new Set(proveedores.map(p => p.categoria).filter(Boolean))]

  return (
    <div className={styles.page}>
      {showCreate && (
        <NuevoProveedorModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProveedores(prev => [p, ...prev])}
        />
      )}
      {chatLead && <ChatModal lead={chatLead} stages={DEFAULT_STAGES} onClose={() => setChatLead(null)} />}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Proveedores</h1>
          <p className={styles.sub}>{proveedores.length} proveedores en tu directorio</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo proveedor
        </button>
      </div>

      <div className={styles.catFilters}>
        {(proveedores.length > 0 ? categorias : CATEGORIAS_BASE).map(cat => (
          <button key={cat} onClick={() => setCatActiva(cat)}
            className={`${styles.catBtn} ${catActiva===cat ? styles.catBtnActive : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array(6).fill(0).map((_,i) => <div key={i} className={styles.card} style={{ opacity: 0.3, minHeight: 160 }} />)}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtrados.map(p => {
            const color = CAT_COLOR[p.categoria] || '#7c6af7'
            const initials = p.nombre.split(' ').slice(0,2).map(n=>n[0]).join('').slice(0,2)
            return (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardAvatar} style={{ background: color+'22', color }}>{initials}</div>
                  <div className={styles.cardTitles}>
                    <h3 className={styles.cardName}>{p.nombre}</h3>
                    <span className={styles.catTag} style={{ color, background: color+'18' }}>{p.categoria}</span>
                  </div>
                  <button className={styles.chatBtn} onClick={() => abrirChat(p)} title="Enviar mensaje" disabled={openingChat === p.id}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
                <p className={styles.cardDesc}>{p.descripcion || p.notes || ''}</p>
                <div className={styles.cardFooter}>
                  <Stars rating={Math.round(p.rating)} />
                  <span className={styles.cardCity}>{p.ciudad || ''}</span>
                </div>
                <div className={styles.cardPhone}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.64 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {p.telefono}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
