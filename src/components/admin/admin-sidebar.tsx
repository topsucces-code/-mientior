'use client';

import { Layout, Menu, Badge } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TeamOutlined,
  MailOutlined,
  BarChartOutlined,
  SettingOutlined,
  GiftOutlined,
  UsergroupAddOutlined,
  SafetyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];
type NonNullMenuItem = NonNullable<MenuItem>;

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation('admin');
  const [pendingCounts, setPendingCounts] = useState({
    orders: 0,
    vendors: 0,
  });

  // Fetch pending counts
  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        // Fetch pending orders count
        const ordersRes = await fetch('/api/orders?status=PENDING');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setPendingCounts(prev => ({
            ...prev,
            orders: ordersData.length || 0,
          }));
        }

        // Fetch pending vendors count
        const vendorsRes = await fetch('/api/vendors?status=PENDING');
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          setPendingCounts(prev => ({
            ...prev,
            vendors: vendorsData.length || 0,
          }));
        }
      } catch (error) {
        console.error('Error fetching pending counts:', error);
      }
    };

    fetchPendingCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems: MenuItem[] = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: t('menu.dashboard', 'Dashboard'),
      onClick: () => router.push('/admin'),
    },
    {
      key: 'commerce',
      icon: <ShoppingOutlined />,
      label: t('menu.commerce', 'Commerce'),
      children: [
        {
          key: 'products-group',
          label: t('menu.products', 'Products'),
          icon: <ShoppingOutlined />,
          children: [
            {
              key: '/admin/products',
              label: t('menu.productsList', 'All Products'),
              onClick: () => router.push('/admin/products'),
            },
            {
              key: '/admin/products/create',
              label: t('menu.addProduct', 'Add Product'),
              onClick: () => router.push('/admin/products/create'),
            },
            {
              key: '/admin/categories',
              label: t('menu.categories', 'Categories'),
              onClick: () => router.push('/admin/categories'),
            },
          ],
        },
        {
          key: 'orders-group',
          label: pendingCounts.orders > 0 ? (
            <>
              {t('menu.orders', 'Orders')} <Badge count={pendingCounts.orders} />
            </>
          ) : (
            t('menu.orders', 'Orders')
          ),
          icon: <ShoppingCartOutlined />,
          children: [
            {
              key: '/admin/orders',
              label: t('menu.allOrders', 'All Orders'),
              onClick: () => router.push('/admin/orders'),
            },
            {
              key: '/admin/orders?status=PENDING',
              label: t('menu.pendingOrders', 'Pending'),
              onClick: () => router.push('/admin/orders?status=PENDING'),
            },
            {
              key: '/admin/orders?status=PROCESSING',
              label: t('menu.processingOrders', 'In Progress'),
              onClick: () => router.push('/admin/orders?status=PROCESSING'),
            },
            {
              key: '/admin/orders?status=DELIVERED',
              label: t('menu.deliveredOrders', 'Delivered'),
              onClick: () => router.push('/admin/orders?status=DELIVERED'),
            },
          ],
        },
        {
          key: 'customers-group',
          label: t('menu.customers', 'Customers'),
          icon: <UserOutlined />,
          children: [
            {
              key: '/admin/customers',
              label: t('menu.allCustomers', 'All Customers'),
              onClick: () => router.push('/admin/customers'),
            },
            {
              key: '/admin/customers/segments',
              label: t('menu.segments', 'Segments'),
              onClick: () => router.push('/admin/customers/segments'),
            },
          ],
        },
        {
          key: 'vendors-group',
          label: pendingCounts.vendors > 0 ? (
            <>
              {t('menu.vendors', 'Vendors')} <Badge count={pendingCounts.vendors} />
            </>
          ) : (
            t('menu.vendors', 'Vendors')
          ),
          icon: <TeamOutlined />,
          children: [
            {
              key: '/admin/vendors',
              label: t('menu.allVendors', 'All Vendors'),
              onClick: () => router.push('/admin/vendors'),
            },
            {
              key: '/admin/vendors?status=PENDING',
              label: t('menu.pendingVendors', 'Pending Approval'),
              onClick: () => router.push('/admin/vendors?status=PENDING'),
            },
            {
              key: '/admin/vendors/commissions',
              label: t('menu.commissions', 'Commissions'),
              onClick: () => router.push('/admin/vendors/commissions'),
            },
          ],
        },
      ],
    },
    {
      key: 'marketing',
      icon: <MailOutlined />,
      label: t('menu.marketing', 'Marketing'),
      children: [
        {
          key: '/admin/marketing/campaigns',
          label: t('menu.campaigns', 'Campaigns'),
          onClick: () => router.push('/admin/marketing/campaigns'),
        },
        {
          key: '/admin/marketing/promo-codes',
          label: t('menu.promoCodes', 'Promo Codes'),
          icon: <GiftOutlined />,
          onClick: () => router.push('/admin/marketing/promo-codes'),
        },
      ],
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: t('menu.analytics', 'Analytics'),
      children: [
        {
          key: '/admin/analytics',
          label: t('menu.reports', 'Reports'),
          onClick: () => router.push('/admin/analytics'),
        },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('menu.settings', 'Settings'),
      children: [
        {
          key: 'configuration',
          label: t('menu.configuration', 'Configuration'),
          children: [
            {
              key: '/admin/settings/general',
              label: t('menu.general', 'General'),
              onClick: () => router.push('/admin/settings/general'),
            },
            {
              key: '/admin/settings/payments',
              label: t('menu.payments', 'Payments'),
              onClick: () => router.push('/admin/settings/payments'),
            },
            {
              key: '/admin/settings/shipping',
              label: t('menu.shipping', 'Shipping'),
              onClick: () => router.push('/admin/settings/shipping'),
            },
          ],
        },
        {
          key: '/admin/admin-users',
          label: t('menu.adminUsers', 'Admin Users'),
          icon: <UsergroupAddOutlined />,
          onClick: () => router.push('/admin/admin-users'),
        },
        {
          key: '/admin/audit-logs',
          label: t('menu.auditLogs', 'Audit Logs'),
          icon: <SafetyOutlined />,
          onClick: () => router.push('/admin/audit-logs'),
        },
      ],
    },
  ];

  // Get selected keys from pathname
  const getSelectedKeys = () => {
    if (pathname === '/admin') return ['/admin'];

    // Filter out null items and try exact match first
    const validItems = menuItems.filter((item): item is NonNullMenuItem => item !== null);
    
    for (const item of validItems) {
      if ('children' in item && item.children) {
        const validChildren = item.children.filter((child): child is NonNullMenuItem => child !== null);
        
        for (const child of validChildren) {
          if ('children' in child && child.children) {
            const validSubChildren = child.children.filter((subChild): subChild is NonNullMenuItem => subChild !== null);
            
            for (const subChild of validSubChildren) {
              if (subChild.key === pathname) {
                return [pathname];
              }
            }
          } else if (child.key === pathname) {
            return [pathname];
          }
        }
      } else if (item.key === pathname) {
        return [pathname];
      }
    }

    // Fallback to partial match
    return [pathname];
  };

  // Get open keys from pathname
  const getDefaultOpenKeys = () => {
    const keys: string[] = [];
    if (pathname.startsWith('/admin/products') || pathname.startsWith('/admin/categories')) {
      keys.push('commerce', 'products-group');
    } else if (pathname.startsWith('/admin/orders')) {
      keys.push('commerce', 'orders-group');
    } else if (pathname.startsWith('/admin/customers')) {
      keys.push('commerce', 'customers-group');
    } else if (pathname.startsWith('/admin/vendors')) {
      keys.push('commerce', 'vendors-group');
    } else if (pathname.startsWith('/admin/marketing')) {
      keys.push('marketing');
    } else if (pathname.startsWith('/admin/analytics')) {
      keys.push('analytics');
    } else if (pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/admin-users') || pathname.startsWith('/admin/audit-logs')) {
      keys.push('settings');
      if (pathname.startsWith('/admin/settings')) {
        keys.push('configuration');
      }
    }
    return keys;
  };

  const [openKeys, setOpenKeys] = useState<string[]>(getDefaultOpenKeys());

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={260}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
      trigger={
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      }
    >
      {/* Logo */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          padding: '16px',
        }}
      >
        {collapsed ? (
          <strong style={{ fontSize: '20px', color: '#f97316' }}>M</strong>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '20px', color: '#f97316' }}>Mientior</strong>
            <Badge count="Admin" style={{ backgroundColor: '#3b82f6' }} />
          </div>
        )}
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        openKeys={collapsed ? [] : openKeys}
        onOpenChange={setOpenKeys}
        items={menuItems}
        style={{ borderRight: 0 }}
      />

      {/* Footer */}
      {!collapsed && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '16px',
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
          }}
        >
          <div>v1.0.0</div>
          <div style={{ marginTop: '4px' }}>
            <a href="#" style={{ color: '#3b82f6', marginRight: '8px' }}>
              {t('menu.docs', 'Documentation')}
            </a>
            <a href="#" style={{ color: '#3b82f6' }}>
              {t('menu.support', 'Support')}
            </a>
          </div>
        </div>
      )}
    </Sider>
  );
}
