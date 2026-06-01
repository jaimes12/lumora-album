import { useState, useEffect } from 'react'
import { clientesApi } from '../api/clientesApi'
import styles from './ClientesPage.module.css'

const ETAPA_META = {
  lead:     { label: 'Lead',      cls: 'lead'     },
  prospect: { label: 'Prospecto', cls: 'prospect' },
  client:   { label: 'Cliente',   cls: 'client'   },
  vip:      { label: 'VIP',       cls: 'vip'      },
}

export default function ClientesPage() {
  const [clientes,     setClientes]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState(null)
  const [filterEtapa,  setFilterEtapa]  = useState('todos')

  useEffect(() => {
    clientesApi.getAll()
      .then(setClientes)
      .catch(() => setClientes([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.nombre.toLowerCase().includes(q) ||
      (c.empresa || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    const matchEtapa = filterEtapa === 'todos' || c.etapa === filterEtapa
    return matchSearch && matchEtapa
  })

  const ultimoContacto = (c) => {
    if (!c.ultimoContacto) return 'Sin contacto'
    return new Date(c.ultimoContacto).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.sub}>{clientes.length} clientes en tu CRM</p>
        </div>
        <button className={styles.btnPrimary}>
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
              {!loading && filtered.map(c => {
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
        </div>

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
              <div className={styles.drawerActions}>
                <button className={styles.btnPrimary}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Enviar mensaje
                </button>
                <button className={styles.btnSecondary}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
