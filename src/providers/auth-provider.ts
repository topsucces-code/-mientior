import type { AuthProvider } from '@refinedev/core';

/**
 * Client-side auth provider for Refine admin panel
 * 
 * This provider integrates Better Auth with Refine's authentication system.
 * It uses fetch to call server APIs instead of direct server imports to work
 * in the client-side context.
 * 
 * Requirements:
 * - 5.1: Redirect unauthenticated admin requests to /admin/login
 * - 5.2: Verify AdminUser record exists and is active
 */
export const authProvider: AuthProvider = {
  /**
   * Login is handled by the admin login page (/admin/login)
   * This method is just a placeholder for Refine's auth flow
   */
  login: async () => {
    return { success: true, redirectTo: '/admin' };
  },

  /**
   * Logout handler
   * Calls Better Auth sign-out API and redirects to admin login
   * 
   * Requirements: 5.1, 5.2
   */
  logout: async () => {
    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        return { 
          success: true, 
          redirectTo: '/admin/login',
        };
      }
      
      throw new Error('Logout failed');
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: { 
          message: 'Failed to logout. Please try again.', 
          name: 'LogoutError' 
        } 
      };
    }
  },

  /**
   * Check authentication status
   * Verifies that the user has a valid admin session
   * 
   * This method is called by Refine on every route change to ensure
   * the user is authenticated and has admin privileges.
   * 
   * Requirements: 5.1, 5.2
   * - Checks if AdminUser record exists
   * - Verifies AdminUser.isActive = true
   * - Redirects to /admin/login if not authenticated
   */
  check: async () => {
    try {
      const response = await fetch('/api/auth/admin/check', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Verify authenticated and user data exists
        if (data?.authenticated && data?.user) {
          return { authenticated: true };
        }
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        return {
          authenticated: false,
          redirectTo: '/admin/login',
          error: { 
            message: 'Please login to access the admin panel', 
            name: 'Unauthorized' 
          },
        };
      }
      
      if (response.status === 403) {
        return {
          authenticated: false,
          redirectTo: '/admin/login',
          error: { 
            message: 'Your account is deactivated. Please contact support.', 
            name: 'Forbidden' 
          },
        };
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
    
    // Default: not authenticated
    return {
      authenticated: false,
      redirectTo: '/admin/login',
      error: { 
        message: 'Authentication check failed', 
        name: 'Unauthorized' 
      },
    };
  },

  /**
   * Get current user identity
   * Returns admin user information for display in the UI
   * 
   * Requirements: 5.2
   * - Returns admin user info (name, email, role)
   * - Used by Refine to display user info in header
   */
  getIdentity: async () => {
    try {
      const response = await fetch('/api/auth/admin/check', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.user) {
          return {
            id: data.user.id,
            name: `${data.user.firstName} ${data.user.lastName}`,
            email: data.user.email,
            role: data.user.role,
            avatar: null,
          };
        }
      }
    } catch (error) {
      console.error('Get identity error:', error);
    }
    
    return null;
  },

  /**
   * Get user permissions
   * Returns admin role and permissions for access control
   * 
   * Requirements: 5.3
   * - Returns admin role and permissions
   * - Used by Refine access control provider to check permissions
   */
  getPermissions: async () => {
    try {
      const response = await fetch('/api/auth/admin/check', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.user) {
          return {
            role: data.user.role,
            permissions: data.user.permissions || [],
          };
        }
      }
    } catch (error) {
      console.error('Get permissions error:', error);
    }
    
    return null;
  },

  /**
   * Error handler
   * Called when an error occurs during authentication operations
   */
  onError: async (error) => {
    console.error('Auth error:', error);
    
    // Handle 401 errors by redirecting to login
    if (error?.statusCode === 401) {
      return {
        error,
        logout: true,
        redirectTo: '/admin/login',
      };
    }
    
    return { error };
  },
};
