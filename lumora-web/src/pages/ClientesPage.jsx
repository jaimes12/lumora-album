import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesApi } from '../api/clientesApi'
import { eventosApi } from '../api/eventosApi'
import { findOrCreateLeadByPhone } from '../api/leadsApi'
import { useAuth } from '../context/AuthContext'
import { PlanGateModal } from '../components/PlanGate'
import { underLimit } from '../config/planConfig'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { ESTADO_META } from '../data/eventosData'
import EventoTipoIcon from '../components/EventoTipoIcon'
import styles from './ClientesPage.module.css'

function ClienteModal({ onClose, onSaved, initial }) {
  const editing = !!initial
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form, setForm] = useState(
    initial
      ? { nombre: initial.nombre, email: initial.email || '', telefono: initial.telefono || '', empresa: initial.empresa || '', notas: initial.notas || '' }
      : { nombre: '', email: '', telefono: '', empresa: '', notas: '' }
  )
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    try {
      const payload = { name: form.nombre, email: form.email || null, phone: form.telefono || null, company: form.empresa || null, notes: form.notas || null }
      const saved = editing
        ? await clientesApi.update(initial.id, payload)
        : await clientesApi.create(payload)
      onSaved(saved); onClose()
    } catch (err) { setError(err.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.modalGrid}>
            <div className={styles.modalField} style={{ gridColumn:'1/-1' }}>
              <label>Nombre completo *</label>
              <input placeholder="Fernanda García Reyes" value={form.nombre} onChange={set('nombre')} required />
            </div>
            <div className={styles.modalField}>
              <label>Email</label>
              <input type="email" placeholder="correo@email.com" value={form.email} onChange={set('email')} />
            </div>
            <div className={styles.modalField}>
              <label>Teléfono</label>
              <input placeholder="+52 55 1234 5678" value={form.telefono} onChange={set('telefono')} />
            </div>
            <div className={styles.modalField} style={{ gridColumn:'1/-1' }}>
              <label>Empresa / Familia</label>
              <input placeholder="Familia García" value={form.empresa} onChange={set('empresa')} />
            </div>
            <div className={styles.modalField} style={{ gridColumn:'1/-1' }}>
              <label>Notas</label>
              <textarea placeholder="Información relevante del cliente..." value={form.notas} onChange={set('notas')} rows={3} />
            </div>
          </div>
          {error && <p className={styles.modalError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalBtnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.modalBtnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ETAPA_META = {
  lead:     { label: 'Lead',      cls: 'lead'     },
  prospect: { label: 'Prospecto', cls: 'prospect' },
  client:   { label: 'Cliente',   cls: 'client'   },
  vip:      { label: 'VIP',       cls: 'vip'      },
}

export default function ClientesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [clientes,     setClientes]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState(null)
  const [filterEtapa,  setFilterEtapa]  = useState('todos')
  const [showCreate,   setShowCreate]   = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [delConfirm,      setDelConfirm]      = useState(false)
  const [showGate,        setShowGate]        = useState(false)
  const [openingChat,     setOpeningChat]     = useState(false)
  const [clienteEventos,  setClienteEventos]  = useState([])
  const [loadingEventos,  setLoadingEventos]  = useState(false)

  const handleDelete = async () => {
    if (!selected) return
    await clientesApi.delete(selected.id).catch(() => {})
    setClientes(prev => prev.filter(c => c.id !== selected.id))
    setSelected(null)
    setDelConfirm(false)
  }

  const handleNewCliente = () => {
    if (!underLimit(user?.plan, 'clientes', clientes.length)) {
      setShowGate(true)
      return
    }
    setShowCreate(true)
  }

  const abrirChat = async (cliente) => {
    if (!cliente?.telefono) return
    setOpeningChat(true)
    try {
      const lead = await findOrCreateLeadByPhone(cliente.telefono, cliente.nombre)
      navigate('/app/chats', { state: { openLeadId: lead.id } })
    } catch { alert('No se pudo abrir el chat') }
    finally { setOpeningChat(false) }
  }

  useEffect(() => {
    clientesApi.getAll()
      .then(setClientes)
      .catch(() => setClientes([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) { setClienteEventos([]); return }
    setLoadingEventos(true)
    eventosApi.getAll(null, selected.id)
      .then(evs => evs.sort((a, b) => a.dateISO.localeCompare(b.dateISO)))
      .then(setClienteEventos)
      .catch(() => setClienteEventos([]))
      .finally(() => setLoadingEventos(false))
  }, [selected?.id])

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.nombre.toLowerCase().includes(q) ||
      (c.empresa || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    const matchEtapa = filterEtapa === 'todos' || c.etapa === filterEtapa
    return matchSearch && matchEtapa
  })

  const { visible, hasMore, sentinelRef, reset } = useInfiniteScroll(filtered, 20)

  useEffect(() => { reset() }, [filterEtapa, search, reset])

  const ultimoContacto = (c) => {
    if (!c.ultimoContacto) return 'Sin contacto'
    return new Date(c.ultimoContacto).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className={styles.page}>
      {(showCreate || editing) && (
        <ClienteModal
          initial={editing}
          onClose={() => { setShowCreate(false); setEditing(null) }}
          onSaved={c => {
            if (editing) {
              setClientes(prev => prev.map(v => v.id === c.id ? c : v))
              setSelected(c)
            } else {
              setClientes(prev => [c, ...prev])
            }
            setEditing(null); setShowCreate(false)
          }}
        />
      )}
      {showGate && (
        <PlanGateModal
          feature="clientes"
          requiredPlan="negocio"
          description="El plan Solo permite hasta 200 clientes. Actualiza al Plan Negocio para tener clientes ilimitados."
          onClose={() => setShowGate(false)}
        />
      )}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.sub}>{clientes.length} clientes en tu CRM</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleNewCliente}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo cliente
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.search} type="text" placeholder="Buscar cliente, empresa o email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.etapaFilters}>
          {['todos', 'lead', 'prospect', 'client', 'vip'].map(e => (
            <button key={e} onClick={() => setFilterEtapa(e)}
              className={`${styles.etapaBtn} ${filterEtapa === e ? styles.etapaBtnActive : ''}`}>
              {e === 'todos' ? 'Todos' : ETAPA_META[e]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={`${styles.tableWrap} ${selected ? styles.tableWrapNarrow : ''}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                {!selected && <th>Teléfono</th>}
                <th>Empresa</th>
                <th>Etapa</th>
                <th>Último contacto</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Cargando…</td></tr>
              )}
              {!loading && visible.map(c => {
                const meta = ETAPA_META[c.etapa] ?? ETAPA_META.lead
                return (
                  <tr key={c.id}
                    className={`${styles.row} ${selected?.id === c.id ? styles.rowSelected : ''}`}
                    onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                    <td>
                      <div className={styles.clientName}>
                        <div className={styles.clientAvatar}>{c.avatar}</div>
                        <span className={styles.clientNameText}>{c.nombre}</span>
                      </div>
                    </td>
                    <td className={styles.muted}>{c.email}</td>
                    {!selected && <td className={styles.muted}>{c.telefono}</td>}
                    <td className={styles.muted}>{c.empresa}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${meta.cls}`]}`}>{meta.label}</span>
                    </td>
                    <td className={styles.muted}>{ultimoContacto(c)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className={styles.empty}>No se encontraron clientes</div>
          )}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
        {hasMore && <div className={styles.loadingMore}>Cargando más clientes…</div>}
        {!hasMore && filtered.length > 20 && (
          <div className={styles.listEnd}>{filtered.length} clientes</div>
        )}

        {selected && (
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerAvatar}>{selected.avatar}</div>
              <div className={styles.drawerTitleArea}>
                <h2 className={styles.drawerName}>{selected.nombre}</h2>
                <span className={`${styles.badge} ${styles[`badge_${selected.etapa}`]}`}>
                  {ETAPA_META[selected.etapa]?.label}
                </span>
              </div>
              <button className={styles.drawerClose} onClick={() => setSelected(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{selected.email || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Teléfono</span>
                  <span className={styles.infoValue}>{selected.telefono || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Empresa</span>
                  <span className={styles.infoValue}>{selected.empresa || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Último contacto</span>
                  <span className={styles.infoValue}>{ultimoContacto(selected)}</span>
                </div>
              </div>
              <div className={styles.statsRow}>
                <div className={styles.statMini}>
                  <span className={styles.statMiniVal}>{selected.eventos}</span>
                  <span className={styles.statMiniLabel}>Eventos</span>
                </div>
                <div className={styles.statMini}>
                  <span className={styles.statMiniVal}>{selected.totalFacturado}</span>
                  <span className={styles.statMiniLabel}>Total facturado</span>
                </div>
              </div>
              {selected.notas && (
                <div className={styles.notasSection}>
                  <span className={styles.notasLabel}>Notas</span>
                  <p className={styles.notas}>{selected.notas}</p>
                </div>
              )}

              {/* Eventos del cliente */}
              <div className={styles.eventosSection}>
                <span className={styles.eventosSectionLabel}>Eventos</span>
                {loadingEventos ? (
                  <p className={styles.eventosEmpty}>Cargando…</p>
                ) : clienteEventos.length === 0 ? (
                  <p className={styles.eventosEmpty}>Sin eventos registrados</p>
                ) : (
                  <div className={styles.eventosList}>
                    {clienteEventos.map(ev => {
                      const meta = ESTADO_META[ev.estado] ?? ESTADO_META.lead
                      return (
                        <button
                          key={ev.id}
                          className={styles.eventoRow}
                          onClick={() => navigate(`/app/eventos/${ev.id}`)}
                        >
                          <EventoTipoIcon tipo={ev.tipo} size={14} />
                          <div className={styles.eventoRowInfo}>
                            <span className={styles.eventoRowNombre}>{ev.nombre}</span>
                            <span className={styles.eventoRowFecha}>{ev.fecha} · {ev.hora}</span>
                          </div>
                          <span className={styles.eventoRowBadge} style={{ color: meta.color, background: meta.bg }}>
                            {meta.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className={styles.drawerActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => abrirChat(selected)}
                  disabled={openingChat || !selected?.telefono}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {openingChat ? 'Abriendo…' : 'Enviar mensaje'}
                </button>
                <button className={styles.btnSecondary} onClick={() => setEditing(selected)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar
                </button>
                {delConfirm
                  ? <span className={styles.delConfirmRow}>
                      <span className={styles.delConfirmText}>¿Eliminar?</span>
                      <button className={styles.delYes} onClick={handleDelete}>Sí</button>
                      <button className={styles.delNo} onClick={() => setDelConfirm(false)}>No</button>
                    </span>
                  : <button className={styles.btnDanger} onClick={() => setDelConfirm(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                      Eliminar
                    </button>
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
