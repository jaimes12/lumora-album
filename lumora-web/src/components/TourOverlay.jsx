import { useEffect, useRef, useState } from 'react'
import { useTour } from '../context/TourContext'
import styles from './TourOverlay.module.css'

const PlaneIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
)

const PAD = 10

function useTargetRect(target, active) {
  const [rect, setRect] = useState(null)
  const lastRef = useRef(null)

  useEffect(() => {
    if (!active || !target) { setRect(null); return }
    let cancelled = false

    const measure = () => {
      if (cancelled) return
      const el = document.querySelector(`[data-tour="${target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        const next = { top: r.top, left: r.left, width: r.width, height: r.height }
        const prev = lastRef.current
        if (!prev || prev.top !== next.top || prev.left !== next.left || prev.width !== next.width || prev.height !== next.height) {
          lastRef.current = next
          setRect(next)
        }
      } else if (lastRef.current) {
        lastRef.current = null
        setRect(null)
      }
    }

    measure()
    const interval = setInterval(measure, 200)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [target, active])

  return rect
}

export default function TourOverlay() {
  const tour = useTour()
  const { active, step } = tour
  const isSpotlight = step?.kind === 'spotlight'
  const rect = useTargetRect(isSpotlight ? step.target : null, active)

  // Avanza el tour si el usuario da clic directo en el elemento real resaltado,
  // sin pasar por el botón del tooltip.
  useEffect(() => {
    if (!active || !isSpotlight || !step.cta || !rect) return
    const els = document.querySelectorAll(`[data-tour="${step.target}"]`)
    if (!els.length) return
    const handler = () => tour.advance()
    els.forEach(el => el.addEventListener('click', handler))
    return () => els.forEach(el => el.removeEventListener('click', handler))
  }, [active, isSpotlight, step, rect]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !step) return null

  if (step.kind === 'modal') {
    const isWelcome = step.id === 'welcome'
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalCard}>
          <div className={styles.iconWrap}><PlaneIcon /></div>
          <h2 className={styles.modalTitle}>{step.title}</h2>
          <p className={styles.modalText}>{step.text}</p>
          {step.text2 && <p className={styles.modalText}>{step.text2}</p>}
          <button className={styles.ctaBtnFull} onClick={() => isWelcome ? tour.advance() : tour.skip()}>
            {step.cta}
          </button>
          {isWelcome && (
            <button type="button" className={styles.skipLink} onClick={tour.skip}>Omitir intro</button>
          )}
        </div>
      </div>
    )
  }

  if (!rect) {
    return <div className={styles.dim} />
  }

  const box = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }

  // Si el botón vive dentro de un formulario (p.ej. un modal para llenar datos),
  // el recorte oscuro debe cubrir todo el modal y no solo el botón, para no
  // apagar los campos que el usuario todavía tiene que llenar.
  const targetEl = document.querySelector(`[data-tour="${step.target}"]`)
  const modalEl = targetEl?.closest('form')?.parentElement ?? null
  const modalRect = modalEl?.getBoundingClientRect() ?? null
  const isModalScoped = !!modalRect

  const cutoutBox = isModalScoped
    ? {
        top: modalRect.top - PAD,
        left: modalRect.left - PAD,
        width: modalRect.width + PAD * 2,
        height: modalRect.height + PAD * 2,
      }
    : box

  const ringBox = {
    top: rect.top - 4,
    left: rect.left - 4,
    width: rect.width + 8,
    height: rect.height + 8,
  }

  const handleCta = () => {
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (el) el.click()
    else tour.advance()
  }

  const spaceBelow = window.innerHeight - (box.top + box.height)
  const placeAbove = step.placement === 'top' || (step.placement !== 'bottom' && spaceBelow < 180)

  const tooltipWidth = Math.min(320, window.innerWidth - 24)
  const tooltipLeft = Math.min(Math.max(12, box.left), window.innerWidth - tooltipWidth - 12)
  const tooltipStyle = placeAbove
    ? { left: tooltipLeft, bottom: window.innerHeight - box.top + 14 }
    : { left: tooltipLeft, top: box.top + box.height + 14 }

  return (
    <div className={styles.overlayRoot}>
      <div className={`${styles.spotlight} ${isModalScoped ? styles.spotlightPlain : ''}`} style={cutoutBox} />
      {isModalScoped && <div className={styles.targetRing} style={ringBox} />}
      <div className={styles.tooltip} style={tooltipStyle} data-placement={placeAbove ? 'top' : 'bottom'}>
        <div className={styles.tooltipHead}>
          <span className={styles.badge}>Guía rápida · {tour.stepIndex} / {tour.total - 1}</span>
          <button className={styles.skipLink} onClick={tour.skip}>Saltar tour</button>
        </div>
        <h3 className={styles.tooltipTitle}>{step.title}</h3>
        <p className={styles.tooltipText}>{step.text}</p>
        {step.cta && (
          <button className={styles.ctaBtn} onClick={handleCta}>{step.cta} →</button>
        )}
        {!step.cta && step.waitForTrigger && (
          <p className={styles.hint}>Completa la acción para continuar automáticamente.</p>
        )}
      </div>
    </div>
  )
}
