'use client';

import { App } from 'antd';

/**
 * Hook to access Ant Design's App context for message, notification, and modal.
 * This ensures proper theming and context access.
 * 
 * Usage:
 * const { message, notification, modal } = useApp();
 * message.success('Done!');
 */
export function useApp() {
  return App.useApp();
}

export default useApp;
