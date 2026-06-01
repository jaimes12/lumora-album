import { useState, useEffect, useRef, useCallback } from 'react'
import { leadsApi } from '../api/leadsApi'
import styles from './ChatPage.module.css'

// ─── Phone input with country code toggle ────────────────────────────────────
const CC = [
  { key: 'mx', prefix: '52', flag: '🇲🇽', label: '+52', hint: '449 452 1666' },
  { key: 'us', prefix: '1',  flag: '🇺🇸', label: '+1',  hint: '415 555 1234' },
]

function PhoneInput({ value, onChange, inputClassName }) {
  const detect = (v) => {
    const d = (v || '').replace(/\D/g, '')
    if (d.startsWith('52') && d.length >= 12) return 0
    if (d.startsWith('1')  && d.length >= 11) return 1
    return 0
  }
  const [idx, setIdx] = useState(() => detect(value))
  const cc = CC[idx]

  const localDigits = () => {
    const d = (value || '').replace(/\D/g, '')
    return d.startsWith(cc.prefix) ? d.slice(cc.prefix.length) : d
  }

  const handleChange = e => onChange(cc.prefix + e.target.value.replace(/\D/g, ''))

  const toggle = () => {
    const next = (idx + 1) % CC.length
    const bare = localDigits()
    setIdx(next)
    onChange(CC[next].prefix + bare)
  }

  return (
    <div className={styles.phoneWrap}>
      <button type="button" className={styles.ccToggle} onClick={toggle}>
        {cc.flag} {cc.label}
      </button>
      <input
        className={`${styles.phoneDigitsInput} ${inputClassName || ''}`}
        value={localDigits()}
        onChange={handleChange}
        placeholder={cc.hint}
        inputMode="numeric"
      />
    </div>
  )
}

// ─── Default stages ──────────────────────────────────────────────────────────
const DEFAULT_STAGES = [
  { id: 'nuevo',      label: 'Nuevo',              color: '#64748b' },
  { id: 'contactado', label: 'Contactado',          color: '#38bdf8' },
  { id: 'cotizacion', label: 'Cotización enviada',  color: '#fb923c' },
  { id: 'negociando', label: 'Negociando',          color: '#a78bfa' },
  { id: 'confirmado', label: 'Confirmado',          color: '#34d399' },
]

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useStages() {
  const [stages, setStages] = useState(() => {
    try {
      const s = localStorage.getItem('lumora_stages')
      return s ? JSON.parse(s) : DEFAULT_STAGES
    } catch { return DEFAULT_STAGES }
  })
  const save = (next) => {
    setStages(next)
    localStorage.setItem('lumora_stages', JSON.stringify(next))
  }
  return [stages, save]
}

// ─── Stage Manager ───────────────────────────────────────────────────────────
const PRESET_COLORS = ['#64748b','#38bdf8','#34d399','#fb923c','#a78bfa','#f472b6','#fbbf24','#ef4444']

function StageManager({ stages, onSave, onClose, onClearAll }) {
  const [rows, setRows] = useState(stages.map(s => ({ ...s })))

  const update = (i, field, val) =>
    setRows(r => r.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  const remove = (i) => setRows(r => r.filter((_, idx) => idx !== i))

  const add = () => setRows(r => [...r, {
    id: 'stage_' + Date.now(),
    label: 'Nueva etapa',
    color: PRESET_COLORS[r.length % PRESET_COLORS.length],
  }])

  return (
    <div className={styles.smOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.smBox}>
        <div className={styles.smHeader}>
          <h3 className={styles.smTitle}>Configurar embudos</h3>
          <button className={styles.smClose} onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.smTableWrap}>
          <table className={styles.smTable}>
            <thead>
              <tr>
                <th className={styles.smTh}>Color</th>
                <th className={styles.smTh}>Nombre del embudo</th>
                <th className={styles.smTh}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.id} className={styles.smRow}>
                  <td className={styles.smTd}>
                    <div className={styles.smColorCell}>
                      <div className={styles.smColorDot} style={{ background: s.color }} />
                      <div className={styles.smPresets}>
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            className={`${styles.smPreset} ${s.color === c ? styles.smPresetActive : ''}`}
                            style={{ background: c }}
                            onClick={() => update(i, 'color', c)}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className={styles.smTd}>
                    <input
                      className={styles.smNameInput}
                      value={s.label}
                      onChange={e => update(i, 'label', e.target.value)}
                    />
                  </td>
                  <td className={styles.smTd}>
                    <button
                      className={styles.smDeleteBtn}
                      onClick={() => remove(i)}
                      disabled={rows.length <= 1}
                      title="Eliminar"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.smFooter}>
          <button className={styles.smAddBtn} onClick={add}>+ Agregar etapa</button>
          <button className={styles.smSaveBtn} onClick={() => { onSave(rows); onClose() }}>
            Guardar cambios
          </button>
        </div>

        {/* Danger zone */}
        <div className={styles.smDanger}>
          <span className={styles.smDangerLabel}>Zona de peligro</span>
          <button
            className={styles.smDangerBtn}
            onClick={onClearAll}
          >
            🗑 Limpiar todas las conversaciones
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Nuevo Lead Modal ────────────────────────────────────────────────────────
const TIPOS_EVENTO = ['Boda', 'XV Años', 'Corporativo', 'Graduación', 'Bautizo', 'Cumpleaños', 'Otro']

