'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationType } from '@prisma/client';

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  data?: Record<string, unknown> | null;
  read: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface UseNotificationsOptions {
  pollInterval?: number; // Polling interval in ms (default: 30000)
  limit?: number;
  autoFetch?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { 
    pollInterval = 30000, 
    limit = 20,
    autoFetch = true,
  } = options;

  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    total: 0,
    isLoading: true,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const response = await fetch(`/api/notifications?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();

      if (isMountedRef.current) {
        setState({
          notifications: data.notifications,
          unreadCount: data.unreadCount,
          total: data.total,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }));
      }
    }
  }, [limit]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({
            ...n,
            read: true,
            readAt: new Date(),
          })),
          unreadCount: 0,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setState(prev => {
          const notification = prev.notifications.find(n => n.id === notificationId);
          return {
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== notificationId),
            unreadCount: notification && !notification.read 
              ? Math.max(0, prev.unreadCount - 1) 
              : prev.unreadCount,
            total: prev.total - 1,
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, []);

  // Load more notifications
  const loadMore = useCallback(async () => {
    const offset = state.notifications.length;
    
    try {
      const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
      
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          notifications: [...prev.notifications, ...data.notifications],
        }));
      }
    } catch (error) {
      console.error('Error loading more notifications:', error);
    }
  }, [state.notifications.length, limit]);

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true;

    if (autoFetch) {
      fetchNotifications(true);

      // Setup polling interval
      if (pollInterval > 0) {
        intervalRef.current = setInterval(() => {
          fetchNotifications(false);
        }, pollInterval);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoFetch, pollInterval, fetchNotifications]);

  return {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    hasMore: state.notifications.length < state.total,
  };
}

// Hook for just the unread count (lightweight polling)
export function useUnreadCount(pollInterval = 60000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=1');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchCount, pollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollInterval, fetchCount]);

  return { unreadCount, refresh: fetchCount };
}
