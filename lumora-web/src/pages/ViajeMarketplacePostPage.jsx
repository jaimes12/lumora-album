import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { viajesApi } from '../api/viajesApi'
import styles from './ViajeMarketplacePostPage.module.css'

const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

export default function ViajeMarketplacePostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [viaje, setViaje] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [publico, setPublico] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [incluye, setIncluye] = useState([])
  const [nuevoIncluye, setNuevoIncluye] = useState('')
  const [savingContent, setSavingContent] = useState(false)
  const [savedAt, setSavedAt] = useState(null)

  const [fotos, setFotos] = useState([])
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await viajesApi.getById(id)
      setViaje(data)
      setPublico(data.publico)
      setTitulo(data.tituloPost)
      setDescripcion(data.descripcion)
      setIncluye(data.incluye ? data.incluye.split('\n').filter(Boolean) : [])
      setFotos(data.fotos)
    } catch {
      setError('No se pudo cargar el viaje')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  const handleToggle = async () => {
    setSavingToggle(true)
    try {
      const updated = await viajesApi.update(id, { isPublic: !publico })
      setPublico(updated.publico)
    } catch {}
    finally { setSavingToggle(false) }
  }

  const handleSaveContent = async () => {
    setSavingContent(true); setError('')
    try {
      const updated = await viajesApi.update(id, {
        postTitle: titulo,
        description: descripcion,
        includes: incluye.join('\n'),
      })
      setTitulo(updated.tituloPost)
      setDescripcion(updated.descripcion)
      setIncluye(updated.incluye ? updated.incluye.split('\n').filter(Boolean) : [])
      setSavedAt(Date.now())
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSavingContent(false)
    }
  }

  const addIncluye = () => {
    const v = nuevoIncluye.trim()
    if (!v) return
    setIncluye(prev => [...prev, v])
    setNuevoIncluye('')
  }

  const removeIncluye = (idx) => {
    setIncluye(prev => prev.filter((_, i) => i !== idx))
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true); setError('')
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const base64 = dataUrl.split(',')[1]
      const photo = await viajesApi.addPhoto(id, { imageData: base64 })
      setFotos(prev => [...prev, { id: photo.id, url: photo.url, caption: photo.caption, orden: photo.sortOrder }])
    } catch (err) {
      setError(err.message || 'No se pudo subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    try {
      await viajesApi.deletePhoto(id, photoId)
      setFotos(prev => prev.filter(f => f.id !== photoId))
    } catch {}
  }

  const movePhoto = async (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= fotos.length) return
    const next = [...fotos]
    ;[next[index], next[target]] = [next[target], next[index]]
    setFotos(next)
    try {
      await viajesApi.reorderPhotos(id, next.map(f => f.id))
    } catch {}
  }

  if (loading) return <div className={styles.stateWrap}>Cargando…</div>
  if (error && !viaje) return <div className={styles.stateWrap}>{error}</div>

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(`/app/viajes/${id}`)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        {viaje.nombre}
      </button>

      <div className={styles.header}>
        <div>
          <span className={styles.headerDestino}>{viaje.destino}</span>
          <h1 className={styles.headerTitle}>Publicación de marketplace</h1>
          <div className={styles.headerMeta}>
            {viaje.salida} → {viaje.regreso} · {fmtMoney(viaje.precioPorPersona)} / persona · {viaje.asientosTotal} cupos
          </div>
        </div>
        {publico && (
          <a href={`/viajes/market/${id}`} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
            Ver publicación ↗
          </a>
        )}
      </div>

      <div className={styles.toggleRow}>
        <label className={styles.switch}>
          <input type="checkbox" checked={publico} disabled={savingToggle} onChange={handleToggle} />
          <span className={styles.switchSlider} />
        </label>
        <div>
          <p className={styles.toggleLabel}>{publico ? 'Publicado en el marketplace' : 'Publicar en el marketplace'}</p>
          <p className={styles.toggleSub}>Gratis con tu cuenta. Cualquiera podrá ver este viaje en /viajes/market y contactarte.</p>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.fieldLabel}>Título de la publicación</label>
        <input
          className={styles.input}
          placeholder={viaje.nombre}
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
        />

        <label className={styles.fieldLabel} style={{ marginTop: 18 }}>Descripción</label>
        <textarea
          className={styles.textarea}
          rows={5}
          placeholder="Cuéntale a los viajeros qué hace especial este viaje: itinerario, hospedaje, transporte…"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
        />

        <label className={styles.fieldLabel} style={{ marginTop: 18 }}>Qué incluye</label>
        <div className={styles.includeList}>
          {incluye.map((item, i) => (
            <div key={i} className={styles.includeItem}>
              <span>{item}</span>
              <button type="button" onClick={() => removeIncluye(i)}>×</button>
            </div>
          ))}
        </div>
        <div className={styles.includeAddRow}>
          <input
            className={styles.input}
            placeholder="Ej: Hotel 4 estrellas"
            value={nuevoIncluye}
            onChange={e => setNuevoIncluye(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIncluye() } }}
          />
          <button type="button" className={styles.btnSecondary} onClick={addIncluye}>Agregar</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.saveRow}>
          <button type="button" className={styles.btnPrimary} onClick={handleSaveContent} disabled={savingContent}>
            {savingContent ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {savedAt && !savingContent && <span className={styles.savedNote}>Guardado ✓</span>}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.fieldLabel}>Fotos</label>
        <p className={styles.fieldHint}>La primera foto es la portada. Usa las flechas para reordenar.</p>
        <div className={styles.photoGrid}>
          {fotos.map((f, i) => (
            <div key={f.id} className={styles.photoCard}>
              <img src={f.url} alt="" />
              {i === 0 && <span className={styles.photoCover}>Portada</span>}
              <button type="button" className={styles.photoDelete} onClick={() => handleDeletePhoto(f.id)}>×</button>
              <div className={styles.photoOrderBtns}>
                <button type="button" disabled={i === 0} onClick={() => movePhoto(i, -1)}>‹</button>
                <button type="button" disabled={i === fotos.length - 1} onClick={() => movePhoto(i, 1)}>›</button>
              </div>
            </div>
          ))}
          <label className={styles.photoAdd}>
            {uploading ? '…' : '+'}
            <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
          </label>
        </div>
      </div>
    </div>
  )
}