function NuevoLeadModal({ onClose, onCreated, leads }) {
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [warning, setWarning] = useState('')
  const [form, setForm] = useState({ nombre: '', telefono: '', tipoEvento: '', fechaEvento: '', presupuesto: '' })
  const set = k => e => {
    setError(''); setWarning('')
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  const checkDuplicate = (phone) => {
    const digits = phone.replace(/\D/g, '')
    const last10 = digits.slice(-10)
    if (last10.length < 6) return null
    return (leads || []).find(l => l.telefono.replace(/\D/g, '').endsWith(last10))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre || !form.telefono) { setError('Nombre y teléfono son obligatorios'); return }
    const dup = checkDuplicate(form.telefono)
    if (dup) { setError(`Ya existe "${dup.nombre}" con ese número. Busca el chat existente.`); return }
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
              <PhoneInput
                value={form.telefono}
                onChange={v => setForm(f => ({ ...f, telefono: v }))}
                inputClassName={styles.leadPhoneInput}
              />
            </div>
            <div className={styles.leadField}>
              <label>Tipo de evento <span className={styles.optLabel}>(opcional)</span></label>
              <select value={form.tipoEvento} onChange={set('tipoEvento')}>
                <option value="">Sin evento vinculado</option>
                {TIPOS_EVENTO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.leadField}>
              <label>Fecha estimada <span className={styles.optLabel}>(opcional)</span></label>
              <input placeholder="Jul 2026" value={form.fechaEvento} onChange={set('fechaEvento')} />
            </div>
            <div className={styles.leadField} style={{ gridColumn: '1/-1' }}>
              <label>Presupuesto estimado ($) <span className={styles.optLabel}>(opcional)</span></label>
              <input type="number" placeholder="85000" min="0" value={form.presupuesto} onChange={set('presupuesto')} />
            </div>
          </div>
          {error && <p className={styles.leadError}>{error}</p>}
          <div className={styles.leadModalActions}>
            <button type="button" className={styles.leadBtnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.leadBtnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : 'Crear lead →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Contact Info Panel ──────────────────────────────────────────────────────
const TIPOS_EVENTO_LIST = ['Boda', 'XV Años', 'Corporativo', 'Graduación', 'Bautizo', 'Cumpleaños', 'Otro']

function ContactInfoPanel({ lead, onUpdate }) {
  const [nombre,      setNombre]      = useState(lead.nombre)
  const [telefono,    setTelefono]    = useState(lead.telefono)
  const [tipoEvento,  setTipoEvento]  = useState(lead.eventTypeRaw || '')
  const [fechaEvento, setFechaEvento] = useState(lead.eventDateRaw || '')
  const [presupuesto, setPresupuesto] = useState(lead.budgetRaw != null ? String(lead.budgetRaw) : '')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await leadsApi.update(lead.id, {
        name:      nombre,
        phone:     telefono,
        eventType: tipoEvento  || null,
        eventDate: fechaEvento || null,
        budget:    presupuesto ? parseFloat(presupuesto) : null,
      })
      onUpdate(lead.id, {
        nombre:      updated.nombre,
        telefono:    updated.telefono,
        avatar:      updated.avatar,
        evento:      updated.evento,
        presupuesto: updated.presupuesto,
        eventTypeRaw: updated.eventTypeRaw,
        eventDateRaw: updated.eventDateRaw,
        budgetRaw:    updated.budgetRaw,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <div className={styles.infoPanel}>
      <p className={styles.infoPanelTitle}>Datos del contacto</p>

      <div className={styles.infoField}>
        <label className={styles.infoLabel}>Nombre</label>
        <input className={styles.infoInput} value={nombre} onChange={e => setNombre(e.target.value)} />
      </div>
      <div className={styles.infoField}>
        <label className={styles.infoLabel}>Teléfono</label>
        <PhoneInput
          value={telefono}
          onChange={setTelefono}
          inputClassName={styles.infoInput}
        />
      </div>

      <div className={styles.infoSep} />
      <p className={styles.infoPanelTitle}>Evento</p>

      <div className={styles.infoField}>
        <label className={styles.infoLabel}>Tipo</label>
        <select className={styles.infoInput} value={tipoEvento} onChange={e => setTipoEvento(e.target.value)}>
          <option value="">Sin evento</option>
          {TIPOS_EVENTO_LIST.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className={styles.infoField}>
        <label className={styles.infoLabel}>Fecha estimada</label>
        <input className={styles.infoInput} placeholder="Jul 2026" value={fechaEvento} onChange={e => setFechaEvento(e.target.value)} />
      </div>
      <div className={styles.infoField}>
        <label className={styles.infoLabel}>Presupuesto ($)</label>
        <input className={styles.infoInput} type="number" placeholder="85000" value={presupuesto} onChange={e => setPresupuesto(e.target.value)} />
      </div>

      <button className={`${styles.infoPanelSave} ${saved ? styles.infoPanelSaved : ''}`} onClick={save} disabled={saving}>
        {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ─── Tick component (message status) ────────────────────────────────────────
function Tick({ saved }) {
  // saved=false → single ✓ (optimistic, en camino)
  // saved=true  → doble ✓✓ (confirmado por servidor)
  return (
    <svg className={styles.tickIcon} viewBox="0 0 16 11" fill="none">
      {saved && (
        <path d="M1 5.5L4.5 9 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      <path
        d={saved ? "M5 5.5L9 9 15 2" : "M1 5.5L5 9 13 2"}
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

// true if a name looks like a raw phone number (no spaces, mostly digits)
const isPhoneNumber = (s) => s && /^[\d\s\-\+\(\)]{7,}$/.test(s.trim())

// ─── Chat Modal ──────────────────────────────────────────────────────────────
function ChatModal({ lead: initLead, stages, onClose, onLeadUpdate }) {
  const [lead,     setLead]     = useState(initLead)
  const [message,  setMessage]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const bottomRef = useRef(null)

  const fetchLead = useCallback(async () => {
    try {
      const updated = await leadsApi.getById(lead.id)
      setLead(updated)
      onLeadUpdate(lead.id, { ultimoMsg: updated.ultimoMsg, noLeidos: 0, hora: updated.hora })
    } catch {}
  }, [lead.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lead.mensajes])

  // Poll every 3s + re-fetch when window regains focus
  useEffect(() => {
    fetchLead() // immediate on open
    const id = setInterval(fetchLead, 3000)
    const onFocus = () => fetchLead()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [fetchLead])

  const send = async () => {
    const text = message.trim()
    if (!text || sending) return
    setSending(true)
    setMessage('')
    const tempId = `tmp_${Date.now()}`
    const tempMsg = {
      id: tempId,
      texto: text,
      tipo: 'out',
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    }
    setLead(l => ({ ...l, mensajes: [...l.mensajes, tempMsg], ultimoMsg: text }))
    onLeadUpdate(lead.id, { ultimoMsg: text })
    try {
      await leadsApi.sendMessage(lead.id, text, 'outbound')
      // Replace temp msg with saved one on next poll; for now mark as saved
      setLead(l => ({
        ...l,
        mensajes: l.mensajes.map(m => m.id === tempId ? { ...m, id: `sent_${Date.now()}` } : m),
      }))
    } catch {}
    finally { setSending(false) }
  }

  const changeStage = async (stageId) => {
    setLead(l => ({ ...l, stage: stageId }))
    onLeadUpdate(lead.id, { stage: stageId })
    await leadsApi.update(lead.id, { stage: stageId }).catch(() => {})
  }

  const currentStage = stages.find(s => s.id === lead.stage) ?? stages[0]
  const nameIsPhone  = isPhoneNumber(lead.nombre)
  const displayName  = nameIsPhone ? lead.telefono : lead.nombre
  const showPhone    = !nameIsPhone && lead.telefono && lead.telefono !== lead.nombre

  return (
    <div className={styles.chatOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.chatModalBox} ${showInfo ? styles.chatModalBoxWide : ''}`}>

        {/* Header */}
        <div className={styles.chatModalHeader}>
          <div className={styles.chatModalAvatar}
            style={nameIsPhone ? { background: '#334155' } : {}}>
            {nameIsPhone
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.49 5.49l1.97-1.34a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              : lead.avatar
            }
          </div>
          <div className={styles.chatModalInfo}>
            <span className={styles.chatModalName}>{displayName}</span>
            <span className={styles.chatModalSub}>
              {showPhone && <span>{lead.telefono}</span>}
              {lead.evento && <span className={styles.chatModalEvento}>{showPhone ? ' · ' : ''}{lead.evento}</span>}
              {lead.presupuesto && lead.presupuesto !== '$0' && (
                <span className={styles.chatModalBudget}> · {lead.presupuesto}</span>
              )}
            </span>
          </div>
          <select
            className={styles.chatStageSelect}
            value={lead.stage}
            style={{ color: currentStage?.color, borderColor: (currentStage?.color ?? '#64748b') + '55' }}
            onChange={e => changeStage(e.target.value)}
          >
            {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {/* Info toggle */}
          <button
            className={`${styles.chatInfoBtn} ${showInfo ? styles.chatInfoBtnActive : ''}`}
            onClick={() => setShowInfo(v => !v)}
            title="Datos del contacto"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
          <button className={styles.chatCloseBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body: chat left + info right */}
        <div className={styles.chatModalContent}>
          <div className={styles.chatLeft}>
            {/* Messages */}
            <div className={styles.chatModalMsgs}>
              {lead.mensajes.length === 0 && (
                <p className={styles.chatEmpty}>Sin mensajes aún. ¡Escribe el primero!</p>
              )}
              {lead.mensajes.map(m => {
                const isSaved = !m.id.startsWith('tmp_')
                return (
                  <div key={m.id} className={`${styles.chatMsgWrap} ${m.tipo === 'out' ? styles.chatMsgOut : ''}`}>
                    <div className={`${styles.chatBubble} ${m.tipo === 'out' ? styles.chatBubbleOut : styles.chatBubbleIn}`}>
                      <p>{m.texto}</p>
                      <div className={styles.chatBubbleMeta}>
                        <span className={styles.chatBubbleTime}>{m.hora}</span>
                        {m.tipo === 'out' && <Tick saved={isSaved} />}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={styles.chatInputArea}>
              <textarea
                className={styles.chatInput}
                placeholder="Escribe un mensaje… (Enter para enviar)"
                value={message}
                rows={1}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              />
              <button className={styles.chatSendBtn} onClick={send} disabled={!message.trim() || sending}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>{/* .chatLeft */}

          {/* Info panel */}
          {showInfo && (
            <ContactInfoPanel
              lead={lead}
              onUpdate={(id, changes) => {
                setLead(l => ({ ...l, ...changes }))
                onLeadUpdate(id, changes)
              }}
            />
          )}
        </div>{/* .chatModalContent */}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [stages,           saveStages]          = useStages()
  const [leads,            setLeads]            = useState([])
  const [loading,          setLoading]          = useState(true)
  const [activeLead,       setActiveLead]       = useState(null)
  const [dragging,         setDragging]         = useState(null)
  const [dragOver,         setDragOver]         = useState(null)
  const [mobileTab,        setMobileTab]        = useState('chats')
  const [showCreate,       setShowCreate]       = useState(false)
  const [showStageManager, setShowStageManager] = useState(false)

  const loadLeads = useCallback(async () => {
    try { setLeads(await leadsApi.getAll()) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadLeads()
    const id = setInterval(loadLeads, 10000) // poll every 10s for incoming messages
    return () => clearInterval(id)
  }, [loadLeads])

  const byStage = (stageId) => leads.filter(l => l.stage === stageId)

  const lastStageId   = stages[stages.length - 1]?.id
  const totalConfirmado = leads
    .filter(l => l.stage === lastStageId)
    .reduce((acc, l) => acc + parseInt((l.presupuesto || '$0').replace(/[$,]/g, '')), 0)
  const totalNoLeidos = leads.filter(l => l.noLeidos > 0).length

  const abrirChat = (lead) => {
    setActiveLead(lead)
    if (lead.noLeidos > 0) {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, noLeidos: 0 } : l))
      leadsApi.markRead(lead.id).catch(() => {})
    }
  }

  const handleLeadUpdate = (id, changes) =>
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l))

  const moverStage = async (leadId, nuevoStage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: nuevoStage } : l))
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
          leads={leads}
          onClose={() => setShowCreate(false)}
          onCreated={lead => { setLeads(prev => [lead, ...prev]); setActiveLead(lead) }}
        />
      )}
      {showStageManager && (
        <StageManager
          stages={stages}
          onSave={saveStages}
          onClose={() => setShowStageManager(false)}
          onClearAll={async () => {
            if (!window.confirm('¿Eliminar TODAS las conversaciones? Esta acción no se puede deshacer.')) return
            await leadsApi.deleteAll().catch(() => {})
            setLeads([])
            setActiveLead(null)
            setShowStageManager(false)
          }}
        />
      )}
      {activeLead && (
        <ChatModal
          lead={activeLead}
          stages={stages}
          onClose={() => setActiveLead(null)}
          onLeadUpdate={(id, changes) => {
            handleLeadUpdate(id, changes)
            setActiveLead(prev => prev?.id === id ? { ...prev, ...changes } : prev)
          }}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pipeline de chats</h1>
          <p className={styles.sub}>{leads.length} conversaciones · {totalNoLeidos} sin leer</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statChip}>
            <span className={styles.statChipVal}>${totalConfirmado.toLocaleString()}</span>
            <span className={styles.statChipLabel}>{stages[stages.length - 1]?.label ?? 'Confirmado'}</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipVal}>{leads.filter(l => l.stage !== lastStageId).length}</span>
            <span className={styles.statChipLabel}>En proceso</span>
          </div>
          <button className={styles.btnSettings} onClick={() => setShowStageManager(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Embudos
          </button>
          <button className={styles.btnNew} onClick={() => setShowCreate(true)}>+ Nuevo lead</button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className={styles.mobileTabs}>
        <button className={`${styles.mobileTab} ${mobileTab === 'chats' ? styles.mobileTabActive : ''}`} onClick={() => setMobileTab('chats')}>
          Chats {totalNoLeidos > 0 && <span className={styles.mobileTabBadge}>{totalNoLeidos}</span>}
        </button>
        <button className={`${styles.mobileTab} ${mobileTab === 'pipeline' ? styles.mobileTabActive : ''}`} onClick={() => setMobileTab('pipeline')}>
          Pipeline
        </button>
      </div>

      {/* Mobile chat list */}
      <div className={`${styles.mobileList} ${mobileTab === 'chats' ? styles.mobileListVisible : ''}`}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Cargando…</div>}
        {stages.map(stage => {
          const items = byStage(stage.id)
          if (items.length === 0) return null
          return (
            <div key={stage.id} className={styles.mobileGroup}>
              <div className={styles.mobileGroupLabel}>
                <span className={styles.mobileGroupDot} style={{ background: stage.color }} />
                {stage.label}
                <span className={styles.mobileGroupCount} style={{ color: stage.color, background: stage.color + '20' }}>{items.length}</span>
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
                    <span className={styles.mobileRowEvento}>{lead.evento || lead.telefono}</span>
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
          ? <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 20 }}>Cargando…</div>
          : stages.map(stage => {
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
                    <span className={styles.colCount} style={{ background: stage.color + '20', color: stage.color }}>{cols.length}</span>
                  </div>
                  <div className={styles.cards}>
                    {cols.map(lead => (
                      <div key={lead.id}
                        className={`${styles.card} ${activeLead?.id === lead.id ? styles.cardActive : ''}`}
                        draggable onDragStart={e => handleDragStart(e, lead)}
                        onClick={() => abrirChat(lead)}>
                        <div className={styles.cardTop}>
                          <div className={styles.cardAvatar}>{lead.avatar}</div>
                          <div className={styles.cardInfo}>
                            <span className={styles.cardName}>{lead.nombre}</span>
                            <span className={styles.cardEvento}>{lead.evento || lead.telefono}</span>
                          </div>
                          {lead.noLeidos > 0 && <span className={styles.unread}>{lead.noLeidos}</span>}
                        </div>
                        <p className={styles.cardMsg}>{lead.ultimoMsg}</p>
                        <div className={styles.cardFooter}>
                          <span className={styles.cardPresupuesto}>{lead.presupuesto !== '$0' ? lead.presupuesto : ''}</span>
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
    </div>
  )
}
