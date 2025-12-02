/**
 * Tests for useAuthFeedback hook
 * 
 * These tests verify the basic functionality of the authentication
 * feedback hook including message display and dismissal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';

// Mock the sonner toast library
vi.mock('sonner', () => ({
  toast: Object.assign(
    vi.fn(() => 'toast-id-1'),
    {
      success: vi.fn(() => 'toast-id-success'),
      error: vi.fn(() => 'toast-id-error'),
      warning: vi.fn(() => 'toast-id-warning'),
      info: vi.fn(() => 'toast-id-info'),
      loading: vi.fn(() => 'toast-id-loading'),
      dismiss: vi.fn(),
    }
  ),
}));

// Import after mocking
const { useAuthFeedback } = await import('./use-auth-feedback');

describe('useAuthFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showMessage', () => {
    it('should display a success message', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('LOGIN_SUCCESS');

      expect(toast.success).toHaveBeenCalledWith(
        'Connexion réussie',
        expect.objectContaining({
          description: 'Bienvenue ! Redirection vers votre compte...',
          duration: 2000,
          ariaLive: 'polite',
          closeButton: true,
        })
      );
    });

    it('should display an error message with assertive ARIA', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('INVALID_CREDENTIALS');

      expect(toast.error).toHaveBeenCalledWith(
        'Identifiants incorrects',
        expect.objectContaining({
          ariaLive: 'assertive',
          closeButton: true,
        })
      );
    });

    it('should display a message with dynamic parameters', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('REGISTER_SUCCESS', { email: 'test@example.com' });

      expect(toast.success).toHaveBeenCalledWith(
        'Inscription réussie !',
        expect.objectContaining({
          description: expect.stringContaining('test@example.com'),
        })
      );
    });

    it('should display a loading message without close button', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('PROCESSING_LOGIN');

      expect(toast.loading).toHaveBeenCalledWith(
        'Connexion en cours...',
        expect.objectContaining({
          closeButton: false,
        })
      );
    });

    it('should display a warning message', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('SESSION_EXPIRED');

      expect(toast.warning).toHaveBeenCalledWith(
        'Session expirée',
        expect.objectContaining({
          ariaLive: 'polite',
        })
      );
    });

    it('should display an info message', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('CHECK_EMAIL', { email: 'user@example.com' });

      expect(toast.info).toHaveBeenCalledWith(
        'Vérifiez votre email',
        expect.objectContaining({
          description: expect.stringContaining('user@example.com'),
        })
      );
    });

    it('should return a toast ID', () => {
      const { showMessage } = useAuthFeedback();

      const toastId = showMessage('LOGIN_SUCCESS');

      expect(toastId).toBe('toast-id-success');
    });

    it('should include auth-toast CSS class', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('LOGIN_SUCCESS');

      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          className: 'auth-toast auth-toast-success',
        })
      );
    });
  });

  describe('dismissMessage', () => {
    it('should dismiss a specific message by ID', () => {
      const { dismissMessage } = useAuthFeedback();

      dismissMessage('toast-id-1');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-id-1');
    });

    it('should dismiss all messages when no ID provided', () => {
      const { dismissMessage } = useAuthFeedback();

      dismissMessage();

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('ARIA live regions', () => {
    it('should use assertive for error messages', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('EMAIL_ALREADY_EXISTS');

      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ariaLive: 'assertive',
        })
      );
    });

    it('should use polite for success messages', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('REGISTER_SUCCESS', { email: 'test@example.com' });

      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ariaLive: 'polite',
        })
      );
    });

    it('should use polite for info messages', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('CHECK_EMAIL', { email: 'test@example.com' });

      expect(toast.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ariaLive: 'polite',
        })
      );
    });

    it('should use polite for warning messages', () => {
      const { showMessage } = useAuthFeedback();

      showMessage('RATE_LIMIT_EXCEEDED', { retryAfter: 60 });

      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ariaLive: 'polite',
        })
      );
    });
  });
});
