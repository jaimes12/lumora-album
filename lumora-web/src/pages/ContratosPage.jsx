import { useState, useRef, useEffect } from 'react'
import styles from './ContratosPage.module.css'
import { fmt } from '../data/eventosData'
import { contratosApi } from '../api/contratosApi'
import { clientesApi } from '../api/clientesApi'
import { eventosApi } from '../api/eventosApi'
import logoFull from '../assets/elixe-logo.png'

/* ─── Contract templates ──────────────────────────────────── */
const TEMPLATES = [
  {
    id: 'boda',
    emoji: '💍',
    nombre: 'Boda',
    desc: 'Contrato completo para servicios de organización de boda. Incluye cláusulas de cancelación, penalizaciones y pagos.',
    color: '#f472b6',
    serviciosDefault: ['Coordinación general del evento','Decoración floral y ambientación','Servicio de banquetes y catering','Fotografía y video','DJ y sonido profesional','Iluminación especial'],
  },
  {
    id: 'corporativo',
    emoji: '🏢',
    nombre: 'Corporativo',
    desc: 'Contrato para eventos empresariales, conferencias y lanzamientos de producto. Términos corporativos.',
    color: '#38bdf8',
    serviciosDefault: ['Logística y coordinación general','Montaje de escenario y equipo audiovisual','Servicio de coffee break y catering','Registro y acreditación de asistentes','Material impreso y señalética'],
  },
  {
    id: 'xv',
    emoji: '🌸',
    nombre: 'XV Años',
    desc: 'Contrato especializado para quinceañeras. Incluye cláusulas para vals, chambelanes y protocolo.',
    color: '#a78bfa',
    serviciosDefault: ['Coordinación integral del evento','Decoración temática personalizada','Servicio de banquete completo','Fotografía y video profesional','DJ y pista de baile','Pastel de quinceañera','Coordinación de vals y chambelanes'],
  },
]

/* ─── Saved contracts (mock) ──────────────────────────────── */
const CONTRATOS_INIT = [
  { id: 'ct1', template: 'boda',       cliente: 'Fernanda García', evento: 'Boda García & Ruiz', fecha: '10 Ene 2026', estado: 'firmado',  total: '$85,000' },
  { id: 'ct2', template: 'corporativo',cliente: 'Carlos Mendoza',  evento: 'Corporativo Telmex', fecha: '15 Feb 2026', estado: 'enviado',  total: '$42,000' },
  { id: 'ct3', template: 'xv',         cliente: 'Ana López',        evento: 'XV Años Sofía',      fecha: '1 Mar 2026',  estado: 'borrador', total: '$67,500' },
]

