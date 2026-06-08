import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { leadsApi } from '../api/leadsApi'
import { DEFAULT_STAGES } from './ChatPage'
import styles from './ContactosPage.module.css'

function getStages() {
  try {
    const s = localStorage.getItem('elixe_stages')
    return s ? JSON.parse(s) : DEFAULT_STAGES
  } catch { return DEFAULT_STAGES }
}

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const PhoneIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.59 1.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l1.62-1.63a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

export default function ContactosPage() {
  const navigate = useNavigate()
  const [leads,            setLeads]            = useState([])
  const [loading,          setLoading]          = useState(true)
  const [search,           setSearch]           = useState('')
  const [filter,           setFilter]           = useState('todos')
  const [confirmDelete,    setConfirmDelete]    = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deletingAll,      setDeletingAll]      = useState(false)
  const stages = getStages()

  const load = useCallback(async () => {
    try { setLeads(await leadsApi.getAll()) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    await leadsApi.delete(id).catch(() => {})
    setLeads(prev => prev.filter(l => l.id !== id))
    setConfirmDelete(null)
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    await leadsApi.deleteAll().catch(() => {})
    setLeads([])
    setConfirmDeleteAll(false)
    setDeletingAll(false)
  }

  const openChat = (lead) => {
    navigate('/app/chats', { state: { openLeadId: lead.id } })
  }

  const stageMeta = (id) => stages.find(s => s.id === id) ?? { label: id, color: '#64748b' }

  // Filter + search
  const q = search.trim().toLowerCase()
  const byStage = filter === 'todos' ? leads : leads.filter(l => l.stage === filter)
  const filtered = q
    ? byStage.filter(l =>
        l.nombre.toLowerCase().includes(q) ||
        (l.telefono || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    : byStage

  const STAGE_FILTERS = [{ id: 'todos', label: 'Todos', color: 'var(--accent)' }, ...stages]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contactos</h1>
          <p className={styles.sub}>
            {leads.length} contacto{leads.length !== 1 ? 's' : ''} · {leads.filter(l => l.noLeidos > 0).length} sin leer
          </p>
        </div>
        {leads.length > 0 && (
          <div className={styles.headerRight}>
            {confirmDeleteAll ? (
              <div className={styles.deleteAllConfirm}>
                <span className={styles.deleteAllText}>¿Eliminar todos?</span>
                <button
                  className={styles.btnDanger}
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                >
                  {deletingAll ? 'Eliminando…' : 'Sí, eliminar todo'}
                </button>
                <button className={styles.btnCancel} onClick={() => setConfirmDeleteAll(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button className={styles.btnDangerOutline} onClick={() => setConfirmDeleteAll(true)}>
                <TrashIcon /> Eliminar todos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {STAGE_FILTERS.map(s => {
            const count = s.id === 'todos' ? leads.length : leads.filter(l => l.stage === s.id).length
            const active = filter === s.id
            return (
              <button
                key={s.id}
                className={`${styles.filterBtn} ${active ? styles.filterActive : ''}`}
                onClick={() => setFilter(s.id)}
                style={active ? { borderColor: s.color, color: s.color, background: `${s.color}15` } : {}}
              >
                {s.label}
                <span className={styles.filterCount}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Limpiar">
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.spinner} />
          Cargando contactos…
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>
            {search || filter !== 'todos'
              ? 'No se encontraron contactos con ese filtro'
              : 'Aún no hay contactos. Los mensajes de WhatsApp aparecerán aquí.'}
          </span>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(lead => {
            const meta    = stageMeta(lead.stage)
            const isDeleting = confirmDelete === lead.id
            return (
              <div
                key={lead.id}
                className={`${styles.row} ${isDeleting ? styles.rowDeleting : ''}`}
                onClick={() => !isDeleting && openChat(lead)}
              >
                {/* Avatar */}
                <div className={styles.avatar}>
                  {lead.avatar || '?'}
                </div>

                {/* Main info */}
                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{lead.nombre || 'Sin nombre'}</span>
                    {lead.noLeidos > 0 && (
                      <span className={styles.unreadBadge}>{lead.noLeidos}</span>
                    )}
                    <span
                      className={styles.stageBadge}
                      style={{ background: `${meta.color}20`, color: meta.color, borderColor: `${meta.color}40` }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className={styles.phoneLine}>
                    <PhoneIcon />
                    <span>{lead.telefono || '—'}</span>
                  </div>
                  {lead.ultimoMsg && (
                    <p className={styles.lastMsg}>{lead.ultimoMsg}</p>
                  )}
                </div>

                {/* Right: time + actions */}
                <div className={styles.right} onClick={e => e.stopPropagation()}>
                  {lead.hora && <span className={styles.time}>{lead.hora}</span>}

                  {isDeleting ? (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>¿Eliminar?</span>
                      <button className={styles.confirmYes} onClick={() => handleDelete(lead.id)}>Sí</button>
                      <button className={styles.confirmNo}  onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <button
                        className={styles.btnAction}
                        title="Abrir chat"
                        onClick={() => openChat(lead)}
                      >
                        <ChatIcon />
                      </button>
                      <button
                        className={`${styles.btnAction} ${styles.btnActionDanger}`}
                        title="Eliminar contacto"
                        onClick={() => setConfirmDelete(lead.id)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
