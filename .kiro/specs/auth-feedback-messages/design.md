# Design Document

## Overview

This design document outlines the implementation of an enhanced user feedback system for authentication processes in the Mientior e-commerce platform. The system will provide clear, accessible, and localized feedback messages for registration, login, and related authentication operations using toast notifications and inline form errors.

## Architecture

### Component Structure

```
src/
├── components/
│   └── ui/
│       ├── toast.tsx (existing - from shadcn/ui)
│       └── auth-feedback.tsx (new - wrapper for auth-specific messages)
├── lib/
│   └── auth-messages.ts (new - centralized message definitions)
└── hooks/
    └── use-auth-feedback.ts (new - custom hook for auth feedback)
```

### Technology Stack

- **UI Library**: shadcn/ui Toast component (based on Radix UI)
- **Notification System**: Sonner (already installed)
- **State Management**: React hooks (useState, useEffect)
- **Accessibility**: ARIA live regions, semantic HTML
- **Styling**: Tailwind CSS with Mientior brand colors

## Components and Interfaces

### 1. Message Definitions (`src/lib/auth-messages.ts`)

Centralized message definitions for consistency and easy localization:

```typescript
export const AUTH_MESSAGES = {
  // Registration Success
  REGISTER_SUCCESS: {
    title: 'Inscription réussie !',
    description: (email: string) => 
      `Votre compte a été créé. Un email de vérification a été envoyé à ${email}.`,
    type: 'success' as const,
    duration: 5000,
  },
  
  // Registration Errors
  EMAIL_ALREADY_EXISTS: {
    title: 'Email déjà utilisé',
    description: 'Cet email est déjà associé à un compte. Essayez de vous connecter ou utilisez un autre email.',
    type: 'error' as const,
    duration: Infinity, // Manual dismiss only
  },
  
  WEAK_PASSWORD: {
    title: 'Mot de passe trop faible',
    description: (requirements: string[]) => 
      `Votre mot de passe doit contenir : ${requirements.join(', ')}`,
    type: 'error' as const,
    duration: Infinity,
  },
  
  // Login Success
  LOGIN_SUCCESS: {
    title: 'Connexion réussie',
    description: 'Redirection vers votre compte...',
    type: 'success' as const,
    duration: 2000,
  },
  
  // Login Errors
  INVALID_CREDENTIALS: {
    title: 'Identifiants incorrects',
    description: 'Email ou mot de passe incorrect. Veuillez réessayer.',
    type: 'error' as const,
    duration: Infinity,
  },
  
  EMAIL_NOT_VERIFIED: {
    title: 'Email non vérifié',
    description: 'Veuillez vérifier votre email avant de vous connecter.',
    type: 'error' as const,
    duration: Infinity,
    action: {
      label: 'Renvoyer l\'email',
      onClick: () => {}, // Will be provided by component
    },
  },
  
  ACCOUNT_LOCKED: {
    title: 'Compte temporairement verrouillé',
    description: (duration: number) => 
      `Trop de tentatives échouées. Réessayez dans ${duration} minutes.`,
    type: 'error' as const,
    duration: Infinity,
  },
  
  // Network Errors
  NETWORK_ERROR: {
    title: 'Erreur de connexion',
    description: 'Impossible de se connecter au serveur. Veuillez réessayer.',
    type: 'error' as const,
    duration: 7000,
  },
  
  // Loading States
  PROCESSING: {
    title: 'Traitement en cours...',
    description: 'Veuillez patienter',
    type: 'loading' as const,
    duration: Infinity,
  },
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
```

### 2. Custom Hook (`src/hooks/use-auth-feedback.ts`)

```typescript
import { toast } from 'sonner';
import { AUTH_MESSAGES, type AuthMessageKey } from '@/lib/auth-messages';

export function useAuthFeedback() {
  const showMessage = (
    messageKey: AuthMessageKey,
    params?: Record<string, any>
  ) => {
    const message = AUTH_MESSAGES[messageKey];
    
    const description = typeof message.description === 'function'
      ? message.description(params)
      : message.description;
    
    const toastOptions = {
      duration: message.duration,
      action: message.action,
      className: `auth-toast auth-toast-${message.type}`,
      ariaLive: 'polite' as const,
    };
    
    switch (message.type) {
      case 'success':
        return toast.success(message.title, {
          description,
          ...toastOptions,
        });
      case 'error':
        return toast.error(message.title, {
          description,
          ...toastOptions,
          ariaLive: 'assertive',
        });
      case 'loading':
        return toast.loading(message.title, {
          description,
          ...toastOptions,
        });
      default:
        return toast(message.title, {
          description,
          ...toastOptions,
        });
    }
  };
  
  const dismissMessage = (toastId?: string | number) => {
    if (toastId) {
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
```

### 3. Enhanced Auth Form Component

