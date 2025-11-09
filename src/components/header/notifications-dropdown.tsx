'use client'

import { Bell, Package, Gift, MessageCircle, AlertCircle } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications.store'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef } from 'react'

const ICON_MAP = {
    order: Package,
    promo: Gift,
    message: MessageCircle,
    system: AlertCircle
} as const

export function NotificationsDropdown() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore()
    const { activeDropdown, setActiveDropdown } = useHeader()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const isOpen = activeDropdown === 'notifications'

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setActiveDropdown(null)
                triggerRef.current?.focus()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, setActiveDropdown])

    const recentNotifications = notifications.slice(0, 5)

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={triggerRef}
                onClick={() => setActiveDropdown(isOpen ? null : 'notifications')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} non lues` : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-controls="notifications-dropdown"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                        aria-hidden="true"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    id="notifications-dropdown"
                    role="menu"
                    aria-label="Menu des notifications"
                    className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slide-down"
                >
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:underline"
                                aria-label={`Marquer toutes les ${unreadCount} notifications comme lues`}
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map((notification) => {
                                const Icon = ICON_MAP[notification.type]
                                return (
                                    <button
                                        key={notification.id}
                                        role="menuitem"
                                        tabIndex={isOpen ? 0 : -1}
                                        onClick={() => {
                                            markAsRead(notification.id)
                                            if (notification.link) {
                                                window.location.href = notification.link
                                            }
                                        }}
                                        className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${!notification.read ? 'bg-blue-50' : ''
                                            }`}
                                        aria-label={`${notification.read ? 'Lue' : 'Non lue'} - ${notification.title}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notification.type === 'order' ? 'bg-green-100 text-green-600' :
                                                notification.type === 'promo' ? 'bg-yellow-100 text-yellow-600' :
                                                    notification.type === 'message' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}
                                                aria-hidden="true"
                                            >
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium ${!notification.read ? 'text-blue-600' : ''}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    <time dateTime={new Date(notification.timestamp).toISOString()}>
                                                        {new Date(notification.timestamp).toLocaleDateString('fr-FR')}
                                                    </time>
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                            )}
                                        </div>
                                    </button>
                                )
                            })
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>Aucune notification</p>
                            </div>
                        )}
                    </div>

                    {notifications.length > 5 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                            <a
                                href="/account/notifications"
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                Voir toutes les notifications
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
