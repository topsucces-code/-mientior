import type { AccessControlProvider } from '@refinedev/core';

// Client-side access control provider
// Uses fetch to check permissions via API
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    try {
      // Call API to check permission
      const response = await fetch('/api/admin/check-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ resource, action }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return { can: data.can };
      }
    } catch (error) {
      console.error('Permission check error:', error);
    }
    
    // Default to denying access if check fails
    return { can: false };
  },
};