Update `src/components/auth/auth-form.tsx` to integrate feedback:

```typescript
'use client';

import { useState } from 'react';
import { useAuthFeedback } from '@/hooks/use-auth-feedback';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [isLoading, setIsLoading] = useState(false);
  const { showMessage, dismissMessage } = useAuthFeedback();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Show loading state
    const loadingToast = showMessage('PROCESSING');
    
    try {
      // Perform authentication
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      dismissMessage(loadingToast);
      
      if (response.ok) {
        showMessage('REGISTER_SUCCESS', { email: formData.email });
      } else {
        const error = await response.json();
        handleError(error);
      }
    } catch (error) {
      dismissMessage(loadingToast);
      showMessage('NETWORK_ERROR');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleError = (error: any) => {
    if (error.code === 'EMAIL_EXISTS') {
      showMessage('EMAIL_ALREADY_EXISTS');
    } else if (error.code === 'WEAK_PASSWORD') {
      showMessage('WEAK_PASSWORD', { requirements: error.requirements });
    }
    // ... other error cases
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative"
      >
        {isLoading ? (
          <>
            <span className="opacity-0">
              {mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">
                {mode === 'login' ? 'Connexion en cours...' : 'Inscription en cours...'}
              </span>
            </span>
          </>
        ) : (
          mode === 'login' ? 'Se connecter' : 'S\'inscrire'
        )}
      </button>
    </form>
  );
}
```

## Data Models

### Message Type Definition

