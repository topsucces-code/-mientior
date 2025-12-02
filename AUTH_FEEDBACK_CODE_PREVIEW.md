# 💻 Aperçu du Code - Messages de Feedback

Voici à quoi ressemblera le code une fois implémenté.

---

## 📁 Fichier 1: Définitions des Messages

**`src/lib/auth-messages.ts`**

```typescript
export const AUTH_MESSAGES = {
  // ✅ Succès Inscription
  REGISTER_SUCCESS: {
    title: 'Inscription réussie !',
    description: (email: string) => 
      `Votre compte a été créé. Un email de vérification a été envoyé à ${email}.`,
    type: 'success',
    duration: 5000,
  },
  
  // ❌ Erreur: Email Existant
  EMAIL_ALREADY_EXISTS: {
    title: 'Email déjà utilisé',
    description: 'Cet email est déjà associé à un compte. Essayez de vous connecter ou utilisez un autre email.',
    type: 'error',
    duration: Infinity,
  },
  
  // ❌ Erreur: Mot de Passe Faible
  WEAK_PASSWORD: {
    title: 'Mot de passe trop faible',
    description: (requirements: string[]) => 
      `Votre mot de passe doit contenir : ${requirements.join(', ')}`,
    type: 'error',
    duration: Infinity,
  },
  
  // ✅ Succès Connexion
  LOGIN_SUCCESS: {
    title: 'Connexion réussie',
    description: 'Redirection vers votre compte...',
    type: 'success',
    duration: 2000,
  },
  
  // ❌ Erreur: Identifiants Incorrects
  INVALID_CREDENTIALS: {
    title: 'Identifiants incorrects',
    description: 'Email ou mot de passe incorrect. Veuillez réessayer.',
    type: 'error',
    duration: Infinity,
  },
  
  // ❌ Erreur: Email Non Vérifié
  EMAIL_NOT_VERIFIED: {
    title: 'Email non vérifié',
    description: 'Veuillez vérifier votre email avant de vous connecter.',
    type: 'error',
    duration: Infinity,
    action: {
      label: 'Renvoyer l\'email',
      onClick: () => {}, // Sera fourni par le composant
    },
  },
  
  // ❌ Erreur: Compte Verrouillé
  ACCOUNT_LOCKED: {
    title: 'Compte temporairement verrouillé',
    description: (duration: number) => 
      `Trop de tentatives échouées. Réessayez dans ${duration} minutes.`,
    type: 'error',
    duration: Infinity,
  },
  
  // ❌ Erreur: Réseau
  NETWORK_ERROR: {
    title: 'Erreur de connexion',
    description: 'Impossible de se connecter au serveur. Veuillez réessayer.',
    type: 'error',
    duration: 7000,
  },
};
```

---

## 📁 Fichier 2: Hook Personnalisé

**`src/hooks/use-auth-feedback.ts`**

```typescript
import { toast } from 'sonner';
import { AUTH_MESSAGES } from '@/lib/auth-messages';

export function useAuthFeedback() {
  const showMessage = (messageKey: keyof typeof AUTH_MESSAGES, params?: any) => {
    const message = AUTH_MESSAGES[messageKey];
    
    // Gérer les descriptions dynamiques
    const description = typeof message.description === 'function'
      ? message.description(params)
      : message.description;
    
    // Options du toast
    const options = {
      duration: message.duration,
      action: message.action,
      className: `auth-toast-${message.type}`,
    };
    
    // Afficher selon le type
    switch (message.type) {
      case 'success':
        return toast.success(message.title, { description, ...options });
      case 'error':
        return toast.error(message.title, { description, ...options });
      default:
        return toast(message.title, { description, ...options });
    }
  };
  
  const dismissMessage = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };
  
  return { showMessage, dismissMessage };
}
```

---

## 📁 Fichier 3: Utilisation dans le Formulaire

**`src/components/auth/auth-form.tsx`** (extrait)

```typescript
'use client';

import { useState } from 'react';
import { useAuthFeedback } from '@/hooks/use-auth-feedback';
import { Loader2 } from 'lucide-react';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const { showMessage, dismissMessage } = useAuthFeedback();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // ✅ Succès
        if (mode === 'register') {
          showMessage('REGISTER_SUCCESS', formData.email);
        } else {
          showMessage('LOGIN_SUCCESS');
          // Redirection après 2 secondes
          setTimeout(() => {
            window.location.href = '/account';
          }, 2000);
        }
      } else {
        // ❌ Erreur
        handleError(data.error);
      }
    } catch (error) {
      // ❌ Erreur réseau
      showMessage('NETWORK_ERROR');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleError = (error: any) => {
    switch (error.code) {
      case 'EMAIL_EXISTS':
        showMessage('EMAIL_ALREADY_EXISTS');
        break;
      case 'WEAK_PASSWORD':
        showMessage('WEAK_PASSWORD', error.requirements);
        break;
      case 'INVALID_CREDENTIALS':
        showMessage('INVALID_CREDENTIALS');
        break;
      case 'EMAIL_NOT_VERIFIED':
        showMessage('EMAIL_NOT_VERIFIED');
        break;
      case 'ACCOUNT_LOCKED':
        showMessage('ACCOUNT_LOCKED', error.duration);
        break;
      default:
        showMessage('NETWORK_ERROR');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Champs du formulaire */}
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        disabled={isLoading}
      />
      
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Mot de passe"
        disabled={isLoading}
      />
      
      {/* Bouton avec état de chargement */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full"
      >
        {isLoading ? (
          <>
            <span className="opacity-0">
              {mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {mode === 'login' ? 'Connexion en cours...' : 'Inscription en cours...'}
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

---

## 📁 Fichier 4: Réponses API Structurées

**`src/app/api/auth/register/route.ts`** (extrait)

```typescript
export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Cet email est déjà utilisé',
          },
        },
        { status: 400 }
      );
    }
    
    // Valider le mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Mot de passe trop faible',
            requirements: passwordValidation.missing,
          },
        },
        { status: 400 }
      );
    }
    
    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });
    
    // Envoyer l'email de vérification
    await sendVerificationEmail(email);
    
    return Response.json({
      success: true,
      data: { user, requiresVerification: true },
    });
    
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Erreur serveur',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Fichier 5: Styles Tailwind

