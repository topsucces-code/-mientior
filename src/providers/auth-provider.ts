import type { AuthProvider } from '@refinedev/core';

// Client-side auth provider for Refine
// Uses fetch to call server APIs instead of direct server imports
export const authProvider: AuthProvider = {
  login: async () => {
    // Better Auth handles login, this is just a placeholder
    return { success: true, redirectTo: '/admin' };
  },
  logout: async () => {
    // Call Better Auth logout via API
    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return { success: true, redirectTo: '/auth/sign-in' };
      }
      throw new Error('Logout failed');
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: { message: 'Logout failed', name: 'LogoutError' } };
    }
  },
  check: async () => {
    try {
      // Check auth status via API call
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.user) {
          return { authenticated: true };
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
    
    return {
      authenticated: false,
      redirectTo: '/auth/sign-in',
      error: { message: 'Not authenticated', name: 'Unauthorized' },
    };
  },
  getIdentity: async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.user) {
          return {
            id: data.user.id,
            name: data.user.name || data.user.email,
            email: data.user.email,
            avatar: data.user.image,
          };
        }
      }
    } catch (error) {
      console.error('Get identity error:', error);
    }
    
    return null;
  },
  onError: async (error) => {
    console.error('Auth error:', error);
    return { error };
  },
};
