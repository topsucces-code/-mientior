import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types'

interface NotificationsState {
    notifications: Notification[]
    unreadCount: number
    setNotifications: (notifications: Notification[]) => void
    addNotification: (notification: Notification) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    removeNotification: (id: string) => void
    clearAll: () => void
    getUnreadCount: () => number
}

export const useNotificationsStore = create<NotificationsState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,

            setNotifications: (notifications) => {
                const unreadCount = notifications.filter((n) => !n.read).length
                set({ notifications, unreadCount })
            },

            addNotification: (notification) => {
                set((state) => {
                    const newNotifications = [notification, ...state.notifications]
                    const unreadCount = newNotifications.filter((n) => !n.read).length
                    return {
                        notifications: newNotifications,
                        unreadCount
                    }
                })
            },

            markAsRead: (id) => {
                set((state) => {
                    const notifications = state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    )
                    const unreadCount = notifications.filter((n) => !n.read).length
                    return { notifications, unreadCount }
                })
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                    unreadCount: 0
                }))
            },

            removeNotification: (id) => {
                set((state) => {
                    const notifications = state.notifications.filter((n) => n.id !== id)
                    const unreadCount = notifications.filter((n) => !n.read).length
                    return { notifications, unreadCount }
                })
            },

            clearAll: () => {
                set({ notifications: [], unreadCount: 0 })
            },

            getUnreadCount: () => {
                return get().unreadCount
            }
        }),
        {
            name: 'notifications-storage'
        }
    )
)
