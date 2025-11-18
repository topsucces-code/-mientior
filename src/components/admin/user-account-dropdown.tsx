'use client';

import { Dropdown, Avatar, Tag, Space, Modal } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SafetyOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useGetIdentity } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { authProvider } from '@/providers/auth-provider';
import { Role } from '@prisma/client';

interface Identity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
}

export function UserAccountDropdown() {
  const { data: identity } = useGetIdentity<Identity>();
  const router = useRouter();
  const { t } = useTranslation('admin');

  const handleLogout = () => {
    Modal.confirm({
      title: t('logout.confirm', 'Are you sure you want to logout?'),
      okText: t('logout.yes', 'Yes'),
      cancelText: t('logout.no', 'No'),
      onOk: async () => {
        await authProvider.logout({});
        router.push('/auth/login');
      },
    });
  };

  const getRoleColor = (role: Role) => {
    const colors = {
      SUPER_ADMIN: 'red',
      ADMIN: 'blue',
      MANAGER: 'green',
      SUPPORT: 'orange',
      VIEWER: 'default',
    };
    return colors[role] || 'default';
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'header',
      type: 'group',
      label: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 500 }}>
            {identity?.firstName} {identity?.lastName}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>{identity?.email}</div>
          {identity?.role && (
            <Tag color={getRoleColor(identity.role)} style={{ marginTop: '4px' }}>
              {identity.role.replace('_', ' ')}
            </Tag>
          )}
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('menu.profile', 'Profile'),
      onClick: () => router.push('/admin/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('menu.settings', 'Settings'),
      onClick: () => router.push('/admin/settings/general'),
    },
    {
      key: 'activity',
      icon: <SafetyOutlined />,
      label: t('menu.activityLog', 'Activity Log'),
      onClick: () => router.push(`/admin/audit-logs?adminUserId=${identity?.id}`),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('menu.logout', 'Logout'),
      danger: true,
      onClick: handleLogout,
    },
  ];

  const getInitials = () => {
    if (!identity) return '?';
    const first = identity.firstName?.[0] || '';
    const last = identity.lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
      <Space style={{ cursor: 'pointer' }}>
        <Avatar
          src={identity?.avatar}
          icon={!identity?.avatar && <UserOutlined />}
          style={{ backgroundColor: '#f97316' }}
        >
          {!identity?.avatar && getInitials()}
        </Avatar>
        <span style={{ fontWeight: 500 }}>
          {identity?.firstName} {identity?.lastName}
        </span>
      </Space>
    </Dropdown>
  );
}
