import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { trabajadoresApi } from '../api/trabajadoresApi'
import { getLimits } from '../config/planConfig'
import styles from './TrabajadoresPage.module.css'

function UsuarioModal({ worker, onClose, onSaved }) {
  const isEdit = !!worker
  const [form, setForm] = useState({
    name:     worker?.name     ?? '',
    email:    worker?.email    ?? '',
    phone:    worker?.phone    ?? '',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name) { setError('El nombre es obligatorio'); return }
    if (!isEdit && !form.email) { setError('El correo es obligatorio'); return }
    if (!isEdit && form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) {
        const updated = await trabajadoresApi.update(worker.id, {
          name: form.name, phone: form.phone || null, password: form.password || null,
        })
        onSaved(updated, true)
      } else {
        const created = await trabajadoresApi.create({
          name: form.name, email: form.email, phone: form.phone || null, password: form.password,
        })
        onSaved(created, false)
      }
      onClose()
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('plan_limit') || msg.includes('Tu plan')) setError(msg)
      else if (msg.includes('ya está registrado')) setError('Este correo ya está registrado')
      else setError('Error al guardar. Intenta de nuevo.')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label>Nombre completo *</label>
            <input value={form.name} onChange={set('name')} placeholder="Juan García" autoFocus />
          </div>
          {!isEdit && (
            <div className={styles.field}>
              <label>Correo electrónico *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="juan@empresa.com" />
            </div>
          )}
          <div className={styles.field}>
            <label>Teléfono</label>
            <input value={form.phone} onChange={set('phone')} placeholder="+52 55 1234 5678" />
          </div>
          <div className={styles.field}>
            <label>{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder={isEdit ? '••••••' : 'Mín. 6 caracteres'} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TrabajadoresPage() {
  const { user } = useAuth()
  const [workers,     setWorkers]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editWorker,  setEditWorker]  = useState(null)
  const [delConfirm,  setDelConfirm]  = useState(null)
  const [deleting,    setDeleting]    = useState(false)

  const maxWorkers = { free: 0, solo: 2, negocio: 5, agencia: 15 }[user?.plan] ?? 0
  const canAdd     = workers.length < maxWorkers

  useEffect(() => {
    trabajadoresApi.getAll()
      .then(setWorkers)
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (w, isEdit) => {
    if (isEdit) setWorkers(prev => prev.map(x => x.id === w.id ? { ...x, ...w } : x))
    else         setWorkers(prev => [w, ...prev])
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await trabajadoresApi.delete(id)
      setWorkers(prev => prev.filter(w => w.id !== id))
      setDelConfirm(null)
    } catch { }
    finally { setDeleting(false) }
  }

  const initials = name => (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className={styles.page}>
      {showModal && (
        <UsuarioModal
          worker={editWorker}
          onClose={() => { setShowModal(false); setEditWorker(null) }}
          onSaved={handleSaved}
        />
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuarios</h1>
          <p className={styles.sub}>
            {workers.length} de {maxWorkers} usuarios disponibles en tu plan
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => { setEditWorker(null); setShowModal(true) }}
          disabled={!canAdd}
          title={!canAdd ? `Límite de tu plan: ${maxWorkers} usuarios` : ''}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar usuario
        </button>
      </div>

      {!canAdd && (
        <div className={styles.limitBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Has alcanzado el límite de tu plan ({maxWorkers} usuarios). Actualiza tu plan para agregar más.
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {Array(3).fill(0).map((_, i) => <div key={i} className={styles.card} style={{ opacity: 0.3, height: 120 }} />)}
        </div>
      ) : workers.length === 0 ? (
        <div className={styles.empty}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/>
          </svg>
          <p>Sin usuarios aún</p>
          {canAdd && <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>Agregar primero</button>}
        </div>
      ) : (
        <div className={styles.list}>
          {workers.map(w => (
            <div key={w.id} className={styles.card}>
              <div className={styles.cardAvatar}>{initials(w.name)}</div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{w.name}</span>
                <span className={styles.cardEmail}>{w.email}</span>
                {w.phone && <span className={styles.cardPhone}>{w.phone}</span>}
              </div>
              <div className={styles.cardBadge}>Usuario</div>
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} onClick={() => { setEditWorker(w); setShowModal(true) }} title="Editar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                {delConfirm === w.id ? (
                  <div className={styles.delConfirm}>
                    <span>¿Eliminar?</span>
                    <button className={styles.delYes} onClick={() => handleDelete(w.id)} disabled={deleting}>Sí</button>
                    <button className={styles.delNo} onClick={() => setDelConfirm(null)}>No</button>
                  </div>
                ) : (
                  <button className={styles.actionBtnDanger} onClick={() => setDelConfirm(w.id)} title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
