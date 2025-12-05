'use client';

import { useState } from 'react';
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
  Loader2,
  ArrowLeft
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
  ORDER_UPDATE: 'bg-emerald-100 text-emerald-600',
  PAYMENT_UPDATE: 'bg-blue-100 text-blue-600',
  DELIVERY_UPDATE: 'bg-amber-100 text-amber-600',
  PROMO_OFFER: 'bg-purple-100 text-purple-600',
  PRICE_DROP: 'bg-red-100 text-red-600',
  BACK_IN_STOCK: 'bg-green-100 text-green-600',
  REVIEW_REQUEST: 'bg-yellow-100 text-yellow-600',
  SUPPORT_UPDATE: 'bg-cyan-100 text-cyan-600',
  SYSTEM_ALERT: 'bg-orange-100 text-orange-600',
};

// Type labels
const typeLabels: Record<NotificationType, string> = {
  ORDER_UPDATE: 'Commandes',
  PAYMENT_UPDATE: 'Paiements',
  DELIVERY_UPDATE: 'Livraisons',
  PROMO_OFFER: 'Promotions',
  PRICE_DROP: 'Baisses de prix',
  BACK_IN_STOCK: 'Retours en stock',
  REVIEW_REQUEST: 'Avis',
  SUPPORT_UPDATE: 'Support',
  SYSTEM_ALERT: 'Système',
};

// Format date
function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInDays === 1) {
    return `Hier à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInDays < 7) {
    return d.toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  }
  
  return d.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

type FilterType = 'all' | 'unread' | NotificationType;

export default function NotificationsPageClient() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    hasMore,
    loadMore,
  } = useNotifications({ pollInterval: 30000, limit: 20 });

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.read;
    return notification.type === activeFilter;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Hier';
    } else {
      groupKey = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey]!.push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au compte
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 
                ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Toutes vos notifications sont lues'
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
              activeFilter === 'all'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Toutes ({total})
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
              activeFilter === 'unread'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Non lues ({unreadCount})
          </button>
          {Object.entries(typeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type as NotificationType)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
                activeFilter === type
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Aucune notification</p>
            <p className="text-sm mt-1">
              {activeFilter === 'all' 
                ? 'Vous n\'avez pas encore reçu de notifications'
                : activeFilter === 'unread'
                ? 'Toutes vos notifications sont lues'
                : `Aucune notification de type "${typeLabels[activeFilter as NotificationType]}"`
              }
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date}>
                {/* Date header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500">{date}</h3>
                </div>

                {/* Notifications for this date */}
                {notifs.map((notification) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600';

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'relative group border-b border-gray-100 last:border-b-0',
                        !notification.read && 'bg-emerald-50/30'
                      )}
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-start space-x-4">
                          {/* Icon */}
                          <div className={cn('flex-shrink-0 p-2.5 rounded-full', colorClass)}>
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className={cn(
                                  'text-sm',
                                  notification.read ? 'text-gray-700' : 'text-gray-900 font-semibold'
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>

                              {/* Unread indicator */}
                              {!notification.read && (
                                <span className="flex-shrink-0 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                              )}
                            </div>

                            {/* Action link */}
                            {notification.link && (
                              <Link
                                href={notification.link}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                                className="inline-flex items-center mt-3 text-sm text-emerald-600 hover:text-emerald-700"
                              >
                                Voir les détails
                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                title="Marquer comme lu"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="px-4 py-4 border-t border-gray-100">
                <button
                  onClick={loadMore}
                  className="w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Charger plus de notifications
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
