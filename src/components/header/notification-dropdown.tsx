'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Package, CreditCard, Truck, Tag, TrendingDown, Box, Star, MessageCircle, AlertCircle, Check, ExternalLink } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/lib/notifications-service';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslations } from 'next-intl';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const notificationIcons: Record<string, React.ReactNode> = {
  ORDER_UPDATE: <Package className="w-5 h-5" />,
  PAYMENT_UPDATE: <CreditCard className="w-5 h-5" />,
  DELIVERY_UPDATE: <Truck className="w-5 h-5" />,
  PROMO_OFFER: <Tag className="w-5 h-5" />,
  PRICE_DROP: <TrendingDown className="w-5 h-5" />,
  BACK_IN_STOCK: <Box className="w-5 h-5" />,
  REVIEW_REQUEST: <Star className="w-5 h-5" />,
  SUPPORT_UPDATE: <MessageCircle className="w-5 h-5" />,
  SYSTEM_ALERT: <AlertCircle className="w-5 h-5" />,
};

const notificationColors: Record<string, string> = {
  ORDER_UPDATE: 'text-blue-600',
  PAYMENT_UPDATE: 'text-green-600',
  DELIVERY_UPDATE: 'text-purple-600',
  PROMO_OFFER: 'text-orange-600',
  PRICE_DROP: 'text-red-600',
  BACK_IN_STOCK: 'text-indigo-600',
  REVIEW_REQUEST: 'text-yellow-600',
  SUPPORT_UPDATE: 'text-cyan-600',
  SYSTEM_ALERT: 'text-red-600',
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const t = useTranslations('notifications');

  const locale = typeof window !== 'undefined' ? navigator.language.startsWith('fr') ? fr : enUS : fr;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const data = await getUserNotifications(session.user.id, { limit: 10 });
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const count = await getUnreadCount(session.user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [session?.user?.id, fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!session?.user?.id) return;
    
    try {
      await markAsRead(notificationId, session.user.id);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!session?.user?.id) return;
    
    try {
      await markAllAsRead(session.user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale 
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer transition-all duration-250 ease-smooth hover:bg-turquoise-600/[0.08] hover:-translate-y-0.5 hover:scale-[1.08] text-gray-800 hover:text-turquoise-600"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 bg-turquoise-600 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.3)] animate-pulse-subtle">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[calc(100vh-120px)] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-turquoise-600 hover:text-turquoise-700 font-medium"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                {t('loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{t('noNotifications')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-turquoise-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${notificationColors[notification.type]}`}>
                        {notificationIcons[notification.type] || <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex-shrink-0 ml-2 text-turquoise-600 hover:text-turquoise-700"
                              title={t('markAsRead')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {notification.link && (
                          <a
                            href={notification.link}
                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                            className="inline-flex items-center text-sm text-turquoise-600 hover:text-turquoise-700 mt-2"
                          >
                            {t('viewDetails')}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <a
                href="/account/notifications"
                className="block w-full text-center text-sm text-turquoise-600 hover:text-turquoise-700 font-medium"
              >
                {t('viewAll')}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
