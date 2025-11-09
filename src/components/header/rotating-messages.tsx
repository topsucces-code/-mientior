'use client'

import { useRotatingMessages } from '@/hooks/use-rotating-messages'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

export function RotatingMessages() {
    const {
        currentMessage,
        nextMessage,
        previousMessage,
        pause,
        resume,
        isPaused
    } = useRotatingMessages()

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={previousMessage}
                className="hover:bg-gray-100 p-1 rounded transition-colors"
                aria-label="Message précédent"
            >
                <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
                className="flex items-center gap-2 min-w-[300px]"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                <span className="text-2xl" aria-hidden="true">{currentMessage.icon}</span>
                <p className="text-sm font-medium truncate animate-fade-in">
                    {currentMessage.text}
                </p>
            </div>

            <button
                onClick={isPaused ? resume : pause}
                className="hover:bg-gray-100 p-1 rounded transition-colors"
                aria-label={isPaused ? 'Reprendre la rotation des messages' : 'Mettre en pause la rotation des messages'}
                aria-pressed={isPaused}
            >
                {isPaused ? (
                    <Play className="w-3.5 h-3.5" />
                ) : (
                    <Pause className="w-3.5 h-3.5" />
                )}
            </button>

            <button
                onClick={nextMessage}
                className="hover:bg-gray-100 p-1 rounded transition-colors"
                aria-label="Message suivant"
            >
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}
