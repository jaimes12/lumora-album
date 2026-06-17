import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { notasApi } from '../api/notasApi'
import styles from './NotasPage.module.css'

const COLORS = [
  { key: 'yellow', label: 'Amarillo', bg: '#fef08a', border: '#facc15' },
  { key: 'green',  label: 'Verde',    bg: '#bbf7d0', border: '#4ade80' },
  { key: 'blue',   label: 'Azul',     bg: '#bae6fd', border: '#38bdf8' },
  { key: 'pink',   label: 'Rosa',     bg: '#fbcfe8', border: '#f472b6' },
  { key: 'orange', label: 'Naranja',  bg: '#fed7aa', border: '#fb923c' },
  { key: 'purple', label: 'Morado',   bg: '#e9d5ff', border: '#c084fc' },
]

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '👀']

const ROTATIONS = [-2, 1.2, -1, 2, -0.8, 1.5, -1.8, 0.8]

function colorStyle(colorKey) {
  return COLORS.find(c => c.key === colorKey) ?? COLORS[0]
}

function initials(name) {
  return (name || 'U').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/* ── New Note Modal ── */
function NuevaNotaModal({ onClose, onCreated }) {
  const [content, setContent] = useState('')
  const [color,   setColor]   = useState('yellow')
  const [saving,  setSaving]  = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const note = await notasApi.create(content.trim(), color)
      onCreated(note)
      onClose()
    } catch {
      setSaving(false)
    }
  }

  const col = colorStyle(color)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Nueva nota</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.previewNote} style={{ background: col.bg, borderColor: col.border }}>
          <textarea
            className={styles.previewTextarea}
            placeholder="Escribe tu nota aquí…"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            autoFocus
            style={{ background: col.bg }}
          />
        </div>

        <div className={styles.colorRow}>
          <span className={styles.colorLabel}>Color</span>
          {COLORS.map(c => (
            <button
              key={c.key}
              className={`${styles.colorDot} ${color === c.key ? styles.colorDotActive : ''}`}
              style={{ background: c.bg, borderColor: c.border }}
              onClick={() => setColor(c.key)}
              title={c.label}
            />
          ))}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={!content.trim() || saving}>
            {saving ? 'Guardando…' : 'Publicar nota'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Single Note Card ── */
function NoteCard({ note, index, userId, isAdmin, onDelete, onReact }) {
  const [showEmojis, setShowEmojis] = useState(false)
  const col = colorStyle(note.color)
  const rotate = ROTATIONS[index % ROTATIONS.length]
  const canDelete = note.isOwn || isAdmin

  const handleReact = async (emoji) => {
    setShowEmojis(false)
    try {
      const reactions = await notasApi.toggleReaction(note.id, emoji)
      onReact(note.id, reactions)
    } catch {}
  }

  return (
    <div
      className={styles.noteCard}
      style={{ background: col.bg, borderColor: col.border, '--rotate': `${rotate}deg` }}
    >
      {canDelete && (
        <button
          className={styles.noteDeleteBtn}
          onClick={() => onDelete(note.id)}
          title="Eliminar nota"
        >
          ×
        </button>
      )}

      <p className={styles.noteContent}>{note.content}</p>

      <div className={styles.noteFooter}>
        <div className={styles.noteAuthor}>
          {note.userPhoto
            ? <img src={note.userPhoto} alt="" className={styles.noteAvatar} />
            : <div className={styles.noteAvatarText} style={{ borderColor: col.border }}>{initials(note.userName)}</div>
          }
          <div className={styles.noteAuthorInfo}>
            <span className={styles.noteAuthorName}>{note.userName}</span>
            <span className={styles.noteDate}>{note.createdAt}</span>
          </div>
        </div>
      </div>

      <div className={styles.reactionsRow}>
        {note.reactions.map(r => (
          <button
            key={r.emoji}
            className={`${styles.reactionChip} ${r.mine ? styles.reactionChipMine : ''}`}
            style={r.mine ? { borderColor: col.border } : {}}
            onClick={() => handleReact(r.emoji)}
            title={r.users.join(', ')}
          >
            {r.emoji} <span className={styles.reactionCount}>{r.count}</span>
          </button>
        ))}
        <div className={styles.emojiPickerWrap}>
          <button
            className={styles.addReactionBtn}
            onClick={() => setShowEmojis(v => !v)}
            title="Agregar reacción"
          >
            😊 +
          </button>
          {showEmojis && (
            <div className={styles.emojiPicker}>
              {EMOJIS.map(e => (
                <button key={e} className={styles.emojiOption} onClick={() => handleReact(e)}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function NotasPage() {
  const { user } = useAuth()
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const isAdmin   = (user?.role ?? 'admin') === 'admin'
  const isAgencia = user?.plan === 'agencia'

  const load = useCallback(async () => {
    if (!isAgencia) { setLoading(false); return }
    try { setNotes(await notasApi.getAll()) }
    catch {}
    finally { setLoading(false) }
  }, [isAgencia])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  const handleCreated = (note) => setNotes(prev => [note, ...prev])

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta nota?')) return
    try {
      await notasApi.remove(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch {}
  }

  const handleReact = (noteId, reactions) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, reactions: Array.from(reactions) } : n))
  }

  if (!isAgencia) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Notas compartidas</h1>
        </div>
        <div className={styles.upgradeWrap}>
          <div className={styles.upgradeCard}>
            <span className={styles.upgradeEmoji}>📌</span>
            <h2 className={styles.upgradeTitle}>Disponible en plan Agencia</h2>
            <p className={styles.upgradeSub}>
              Las notas compartidas permiten a tu equipo colaborar con mensajes, recordatorios y
              comentarios que todos pueden ver y reaccionar.
            </p>
            <a href="/app/paquetes" className={styles.upgradeBtn}>Ver planes</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {showNew && (
        <NuevaNotaModal
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notas compartidas</h1>
          <p className={styles.sub}>{notes.length} nota{notes.length !== 1 ? 's' : ''} · todo el equipo las ve</p>
        </div>
        <button className={styles.btnNew} onClick={() => setShowNew(true)}>
          + Nueva nota
        </button>
      </div>

      {loading && (
        <div className={styles.empty}>Cargando…</div>
      )}

      {!loading && notes.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>📌</span>
          <p>No hay notas todavía. ¡Sé el primero en publicar una!</p>
          <button className={styles.btnNew} onClick={() => setShowNew(true)}>+ Nueva nota</button>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className={styles.board}>
          {notes.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              index={i}
              userId={user?.userId}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          ))}
        </div>
      )}
    </div>
  )
}
