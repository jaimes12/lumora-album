import { useState, useEffect } from 'react'
import { ventasApi } from '../api/ventasApi'
import styles from './VentasPage.module.css'

const COT_META = {
  approved: { label: 'Aprobada',  cls: 'approved' },
  signed:   { label: 'Aprobada',  cls: 'approved' },
  sent:     { label: 'Enviada',   cls: 'pending'  },
  pending:  { label: 'Pendiente', cls: 'pending'  },
  draft:    { label: 'Borrador',  cls: 'draft'    },
  cancelled:{ label: 'Cancelada', cls: 'draft'    },
}

const FAC_META = {
  paid:     { label: 'Pagada',    cls: 'paid'    },
  sent:     { label: 'Enviada',   cls: 'pending' },
  pending:  { label: 'Pendiente', cls: 'pending' },
  draft:    { label: 'Borrador',  cls: 'draft'   },
  overdue:  { label: 'Vencida',   cls: 'overdue' },
  cancelled:{ label: 'Cancelada', cls: 'draft'   },
}

export default function VentasPage() {
  const [ventas,  setVentas]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('cotizaciones')

  useEffect(() => {
    ventasApi.getAll()
      .then(setVentas)
      .catch(() => setVentas([]))
      .finally(() => setLoading(false))
  }, [])

  const cotizaciones = ventas.filter(v => v.tipo === 'quote')
  const facturas     = ventas.filter(v => v.tipo === 'invoice')
  const data         = tab === 'cotizaciones' ? cotizaciones : facturas
  const meta         = tab === 'cotizaciones' ? COT_META : FAC_META

  const totalAprobado = cotizaciones
    .filter(c => ['approved', 'signed'].includes(c.estado))
    .reduce((s, c) => s + c.totalNum, 0)

  const totalPagado = facturas
    .filter(f => f.estado === 'paid')
    .reduce((s, f) => s + f.totalNum, 0)

  const totalPendiente = facturas
    .filter(f => f.estado !== 'paid')
    .reduce((s, f) => s + f.totalNum, 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ventas</h1>
          <p className={styles.sub}>Cotizaciones y facturación</p>
        </div>
        <button className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva cotización
        </button>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Cotizaciones aprobadas</span>
          <span className={styles.summaryValue}>${totalAprobado.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{cotizaciones.filter(c => ['approved','signed'].includes(c.estado)).length} cotizaciones</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total cobrado</span>
          <span className={styles.summaryValue} style={{ color: '#34d399' }}>${totalPagado.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{facturas.filter(f => f.estado === 'paid').length} facturas pagadas</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pendiente de cobro</span>
          <span className={styles.summaryValue} style={{ color: '#fb923c' }}>${totalPendiente.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{facturas.filter(f => f.estado !== 'paid').length} facturas pendientes</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'cotizaciones' ? styles.tabActive : ''}`} onClick={() => setTab('cotizaciones')}>
          Cotizaciones <span className={styles.tabCount}>{cotizaciones.length}</span>
        </button>
        <button className={`${styles.tab} ${tab === 'facturas' ? styles.tabActive : ''}`} onClick={() => setTab('facturas')}>
          Facturas <span className={styles.tabCount}>{facturas.length}</span>
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>#</th><th>Cliente</th><th>Evento</th><th>Total</th><th>Estado</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Cargando…</td></tr>
            )}
            {!loading && data.map(item => {
              const m = meta[item.estado] ?? { label: item.estado, cls: 'draft' }
              return (
                <tr key={item.id} className={styles.row}>
                  <td className={styles.idCol}>{item.numero}</td>
                  <td className={styles.clienteCol}>{item.clienteNombre}</td>
                  <td className={styles.muted}>{item.evento || '—'}</td>
                  <td className={styles.totalCol}>{item.total}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${m.cls}`]}`}>{m.label}</span>
                  </td>
                  <td className={styles.muted}>{item.fecha}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.actionBtn} title="Ver">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className={styles.actionBtn} title="Descargar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && data.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:14 }}>
            Sin {tab} registradas
          </div>
        )}
      </div>
    </div>
  )
}
