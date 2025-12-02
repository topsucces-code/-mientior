/**
 * Global Toast Keyboard Handler
 * 
 * Provides global keyboard navigation for toast notifications,
 * specifically handling the Escape key to dismiss messages.
 * 
 * Requirements: 6.5, 9.3
 */

'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Component that handles global keyboard events for toast notifications
 * 
 * Features:
 * - Escape key dismisses all visible toasts
 * - Focus management after dismissal
 * - Accessible keyboard navigation
 * 
 * Requirements:
 * - 6.5: Feedback messages SHALL be keyboard-navigable and dismissible
 * - 9.3: WHEN a user presses Escape key THEN the AuthSystem SHALL dismiss the currently visible message
 */
export function ToastKeyboardHandler() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Requirement 9.3: Escape key dismisses messages
      if (event.key === 'Escape') {
        // Check if there are any visible toasts
        const toastElements = document.querySelectorAll('[data-sonner-toast]');
        
        if (toastElements.length > 0) {
          // Dismiss all toasts
          toast.dismiss();
          
          // Prevent default Escape behavior (like closing modals) when toasts are visible
          event.stopPropagation();
          
          // Return focus to the previously focused element or body
          // This ensures keyboard users can continue navigating
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement !== document.body) {
            activeElement.blur();
          }
        }
      }
    }

    // Add event listener with capture phase to handle before other handlers
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
