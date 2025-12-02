'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'

const STORAGE_KEY = 'search-history'
const MAX_ENTRIES = 10

/**
 * Client-side hook for managing search history
 * - Uses localStorage for anonymous users (instant feedback)
 * - Syncs to backend for authenticated users
 * - Auto-syncs localStorage to backend on login
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { session } = useAuth()
  const isAuthenticated = !!session?.user

  /**
   * Safely get data from localStorage
   */
  const getLocalStorage = useCallback((): string[] => {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading localStorage:', error)
      return []
    }
  }, [])

  /**
   * Safely set data to localStorage
   */
  const setLocalStorage = useCallback((queries: string[]): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queries))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }, [])

  /**
   * Load history from localStorage or backend
   */
  const loadHistory = useCallback(async () => {
    if (isAuthenticated) {
      // Fetch from backend
      setIsLoading(true)
      try {
        const response = await fetch('/api/user/search-history')
        if (response.ok) {
          const data = await response.json()
          const queries = data.data?.map((entry: { query: string }) => entry.query) || []
          setHistory(queries)
        } else {
          // Fallback to localStorage
          setHistory(getLocalStorage())
        }
      } catch (error) {
        console.error('Error loading search history:', error)
        setHistory(getLocalStorage())
      } finally {
        setIsLoading(false)
      }
    } else {
      // Load from localStorage
      setHistory(getLocalStorage())
    }
  }, [isAuthenticated, getLocalStorage])

  /**
   * Add query to history
   * - Updates localStorage immediately for instant feedback
   * - Syncs to backend if authenticated
   */
  const addToHistory = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return

      // Update localStorage immediately
      const currentHistory = getLocalStorage()
      const normalized = trimmed.toLowerCase()

      // Remove duplicate if exists
      const filtered = currentHistory.filter(
        (q) => q.toLowerCase() !== normalized
      )

      // Prepend new query and limit to MAX_ENTRIES
      const updated = [trimmed, ...filtered].slice(0, MAX_ENTRIES)
      setLocalStorage(updated)
      setHistory(updated)

      // Sync to backend if authenticated
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/user/search-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: trimmed }),
          })

          // Gracefully handle server errors without surfacing to user
          if (!response.ok && response.status >= 500) {
            console.error('Server error syncing search history, falling back to localStorage')
          }
        } catch (error) {
          console.error('Error syncing search history to backend:', error)
          // Don't throw - localStorage is primary, history is non-critical
        }
      }
    },
    [isAuthenticated, getLocalStorage, setLocalStorage]
  )

  /**
   * Remove specific query from history
   */
  const removeFromHistory = useCallback(
    async (query: string) => {
      const normalized = query.toLowerCase()

      // Update localStorage
      const currentHistory = getLocalStorage()
      const filtered = currentHistory.filter(
        (q) => q.toLowerCase() !== normalized
      )
      setLocalStorage(filtered)
      setHistory(filtered)

      // Sync to backend if authenticated
      if (isAuthenticated) {
        try {
          const response = await fetch(`/api/user/search-history?query=${encodeURIComponent(query)}`, {
            method: 'DELETE',
          })

          // Gracefully handle server errors without surfacing to user
          if (!response.ok && response.status >= 500) {
            console.error('Server error removing search history from backend')
          }
        } catch (error) {
          console.error('Error removing search history from backend:', error)
        }
      }
    },
    [isAuthenticated, getLocalStorage, setLocalStorage]
  )

  /**
   * Clear all history
   */
  const clearHistory = useCallback(async () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        console.error('Error clearing localStorage:', error)
      }
    }
    setHistory([])

    // Clear backend if authenticated
    if (isAuthenticated) {
      try {
        const response = await fetch('/api/user/search-history', {
          method: 'DELETE',
        })

        // Gracefully handle server errors without surfacing to user
        if (!response.ok && response.status >= 500) {
          console.error('Server error clearing backend search history')
        }
      } catch (error) {
        console.error('Error clearing backend search history:', error)
      }
    }
  }, [isAuthenticated])

  /**
   * Sync localStorage history to backend on login
   */
  const syncHistory = useCallback(async () => {
    if (!isAuthenticated) return

    const localHistory = getLocalStorage()
    if (localHistory.length === 0) {
      // No local history to sync, just fetch backend
      await loadHistory()
      return
    }

    // Sync each query to backend
    try {
      await Promise.all(
        localHistory.map((query) =>
          fetch('/api/user/search-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          })
        )
      )

      // Fetch updated backend history
      await loadHistory()

      // Clear localStorage after successful sync
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error syncing search history:', error)
    }
  }, [isAuthenticated, getLocalStorage, loadHistory])

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Sync on auth change (login)
  useEffect(() => {
    if (isAuthenticated) {
      syncHistory()
    }
  }, [isAuthenticated, syncHistory])

  return {
    history,
    isLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}
