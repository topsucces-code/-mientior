/**
 * Centralized Authentication Feedback Messages
 * 
 * This module provides all user-facing messages for authentication flows
 * in French language, following WCAG accessibility guidelines.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

// Message type definitions
export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface MessageAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface AuthMessage<TParams = Record<string, unknown>> {
  title: string;
  description: string | ((params: TParams) => string);
  type: MessageType;
  duration: number; // milliseconds, Infinity for manual dismiss only
  action?: MessageAction;
}

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;

/**
 * Centralized message definitions for authentication flows
 * All messages are in French (Requirements 7.1, 7.2, 7.3, 7.4, 7.5)
 */
export const AUTH_MESSAGES = {
  // ============================================================================
  // REGISTRATION SUCCESS MESSAGES
  // ============================================================================
  
  REGISTER_SUCCESS: {
    title: 'Inscription réussie !',
    description: (params: { email: string }) => 
      `Votre compte a été créé avec succès. Un email de vérification a été envoyé à ${params.email}. Veuillez vérifier votre boîte de réception.`,
    type: 'success' as const,
    duration: 5000,
    // Action button will be added dynamically by the component
  },
  
  REGISTER_SUCCESS_NO_VERIFICATION: {
    title: 'Inscription réussie !',
    description: 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
    type: 'success' as const,
    duration: 5000,
  },

  // ============================================================================
  // REGISTRATION ERROR MESSAGES
  // ============================================================================
  
  EMAIL_ALREADY_EXISTS: {
    title: 'Email déjà utilisé',
    description: 'Cet email est déjà associé à un compte existant. Essayez de vous connecter ou utilisez une autre adresse email.',
    type: 'error' as const,
    duration: Infinity, // Manual dismiss only
  },
  
  WEAK_PASSWORD: {
    title: 'Mot de passe trop faible',
    description: (params: { requirements: string[] }) => {
      const reqList = params.requirements.join(', ');
      return `Votre mot de passe doit contenir : ${reqList}`;
    },
    type: 'error' as const,
    duration: Infinity,
  },
  
  INVALID_EMAIL_FORMAT: {
    title: 'Format d\'email invalide',
    description: 'Veuillez entrer une adresse email valide.',
    type: 'error' as const,
    duration: Infinity,
  },
  
  REGISTRATION_FAILED: {
    title: 'Échec de l\'inscription',
    description: 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.',
    type: 'error' as const,
    duration: Infinity,
  },

  // ============================================================================
  // LOGIN SUCCESS MESSAGES
  // ============================================================================
  
  LOGIN_SUCCESS: {
    title: 'Connexion réussie',
    description: 'Bienvenue ! Redirection vers votre compte...',
    type: 'success' as const,
    duration: 2000,
  },
  
  LOGIN_SUCCESS_WELCOME_BACK: {
    title: 'Bon retour !',
    description: (params: { name: string }) => 
      `Content de vous revoir, ${params.name} ! Redirection en cours...`,
    type: 'success' as const,
    duration: 2000,
  },

  // ============================================================================
  // LOGIN ERROR MESSAGES
  // ============================================================================
  
  INVALID_CREDENTIALS: {
    title: 'Identifiants incorrects',
    description: 'Email ou mot de passe incorrect. Veuillez vérifier vos informations et réessayer.',
    type: 'error' as const,
    duration: Infinity,
  },
  
  EMAIL_NOT_VERIFIED: {
    title: 'Email non vérifié',
    description: 'Veuillez vérifier votre email avant de vous connecter. Un email de vérification vous a été envoyé lors de votre inscription.',
    type: 'error' as const,
    duration: Infinity,
  },
  
  ACCOUNT_LOCKED: {
    title: 'Compte temporairement verrouillé',
    description: (params: { duration: number; attempts?: number }) => {
      const minutes = Math.ceil(params.duration);
      const attemptsText = params.attempts ? ` après ${params.attempts} tentatives échouées` : '';
      return `Votre compte a été temporairement verrouillé${attemptsText}. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    },
    type: 'error' as const,
    duration: Infinity,
  },
  
  ACCOUNT_DISABLED: {
    title: 'Compte désactivé',
    description: 'Votre compte a été désactivé. Veuillez contacter le support pour plus d\'informations.',
    type: 'error' as const,
    duration: Infinity,
  },

  // ============================================================================
  // EMAIL VERIFICATION MESSAGES
  // ============================================================================
  
  EMAIL_VERIFICATION_SENT: {
    title: 'Email de vérification envoyé',
    description: (params: { email: string }) => 
      `Un nouvel email de vérification a été envoyé à ${params.email}. Veuillez vérifier votre boîte de réception.`,
    type: 'success' as const,
    duration: 5000,
  },
  
  EMAIL_VERIFIED_SUCCESS: {
    title: 'Email vérifié avec succès',
    description: 'Votre adresse email a été vérifiée. Vous pouvez maintenant vous connecter.',
    type: 'success' as const,
    duration: 5000,
  },
  
  EMAIL_VERIFICATION_FAILED: {
    title: 'Échec de la vérification',
    description: 'Le lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.',
    type: 'error' as const,
    duration: Infinity,
  },
  
  EMAIL_VERIFICATION_EXPIRED: {
    title: 'Lien de vérification expiré',
    description: 'Ce lien de vérification a expiré. Veuillez demander un nouveau lien de vérification.',
    type: 'warning' as const,
    duration: 7000,
  },

  // ============================================================================
  // PASSWORD RESET MESSAGES
  // ============================================================================
  
  PASSWORD_RESET_EMAIL_SENT: {
    title: 'Email de réinitialisation envoyé',
    description: (params: { email: string }) => 
      `Un email de réinitialisation de mot de passe a été envoyé à ${params.email}. Veuillez vérifier votre boîte de réception.`,
    type: 'success' as const,
    duration: 5000,
  },
  
  PASSWORD_RESET_SUCCESS: {
    title: 'Mot de passe réinitialisé',
    description: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
    type: 'success' as const,
    duration: 5000,
  },
  
  PASSWORD_RESET_FAILED: {
    title: 'Échec de la réinitialisation',
    description: 'Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.',
    type: 'error' as const,
    duration: Infinity,
  },
  
  PASSWORD_RESET_LINK_EXPIRED: {
    title: 'Lien de réinitialisation expiré',
    description: 'Ce lien de réinitialisation a expiré. Veuillez demander un nouveau lien.',
    type: 'warning' as const,
    duration: 7000,
  },
  
  PASSWORD_SAME_AS_OLD: {
    title: 'Mot de passe identique',
    description: 'Votre nouveau mot de passe doit être différent de l\'ancien.',
    type: 'error' as const,
    duration: Infinity,
  },

  // ============================================================================
  // NETWORK AND SYSTEM ERROR MESSAGES
  // ============================================================================
  
  NETWORK_ERROR: {
    title: 'Erreur de connexion',
    description: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.',
    type: 'error' as const,
    duration: 7000,
  },
  
  SERVER_ERROR: {
    title: 'Erreur serveur',
    description: 'Une erreur est survenue sur le serveur. Veuillez réessayer dans quelques instants.',
    type: 'error' as const,
    duration: 7000,
  },
  
  RATE_LIMIT_EXCEEDED: {
    title: 'Trop de tentatives',
    description: (params: { retryAfter?: number }) => {
      if (params.retryAfter) {
        const minutes = Math.ceil(params.retryAfter / 60);
        return `Vous avez effectué trop de tentatives. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      }
      return 'Vous avez effectué trop de tentatives. Veuillez réessayer plus tard.';
    },
    type: 'warning' as const,
    duration: 7000,
  },
  
  SESSION_EXPIRED: {
    title: 'Session expirée',
    description: 'Votre session a expiré. Veuillez vous reconnecter.',
    type: 'warning' as const,
    duration: 5000,
  },

  // ============================================================================
  // LOADING STATES
  // ============================================================================
  
  PROCESSING_REGISTRATION: {
    title: 'Inscription en cours...',
    description: 'Création de votre compte. Veuillez patienter.',
    type: 'loading' as const,
    duration: Infinity,
  },
  
  PROCESSING_LOGIN: {
    title: 'Connexion en cours...',
    description: 'Vérification de vos identifiants. Veuillez patienter.',
    type: 'loading' as const,
    duration: Infinity,
  },
  
  PROCESSING_PASSWORD_RESET: {
    title: 'Traitement en cours...',
    description: 'Envoi de l\'email de réinitialisation. Veuillez patienter.',
    type: 'loading' as const,
    duration: Infinity,
  },
  
  PROCESSING_EMAIL_VERIFICATION: {
    title: 'Vérification en cours...',
    description: 'Vérification de votre email. Veuillez patienter.',
    type: 'loading' as const,
    duration: Infinity,
  },

  // ============================================================================
  // OAUTH MESSAGES
  // ============================================================================
  
  OAUTH_SUCCESS: {
    title: 'Connexion réussie',
    description: (params: { provider: string }) => 
      `Connexion avec ${params.provider} réussie. Redirection en cours...`,
    type: 'success' as const,
    duration: 2000,
  },
  
  OAUTH_FAILED: {
    title: 'Échec de la connexion',
    description: (params: { provider: string }) => 
      `La connexion avec ${params.provider} a échoué. Veuillez réessayer ou utiliser une autre méthode.`,
    type: 'error' as const,
    duration: Infinity,
  },
  
  OAUTH_ACCOUNT_LINKED: {
    title: 'Compte lié avec succès',
    description: (params: { provider: string }) => 
      `Votre compte ${params.provider} a été lié avec succès.`,
    type: 'success' as const,
    duration: 5000,
  },
  
  OAUTH_EMAIL_ALREADY_EXISTS: {
    title: 'Email déjà utilisé',
    description: 'Un compte existe déjà avec cet email. Veuillez vous connecter avec votre email et mot de passe.',
    type: 'error' as const,
    duration: Infinity,
  },

  // ============================================================================
  // VALIDATION MESSAGES
  // ============================================================================
  
  VALIDATION_ERROR: {
    title: 'Erreur de validation',
    description: 'Veuillez vérifier les informations saisies et corriger les erreurs.',
    type: 'error' as const,
    duration: Infinity,
  },
  
  REQUIRED_FIELD: {
    title: 'Champ requis',
    description: (params: { field: string }) => 
      `Le champ "${params.field}" est requis.`,
    type: 'error' as const,
    duration: Infinity,
  },
  
  PASSWORDS_DO_NOT_MATCH: {
    title: 'Mots de passe différents',
    description: 'Les mots de passe ne correspondent pas. Veuillez vérifier et réessayer.',
    type: 'error' as const,
    duration: Infinity,
  },

  // ============================================================================
  // INFORMATIONAL MESSAGES
  // ============================================================================
  
  CHECK_EMAIL: {
    title: 'Vérifiez votre email',
    description: (params: { email: string }) => 
      `Un email a été envoyé à ${params.email}. Veuillez vérifier votre boîte de réception et suivre les instructions.`,
    type: 'info' as const,
    duration: 7000,
  },
  
  LOGOUT_SUCCESS: {
    title: 'Déconnexion réussie',
    description: 'Vous avez été déconnecté avec succès. À bientôt !',
    type: 'success' as const,
    duration: 3000,
  },
  
  PROFILE_UPDATED: {
    title: 'Profil mis à jour',
    description: 'Vos informations ont été mises à jour avec succès.',
    type: 'success' as const,
    duration: 3000,
  },
} as const;

/**
 * Helper function to get a message with parameters
 * @param key - The message key
 * @param params - Optional parameters for dynamic content
 * @returns The complete message object with resolved description
 */
export function getAuthMessage(
  key: AuthMessageKey,
  params?: Record<string, unknown>
): Omit<AuthMessage, 'description'> & { description: string } {
  const message = AUTH_MESSAGES[key];
  
  const description = typeof message.description === 'function'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? message.description(params as any)
    : message.description;
  
  return {
    ...message,
    description,
  };
}

/**
 * Helper function to check if a message requires parameters
 * @param key - The message key
 * @returns true if the message description is a function (requires parameters)
 */
export function messageRequiresParams(key: AuthMessageKey): boolean {
  return typeof AUTH_MESSAGES[key].description === 'function';
}

/**
 * Get all message keys by type
 * @param type - The message type to filter by
 * @returns Array of message keys matching the type
 */
export function getMessageKeysByType(type: MessageType): AuthMessageKey[] {
  return Object.entries(AUTH_MESSAGES)
    .filter(([_, message]) => message.type === type)
    .map(([key]) => key as AuthMessageKey);
}
