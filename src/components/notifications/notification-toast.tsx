'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  X, 
  Package, 
  CreditCard, 
  Truck, 
  Tag, 
  TrendingDown, 
  Box, 
  Star, 
  MessageCircle, 
  AlertCircle,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationType } from '@prisma/client';

interface NotificationToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  onClose: (id: string) => void;
  duration?: number;
}

// Icon mapping
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

// Color mapping
const typeColors: Record<NotificationType, { bg: string; icon: string; border: string }> = {
  ORDER_UPDATE: { bg: 'bg-turquoise-50', icon: 'text-turquoise-600', border: 'border-turquoise-200' },
  PAYMENT_UPDATE: { bg: 'bg-turquoise-50', icon: 'text-turquoise-600', border: 'border-turquoise-200' },
  DELIVERY_UPDATE: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
  PROMO_OFFER: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
  PRICE_DROP: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
  BACK_IN_STOCK: { bg: 'bg-turquoise-50', icon: 'text-turquoise-600', border: 'border-turquoise-200' },
  REVIEW_REQUEST: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-200' },
  SUPPORT_UPDATE: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200' },
  SYSTEM_ALERT: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
};

export default function NotificationToast({
  id,
  type,
  title,
  message,
  link,
  onClose,
  duration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const Icon = typeIcons[type] || Bell;
  const colors = typeColors[type] || { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-200' };

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const content = (
    <div className="flex items-start space-x-3">
      <div className={cn('flex-shrink-0 p-2 rounded-full', colors.bg)}>
        <Icon className={cn('h-5 w-5', colors.icon)} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 line-clamp-2">{message}</p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div
      className={cn(
        'w-full max-w-sm bg-white rounded-lg shadow-lg border overflow-hidden transition-all duration-300 ease-out',
        colors.border,
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      {link ? (
        <Link href={link} onClick={handleClose} className="block p-4 hover:bg-gray-50">
          {content}
        </Link>
      ) : (
        <div className="p-4">{content}</div>
      )}
      
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={cn('h-full transition-all ease-linear', colors.icon.replace('text-', 'bg-'))}
          style={{
            width: isVisible ? '0%' : '100%',
            transitionDuration: `${duration}ms`,
          }}
        />
      </div>
    </div>
  );
}

// Toast container component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
