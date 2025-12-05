'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { theme as antdTheme } from 'antd';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  // Detect system preference
  const getSystemPreference = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  // Update isDark based on mode
  const updateIsDark = useCallback((currentMode: ThemeMode) => {
    if (currentMode === 'system') {
      setIsDark(getSystemPreference());
    } else {
      setIsDark(currentMode === 'dark');
    }
  }, [getSystemPreference]);

  // Load saved preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-theme-mode') as ThemeMode | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setModeState(saved);
        updateIsDark(saved);
      } else {
        updateIsDark('system');
      }
    }
  }, [updateIsDark]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        setIsDark(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    updateIsDark(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-theme-mode', newMode);
    }
  }, [updateIsDark]);

  const toggleTheme = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  }, [isDark, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Ant Design theme configuration
export function useAntdTheme() {
  const { isDark } = useTheme();

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      ...(isDark ? {
        colorBgContainer: '#141414',
        colorBgElevated: '#1f1f1f',
        colorBgLayout: '#000000',
        colorBorder: '#303030',
        colorBorderSecondary: '#303030',
      } : {}),
    },
    components: {
      Layout: {
        siderBg: isDark ? '#141414' : '#001529',
        headerBg: isDark ? '#141414' : '#fff',
        bodyBg: isDark ? '#000000' : '#f0f2f5',
      },
      Menu: {
        darkItemBg: isDark ? '#141414' : '#001529',
        darkSubMenuItemBg: isDark ? '#1f1f1f' : '#000c17',
      },
      Card: {
        colorBgContainer: isDark ? '#141414' : '#fff',
      },
      Table: {
        colorBgContainer: isDark ? '#141414' : '#fff',
        headerBg: isDark ? '#1f1f1f' : '#fafafa',
      },
      Modal: {
        contentBg: isDark ? '#1f1f1f' : '#fff',
        headerBg: isDark ? '#1f1f1f' : '#fff',
      },
    },
  };
}
