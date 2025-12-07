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

// Ant Design theme configuration - Palette "Frais & Confiant" (Turquoise/Orange)
export function useAntdTheme() {
  const { isDark } = useTheme();

  // Branding colors
  const colors = {
    turquoise: {
      primary: '#0891B2',    // turquoise-600
      light: '#06B6D4',      // turquoise-500
      dark: '#0E7490',       // turquoise-700
      bg: '#ECFEFF',         // turquoise-50
    },
    orange: {
      primary: '#F97316',    // orange-500
      light: '#FB923C',      // orange-400
      dark: '#EA580C',       // orange-600
    },
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  };

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      // Primary color: Turquoise (confiance)
      colorPrimary: colors.turquoise.primary,
      colorLink: colors.turquoise.primary,
      colorLinkHover: colors.turquoise.light,
      colorLinkActive: colors.turquoise.dark,
      
      // Success/Error/Warning
      colorSuccess: colors.success,
      colorError: colors.error,
      colorWarning: colors.warning,
      
      // Border radius
      borderRadius: 6,
      
      // Dark mode overrides
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
        siderBg: isDark ? '#141414' : '#fff',
        headerBg: isDark ? '#141414' : '#fff',
        bodyBg: isDark ? '#000000' : '#f5f5f5',
      },
      Menu: {
        itemSelectedBg: isDark ? colors.turquoise.dark : colors.turquoise.bg,
        itemSelectedColor: isDark ? colors.turquoise.light : colors.turquoise.primary,
        itemHoverBg: isDark ? '#1f1f1f' : colors.turquoise.bg,
        darkItemBg: isDark ? '#141414' : '#fff',
        darkSubMenuItemBg: isDark ? '#1f1f1f' : '#fafafa',
      },
      Button: {
        primaryColor: '#fff',
        colorPrimary: colors.turquoise.primary,
        colorPrimaryHover: colors.turquoise.light,
        colorPrimaryActive: colors.turquoise.dark,
        // Orange for danger/CTA actions
        colorError: colors.orange.primary,
        colorErrorHover: colors.orange.light,
        colorErrorActive: colors.orange.dark,
      },
      Card: {
        colorBgContainer: isDark ? '#141414' : '#fff',
      },
      Table: {
        colorBgContainer: isDark ? '#141414' : '#fff',
        headerBg: isDark ? '#1f1f1f' : '#fafafa',
        rowHoverBg: isDark ? '#1f1f1f' : colors.turquoise.bg,
      },
      Modal: {
        contentBg: isDark ? '#1f1f1f' : '#fff',
        headerBg: isDark ? '#1f1f1f' : '#fff',
      },
      Badge: {
        colorError: colors.orange.primary,
      },
      Tag: {
        colorSuccess: colors.success,
        colorError: colors.error,
        colorWarning: colors.warning,
        colorInfo: colors.turquoise.primary,
      },
      Tabs: {
        inkBarColor: colors.turquoise.primary,
        itemSelectedColor: colors.turquoise.primary,
        itemHoverColor: colors.turquoise.light,
      },
      Switch: {
        colorPrimary: colors.turquoise.primary,
        colorPrimaryHover: colors.turquoise.light,
      },
      Checkbox: {
        colorPrimary: colors.turquoise.primary,
        colorPrimaryHover: colors.turquoise.light,
      },
      Radio: {
        colorPrimary: colors.turquoise.primary,
        colorPrimaryHover: colors.turquoise.light,
      },
      Input: {
        activeBorderColor: colors.turquoise.primary,
        hoverBorderColor: colors.turquoise.light,
      },
      Select: {
        optionSelectedBg: colors.turquoise.bg,
        optionSelectedColor: colors.turquoise.primary,
      },
      DatePicker: {
        activeBorderColor: colors.turquoise.primary,
        hoverBorderColor: colors.turquoise.light,
      },
      Pagination: {
        itemActiveBg: colors.turquoise.primary,
        itemActiveColorDisabled: colors.turquoise.light,
      },
      Progress: {
        defaultColor: colors.turquoise.primary,
      },
      Spin: {
        colorPrimary: colors.turquoise.primary,
      },
    },
  };
}
