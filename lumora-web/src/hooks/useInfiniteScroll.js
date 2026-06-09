import { useState, useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll(items, pageSize = 20) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const sentinelRef = useRef(null)

  const reset = useCallback(() => setVisibleCount(pageSize), [pageSize])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(n => Math.min(n + pageSize, items.length + pageSize))
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [items.length, pageSize])

  return {
    visible: items.slice(0, visibleCount),
    hasMore: visibleCount < items.length,
    total: items.length,
    sentinelRef,
    reset,
  }
}
