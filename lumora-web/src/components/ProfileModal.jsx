import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './ProfileModal.module.css'

const EyeIcon = ({ open }) => open ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const TABS = ['Información', 'Correo', 'Contraseña', 'Foto de perfil']

export default function ProfileModal({ onClose }) {
  const { user, updateProfile, updateEmail, updatePassword, updatePhoto } = useAuth()
  const [tab,        setTab]        = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState('')
  const [error,      setError]      = useState('')
  const fileRef = useRef(null)

  // Tab 0 — Info
  const [name,       setName]       = useState(user?.name || '')

  // Tab 1 — Email
  const [newEmail,   setNewEmail]   = useState('')
  const [emailPass,  setEmailPass]  = useState('')
  const [showEP,     setShowEP]     = useState(false)

  // Tab 2 — Password
  const [oldPass,    setOldPass]    = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [newPass2,   setNewPass2]   = useState('')
  const [showOP,     setShowOP]     = useState(false)
  const [showNP,     setShowNP]     = useState(false)

  // Tab 3 — Photo
  const [photoPreview, setPhotoPreview] = useState(user?.photo || null)

  const reset = () => { setSuccess(''); setError('') }

  const handleTab = (i) => { setTab(i); reset() }

  const handleInfo = async (e) => {
    e.preventDefault(); reset()
    if (!name.trim()) return
    setLoading(true)
    try {
      await updateProfile(name.trim())
      setSuccess('Nombre actualizado correctamente.')
    } catch { setError('Error al actualizar el nombre.') }
    finally { setLoading(false) }
  }

  const handleEmail = async (e) => {
    e.preventDefault(); reset()
    setLoading(true)
    try {
      await updateEmail(newEmail, emailPass)
      setSuccess('Correo actualizado correctamente.')
      setNewEmail(''); setEmailPass('')
    } catch (err) {
      setError(err.message || 'Error al actualizar el correo.')
    } finally { setLoading(false) }
  }

  const handlePassword = async (e) => {
    e.preventDefault(); reset()
    if (newPass !== newPass2) { setError('Las contraseñas no coinciden.'); return }
    if (newPass.length < 8) { setError('Mínimo 8 caracteres.'); return }
    setLoading(true)
    try {
      await updatePassword(oldPass, newPass)
      setSuccess('Contraseña cambiada correctamente.')
      setOldPass(''); setNewPass(''); setNewPass2('')
    } catch (err) {
      setError(err.message || 'Contraseña actual incorrecta.')
    } finally { setLoading(false) }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handlePhoto = async (e) => {
    e.preventDefault(); reset()
    if (!photoPreview || photoPreview === user?.photo) return
    setLoading(true)
    try {
      await updatePhoto(photoPreview)
      setSuccess('Foto actualizada.')
    } catch { setError('Error al subir la foto.') }
    finally { setLoading(false) }
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Mi perfil</h2>
          <button className={styles.closeBtn} onClick={onClose}><XIcon /></button>
        </div>

        {/* Avatar + name top */}
        <div className={styles.topSection}>
          {photoPreview
            ? <img src={photoPreview} alt="" className={styles.avatarLg} />
            : <div className={styles.avatarLgText}>{initials}</div>
          }
          <div>
            <p className={styles.topName}>{user?.name}</p>
            <p className={styles.topEmail}>{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t, i) => (
            <button key={t} className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`} onClick={() => handleTab(i)}>
              {t}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {success && <div className={styles.successMsg}>{success}</div>}
          {error   && <div className={styles.errorMsg}>{error}</div>}

          {/* Tab 0: Información */}
          {tab === 0 && (
            <form className={styles.form} onSubmit={handleInfo}>
              <div className={styles.field}>
                <label>Nombre completo</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label>Correo electrónico</label>
                <input value={user?.email || ''} disabled className={styles.inputDisabled} />
                <span className={styles.hint}>Para cambiar el correo ve a la pestaña "Correo"</span>
              </div>
              <button className={styles.btnSave} type="submit" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          )}

          {/* Tab 1: Correo */}
          {tab === 1 && (
            <form className={styles.form} onSubmit={handleEmail}>
              <div className={styles.field}>
                <label>Correo actual</label>
                <input value={user?.email || ''} disabled className={styles.inputDisabled} />
              </div>
              <div className={styles.field}>
                <label>Nuevo correo</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="nuevo@correo.com" required />
              </div>
              <div className={styles.field}>
                <label>Confirmar con contraseña</label>
                <div className={styles.passWrap}>
                  <input type={showEP ? 'text' : 'password'} value={emailPass} onChange={e => setEmailPass(e.target.value)} placeholder="Tu contraseña actual" required />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowEP(p => !p)}><EyeIcon open={showEP} /></button>
                </div>
              </div>
              <button className={styles.btnSave} type="submit" disabled={loading}>
                {loading ? 'Actualizando…' : 'Cambiar correo'}
              </button>
            </form>
          )}

          {/* Tab 2: Contraseña */}
          {tab === 2 && (
            <form className={styles.form} onSubmit={handlePassword}>
              <div className={styles.field}>
                <label>Contraseña actual</label>
                <div className={styles.passWrap}>
                  <input type={showOP ? 'text' : 'password'} value={oldPass} onChange={e => setOldPass(e.target.value)} required />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowOP(p => !p)}><EyeIcon open={showOP} /></button>
                </div>
              </div>
              <div className={styles.field}>
                <label>Nueva contraseña</label>
                <div className={styles.passWrap}>
                  <input type={showNP ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 8 caracteres" required />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowNP(p => !p)}><EyeIcon open={showNP} /></button>
                </div>
              </div>
              <div className={styles.field}>
                <label>Confirmar nueva contraseña</label>
                <input type="password" value={newPass2} onChange={e => setNewPass2(e.target.value)} required />
              </div>
              <button className={styles.btnSave} type="submit" disabled={loading}>
                {loading ? 'Cambiando…' : 'Cambiar contraseña'}
              </button>
            </form>
          )}

          {/* Tab 3: Foto */}
          {tab === 3 && (
            <form className={styles.form} onSubmit={handlePhoto}>
              <div className={styles.photoSection}>
                {photoPreview
                  ? <img src={photoPreview} alt="" className={styles.photoPreview} />
                  : <div className={styles.photoPlaceholder}>{initials}</div>
                }
                <input ref={fileRef} type="file" accept="image/*" className={styles.fileInput} onChange={handleFileChange} />
                <button type="button" className={styles.btnSelectPhoto} onClick={() => fileRef.current?.click()}>
                  Seleccionar foto
                </button>
              </div>
              <button className={styles.btnSave} type="submit" disabled={loading || !photoPreview || photoPreview === user?.photo}>
                {loading ? 'Subiendo…' : 'Guardar foto'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
