'use client'

import { useEffect, useState } from 'react'
import { throttle } from '@/lib/utils'

export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [scrollY, setScrollY] = useState(0)
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY

    const updateScrollDirection = throttle(() => {
      const currentScrollY = window.scrollY

      // Check if at top
      setIsAtTop(currentScrollY < 10)

      // Only update direction if scroll is significant enough
      if (Math.abs(currentScrollY - lastScrollY) < threshold) {
        return
      }

      setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up')
      setScrollY(currentScrollY)
      lastScrollY = currentScrollY > 0 ? currentScrollY : 0
    }, 100)

    window.addEventListener('scroll', updateScrollDirection)

    return () => {
      window.removeEventListener('scroll', updateScrollDirection)
    }
  }, [threshold])

  return { scrollDirection, scrollY, isAtTop }
}
