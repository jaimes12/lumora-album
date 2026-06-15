import { useState, useEffect } from 'react'
import { orgSettingsApi } from '../api/orgSettingsApi'
import styles from './ConfigPage.module.css'

const EMPTY = { companyName: '', rfc: '', directorName: '', phone: '', email: '', city: '', address: '' }

export default function ConfigPage() {
  const [form,    setForm]    = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    orgSettingsApi.get()
      .then(d => setForm({ ...EMPTY, ...d }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await orgSettingsApi.update(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración</h1>
          <p className={styles.sub}>Datos de tu empresa — aparecen en los contratos generados</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando…</div>
      ) : (
        <form className={styles.card} onSubmit={handleSave}>
          <div className={styles.sectionTitle}>Información de la empresa</div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Razón social</label>
              <input
                placeholder="Elixe Events S.A. de C.V."
                value={form.companyName}
                onChange={set('companyName')}
              />
            </div>
            <div className={styles.field}>
              <label>RFC</label>
              <input
                placeholder="LES210601AB3"
                value={form.rfc}
                onChange={set('rfc')}
              />
            </div>
            <div className={styles.field}>
              <label>Director / Representante legal</label>
              <input
                placeholder="Nombre completo"
                value={form.directorName}
                onChange={set('directorName')}
              />
            </div>
            <div className={styles.field}>
              <label>Teléfono</label>
              <input
                placeholder="+52 55 1234 5678"
                value={form.phone}
                onChange={set('phone')}
              />
            </div>
            <div className={styles.field}>
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="contacto@tuempresa.mx"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <div className={styles.field}>
              <label>Ciudad</label>
              <input
                placeholder="Ciudad de México"
                value={form.city}
                onChange={set('city')}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Domicilio fiscal</label>
              <input
                placeholder="Av. Insurgentes Sur 1234, Col. Del Valle, CDMX"
                value={form.address}
                onChange={set('address')}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            {saved && <span className={styles.savedMsg}>Guardado correctamente</span>}
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
