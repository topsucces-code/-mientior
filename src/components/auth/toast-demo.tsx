/**
 * Toast Demo Component
 * 
 * This component demonstrates all toast variants with proper styling,
 * icons, and animations. Used for visual verification during development.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

'use client';

import { Button } from '@/components/ui/button';
import { useAuthFeedback } from '@/hooks/use-auth-feedback';

export function ToastDemo() {
  const { showMessage } = useAuthFeedback();

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold mb-4">Toast Styling Demo</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Click the buttons below to test different toast variants with Mientior brand colors.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={() => showMessage('REGISTER_SUCCESS', { email: 'user@example.com' })}
          variant="outline"
          className="border-success text-success hover:bg-success/10"
        >
          Show Success Toast
        </Button>

        <Button
          onClick={() => showMessage('INVALID_CREDENTIALS')}
          variant="outline"
          className="border-error text-error hover:bg-error/10"
        >
          Show Error Toast
        </Button>

        <Button
          onClick={() => showMessage('WEAK_PASSWORD', { requirements: ['8 caractères', 'une majuscule', 'un chiffre'] })}
          variant="outline"
          className="border-aurore-500 text-aurore-900 hover:bg-aurore-100"
        >
          Show Warning Toast
        </Button>

        <Button
          onClick={() => showMessage('EMAIL_NOT_VERIFIED')}
          variant="outline"
          className="border-blue-500 text-blue-900 hover:bg-blue-100"
        >
          Show Info Toast
        </Button>

        <Button
          onClick={() => {
            const toastId = showMessage('PROCESSING');
            setTimeout(() => {
              // Dismiss after 2 seconds for demo
              showMessage('LOGIN_SUCCESS');
            }, 2000);
          }}
          variant="outline"
          className="border-nuanced-500 text-anthracite-700 hover:bg-platinum-50"
        >
          Show Loading Toast
        </Button>

        <Button
          onClick={() => showMessage('NETWORK_ERROR')}
          variant="outline"
          className="border-error text-error hover:bg-error/10"
        >
          Show Network Error
        </Button>
      </div>

      <div className="mt-8 p-4 bg-platinum-50 rounded-lg">
        <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>✅ Mientior brand colors (Orange #FF6B00, Blue #1E3A8A, Aurore #FFC107)</li>
          <li>✅ Distinct visual styles for each message type</li>
          <li>✅ Icons with proper aria-labels for accessibility</li>
          <li>✅ WCAG AA color contrast compliance</li>
          <li>✅ Smooth slide-in/slide-out animations</li>
          <li>✅ Hover to pause auto-dismiss</li>
          <li>✅ Keyboard dismissal (Escape key)</li>
          <li>✅ Close button on all toasts (except loading)</li>
        </ul>
      </div>
    </div>
  );
}
