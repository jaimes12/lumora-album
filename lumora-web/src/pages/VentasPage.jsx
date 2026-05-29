import { useState } from 'react'
import styles from './VentasPage.module.css'

const COTIZACIONES = [
  { id: 'COT-001', cliente: 'Fernanda García', evento: 'Boda García & Ruiz', total: '$85,000', estado: 'approved', fecha: '01 Jun 2026' },
  { id: 'COT-002', cliente: 'Carlos Mendoza', evento: 'Corporativo Telmex Q3', total: '$42,000', estado: 'pending', fecha: '03 Jun 2026' },
  { id: 'COT-003', cliente: 'Ana López', evento: 'XV Años Sofía', total: '$67,500', estado: 'approved', fecha: '05 Jun 2026' },
  { id: 'COT-004', cliente: 'Roberto Sánchez', evento: 'Graduación ITESM', total: '$28,000', estado: 'draft', fecha: '07 Jun 2026' },
  { id: 'COT-005', cliente: 'Valeria Torres', evento: 'Boda Torres & Medina', total: '$110,000', estado: 'pending', fecha: '10 Jun 2026' },
  { id: 'COT-006', cliente: 'Diego Ramírez', evento: 'Lanzamiento InnovaTech', total: '$35,500', estado: 'draft', fecha: '12 Jun 2026' },
]

const FACTURAS = [
  { id: 'FAC-001', cliente: 'Fernanda García', evento: 'Boda García & Ruiz', total: '$85,000', estado: 'paid', fecha: '14 Jun 2026' },
  { id: 'FAC-002', cliente: 'Carlos Mendoza', evento: 'Evento Corporativo Q2', total: '$55,000', estado: 'paid', fecha: '20 May 2026' },
  { id: 'FAC-003', cliente: 'Ana López', evento: 'XV Años Sofía', total: '$67,500', estado: 'overdue', fecha: '22 Jun 2026' },
  { id: 'FAC-004', cliente: 'Mónica Reyes', evento: 'Bautizo Sebastián', total: '$18,500', estado: 'pending', fecha: '08 Jul 2026' },
  { id: 'FAC-005', cliente: 'Héctor Villanueva', evento: 'Evento Corporativo Q1', total: '$72,000', estado: 'paid', fecha: '15 Mar 2026' },
]

const COT_META = {
  approved: { label: 'Aprobada',  cls: 'approved' },
  pending:  { label: 'Pendiente', cls: 'pending'  },
  draft:    { label: 'Borrador',  cls: 'draft'    },
}

const FAC_META = {
  paid:    { label: 'Pagada',   cls: 'paid'    },
  pending: { label: 'Pendiente', cls: 'pending' },
  overdue: { label: 'Vencida',  cls: 'overdue' },
}

export default function VentasPage() {
  const [tab, setTab] = useState('cotizaciones')

  const data = tab === 'cotizaciones' ? COTIZACIONES : FACTURAS
  const meta = tab === 'cotizaciones' ? COT_META : FAC_META

  const totalAprobado = COTIZACIONES
    .filter(c => c.estado === 'approved')
    .reduce((s, c) => s + parseInt(c.total.replace(/[$,]/g, '')), 0)

  const totalPagado = FACTURAS
    .filter(f => f.estado === 'paid')
    .reduce((s, f) => s + parseInt(f.total.replace(/[$,]/g, '')), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ventas</h1>
          <p className={styles.sub}>Cotizaciones y facturación del mes</p>
        </div>
        <button className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva cotización
        </button>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Cotizaciones aprobadas</span>
          <span className={styles.summaryValue}>${totalAprobado.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{COTIZACIONES.filter(c => c.estado === 'approved').length} cotizaciones</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total cobrado</span>
          <span className={styles.summaryValue} style={{ color: '#34d399' }}>${totalPagado.toLocaleString('es-MX')}</span>
          <span className={styles.summaryMeta}>{FACTURAS.filter(f => f.estado === 'paid').length} facturas pagadas</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pendiente de cobro</span>
          <span className={styles.summaryValue} style={{ color: '#fb923c' }}>
            ${FACTURAS.filter(f => f.estado !== 'paid').reduce((s, f) => s + parseInt(f.total.replace(/[$,]/g, '')), 0).toLocaleString('es-MX')}
          </span>
          <span className={styles.summaryMeta}>{FACTURAS.filter(f => f.estado !== 'paid').length} facturas pendientes</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'cotizaciones' ? styles.tabActive : ''}`}
          onClick={() => setTab('cotizaciones')}
        >
          Cotizaciones
          <span className={styles.tabCount}>{COTIZACIONES.length}</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'facturas' ? styles.tabActive : ''}`}
          onClick={() => setTab('facturas')}
        >
          Facturas
          <span className={styles.tabCount}>{FACTURAS.length}</span>
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              const m = meta[item.estado]
              return (
                <tr key={item.id} className={styles.row}>
                  <td className={styles.idCol}>{item.id}</td>
                  <td className={styles.clienteCol}>{item.cliente}</td>
                  <td className={styles.muted}>{item.evento}</td>
                  <td className={styles.totalCol}>{item.total}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${m.cls}`]}`}>
                      {m.label}
                    </span>
                  </td>
                  <td className={styles.muted}>{item.fecha}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.actionBtn} title="Ver">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className={styles.actionBtn} title="Descargar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
