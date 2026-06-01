import { useState, useEffect } from 'react'
import { leadsApi } from '../api/leadsApi'
import styles from './ChatPage.module.css'

const TIPOS_EVENTO = ['Boda', 'XV Años', 'Corporativo', 'Graduación', 'Bautizo', 'Cumpleaños', 'Otro']

function NuevoLeadModal({ onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form, setForm] = useState({ nombre: '', telefono: '', tipoEvento: 'Boda', fechaEvento: '', presupuesto: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre || !form.telefono) { setError('Nombre y teléfono son obligatorios'); return }
    setSaving(true); setError('')
    try {
      const nuevo = await leadsApi.create({
        name: form.nombre,
        phone: form.telefono,
        eventType: form.tipoEvento || null,
        eventDate: form.fechaEvento || null,
        budget: form.presupuesto ? parseFloat(form.presupuesto) : null,
      })
      onCreated(nuevo); onClose()
    } catch (err) { setError(err.message || 'Error al crear lead') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.leadOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.leadModal}>
        <div className={styles.leadModalHeader}>
          <h2 className={styles.leadModalTitle}>Nuevo lead</h2>
          <button className={styles.leadModalClose} onClick={onClose}>✕</button>
        </div>
        <form className={styles.leadModalForm} onSubmit={handleSubmit}>
          <div className={styles.leadGrid}>
            <div className={styles.leadField}>
              <label>Nombre *</label>
              <input placeholder="Valeria Torres" value={form.nombre} onChange={set('nombre')} required />
            </div>
            <div className={styles.leadField}>
              <label>Teléfono *</label>
              <input placeholder="+52 55 1234 5678" value={form.telefono} onChange={set('telefono')} required />
            </div>
            <div className={styles.leadField}>
              <label>Tipo de evento</label>
              <select value={form.tipoEvento} onChange={set('tipoEvento')}>
                {TIPOS_EVENTO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.leadField}>
              <label>Fecha estimada</label>
              <input placeholder="Jul 2026" value={form.fechaEvento} onChange={set('fechaEvento')} />
            </div>
            <div className={styles.leadField} style={{ gridColumn:'1/-1' }}>
              <label>Presupuesto estimado ($)</label>
              <input type="number" placeholder="85000" min="0" value={form.presupuesto} onChange={set('presupuesto')} />
            </div>
          </div>
          {error && <p className={styles.leadError}>{error}</p>}
          <div className={styles.leadModalActions}>
            <button type="button" className={styles.leadBtnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.leadBtnPrimary} disabled={saving}>{saving ? 'Guardando…' : 'Crear lead →'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STAGES = [
  { id: 'nuevo',      label: 'Nuevo',             color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  { id: 'contactado', label: 'Contactado',         color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  { id: 'cotizacion', label: 'Cotización enviada', color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { id: 'negociando', label: 'Negociando',         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { id: 'confirmado', label: 'Confirmado',         color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
]

export default function ChatPage() {
  const [leads,       setLeads]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [leadActivo,  setLeadActivo]  = useState(null)
  const [mensaje,     setMensaje]     = useState('')
  const [dragging,    setDragging]    = useState(null)
  const [dragOver,    setDragOver]    = useState(null)
  const [mobileTab,   setMobileTab]   = useState('chats')
  const [showCreate,  setShowCreate]  = useState(false)

  useEffect(() => {
    leadsApi.getAll()
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false))
  }, [])

  const byStage = (stageId) => leads.filter(l => l.stage === stageId)

  const totalPresupuesto = leads
    .filter(l => l.stage === 'confirmado')
    .reduce((acc, l) => acc + parseInt((l.presupuesto || '$0').replace(/[$,]/g, '')), 0)

  const totalNoLeidos = leads.filter(l => l.noLeidos > 0).length

  const abrirChat = (lead) => {
    setLeadActivo(lead)
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, noLeidos: 0 } : l))
    leadsApi.markRead(lead.id).catch(() => {})
  }

  const enviarMensaje = async () => {
    if (!mensaje.trim() || !leadActivo) return
    const texto = mensaje
    setMensaje('')
    const nuevoMsg = { id: Date.now(), texto, tipo: 'out', hora: 'Ahora' }
    setLeads(prev => prev.map(l =>
      l.id === leadActivo.id ? { ...l, mensajes: [...l.mensajes, nuevoMsg], ultimoMsg: texto } : l
    ))
    setLeadActivo(prev => ({ ...prev, mensajes: [...prev.mensajes, nuevoMsg] }))
    await leadsApi.sendMessage(leadActivo.id, texto, 'outbound').catch(() => {})
  }

  const moverStage = async (leadId, nuevoStage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: nuevoStage } : l))
    if (leadActivo?.id === leadId) setLeadActivo(prev => ({ ...prev, stage: nuevoStage }))
    await leadsApi.update(leadId, { stage: nuevoStage }).catch(() => {})
  }

  const handleDragStart = (e, lead) => { setDragging(lead); e.dataTransfer.effectAllowed = 'move' }
  const handleDrop = (e, stageId) => {
    e.preventDefault()
    if (dragging && dragging.stage !== stageId) moverStage(dragging.id, stageId)
    setDragging(null); setDragOver(null)
  }

  return (
    <div className={styles.page}>
      {showCreate && (
        <NuevoLeadModal
          onClose={() => setShowCreate(false)}
          onCreated={lead => setLeads(prev => [lead, ...prev])}
        />
      )}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pipeline de chats</h1>
          <p className={styles.sub}>{leads.length} conversaciones · {totalNoLeidos} sin leer</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statChip}>
            <span className={styles.statChipVal}>${totalPresupuesto.toLocaleString()}</span>
            <span className={styles.statChipLabel}>Confirmado</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipVal}>{byStage('negociando').length + byStage('cotizacion').length}</span>
            <span className={styles.statChipLabel}>En proceso</span>
          </div>
          <button className={styles.btnNew} onClick={() => setShowCreate(true)}>+ Nuevo lead</button>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className={styles.mobileTabs}>
        <button className={`${styles.mobileTab} ${mobileTab === 'chats' ? styles.mobileTabActive : ''}`} onClick={() => setMobileTab('chats')}>
          Chats
          {totalNoLeidos > 0 && <span className={styles.mobileTabBadge}>{totalNoLeidos}</span>}
        </button>
        <button className={`${styles.mobileTab} ${mobileTab === 'pipeline' ? styles.mobileTabActive : ''}`} onClick={() => setMobileTab('pipeline')}>
          Pipeline
        </button>
      </div>

      {/* Mobile chat list */}
      <div className={`${styles.mobileList} ${mobileTab === 'chats' ? styles.mobileListVisible : ''}`}>
        {loading && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:14 }}>Cargando…</div>}
        {STAGES.map(stage => {
          const items = byStage(stage.id)
          if (items.length === 0) return null
          return (
            <div key={stage.id} className={styles.mobileGroup}>
              <div className={styles.mobileGroupLabel}>
                <span className={styles.mobileGroupDot} style={{ background: stage.color }} />
                {stage.label}
                <span className={styles.mobileGroupCount} style={{ color: stage.color, background: stage.bg }}>{items.length}</span>
              </div>
              {items.map(lead => (
                <button key={lead.id} className={styles.mobileRow} onClick={() => abrirChat(lead)}>
                  <div className={styles.mobileRowAvatar}>{lead.avatar}</div>
                  <div className={styles.mobileRowBody}>
                    <div className={styles.mobileRowTop}>
                      <span className={styles.mobileRowName}>{lead.nombre}</span>
                      <span className={styles.mobileRowHora}>{lead.hora}</span>
                    </div>
                    <div className={styles.mobileRowBottom}>
                      <span className={styles.mobileRowMsg}>{lead.ultimoMsg}</span>
                      {lead.noLeidos > 0 && <span className={styles.unread}>{lead.noLeidos}</span>}
                    </div>
                    <span className={styles.mobileRowEvento}>{lead.evento} · {lead.presupuesto}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {/* Kanban board */}
      <div className={`${styles.board} ${mobileTab === 'pipeline' ? styles.boardMobileVisible : ''}`}>
        {loading
          ? <div style={{ color:'var(--text-muted)', fontSize:14, padding:20 }}>Cargando…</div>
          : STAGES.map(stage => {
            const cols = byStage(stage.id)
            return (
              <div key={stage.id}
                className={`${styles.column} ${dragOver === stage.id ? styles.columnDragOver : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(stage.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, stage.id)}>
                <div className={styles.colHeader} style={{ borderColor: stage.color }}>
                  <div className={styles.colTitleWrap}>
                    <span className={styles.colDot} style={{ background: stage.color }} />
                    <span className={styles.colTitle}>{stage.label}</span>
                  </div>
                  <span className={styles.colCount} style={{ background: stage.bg, color: stage.color }}>{cols.length}</span>
                </div>
                <div className={styles.cards}>
                  {cols.map(lead => (
                    <div key={lead.id}
                      className={`${styles.card} ${leadActivo?.id === lead.id ? styles.cardActive : ''}`}
                      draggable onDragStart={e => handleDragStart(e, lead)} onClick={() => abrirChat(lead)}>
                      <div className={styles.cardTop}>
                        <div className={styles.cardAvatar}>{lead.avatar}</div>
                        <div className={styles.cardInfo}>
                          <span className={styles.cardName}>{lead.nombre}</span>
                          <span className={styles.cardEvento}>{lead.evento}</span>
                        </div>
                        {lead.noLeidos > 0 && <span className={styles.unread}>{lead.noLeidos}</span>}
                      </div>
                      <p className={styles.cardMsg}>{lead.ultimoMsg}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardPresupuesto}>{lead.presupuesto}</span>
                        <span className={styles.cardHora}>{lead.hora}</span>
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && <div className={styles.emptyCol}>Arrastra aquí</div>}
                </div>
              </div>
            )
          })
        }
      </div>

      {/* Chat panel */}
      {leadActivo && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <button className={styles.backBtn} onClick={() => setLeadActivo(null)} aria-label="Volver">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className={styles.panelAvatar}>{leadActivo.avatar}</div>
            <div className={styles.panelInfo}>
              <span className={styles.panelName}>{leadActivo.nombre}</span>
              <span className={styles.panelEvento}>{leadActivo.evento} · {leadActivo.presupuesto}</span>
            </div>
            <div className={styles.panelActions}>
              <select className={styles.stageSelect} value={leadActivo.stage} onChange={e => moverStage(leadActivo.id, e.target.value)}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button className={styles.closeBtn} onClick={() => setLeadActivo(null)}>✕</button>
            </div>
          </div>
          <div className={styles.messages}>
            {leadActivo.mensajes.map(m => (
              <div key={m.id} className={`${styles.msgWrap} ${m.tipo === 'out' ? styles.msgOut : ''}`}>
                <div className={`${styles.bubble} ${m.tipo === 'out' ? styles.bubbleOut : styles.bubbleIn}`}>
                  <p>{m.texto}</p>
                  <span className={styles.hora}>{m.hora}</span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.inputArea}>
            <input className={styles.msgInput} placeholder="Escribe un mensaje..."
              value={mensaje} onChange={e => setMensaje(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviarMensaje()} />
            <button className={styles.sendBtn} onClick={enviarMensaje}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
