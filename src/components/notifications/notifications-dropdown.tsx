'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Package, 
  CreditCard, 
  Truck, 
  Tag, 
  TrendingDown, 
  Box, 
  Star, 
  MessageCircle, 
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { NotificationType } from '@prisma/client';

// Icon mapping for notification types
const typeIcons: Record<NotificationType, React.ElementType> = {
  ORDER_UPDATE: Package,
  PAYMENT_UPDATE: CreditCard,
  DELIVERY_UPDATE: Truck,
  PROMO_OFFER: Tag,
  PRICE_DROP: TrendingDown,
  BACK_IN_STOCK: Box,
  REVIEW_REQUEST: Star,
  SUPPORT_UPDATE: MessageCircle,
  SYSTEM_ALERT: AlertCircle,
};

// Color mapping for notification types
const typeColors: Record<NotificationType, string> = {
  ORDER_UPDATE: 'bg-turquoise-100 text-turquoise-600',
  PAYMENT_UPDATE: 'bg-turquoise-100 text-turquoise-600',
  DELIVERY_UPDATE: 'bg-amber-100 text-amber-600',
  PROMO_OFFER: 'bg-orange-100 text-orange-600',
  PRICE_DROP: 'bg-red-100 text-red-600',
  BACK_IN_STOCK: 'bg-turquoise-100 text-turquoise-600',
  REVIEW_REQUEST: 'bg-yellow-100 text-yellow-600',
  SUPPORT_UPDATE: 'bg-cyan-100 text-cyan-600',
  SYSTEM_ALERT: 'bg-orange-100 text-orange-600',
};

// Format relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'À l\'instant';
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  
  return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    hasMore,
    loadMore,
  } = useNotifications({ pollInterval: 30000, limit: 10 });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-turquoise-600 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-turquoise-600 hover:text-turquoise-700 flex items-center"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-turquoise-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600';

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'relative group',
                        !notification.read && 'bg-turquoise-50/50'
                      )}
                    >
                      <Link
                        href={notification.link || '#'}
                        onClick={() => handleNotificationClick(notification.id, notification.read)}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className={cn('flex-shrink-0 p-2 rounded-full', colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={cn(
                                'text-sm',
                                notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-turquoise-500 rounded-full ml-2 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </Link>

                      {/* Actions (visible on hover) */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-1 bg-white shadow-sm rounded-md p-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-turquoise-600 rounded"
                            title="Marquer comme lu"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Load more button */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    className="w-full py-3 text-sm text-turquoise-600 hover:text-turquoise-700 hover:bg-gray-50 transition-colors"
                  >
                    Voir plus
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
            <Link
              href="/account/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-turquoise-600 hover:text-turquoise-700"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