```typescript
type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface AuthMessage {
  title: string;
  description: string | ((params: any) => string);
  type: MessageType;
  duration: number; // milliseconds, Infinity for manual dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Toast Configuration

```typescript
interface ToastConfig {
  position: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  theme: 'light' | 'dark' | 'system';
  richColors: boolean;
  closeButton: boolean;
  duration: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Success Message Contains Email
*For any* successful registration, the success message should contain the user's email address for confirmation.
**Validates: Requirements 1.3**

### Property 2: Error Messages Preserve Form Data
*For any* error during registration or login, all form fields (except password) should retain their values.
**Validates: Requirements 2.5, 4.5**

### Property 3: Loading State Disables Submission
*For any* authentication request in progress, the submit button should be disabled and show a loading indicator.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 4: Messages Have Appropriate ARIA Attributes
*For any* feedback message displayed, it should have appropriate ARIA live region attributes (polite for info/success, assertive for errors).
**Validates: Requirements 6.1, 6.2**

### Property 5: Icons Have Text Alternatives
*For any* message containing an icon, the icon should have an aria-label or equivalent text alternative.
**Validates: Requirements 6.4**

### Property 6: Messages Are Keyboard Dismissible
*For any* displayed message, pressing the Escape key should dismiss it.
**Validates: Requirements 6.5, 9.3**

### Property 7: All Messages Are In French
*For any* feedback message displayed, the text content should be in French language.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 8: Message Types Have Distinct Visual Styles
*For any* message type (success, error, warning, info), it should have a distinct color scheme matching the specification.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 9: Success Messages Auto-Dismiss
*For any* success message, it should automatically dismiss after its specified duration (5 seconds for registration, 2 seconds for login).
**Validates: Requirements 1.5, 3.2, 10.1**

### Property 10: Error Messages Persist Until Dismissed
*For any* error message, it should remain visible until manually dismissed by the user or the error is corrected.
**Validates: Requirements 10.2**

### Property 11: Loading Indicator Removes Quickly
*For any* completed authentication request, the loading indicator should be removed within 500ms of completion.
**Validates: Requirements 5.4, 10.4**

### Property 12: Hover Pauses Auto-Dismiss
*For any* message with auto-dismiss, hovering over it should pause the dismiss timer.
**Validates: Requirements 10.4**

## Error Handling

### Client-Side Error Handling

```typescript
// Error mapping from API responses to message keys
const ERROR_CODE_MAP: Record<string, AuthMessageKey> = {
  'EMAIL_EXISTS': 'EMAIL_ALREADY_EXISTS',
  'WEAK_PASSWORD': 'WEAK_PASSWORD',
  'INVALID_CREDENTIALS': 'INVALID_CREDENTIALS',
  'EMAIL_NOT_VERIFIED': 'EMAIL_NOT_VERIFIED',
  'ACCOUNT_LOCKED': 'ACCOUNT_LOCKED',
  'NETWORK_ERROR': 'NETWORK_ERROR',
};

function handleAuthError(error: any) {
  const messageKey = ERROR_CODE_MAP[error.code] || 'NETWORK_ERROR';
  showMessage(messageKey, error.params);
}
```

### API Response Format

```typescript
// Success response
{
  success: true,
  data: {
    user: { ... },
    requiresVerification: boolean
  }
}

// Error response
{
  success: false,
  error: {
    code: string,
    message: string,
    params?: Record<string, any>
  }
}
```

## Testing Strategy

### Unit Tests

Test individual message display functions:
- Message rendering with correct content
- ARIA attributes presence
- Icon and close button functionality
- Duration and auto-dismiss behavior

### Property-Based Tests

Using fast-check library for property testing:

**Property Test 1: Email in Success Message**
```typescript
import fc from 'fast-check';

test('success message contains user email', () => {
  fc.assert(
    fc.property(fc.emailAddress(), (email) => {
      const message = AUTH_MESSAGES.REGISTER_SUCCESS.description(email);
      expect(message).toContain(email);
    })
  );
});
```

**Property Test 2: Form Data Preservation**
```typescript
test('form data preserved on error', () => {
  fc.assert(
    fc.property(
      fc.record({
        email: fc.emailAddress(),
        name: fc.string(),
      }),
      async (formData) => {
        // Trigger error
        await submitForm(formData);
        // Check fields still have values
        expect(getFieldValue('email')).toBe(formData.email);
        expect(getFieldValue('name')).toBe(formData.name);
      }
    )
  );
});
```

**Property Test 3: French Language**
```typescript
test('all messages are in French', () => {
  Object.values(AUTH_MESSAGES).forEach((message) => {
    const text = typeof message.description === 'function'
      ? message.description({})
      : message.description;
    
    // Check for French-specific patterns
    expect(text).toMatch(/[àâäéèêëïîôùûüÿç]/i); // French accents
    expect(text).not.toMatch(/\b(the|and|or|please)\b/i); // English words
  });
});
```

### Integration Tests

Test complete authentication flows with feedback:
- Registration flow with success message
- Login flow with error handling
- Email verification reminder flow
- Account lockout flow

### E2E Tests (Playwright)

Test user-visible behavior:
- Toast notifications appear and dismiss correctly
- Loading states show during requests
- Error messages display for invalid inputs
- Success messages show after successful operations

## Styling

### Tailwind CSS Classes

```css
/* Toast variants */
.auth-toast-success {
  @apply bg-green-50 border-green-200 text-green-900;
}

.auth-toast-error {
  @apply bg-red-50 border-red-200 text-red-900;
}

.auth-toast-warning {
  @apply bg-orange-50 border-orange-200 text-orange-900;
}

.auth-toast-info {
  @apply bg-blue-50 border-blue-200 text-blue-900;
}

/* Loading button state */
.btn-loading {
  @apply relative cursor-not-allowed opacity-70;
}

.btn-loading-spinner {
  @apply absolute inset-0 flex items-center justify-center;
}
```

### Brand Color Integration

- Success: Green (#10B981) - complementary to Mientior orange
- Error: Red (#EF4444) - standard error color
- Warning: Aurore (#FFC107) - existing Mientior color
- Info: Blue (#1E3A8A) - existing Mientior color

## Accessibility Considerations

1. **ARIA Live Regions**: All toast notifications use aria-live="polite" (info/success) or aria-live="assertive" (errors)
2. **Keyboard Navigation**: Messages can be dismissed with Escape key
3. **Focus Management**: Focus returns to form after message dismissal
4. **Screen Reader Announcements**: Message content is announced automatically
5. **Color Contrast**: All text meets WCAG AA standards (4.5:1 minimum)
6. **Icon Alternatives**: All icons have aria-label attributes

## Performance Considerations

1. **Message Queuing**: Maximum 3 messages displayed simultaneously
2. **Animation Performance**: Use CSS transforms for smooth animations
3. **Memory Management**: Auto-dismiss messages to prevent memory leaks
4. **Debouncing**: Prevent duplicate messages within 1 second
5. **Lazy Loading**: Toast component loaded only when needed

## Security Considerations

1. **XSS Prevention**: All user-provided content (email) is sanitized before display
2. **Information Disclosure**: Error messages don't reveal sensitive information
3. **Rate Limiting**: Feedback for rate-limited actions shows appropriate messages
4. **CSRF Protection**: All authentication requests include CSRF tokens

## Migration Strategy

1. **Phase 1**: Add message definitions and custom hook
2. **Phase 2**: Update registration form with feedback
3. **Phase 3**: Update login form with feedback
4. **Phase 4**: Add E2E tests
5. **Phase 5**: Monitor and refine based on user feedback

## Dependencies

- `sonner`: ^1.0.0 (already installed)
- `@radix-ui/react-toast`: via shadcn/ui (already installed)
- `lucide-react`: for icons (already installed)
- `fast-check`: for property-based testing (already installed)

## Future Enhancements

1. **Analytics**: Track which error messages are most common
2. **A/B Testing**: Test different message wording for clarity
3. **Internationalization**: Support multiple languages beyond French
4. **Rich Media**: Add illustrations or animations to messages
5. **Sound Feedback**: Optional audio cues for accessibility