**`src/app/globals.css`** (ajout)

```css
/* Toast Variants */
.auth-toast-success {
  @apply bg-green-50 border-green-200 text-green-900;
}

.auth-toast-success [data-icon] {
  @apply text-green-600;
}

.auth-toast-error {
  @apply bg-red-50 border-red-200 text-red-900;
}

.auth-toast-error [data-icon] {
  @apply text-red-600;
}

.auth-toast-warning {
  @apply bg-orange-50 border-orange-200 text-orange-900;
}

.auth-toast-warning [data-icon] {
  @apply text-orange-600;
}

.auth-toast-info {
  @apply bg-blue-50 border-blue-200 text-blue-900;
}

.auth-toast-info [data-icon] {
  @apply text-blue-600;
}

/* Loading Button */
.btn-loading {
  @apply relative cursor-not-allowed opacity-70;
}

.btn-loading-spinner {
  @apply absolute inset-0 flex items-center justify-center;
}
```

---

## 🧪 Fichier 6: Exemple de Test

**`src/hooks/use-auth-feedback.test.ts`**

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthFeedback } from './use-auth-feedback';
import { toast } from 'sonner';

jest.mock('sonner');

describe('useAuthFeedback', () => {
  it('should show success message with email', () => {
    const { result } = renderHook(() => useAuthFeedback());
    
    act(() => {
      result.current.showMessage('REGISTER_SUCCESS', 'test@example.com');
    });
    
    expect(toast.success).toHaveBeenCalledWith(
      'Inscription réussie !',
      expect.objectContaining({
        description: expect.stringContaining('test@example.com'),
      })
    );
  });
  
  it('should show error message for duplicate email', () => {
    const { result } = renderHook(() => useAuthFeedback());
    
    act(() => {
      result.current.showMessage('EMAIL_ALREADY_EXISTS');
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Email déjà utilisé',
      expect.objectContaining({
        description: expect.stringContaining('déjà associé'),
      })
    );
  });
});
```

---

## 📊 Résultat Visuel Attendu

### Message de Succès (Inscription)
```
┌─────────────────────────────────────────────┐
│ ✅ Inscription réussie !                    │
│                                             │
│ Votre compte a été créé. Un email de       │
│ vérification a été envoyé à                │
│ user@example.com.                           │
│                                             │
│ [Renvoyer l'email]                    [×]  │
└─────────────────────────────────────────────┘
```

### Message d'Erreur (Email Existant)
```
┌─────────────────────────────────────────────┐
│ ❌ Email déjà utilisé                       │
│                                             │
│ Cet email est déjà associé à un compte.    │
│ Essayez de vous connecter ou utilisez un   │
│ autre email.                                │
│                                        [×]  │
└─────────────────────────────────────────────┘
```

### Bouton avec Chargement
```
Avant:  [  Se connecter  ]
Pendant: [ ⏳ Connexion en cours... ]
Après:  [  Se connecter  ]
```

---

## 🚀 Comment Tester

### 1. Tester l'Inscription Réussie
```typescript
// Dans le navigateur
1. Aller sur /register
2. Remplir le formulaire avec un nouvel email
3. Soumettre
4. ✅ Voir le message "Inscription réussie !"
5. Message disparaît après 5 secondes
```

### 2. Tester l'Erreur Email Existant
```typescript
// Dans le navigateur
1. Aller sur /register
2. Remplir avec un email existant
3. Soumettre
4. ❌ Voir le message "Email déjà utilisé"
5. Message reste jusqu'à fermeture manuelle
```

### 3. Tester la Connexion
```typescript
// Dans le navigateur
1. Aller sur /login
2. Remplir avec des identifiants valides
3. Soumettre
4. ✅ Voir "Connexion réussie"
5. Redirection après 2 secondes
```

---

## 💡 Avantages de Cette Implémentation

### ✅ Centralisé
- Tous les messages au même endroit
- Facile à modifier
- Facile à traduire

### ✅ Réutilisable
- Hook personnalisé utilisable partout
- Pas de duplication de code

### ✅ Type-Safe
- TypeScript garantit les clés de messages
- Paramètres typés

### ✅ Accessible
- ARIA live regions automatiques
- Navigation clavier
- Contraste des couleurs

### ✅ Testable
- Tests unitaires simples
- Property-based tests
- Tests E2E

---

**Voilà à quoi ressemblera votre code !** 🎉

*Prêt à implémenter ? Consultez `tasks.md` pour commencer !*
