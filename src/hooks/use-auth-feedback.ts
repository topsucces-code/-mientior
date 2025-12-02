/**
 * Custom Authentication Feedback Hook
 * 
 * Provides a centralized interface for displaying authentication-related
 * feedback messages using the Sonner toast library with proper accessibility
 * support (ARIA live regions).
 * 
 * Requirements: 6.1, 6.2, 6.4, 8.1, 8.2, 8.3, 8.4
 */

'use client';

import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { AUTH_MESSAGES, type AuthMessageKey } from '@/lib/auth-messages';

/**
 * Custom hook for displaying authentication feedback messages
 * 
 * Features:
 * - Type-safe message keys
 * - Dynamic parameter support
 * - Automatic ARIA live region configuration
 * - Consistent styling and behavior
 * - Toast dismissal management
 * 
 * @example
 * ```tsx
 * const { showMessage, dismissMessage } = useAuthFeedback();
 * 
 * // Show a simple message
 * showMessage('LOGIN_SUCCESS');
 * 
 * // Show a message with parameters
 * showMessage('REGISTER_SUCCESS', { email: 'user@example.com' });
 * 
 * // Dismiss a specific message
 * const toastId = showMessage('PROCESSING_LOGIN');
 * dismissMessage(toastId);
 * 
 * // Dismiss all messages
 * dismissMessage();
 * ```
 */
export function useAuthFeedback() {
  /**
   * Get the appropriate icon for a message type
   * Icons have aria-label for accessibility (Requirement 6.4)
   * 
   * @param type - The message type
   * @returns React element with the appropriate icon
   */
  const getIcon = (type: string) => {
    const iconProps = {
      className: 'h-5 w-5',
      'aria-hidden': true, // Icon is decorative, text provides context
    };

    switch (type) {
      case 'success':
        return React.createElement(CheckCircle2, { ...iconProps, 'aria-label': 'Succès' });
      case 'error':
        return React.createElement(XCircle, { ...iconProps, 'aria-label': 'Erreur' });
      case 'warning':
        return React.createElement(AlertTriangle, { ...iconProps, 'aria-label': 'Avertissement' });
      case 'info':
        return React.createElement(Info, { ...iconProps, 'aria-label': 'Information' });
      case 'loading':
        return React.createElement(Loader2, { ...iconProps, className: 'h-5 w-5 animate-spin', 'aria-label': 'Chargement' });
      default:
        return null;
    }
  };

  /**
   * Display an authentication feedback message
   * 
   * @param messageKey - The key of the message to display from AUTH_MESSAGES
   * @param params - Optional parameters for dynamic message content and action buttons
   * @returns The toast ID that can be used to dismiss the message
   */
  const showMessage = (
    messageKey: AuthMessageKey,
    params?: Record<string, unknown> & { action?: { label: string; onClick: () => void } }
  ): string | number => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = AUTH_MESSAGES[messageKey] as any;
    
    // Resolve description (handle both static strings and functions)
    const description = typeof message.description === 'function'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? message.description(params as any)
      : message.description;
    
    // Get the appropriate icon for this message type (Requirements 6.4, 8.1, 8.2, 8.3, 8.4)
    const icon = getIcon(message.type);
    
    // Use dynamic action from params if provided, otherwise use message default
    const action = params?.action || message.action;
    
    // Configure toast options
    const toastOptions = {
      description,
      duration: message.duration === Infinity ? Infinity : message.duration,
      ...(action && { action }),
      className: `auth-toast auth-toast-${message.type}`,
      // ARIA live region configuration (Requirements 6.1, 6.2)
      // - 'assertive' for errors (interrupts screen reader)
      // - 'polite' for other messages (waits for screen reader to finish)
      ariaLive: (message.type === 'error' ? 'assertive' : 'polite') as 'assertive' | 'polite',
      closeButton: true,
      icon,
    };
    
    // Display toast based on message type
    switch (message.type) {
      case 'success':
        return toast.success(message.title, toastOptions);
      
      case 'error':
        return toast.error(message.title, toastOptions);
      
      case 'warning':
        return toast.warning(message.title, toastOptions);
      
      case 'info':
        return toast.info(message.title, toastOptions);
      
      case 'loading':
        return toast.loading(message.title, {
          ...toastOptions,
          closeButton: false, // Loading toasts shouldn't have close button
        });
      
      default:
        return toast(message.title, toastOptions);
    }
  };
  
  /**
   * Dismiss a specific toast message or all messages
   * 
   * @param toastId - Optional toast ID to dismiss. If not provided, dismisses all toasts
   */
  const dismissMessage = (toastId?: string | number): void => {
    if (toastId !== undefined) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };
  
  return {
    showMessage,
    dismissMessage,
  };
}
