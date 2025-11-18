'use client';

import { Layout, Breadcrumb, Button, Space } from 'antd';
import { SearchOutlined, BellOutlined } from '@ant-design/icons';
import { useBreadcrumb } from '@refinedev/core';
import { usePathname } from 'next/navigation';
import { NotificationsBell } from './notifications-bell';
import { LanguageSelector } from './language-selector';
import { UserAccountDropdown } from './user-account-dropdown';
import { useTranslation } from 'react-i18next';

const { Header } = Layout;

interface AdminHeaderProps {
  onSearchOpen: () => void;
}

export function AdminHeader({ onSearchOpen }: AdminHeaderProps) {
  const { breadcrumbs } = useBreadcrumb();
  const pathname = usePathname();
  const { t } = useTranslation('admin');

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
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        height: '64px',
      }}
    >
      {/* Left: Breadcrumbs */}
      <div style={{ flex: 1 }}>
        <Breadcrumb
          items={breadcrumbs.map((breadcrumb) => ({
            title: breadcrumb.label,
            href: breadcrumb.href,
          }))}
        />
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
              background: '#f0f0f0',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            {shortcutKey}
          </kbd>
        </Button>
      </div>

      {/* Right: Actions */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Space size="middle">
          <NotificationsBell />
          <LanguageSelector />
          <UserAccountDropdown />
        </Space>
      </div>
    </Header>
  );
}
