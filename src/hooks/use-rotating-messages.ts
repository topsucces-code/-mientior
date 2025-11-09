import { useState, useEffect, useCallback } from 'react'
import type { RotatingMessage } from '@/types'
import { DEFAULT_ROTATING_MESSAGES } from '@/lib/constants'

interface UseRotatingMessagesOptions {
    messages?: RotatingMessage[]
    interval?: number // in milliseconds
}

interface UseRotatingMessagesReturn {
    currentMessage: RotatingMessage
    currentIndex: number
    nextMessage: () => void
    previousMessage: () => void
    pause: () => void
    resume: () => void
    isPaused: boolean
}

export function useRotatingMessages(
    options: UseRotatingMessagesOptions = {}
): UseRotatingMessagesReturn {
    const { messages = DEFAULT_ROTATING_MESSAGES, interval = 5000 } = options

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const nextMessage = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length)
    }, [messages.length])

    const previousMessage = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length)
    }, [messages.length])

    const pause = useCallback(() => {
        setIsPaused(true)
    }, [])

    const resume = useCallback(() => {
        setIsPaused(false)
    }, [])

    useEffect(() => {
        if (isPaused || messages.length <= 1) {
            return
        }

        const intervalId = setInterval(() => {
            nextMessage()
        }, interval)

        return () => {
            clearInterval(intervalId)
        }
    }, [isPaused, interval, nextMessage, messages.length])

    // Fallback message if messages array is empty
    const fallbackMessage: RotatingMessage = {
        id: 'fallback',
        text: 'Bienvenue sur Mientior',
        icon: '🎉',
        link: '/'
    }

    return {
        currentMessage: messages[currentIndex] || messages[0] || fallbackMessage,
        currentIndex,
        nextMessage,
        previousMessage,
        pause,
        resume,
        isPaused
    }
}
