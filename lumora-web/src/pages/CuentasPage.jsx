import { useState, useEffect, useCallback } from 'react'
import { accountsApi } from '../api/accountsApi'
import { viajesApi } from '../api/viajesApi'
import { useAuth } from '../context/AuthContext'
import styles from './CuentasPage.module.css'

const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n || 0)
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function CuentasPage() {
  const { user } = useAuth()
  const isTravel = user?.industry === 'travel'

  const [forbidden, setForbidden] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [activeId, setActiveId] = useState(null)

  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  const [trips, setTrips] = useState([])
  const [filters, setFilters] = useState({ from: '', to: '', tripId: '', type: '' })

  const [showNewAccount, setShowNewAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const [delAccountConfirm, setDelAccountConfirm] = useState(null)
  const [addingRow, setAddingRow] = useState(false)

  const active = accounts.find(a => a.id === activeId) ?? null

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    try {
      const data = await accountsApi.getAll()
      setAccounts(data)
      setActiveId(prev => prev ?? data[0]?.id ?? null)
    } catch (err) {
      if (String(err.message).includes('403')) setForbidden(true)
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => {
    if (isTravel) viajesApi.getAll().then(setTrips).catch(() => {})
  }, [isTravel])

  const loadEntries = useCallback(async () => {
    if (!activeId) { setEntries([]); return }
    setLoadingEntries(true)
    try {
      const data = await accountsApi.getEntries(activeId, filters)
      setEntries(data)
    } catch {} finally {
      setLoadingEntries(false)
    }
  }, [activeId, filters])

  useEffect(() => { loadEntries() }, [loadEntries])

  const refreshAccountTotals = async () => {
    try { setAccounts(await accountsApi.getAll()) } catch {}
  }

  // ── Cuentas ──────────────────────────────────────────────────────────────
  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (!newAccountName.trim()) return
    setSavingAccount(true)
    try {
      const acc = await accountsApi.create(newAccountName.trim())
      setAccounts(prev => [acc, ...prev])
      setActiveId(acc.id)
      setNewAccountName('')
      setShowNewAccount(false)
    } catch {} finally { setSavingAccount(false) }
  }

  const handleRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return }
    try {
      await accountsApi.rename(id, renameValue.trim())
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, nombre: renameValue.trim() } : a))
    } catch {}
    setRenamingId(null)
  }

  const handleDeleteAccount = async (id) => {
    try {
      await accountsApi.delete(id)
      setAccounts(prev => {
        const next = prev.filter(a => a.id !== id)
        if (activeId === id) setActiveId(next[0]?.id ?? null)
        return next
      })
    } catch {}
    setDelAccountConfirm(null)
  }

  // ── Movimientos ──────────────────────────────────────────────────────────
  const handleAddRow = async () => {
    if (!activeId || addingRow) return
    setAddingRow(true)
    try {
      const entry = await accountsApi.addEntry(activeId, {
        entryDate: new Date().toISOString(),
        concept: '',
        category: '',
        type: 'gasto',
        amount: 0,
        tripId: null,
        notes: '',
      })
      setEntries(prev => [entry, ...prev])
      refreshAccountTotals()
    } catch {} finally { setAddingRow(false) }
  }

  const handleFieldSave = async (entry, patch) => {
    const merged = { ...entry, ...patch }
    setEntries(prev => prev.map(e => e.id === entry.id ? merged : e))
    try {
      await accountsApi.updateEntry(activeId, entry.id, {
        entryDate: patch.fechaISO ? new Date(patch.fechaISO + 'T12:00:00').toISOString() : undefined,
        concept: patch.concepto,
        category: patch.categoria,
        type: patch.tipo,
        amount: patch.monto,
        tripId: patch.tripId === undefined ? undefined : (patch.tripId || null),
        clearTripId: patch.tripId === '' || patch.tripId === null,
        notes: patch.notas,
      })
      if (patch.tipo !== undefined || patch.monto !== undefined) refreshAccountTotals()
    } catch {}
  }

  const handleDeleteEntry = async (entry) => {
    setEntries(prev => prev.filter(e => e.id !== entry.id))
    try {
      await accountsApi.deleteEntry(activeId, entry.id)
      refreshAccountTotals()
    } catch {}
  }

  const totalIngresos = entries.filter(e => e.tipo === 'ingreso').reduce((s, e) => s + e.monto, 0)
  const totalGastos   = entries.filter(e => e.tipo === 'gasto').reduce((s, e) => s + e.monto, 0)
  const balance       = totalIngresos - totalGastos

  if (forbidden) {
    return (
      <div className={styles.page}>
        <div className={styles.forbidden}>
          <span className={styles.forbiddenIcon}>🔒</span>
          <h2>Solo administradores</h2>
          <p>Esta sección es privada para el administrador de la cuenta.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cuentas</h1>
          <p className={styles.sub}>Lleva tus cuentas de gastos e ingresos, tipo Excel. Solo tú la ves.</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Lista de cuentas ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <span>Mis cuentas</span>
            <button className={styles.addAccountBtn} onClick={() => setShowNewAccount(v => !v)} title="Nueva cuenta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          {showNewAccount && (
            <form className={styles.newAccountForm} onSubmit={handleCreateAccount}>
              <input
                autoFocus
                placeholder="Nombre de la cuenta"
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
              />
              <div className={styles.newAccountActions}>
                <button type="button" onClick={() => { setShowNewAccount(false); setNewAccountName('') }}>Cancelar</button>
                <button type="submit" disabled={savingAccount || !newAccountName.trim()}>Crear</button>
              </div>
            </form>
          )}

          {loadingAccounts ? (
            <p className={styles.emptyHint}>Cargando…</p>
          ) : accounts.length === 0 ? (
            <p className={styles.emptyHint}>Crea tu primera cuenta para empezar.</p>
          ) : (
            <div className={styles.accountList}>
              {accounts.map(a => (
                <div key={a.id} className={`${styles.accountItem} ${a.id === activeId ? styles.accountItemActive : ''}`}>
                  {renamingId === a.id ? (
                    <input
                      autoFocus
                      className={styles.renameInput}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(a.id)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(a.id); if (e.key === 'Escape') setRenamingId(null) }}
                    />
                  ) : (
                    <button className={styles.accountBtn} onClick={() => setActiveId(a.id)}>
                      <span className={styles.accountName}>{a.nombre}</span>
                      <span className={styles.accountBalance} style={{ color: a.balance >= 0 ? '#16a34a' : '#dc2626' }}>
                        {fmtMoney(a.balance)}
                      </span>
                    </button>
                  )}
                  <div className={styles.accountItemActions}>
                    <button
                      className={styles.iconBtn}
                      title="Renombrar"
                      onClick={() => { setRenamingId(a.id); setRenameValue(a.nombre) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className={styles.iconBtn} title="Eliminar" onClick={() => setDelAccountConfirm(a)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Hoja de la cuenta activa ── */}
        <div className={styles.sheet}>
          {!active ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📒</span>
              <p>Crea una cuenta para empezar a registrar movimientos.</p>
            </div>
          ) : (
            <>
              <div className={styles.summaryRow}>
                <div className={styles.summaryStat}>
                  <span className={styles.summaryLbl}>Ingresos</span>
                  <span className={styles.summaryVal} style={{ color: '#16a34a' }}>{fmtMoney(totalIngresos)}</span>
                </div>
                <div className={styles.summaryStat}>
                  <span className={styles.summaryLbl}>Gastos</span>
                  <span className={styles.summaryVal} style={{ color: '#dc2626' }}>{fmtMoney(totalGastos)}</span>
                </div>
                <div className={styles.summaryStat}>
                  <span className={styles.summaryLbl}>Balance</span>
                  <span className={styles.summaryVal} style={{ color: balance >= 0 ? '#16a34a' : '#dc2626' }}>{fmtMoney(balance)}</span>
                </div>
              </div>

              <div className={styles.filtersRow}>
                <div className={styles.filterField}>
                  <label>Desde</label>
                  <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
                </div>
                <div className={styles.filterField}>
                  <label>Hasta</label>
                  <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
                </div>
                {isTravel && (
                  <div className={styles.filterField}>
                    <label>Viaje</label>
                    <select value={filters.tripId} onChange={e => setFilters(f => ({ ...f, tripId: e.target.value }))}>
                      <option value="">Todos</option>
                      {trips.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                )}
                <div className={styles.filterField}>
                  <label>Tipo</label>
                  <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                    <option value="">Todos</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                  </select>
                </div>
                {(filters.from || filters.to || filters.tripId || filters.type) && (
                  <button className={styles.clearFiltersBtn} onClick={() => setFilters({ from: '', to: '', tripId: '', type: '' })}>
                    Limpiar filtros
                  </button>
                )}
                <button className={styles.addRowBtn} onClick={handleAddRow} disabled={addingRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Agregar movimiento
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.colDate}>Fecha</th>
                      <th className={styles.colConcept}>Concepto</th>
                      <th className={styles.colCategory}>Categoría</th>
                      <th className={styles.colType}>Tipo</th>
                      {isTravel && <th className={styles.colTrip}>Viaje</th>}
                      <th className={styles.colAmount}>Monto</th>
                      <th className={styles.colNotes}>Notas</th>
                      <th className={styles.colActions}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEntries ? (
                      <tr><td colSpan={8} className={styles.emptyCell}>Cargando…</td></tr>
                    ) : entries.length === 0 ? (
                      <tr><td colSpan={8} className={styles.emptyCell}>Sin movimientos. Da clic en "Agregar movimiento".</td></tr>
                    ) : (
                      entries.map(entry => (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          trips={trips}
                          isTravel={isTravel}
                          onSave={handleFieldSave}
                          onDelete={() => handleDeleteEntry(entry)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {delAccountConfirm && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setDelAccountConfirm(null)}>
          <div className={styles.confirmModal}>
            <h3>¿Eliminar "{delAccountConfirm.nombre}"?</h3>
            <p>Se eliminarán todos sus movimientos. Esta acción no se puede deshacer.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setDelAccountConfirm(null)}>Cancelar</button>
              <button className={styles.dangerBtn} onClick={() => handleDeleteAccount(delAccountConfirm.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EntryRow({ entry, trips, isTravel, onSave, onDelete }) {
  const [local, setLocal] = useState(entry)
  useEffect(() => { setLocal(entry) }, [entry])

  const commit = (field, value) => {
    setLocal(prev => ({ ...prev, [field]: value }))
    if (value === entry[field]) return
    onSave(entry, { [field]: value })
  }

  return (
    <tr className={styles.row}>
      <td className={styles.colDate}>
        <input
          type="date"
          className={styles.cellInput}
          value={local.fechaISO}
          onChange={e => setLocal(prev => ({ ...prev, fechaISO: e.target.value }))}
          onBlur={e => commit('fechaISO', e.target.value)}
        />
      </td>
      <td className={styles.colConcept}>
        <input
          className={styles.cellInput}
          placeholder="Ej: Hotel, boletos…"
          value={local.concepto}
          onChange={e => setLocal(prev => ({ ...prev, concepto: e.target.value }))}
          onBlur={e => commit('concepto', e.target.value)}
        />
      </td>
      <td className={styles.colCategory}>
        <input
          className={styles.cellInput}
          placeholder="Categoría"
          value={local.categoria}
          onChange={e => setLocal(prev => ({ ...prev, categoria: e.target.value }))}
          onBlur={e => commit('categoria', e.target.value)}
        />
      </td>
      <td className={styles.colType}>
        <select
          className={`${styles.cellSelect} ${local.tipo === 'ingreso' ? styles.typeIngreso : styles.typeGasto}`}
          value={local.tipo}
          onChange={e => commit('tipo', e.target.value)}
        >
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
      </td>
      {isTravel && (
        <td className={styles.colTrip}>
          <select
            className={styles.cellSelect}
            value={local.tripId ?? ''}
            onChange={e => commit('tripId', e.target.value)}
          >
            <option value="">—</option>
            {trips.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </td>
      )}
      <td className={styles.colAmount}>
        <input
          type="number" step="0.01"
          className={`${styles.cellInput} ${styles.cellAmount}`}
          value={local.monto}
          onChange={e => setLocal(prev => ({ ...prev, monto: e.target.value }))}
          onBlur={e => commit('monto', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className={styles.colNotes}>
        <input
          className={styles.cellInput}
          placeholder="Notas"
          value={local.notas}
          onChange={e => setLocal(prev => ({ ...prev, notas: e.target.value }))}
          onBlur={e => commit('notas', e.target.value)}
        />
      </td>
      <td className={styles.colActions}>
        <button className={styles.deleteRowBtn} onClick={onDelete} title="Eliminar movimiento">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </td>
    </tr>
  )
}
