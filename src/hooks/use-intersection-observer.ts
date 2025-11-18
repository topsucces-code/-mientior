'use client'

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  triggerOnce?: boolean
  onIntersect?: () => void
}

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  triggerOnce = false,
  onIntersect,
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<T>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)

        // Call onIntersect callback when element becomes visible
        if (entry.isIntersecting && onIntersect) {
          onIntersect()
        }

        // Disconnect if triggerOnce is true and element is intersecting
        if (triggerOnce && entry.isIntersecting) {
          observer.disconnect()
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, triggerOnce, onIntersect])

  return { ref: targetRef, isIntersecting }
}