const ESTADO_COLOR = {
  firmado:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  enviado:  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  borrador: { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

/* ─── Contract renderer ───────────────────────────────────── */
function buildContract(template, form) {
  const hoy    = new Date()
  const fecha  = form.fechaFirma || hoy.toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })
  const ciudad = 'Ciudad de México'
  const empresa = 'Elixe Events S.A. de C.V.'
  const rfc    = 'LES210601AB3'

  const clausulas = {
    boda: [
      { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato tiene por objeto la prestación de servicios profesionales de organización y coordinación del evento de boda a celebrarse el día ${form.fechaEvento || '[FECHA DEL EVENTO]'}, en el inmueble denominado "${form.venue || '[VENUE]'}", con una asistencia estimada de ${form.invitados || '[N]'} personas.` },
      { titulo: 'SERVICIOS INCLUIDOS', lista: form.servicios },
      { titulo: 'MONTO Y FORMA DE PAGO', texto: `El monto total por los servicios contratados asciende a la cantidad de ${form.total || '[MONTO TOTAL]'} (${form.totalLetras || 'MONTO EN LETRAS'}) M.N., los cuales serán cubiertos de la siguiente manera:\n\n• Anticipo del ${form.pctAnticipo || '50'}% al momento de la firma del presente contrato: ${form.anticipo || '[ANTICIPO]'}\n• Liquidación del saldo restante a más tardar ${form.diasLiquidacion || '15'} días naturales antes de la fecha del evento: ${form.liquidacion || '[SALDO]'}\n\nEl pago podrá realizarse mediante transferencia bancaria, depósito o cheque certificado a nombre de ${empresa}.` },
      { titulo: 'OBLIGACIONES DE EL PRESTADOR', lista: ['Asignar un coordinador de bodas certificado como responsable directo del evento','Coordinar a todos los proveedores contratados antes y durante el evento','Realizar un mínimo de tres reuniones de seguimiento previas al evento','Estar presente desde el montaje hasta la conclusión del evento','Entregar un cronograma detallado del evento con 30 días de anticipación','Gestionar permisos y logística necesaria para el desarrollo del evento'] },
      { titulo: 'OBLIGACIONES DE EL CONTRATANTE', lista: ['Proporcionar la información necesaria para la planeación del evento en los tiempos acordados','Realizar los pagos conforme al calendario establecido en la cláusula tercera','Notificar cualquier cambio en la lista de invitados con al menos 30 días de anticipación','Respetar los tiempos y condiciones del venue acordadas','Designar un representante autorizado para la toma de decisiones'] },
      { titulo: 'CANCELACIONES Y PENALIZACIONES', texto: `En caso de cancelación del evento por parte de EL CONTRATANTE, se aplicarán los siguientes cargos:\n\n• Cancelación con más de 90 días de anticipación: retención del 20% del anticipo\n• Cancelación entre 60 y 90 días antes del evento: retención del 50% del anticipo\n• Cancelación entre 30 y 60 días antes del evento: retención del 75% del anticipo\n• Cancelación con menos de 30 días de anticipación: pérdida total del anticipo\n\nEn caso de cancelación por causas imputables a EL PRESTADOR, se devolverá el 100% de los pagos realizados más un 10% adicional como penalización.` },
      { titulo: 'CASO FORTUITO O FUERZA MAYOR', texto: 'Ninguna de las partes será responsable por incumplimiento de sus obligaciones cuando dicho incumplimiento sea consecuencia directa de caso fortuito o fuerza mayor, incluyendo pero no limitado a: desastres naturales, actos de autoridad, pandemias declaradas oficialmente o cualquier otro evento fuera del control razonable de las partes. En tales casos, las partes acordarán de buena fe una nueva fecha para la celebración del evento.' },
      { titulo: 'CONFIDENCIALIDAD', texto: 'Las partes se obligan a guardar la más estricta confidencialidad respecto de la información que intercambien en virtud del presente contrato, incluyendo datos personales, información financiera y detalles del evento, de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.' },
      { titulo: 'JURISDICCIÓN Y LEGISLACIÓN APLICABLE', texto: `Para la interpretación y cumplimiento del presente contrato, las partes se someten expresamente a la jurisdicción de los Tribunales competentes de ${ciudad}, renunciando al fuero que pudiera corresponderles por razón de su domicilio presente o futuro, siendo aplicable la legislación del Estado correspondiente.` },
    ],
    corporativo: [
      { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato regula la prestación de servicios profesionales de organización para el evento corporativo denominado "${form.nombreEvento || '[NOMBRE DEL EVENTO]'}", a realizarse el ${form.fechaEvento || '[FECHA]'} en "${form.venue || '[VENUE]'}", con capacidad para ${form.invitados || '[N]'} asistentes.` },
      { titulo: 'SERVICIOS CONTRATADOS', lista: form.servicios },
      { titulo: 'INVERSIÓN Y CONDICIONES DE PAGO', texto: `La inversión total para la realización del evento es de ${form.total || '[MONTO]'} M.N., con las siguientes condiciones:\n\n• 40% de anticipo a la firma del contrato: ${form.anticipo || '[ANTICIPO]'}\n• 40% a 30 días del evento\n• 20% al cierre del evento con conformidad del cliente\n\nLa empresa emisora de factura es ${empresa}, RFC ${rfc}.` },
      { titulo: 'COORDINACIÓN Y COMUNICACIÓN', lista: ['Se asignará un Project Manager exclusivo para el evento','Reportes de avance semanales vía correo electrónico','Disponibilidad telefónica 24/7 durante los 3 días previos al evento','Reunión de briefing final 72 horas antes del evento'] },
      { titulo: 'PROPIEDAD INTELECTUAL Y USO DE IMAGEN', texto: `${empresa} podrá utilizar imágenes y material audiovisual del evento con fines de portafolio y marketing, salvo indicación expresa en contrario por parte de EL CONTRATANTE, quien deberá notificarlo por escrito antes de la firma del presente documento.` },
      { titulo: 'CANCELACIONES', texto: `Cancelación con más de 60 días: cargo del 25% del total. Entre 30 y 60 días: 50% del total. Menos de 30 días: 75% del total. En caso de suspensión por causa gubernamental o de fuerza mayor debidamente acreditada, se reprogramará sin costo adicional.` },
      { titulo: 'PROTECCIÓN DE DATOS', texto: `Conforme a la LFPDPPP, ${empresa} se compromete al tratamiento confidencial de los datos personales proporcionados por EL CONTRATANTE, utilizándolos únicamente para la prestación de los servicios objeto de este contrato.` },
      { titulo: 'LEGISLACIÓN APLICABLE', texto: `Las partes se someten a los tribunales competentes de ${ciudad} para cualquier controversia derivada del presente instrumento.` },
    ],
    xv: [
      { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato tiene por objeto la organización y coordinación integral de la celebración de Quinceañera de la señorita ${form.nombreFestejada || '[NOMBRE DE LA FESTEJADA]'}, a celebrarse el ${form.fechaEvento || '[FECHA]'} en "${form.venue || '[VENUE]'}", con una asistencia de ${form.invitados || '[N]'} invitados.` },
      { titulo: 'PAQUETE DE SERVICIOS', lista: form.servicios },
      { titulo: 'COSTO TOTAL Y PAGOS', texto: `El costo total del paquete de servicios es de ${form.total || '[MONTO]'} M.N., distribuido de la siguiente forma:\n\n• Anticipo de reservación (${form.pctAnticipo || '30'}%): ${form.anticipo || '[ANTICIPO]'} — a la firma del contrato\n• Segundo pago (40%): a 60 días naturales del evento\n• Liquidación (${100 - parseInt(form.pctAnticipo || 30) - 40}%): a 15 días del evento` },
      { titulo: 'COORDINACIÓN DE VALS Y CHAMBELANES', texto: `El servicio incluye hasta ${form.chambelanes || '14'} chambelanes coordinados por nuestro equipo. Se realizarán dos ensayos previos al evento en fechas a coordinar. La música para el vals deberá ser seleccionada con al menos 45 días de anticipación para su preparación técnica.` },
      { titulo: 'PERSONALIZACIÓN DEL EVENTO', lista: ['Reunión de diseño de concepto y temática sin costo','Moodboard y presentación de propuesta visual','Acompañamiento en selección de vestido y accesorios (consultoría)','Coordinación con la iglesia o lugar de ceremonia religiosa','Mesa de dulces o candy bar personalizada según temática'] },
      { titulo: 'CANCELACIONES Y REEMBOLSOS', texto: `Por tratarse de un evento de carácter especial y único, las políticas de cancelación son las siguientes:\n\n• Más de 180 días: reembolso del 80% del anticipo\n• Entre 90 y 180 días: reembolso del 50%\n• Entre 30 y 90 días: reembolso del 25%\n• Menos de 30 días: sin reembolso\n\nCambios de fecha están sujetos a disponibilidad y sin costo adicional con 60 días de anticipación.` },
      { titulo: 'FOTOGRAFÍA Y VIDEO', texto: 'El servicio de fotografía incluye sesión previa (trash the dress o sesión de compromiso) y cobertura completa del evento. La entrega digital se realizará en un plazo máximo de 45 días naturales posteriores al evento mediante galería en línea privada.' },
      { titulo: 'LEGISLACIÓN Y JURISDICCIÓN', texto: `Ambas partes acuerdan someterse a los tribunales de ${ciudad} para cualquier controversia, aplicándose la legislación civil vigente.` },
    ],
  }

  return clausulas[template.id] || clausulas.boda
}

/* ─── Contract preview component ─────────────────────────── */
function ContractPreview({ template, form, contratoRef }) {
  const clausulas = buildContract(template, form)
  const hoy = new Date()
  const fechaFormato = hoy.toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })
  const numContrato = `LM-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`

  return (
    <div className={styles.preview} ref={contratoRef}>
      {/* Letterhead */}
      <div className={styles.letterhead}>
        <div className={styles.letterheadLeft}>
          <img src={logoFull} alt="Elixe Events" className={styles.letterheadLogoImg} />
        </div>
        <div className={styles.letterheadRight}>
          <div className={styles.letterheadData}>RFC: LES210601AB3</div>
          <div className={styles.letterheadData}>Tel: +52 55 1234 5678</div>
          <div className={styles.letterheadData}>contacto@lumora.mx</div>
        </div>
      </div>

      <div className={styles.letterheadLine} />

      {/* Title */}
      <div className={styles.contractTitleBlock}>
        <div className={styles.contractNum}>No. {numContrato}</div>
        <h1 className={styles.contractTitle}>
          CONTRATO DE PRESTACIÓN DE SERVICIOS
          {template.id === 'boda' && ' DE ORGANIZACIÓN DE BODA'}
          {template.id === 'corporativo' && ' PARA EVENTO CORPORATIVO'}
          {template.id === 'xv' && ' DE ORGANIZACIÓN DE QUINCEAÑERA'}
        </h1>
        <div className={styles.contractDate}>
          Celebrado en {form.ciudad || 'Ciudad de México'}, a los {fechaFormato}
        </div>
      </div>

      {/* Parties */}
      <div className={styles.parties}>
        <div className={styles.partiesTitle}>COMPARECIENTES</div>
        <div className={styles.partyBlock}>
          <span className={styles.partyLabel}>EL CONTRATANTE:</span>
          <span className={styles.partyValue}>
            {form.clienteNombre || '[NOMBRE DEL CLIENTE]'}{form.clienteRFC ? `, RFC: ${form.clienteRFC}` : ''}, con domicilio en {form.domicilioCliente || '[DOMICILIO]'}, a quien en lo sucesivo se le denominará <strong>"EL CONTRATANTE"</strong>.
          </span>
        </div>
        <div className={styles.partyBlock}>
          <span className={styles.partyLabel}>EL PRESTADOR:</span>
          <span className={styles.partyValue}>
            <strong>ELIXE EVENTS S.A. de C.V.</strong>, RFC LES210601AB3, con domicilio en Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, representada por el C. <strong>Angel Jaimes</strong> en su carácter de Director General, a quien en lo sucesivo se le denominará <strong>"EL PRESTADOR"</strong>.
          </span>
        </div>
        <div className={styles.partiesDecl}>
          Ambas partes, reconociendo su plena capacidad jurídica, libre de coacción y vicios del consentimiento, convienen en celebrar el presente contrato al tenor de las siguientes:
        </div>
      </div>

      {/* Clauses */}
      <div className={styles.clauses}>
        <div className={styles.clausesTitle}>C L Á U S U L A S</div>
        {clausulas.map((c, i) => (
          <div key={i} className={styles.clause}>
            <div className={styles.clauseTitle}>
              CLÁUSULA {['PRIMERA','SEGUNDA','TERCERA','CUARTA','QUINTA','SEXTA','SÉPTIMA','OCTAVA','NOVENA','DÉCIMA'][i] || `${i+1}ª`}.— {c.titulo}
            </div>
            {c.texto && (
              <div
                className={styles.clauseText}
                contentEditable
                suppressContentEditableWarning
              >
                {c.texto}
              </div>
            )}
            {c.lista && (
              <ul className={styles.clauseList}>
                {c.lista.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {form.notas && (
        <div className={styles.notasBlock}>
          <div className={styles.clauseTitle}>CONDICIONES ESPECIALES</div>
          <div className={styles.clauseText}>{form.notas}</div>
        </div>
      )}

      {/* Signatures */}
      <div className={styles.signatures}>
        <div className={styles.signaturesTitle}>
          Leído el presente instrumento por las partes, lo firman de conformidad en la ciudad y fecha señalados al principio.
        </div>
        <div className={styles.sigRow}>
          <div className={styles.sigBlock}>
            <div className={styles.sigLine} />
            <div className={styles.sigName}>{form.clienteNombre || 'EL CONTRATANTE'}</div>
            <div className={styles.sigRole}>Contratante</div>
            {form.clienteRFC && <div className={styles.sigData}>RFC: {form.clienteRFC}</div>}
          </div>
          <div className={styles.sigBlock}>
            <div className={styles.sigLine} />
            <div className={styles.sigName}>Angel Jaimes</div>
            <div className={styles.sigRole}>Director General</div>
            <div className={styles.sigData}>Elixe Events S.A. de C.V.</div>
          </div>
        </div>
        <div className={styles.sigFooter}>
          Este documento tiene validez legal con las firmas autógrafas de ambas partes. Se firma en dos tantos originales quedando uno en poder de cada contratante.
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ───────────────────────────────────────────── */
export default function ContratosPage() {
  const [vista,       setVista]       = useState('lista')   // lista | nuevo
  const [template,    setTemplate]    = useState(null)
  const [contratos,   setContratos]   = useState([])
  const [contratoActivo, setContratoActivo] = useState(null)
  const contratoRef = useRef(null)

  const [clientesList, setClientesList] = useState([])
  const [eventosList,  setEventosList]  = useState([])

  useEffect(() => {
    contratosApi.getAll().then(setContratos).catch(() => setContratos([]))
    clientesApi.getAll().then(setClientesList).catch(() => setClientesList([]))
    eventosApi.getAll().then(setEventosList).catch(() => setEventosList([]))
  }, [])

  const [form, setForm] = useState({
    clienteId: '', clienteNombre: '', clienteRFC: '', domicilioCliente: '',
    eventoId: '', nombreEvento: '', fechaEvento: '', fechaFirma: '',
    venue: '', invitados: '', ciudad: 'Ciudad de México',
    nombreFestejada: '', chambelanes: '14',
    total: '', anticipo: '', liquidacion: '', pctAnticipo: '50',
    diasLiquidacion: '15', totalLetras: '',
    servicios: [], notas: '',
  })

  const eventosFiltrados = form.clienteId
    ? eventosList.filter(e => e.clienteId === form.clienteId)
    : eventosList

  const handleClienteChange = (clienteId) => {
    const c = clientesList.find(x => x.id === clienteId)
    setForm(f => ({ ...f, clienteId, clienteNombre: c?.nombre || '' }))
  }

  const handleEventoChange = (eventoId) => {
    const ev = eventosList.find(e => e.id === eventoId)
    setForm(f => ({
      ...f, eventoId,
      nombreEvento: ev?.nombre || '',
      fechaEvento:  ev?.fecha || '',
      venue:        ev?.venue || '',
      invitados:    String(ev?.invitados || ''),
      total:        ev ? fmt(ev.presupuestoTotal) : '',
    }))
  }

  const selectTemplate = (t) => {
    setTemplate(t)
    setForm(f => ({ ...f, servicios: [...t.serviciosDefault] }))
  }

  const toggleServicio = (s) =>
    setForm(f => ({
      ...f,
      servicios: f.servicios.includes(s)
        ? f.servicios.filter(x => x !== s)
        : [...f.servicios, s],
    }))

  const addServicio = (s) => {
    if (s.trim() && !form.servicios.includes(s)) {
      setForm(f => ({ ...f, servicios: [...f.servicios, s] }))
    }
  }

  const printPDF = () => {
    const html = contratoRef.current?.innerHTML
    if (!html) return
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8"/>
      <title>Contrato — ${form.clienteNombre || 'Elixe Events'}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Georgia', serif; font-size: 11pt; color: #1a1a1a; background: #fff; padding: 20mm 18mm; line-height: 1.7; }
        .letterhead { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12pt; }
        .letterheadLeft { display:flex; align-items:center; }
        .letterheadLogoImg { height:38pt; width:auto; object-fit:contain; }
        .letterheadRight { text-align:right; }
        .letterheadData { font-family:sans-serif; font-size:9pt; color:#555; }
        .letterheadLine { border-top:2pt solid #7c6af7; margin-bottom:18pt; }
        .contractTitleBlock { text-align:center; margin-bottom:16pt; }
        .contractNum { font-family:sans-serif; font-size:8pt; color:#999; margin-bottom:4pt; }
        .contractTitle { font-size:13pt; font-weight:700; letter-spacing:1pt; color:#0d0c12; text-transform:uppercase; line-height:1.4; }
        .contractDate { font-size:10pt; color:#555; margin-top:6pt; }
        .parties { background:#f9f9fc; border:1pt solid #e0e0ef; border-radius:6pt; padding:12pt; margin-bottom:16pt; }
        .partiesTitle { font-family:sans-serif; font-size:8pt; font-weight:700; letter-spacing:2pt; text-transform:uppercase; color:#7c6af7; margin-bottom:10pt; }
        .partyBlock { margin-bottom:8pt; }
        .partyLabel { font-family:sans-serif; font-size:9pt; font-weight:700; color:#0d0c12; margin-right:6pt; }
        .partyValue { font-size:10pt; color:#333; }
        .partiesDecl { font-size:9pt; color:#555; font-style:italic; margin-top:10pt; }
        .clauses { margin-bottom:16pt; }
        .clausesTitle { font-family:sans-serif; font-size:9pt; font-weight:800; letter-spacing:3pt; text-transform:uppercase; color:#7c6af7; text-align:center; margin-bottom:14pt; padding-bottom:6pt; border-bottom:1pt solid #e0e0ef; }
        .clause { margin-bottom:14pt; }
        .clauseTitle { font-family:sans-serif; font-size:9pt; font-weight:700; color:#0d0c12; text-transform:uppercase; margin-bottom:5pt; }
        .clauseText { font-size:10pt; color:#333; text-align:justify; white-space:pre-line; }
        .clauseList { padding-left:16pt; font-size:10pt; color:#333; }
        .clauseList li { margin-bottom:3pt; }
        .notasBlock { background:#fffbf0; border:1pt solid #f0e0a0; border-radius:6pt; padding:10pt; margin-bottom:16pt; }
        .signatures { margin-top:28pt; }
        .signaturesTitle { font-size:9pt; color:#555; font-style:italic; text-align:center; margin-bottom:28pt; }
        .sigRow { display:flex; justify-content:space-around; gap:24pt; margin-bottom:16pt; }
        .sigBlock { flex:1; text-align:center; }
        .sigLine { border-top:1pt solid #333; margin-bottom:6pt; }
        .sigName { font-family:sans-serif; font-size:9pt; font-weight:700; }
        .sigRole { font-size:9pt; color:#555; }
        .sigData { font-size:8pt; color:#888; }
        .sigFooter { font-size:8pt; color:#aaa; text-align:center; }
        @media print { body { padding:12mm 15mm; } }
      </style>
    </head><body>${html}</body></html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 600)
  }

  const resetForm = () => setForm({ clienteId:'', clienteNombre:'', clienteRFC:'', domicilioCliente:'', eventoId:'', nombreEvento:'', fechaEvento:'', fechaFirma:'', venue:'', invitados:'', ciudad:'Ciudad de México', nombreFestejada:'', chambelanes:'14', total:'', anticipo:'', liquidacion:'', pctAnticipo:'50', diasLiquidacion:'15', totalLetras:'', servicios:[], notas:'' })

  const guardarContrato = async () => {
    const totalNum = parseFloat((form.total || '0').replace(/[$,]/g, '')) || 0
    const nuevo = {
      id: `ct${Date.now()}`,
      template: template?.id || 'boda',
      cliente: form.clienteNombre || 'Sin cliente',
      evento:  form.nombreEvento  || 'Sin evento',
      fecha:   new Date().toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }),
      estado:  'borrador',
      total:   form.total || '$0',
    }
    // Persist to API if client selected
    if (form.clienteId) {
      contratosApi.create({
        clientId: form.clienteId,
        eventId: form.eventoId || null,
        template: template?.id || 'general',
        title: form.nombreEvento || `Contrato ${template?.nombre || ''}`,
        total: totalNum,
        notes: form.notas || null,
      }).then(saved => {
        setContratos(c => [{ ...nuevo, id: saved.id }, ...c.filter(x => x.id !== nuevo.id)])
      }).catch(() => {})
    }
    setContratos(c => [nuevo, ...c])
    setVista('lista')
    setTemplate(null)
    resetForm()
  }

  if (vista === 'nuevo') {
    return (
      <div className={styles.page}>
        <div className={styles.generatorHeader}>
          <button className={styles.backBtn} onClick={() => { setVista('lista'); setTemplate(null) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Contratos
          </button>
          <h1 className={styles.generatorTitle}>Nuevo contrato</h1>
          <div className={styles.generatorActions}>
            <button className={styles.btnSave} onClick={guardarContrato}>Guardar borrador</button>
            <button className={styles.btnPDF} onClick={printPDF} disabled={!template}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
              </svg>
              Descargar PDF
            </button>
          </div>
        </div>

        <div className={styles.generatorLayout}>
          {/* Config panel */}
          <div className={styles.configPanel}>

            {/* Step 1: Template */}
            <div className={styles.configSection}>
              <div className={styles.configSectionTitle}>
                <span className={styles.stepNum}>1</span>
                Tipo de contrato
              </div>
              <div className={styles.templateCards}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className={`${styles.templateCard} ${template?.id === t.id ? styles.templateCardActive : ''}`}
                    onClick={() => selectTemplate(t)}
                    style={template?.id === t.id ? { borderColor: t.color, background: t.color+'10' } : {}}
                  >
                    <span className={styles.templateEmoji}>{t.emoji}</span>
                    <div className={styles.templateInfo}>
                      <span className={styles.templateName}>{t.nombre}</span>
                      <span className={styles.templateDesc}>{t.desc}</span>
                    </div>
                    {template?.id === t.id && <span className={styles.templateCheck} style={{ color: t.color }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {template && (
              <>
                {/* Step 2: Client + Event */}
                <div className={styles.configSection}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.stepNum}>2</span>
                    Cliente y evento
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Cliente</label>
                      <select value={form.clienteId} onChange={e => handleClienteChange(e.target.value)}>
                        <option value="">— Seleccionar cliente —</option>
                        {clientesList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}

                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Evento</label>
                      <select value={form.eventoId} onChange={e => handleEventoChange(e.target.value)}>
                        <option value="">— Seleccionar evento —</option>
                        {eventosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                    {template.id === 'xv' && (
                      <div className={`${styles.formField} ${styles.formFieldFull}`}>
                        <label>Nombre de la festejada</label>
                        <input placeholder="Nombre completo" value={form.nombreFestejada} onChange={e => setForm(f => ({ ...f, nombreFestejada: e.target.value }))} />
                      </div>
                    )}
                    <div className={styles.formField}>
                      <label>Fecha del evento</label>
                      <input placeholder="Ej. 14 de junio de 2026" value={form.fechaEvento} onChange={e => setForm(f => ({ ...f, fechaEvento: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>Venue</label>
                      <input placeholder="Nombre del lugar" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>Invitados</label>
                      <input type="number" placeholder="200" value={form.invitados} onChange={e => setForm(f => ({ ...f, invitados: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>RFC del cliente</label>
                      <input placeholder="XAXX010101000" value={form.clienteRFC} onChange={e => setForm(f => ({ ...f, clienteRFC: e.target.value }))} />
                    </div>
                    <div className={`${styles.formField} ${styles.formFieldFull}`}>
                      <label>Domicilio del cliente</label>
                      <input placeholder="Calle, colonia, ciudad" value={form.domicilioCliente} onChange={e => setForm(f => ({ ...f, domicilioCliente: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Step 3: Financials */}
                <div className={styles.configSection}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.stepNum}>3</span>
                    Datos financieros
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Monto total</label>
                      <input placeholder="$85,000" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>% de anticipo</label>
                      <input type="number" placeholder="50" min="10" max="100" value={form.pctAnticipo} onChange={e => setForm(f => ({ ...f, pctAnticipo: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>Monto anticipo</label>
                      <input placeholder="$42,500" value={form.anticipo} onChange={e => setForm(f => ({ ...f, anticipo: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>Días para liquidar</label>
                      <input type="number" placeholder="15" value={form.diasLiquidacion} onChange={e => setForm(f => ({ ...f, diasLiquidacion: e.target.value }))} />
                    </div>
                    <div className={`${styles.formField} ${styles.formFieldFull}`}>
                      <label>Total en letra</label>
                      <input placeholder="Ochenta y cinco mil pesos 00/100 M.N." value={form.totalLetras} onChange={e => setForm(f => ({ ...f, totalLetras: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Step 4: Services */}
                <div className={styles.configSection}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.stepNum}>4</span>
                    Servicios incluidos
                  </div>
                  <div className={styles.serviciosList}>
                    {template.serviciosDefault.map(s => (
                      <label key={s} className={styles.servicioCheck}>
                        <input type="checkbox" checked={form.servicios.includes(s)} onChange={() => toggleServicio(s)} />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.addServicio}>
                    <input
                      className={styles.addServicioInput}
                      placeholder="Agregar servicio personalizado..."
                      onKeyDown={e => { if (e.key === 'Enter') { addServicio(e.target.value); e.target.value = '' }}}
                    />
                    <span className={styles.addServicioHint}>↵ Enter para agregar</span>
                  </div>
                </div>

                {/* Step 5: Notes */}
                <div className={styles.configSection}>
                  <div className={styles.configSectionTitle}>
                    <span className={styles.stepNum}>5</span>
                    Notas y condiciones especiales
                  </div>
                  <textarea
                    className={styles.notasInput}
                    placeholder="Acuerdos adicionales, condiciones especiales, restricciones del venue..."
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>

          {/* Preview panel */}
          <div className={styles.previewPanel}>
            <div className={styles.previewToolbar}>
              <span className={styles.previewLabel}>Vista previa del contrato</span>
              <span className={styles.previewHint}>Los textos son editables directamente</span>
            </div>

            {!template ? (
              <div className={styles.previewEmpty}>
                <span className={styles.previewEmptyIcon}>📄</span>
                <p>Selecciona un tipo de contrato para ver la vista previa</p>
              </div>
            ) : (
              <div className={styles.previewScroll}>
                <ContractPreview template={template} form={form} contratoRef={contratoRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Lista de contratos ── */
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contratos</h1>
          <p className={styles.sub}>{contratos.length} contratos · {contratos.filter(c=>c.estado==='firmado').length} firmados</p>
        </div>
        <button className={styles.btnNew} onClick={() => setVista('nuevo')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo contrato
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total', val: contratos.length, color: 'var(--accent-2)' },
          { label: 'Firmados', val: contratos.filter(c=>c.estado==='firmado').length, color: '#34d399' },
          { label: 'Enviados', val: contratos.filter(c=>c.estado==='enviado').length,  color: '#fb923c' },
          { label: 'Borradores', val: contratos.filter(c=>c.estado==='borrador').length, color: '#64748b' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contratos.map(ct => {
              const tmpl = TEMPLATES.find(t => t.id === ct.template)
              const est  = ESTADO_COLOR[ct.estado] || ESTADO_COLOR.borrador
              return (
                <tr key={ct.id} className={styles.row}>
                  <td>
                    <div className={styles.tipoCell}>
                      <span className={styles.tipoEmoji}>{tmpl?.emoji}</span>
                      <span>{tmpl?.nombre}</span>
                    </div>
                  </td>
                  <td className={styles.muted}>{ct.cliente}</td>
                  <td className={styles.muted}>{ct.evento}</td>
                  <td className={styles.muted}>{ct.fecha}</td>
                  <td className={styles.totalCell}>{ct.total}</td>
                  <td>
                    <span className={styles.estadoBadge} style={{ color: est.color, background: est.bg }}>
                      {ct.estado.charAt(0).toUpperCase() + ct.estado.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.rowBtn} title="Editar" onClick={() => setVista('nuevo')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className={styles.rowBtnPDF} title="Descargar PDF">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
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
