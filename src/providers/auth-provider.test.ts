import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authProvider } from './auth-provider'

// Mock fetch globally
global.fetch = vi.fn()

describe('Auth Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('check()', () => {
    it('should return authenticated true when admin check succeeds', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'SUPER_ADMIN',
          },
        }),
      } as Response)

      const result = await authProvider.check!()

      expect(result).toEqual({ authenticated: true })
      expect(fetch).toHaveBeenCalledWith('/api/auth/admin/check', {
        method: 'GET',
        credentials: 'include',
      })
    })

    it('should redirect to login when not authenticated (401)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ authenticated: false }),
      } as Response)

      const result = await authProvider.check!()

      expect(result).toEqual({
        authenticated: false,
        redirectTo: '/admin/login',
        error: {
          message: 'Please login to access the admin panel',
          name: 'Unauthorized',
        },
      })
    })

    it('should redirect to login when account is deactivated (403)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ authenticated: false }),
      } as Response)

      const result = await authProvider.check!()

      expect(result).toEqual({
        authenticated: false,
        redirectTo: '/admin/login',
        error: {
          message: 'Your account is deactivated. Please contact support.',
          name: 'Forbidden',
        },
      })
    })

    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await authProvider.check!()

      expect(result).toEqual({
        authenticated: false,
        redirectTo: '/admin/login',
        error: {
          message: 'Authentication check failed',
          name: 'Unauthorized',
        },
      })
    })
  })

  describe('getIdentity()', () => {
    it('should return admin user identity', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'SUPER_ADMIN',
          },
        }),
      } as Response)

      const result = await authProvider.getIdentity!()

      expect(result).toEqual({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'SUPER_ADMIN',
        avatar: null,
      })
    })

    it('should return null when not authenticated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ authenticated: false }),
      } as Response)

      const result = await authProvider.getIdentity!()

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await authProvider.getIdentity!()

      expect(result).toBeNull()
    })
  })

  describe('logout()', () => {
    it('should logout successfully and redirect to admin login', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const result = await authProvider.logout!()

      expect(result).toEqual({
        success: true,
        redirectTo: '/admin/login',
      })
      expect(fetch).toHaveBeenCalledWith('/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('should handle logout errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)

      const result = await authProvider.logout!()

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Failed to logout. Please try again.',
          name: 'LogoutError',
        },
      })
    })
  })

  describe('login()', () => {
    it('should return success with redirect to admin', async () => {
      const result = await authProvider.login!()

      expect(result).toEqual({
        success: true,
        redirectTo: '/admin',
      })
    })
  })

  describe('getPermissions()', () => {
    it('should return admin role and permissions', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'SUPER_ADMIN',
            permissions: ['PRODUCTS_READ', 'PRODUCTS_WRITE', 'ORDERS_READ'],
          },
        }),
      } as Response)

      const result = await authProvider.getPermissions!()

      expect(result).toEqual({
        role: 'SUPER_ADMIN',
        permissions: ['PRODUCTS_READ', 'PRODUCTS_WRITE', 'ORDERS_READ'],
      })
      expect(fetch).toHaveBeenCalledWith('/api/auth/admin/check', {
        method: 'GET',
        credentials: 'include',
      })
    })

    it('should return null when not authenticated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ authenticated: false }),
      } as Response)

      const result = await authProvider.getPermissions!()

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await authProvider.getPermissions!()

      expect(result).toBeNull()
    })

    it('should handle missing permissions array', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'admin-1',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'VIEWER',
          },
        }),
      } as Response)

      const result = await authProvider.getPermissions!()

      expect(result).toEqual({
        role: 'VIEWER',
        permissions: [],
      })
    })
  })

  describe('onError()', () => {
    it('should handle 401 errors with logout and redirect', async () => {
      const error = { statusCode: 401, message: 'Unauthorized' }

      const result = await authProvider.onError!(error)

      expect(result).toEqual({
        error,
        logout: true,
        redirectTo: '/admin/login',
      })
    })

    it('should handle other errors without logout', async () => {
      const error = { statusCode: 500, message: 'Server error' }

      const result = await authProvider.onError!(error)

      expect(result).toEqual({ error })
    })
  })
})
