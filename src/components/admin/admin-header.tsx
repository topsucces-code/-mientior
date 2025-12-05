'use client';

import { Layout, Breadcrumb, Button, Space, Tooltip, Grid } from 'antd';
import { SearchOutlined, SunOutlined, MoonOutlined, MenuOutlined } from '@ant-design/icons';
import { useBreadcrumb } from '@refinedev/core';
import { NotificationsBell } from './notifications-bell';
import { LanguageSelector } from './language-selector';
import { UserAccountDropdown } from './user-account-dropdown';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/theme-context';

const { Header } = Layout;
const { useBreakpoint } = Grid;

interface AdminHeaderProps {
  onSearchOpen: () => void;
  onMobileMenuToggle?: () => void;
}

export function AdminHeader({ onSearchOpen, onMobileMenuToggle }: AdminHeaderProps) {
  const { breadcrumbs } = useBreadcrumb();
  const { t } = useTranslation('admin');
  const { isDark, toggleTheme } = useTheme();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Get keyboard shortcut based on platform
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isDark ? '#141414' : '#fff',
        borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
        padding: '0 24px',
        height: '64px',
      }}
    >
      {/* Left: Mobile Menu + Breadcrumbs */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isMobile && onMobileMenuToggle && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMobileMenuToggle}
            style={{ fontSize: '18px' }}
          />
        )}
        {!isMobile && (
          <Breadcrumb
            items={breadcrumbs.map((breadcrumb) => ({
              title: breadcrumb.label,
              href: breadcrumb.href,
            }))}
          />
        )}
      </div>

      {/* Center: Search Trigger */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Button
          type="default"
          icon={<SearchOutlined />}
          onClick={onSearchOpen}
          style={{
            width: '300px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#999' }}>{t('search.placeholder', 'Search...')}</span>
          <kbd
            style={{
              padding: '2px 6px',
              background: isDark ? '#303030' : '#f0f0f0',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: isDark ? '#fff' : '#000',
            }}
          >
            {shortcutKey}
          </kbd>
        </Button>
      </div>

      {/* Right: Actions */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Space size="middle">
          <Tooltip title={isDark ? t('theme.switchToLight', 'Light mode') : t('theme.switchToDark', 'Dark mode')}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ fontSize: '18px' }}
            />
          </Tooltip>
          <NotificationsBell />
          <LanguageSelector />
          <UserAccountDropdown />
        </Space>
      </div>
    </Header>
  );
}
