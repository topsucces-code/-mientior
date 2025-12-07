'use client';

import { Layout, Menu, Badge, Drawer, Grid } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
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
  SearchOutlined,
  RollbackOutlined,
  CloseOutlined,
  FileTextOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/theme-context';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];
type NonNullMenuItem = NonNullable<MenuItem>;

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
}

export function AdminSidebar({ 
  collapsed, 
  onCollapse, 
  mobileOpen: externalMobileOpen, 
  onMobileToggle 
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation('admin');
  const { isDark } = useTheme();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal
  const mobileOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const setMobileOpen = onMobileToggle || setInternalMobileOpen;
  const [pendingCounts, setPendingCounts] = useState({
    orders: 0,
    vendors: 0,
  });

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile, setMobileOpen]);

  // Handle navigation with mobile drawer close
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [router, isMobile, setMobileOpen]);

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
      onClick: () => handleNavigate('/admin'),
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
              onClick: () => handleNavigate('/admin/products'),
            },
            {
              key: '/admin/products/create',
              label: t('menu.addProduct', 'Add Product'),
              onClick: () => handleNavigate('/admin/products/create'),
            },
            {
              key: '/admin/categories',
              label: t('menu.categories', 'Categories'),
              onClick: () => handleNavigate('/admin/categories'),
            },
            {
              key: '/admin/products/tags',
              label: t('menu.productTags', 'Tags'),
              onClick: () => handleNavigate('/admin/products/tags'),
            },
            {
              key: '/admin/products/reviews',
              label: t('menu.reviews', 'Reviews'),
              onClick: () => handleNavigate('/admin/products/reviews'),
            },
            {
              key: '/admin/products/variants',
              label: t('menu.variants', 'Variants'),
              onClick: () => handleNavigate('/admin/products/variants'),
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
              onClick: () => handleNavigate('/admin/orders'),
            },
            {
              key: '/admin/orders?status=PENDING',
              label: t('menu.pendingOrders', 'Pending'),
              onClick: () => handleNavigate('/admin/orders?status=PENDING'),
            },
            {
              key: '/admin/orders?status=PROCESSING',
              label: t('menu.processingOrders', 'In Progress'),
              onClick: () => handleNavigate('/admin/orders?status=PROCESSING'),
            },
            {
              key: '/admin/orders?status=DELIVERED',
              label: t('menu.deliveredOrders', 'Delivered'),
              onClick: () => handleNavigate('/admin/orders?status=DELIVERED'),
            },
          ],
        },
        {
          key: '/admin/returns',
          label: t('menu.returns', 'Returns & Refunds'),
          icon: <RollbackOutlined />,
          onClick: () => handleNavigate('/admin/returns'),
        },
        {
          key: 'customers-group',
          label: t('menu.customers', 'Customers'),
          icon: <UserOutlined />,
          children: [
            {
              key: '/admin/customers',
              label: t('menu.allCustomers', 'All Customers'),
              onClick: () => handleNavigate('/admin/customers'),
            },
            {
              key: '/admin/customers/search',
              label: t('menu.customerSearch', 'Customer Search'),
              icon: <SearchOutlined />,
              onClick: () => handleNavigate('/admin/customers/search'),
            },
            {
              key: '/admin/customers/segments',
              label: t('menu.segments', 'Segments'),
              onClick: () => handleNavigate('/admin/customers/segments'),
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
              onClick: () => handleNavigate('/admin/vendors'),
            },
            {
              key: '/admin/vendors?status=PENDING',
              label: t('menu.pendingVendors', 'Pending Approval'),
              onClick: () => handleNavigate('/admin/vendors?status=PENDING'),
            },
            {
              key: '/admin/vendors/commissions',
              label: t('menu.commissions', 'Commissions'),
              onClick: () => handleNavigate('/admin/vendors/commissions'),
            },
            {
              key: '/admin/vendors/payouts',
              label: t('menu.payouts', 'Payouts'),
              onClick: () => handleNavigate('/admin/vendors/payouts'),
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
          onClick: () => handleNavigate('/admin/marketing/campaigns'),
        },
        {
          key: '/admin/marketing/promo-codes',
          label: t('menu.promoCodes', 'Promo Codes'),
          icon: <GiftOutlined />,
          onClick: () => handleNavigate('/admin/marketing/promo-codes'),
        },
        {
          key: '/admin/marketing/segments',
          label: t('menu.segments', 'Segments'),
          onClick: () => handleNavigate('/admin/marketing/segments'),
        },
        {
          key: '/admin/newsletter',
          label: t('menu.newsletter', 'Newsletter'),
          onClick: () => handleNavigate('/admin/newsletter'),
        },
      ],
    },
    {
      key: 'cms',
      icon: <FileTextOutlined />,
      label: t('menu.cms', 'CMS'),
      children: [
        {
          key: '/admin/cms/pages',
          label: t('menu.pages', 'Pages'),
          onClick: () => handleNavigate('/admin/cms/pages'),
        },
        {
          key: 'blog-group',
          label: t('menu.blog', 'Blog'),
          children: [
            {
              key: '/admin/cms/blog',
              label: t('menu.blogPosts', 'Posts'),
              onClick: () => handleNavigate('/admin/cms/blog'),
            },
            {
              key: '/admin/cms/blog/categories',
              label: t('menu.blogCategories', 'Categories'),
              onClick: () => handleNavigate('/admin/cms/blog/categories'),
            },
            {
              key: '/admin/cms/blog/tags',
              label: t('menu.blogTags', 'Tags'),
              onClick: () => handleNavigate('/admin/cms/blog/tags'),
            },
          ],
        },
        {
          key: '/admin/cms/banners',
          label: t('menu.banners', 'Banners'),
          onClick: () => handleNavigate('/admin/cms/banners'),
        },
        {
          key: '/admin/cms/faq',
          label: t('menu.faq', 'FAQ'),
          onClick: () => handleNavigate('/admin/cms/faq'),
        },
        {
          key: '/admin/cms/menus',
          label: t('menu.menus', 'Menus'),
          onClick: () => handleNavigate('/admin/cms/menus'),
        },
        {
          key: '/admin/cms/media',
          label: t('menu.media', 'Media Library'),
          onClick: () => handleNavigate('/admin/cms/media'),
        },
        {
          key: '/admin/cms/snippets',
          label: t('menu.snippets', 'Snippets'),
          onClick: () => handleNavigate('/admin/cms/snippets'),
        },
        {
          key: '/admin/cms/content-blocks',
          label: t('menu.contentBlocks', 'Content Blocks'),
          onClick: () => handleNavigate('/admin/cms/content-blocks'),
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
          onClick: () => handleNavigate('/admin/analytics'),
        },
        {
          key: '/admin/notifications',
          label: t('menu.notificationsCenter', 'Notifications'),
          onClick: () => handleNavigate('/admin/notifications'),
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
              onClick: () => handleNavigate('/admin/settings/general'),
            },
            {
              key: '/admin/settings/payments',
              label: t('menu.payments', 'Payments'),
              onClick: () => handleNavigate('/admin/settings/payments'),
            },
            {
              key: '/admin/settings/shipping',
              label: t('menu.shipping', 'Shipping'),
              onClick: () => handleNavigate('/admin/settings/shipping'),
            },
            {
              key: '/admin/settings/appearance',
              label: t('menu.appearance', 'Appearance'),
              onClick: () => handleNavigate('/admin/settings/appearance'),
            },
            {
              key: '/admin/settings/taxes',
              label: t('menu.taxes', 'Taxes'),
              onClick: () => handleNavigate('/admin/settings/taxes'),
            },
            {
              key: '/admin/settings/notifications',
              label: t('menu.notifications', 'Notifications'),
              onClick: () => handleNavigate('/admin/settings/notifications'),
            },
            {
              key: '/admin/settings/security',
              label: t('menu.security', 'Security'),
              onClick: () => handleNavigate('/admin/settings/security'),
            },
            {
              key: '/admin/settings/sessions',
              label: t('menu.sessions', 'Sessions'),
              onClick: () => handleNavigate('/admin/settings/sessions'),
            },
            {
              key: '/admin/settings/integrations',
              label: t('menu.integrations', 'Integrations'),
              onClick: () => handleNavigate('/admin/settings/integrations'),
            },
          ],
        },
        {
          key: '/admin/admin-users',
          label: t('menu.adminUsers', 'Admin Users'),
          icon: <UsergroupAddOutlined />,
          onClick: () => handleNavigate('/admin/admin-users'),
        },
        {
          key: '/admin/audit-logs',
          label: t('menu.auditLogs', 'Audit Logs'),
          icon: <SafetyOutlined />,
          onClick: () => handleNavigate('/admin/audit-logs'),
        },
        {
          key: '/admin/pim',
          label: t('menu.pim', 'PIM Integration'),
          icon: <SyncOutlined />,
          onClick: () => handleNavigate('/admin/pim'),
        },
        {
          key: '/admin/pim/logs',
          label: t('menu.pimLogs', 'PIM Sync Logs'),
          onClick: () => handleNavigate('/admin/pim/logs'),
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

  // Shared sidebar content
  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'center',
          borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          padding: '16px',
          background: isDark ? '#141414' : '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ fontSize: '20px', color: '#0891B2' }}>
            {collapsed && !isMobile ? 'M' : 'Mientior'}
          </strong>
          {(!collapsed || isMobile) && (
            <Badge count="Admin" style={{ backgroundColor: '#F97316' }} />
          )}
        </div>
        {isMobile && (
          <CloseOutlined
            onClick={() => setMobileOpen(false)}
            style={{ fontSize: '18px', cursor: 'pointer' }}
          />
        )}
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        openKeys={isMobile || !collapsed ? openKeys : []}
        onOpenChange={setOpenKeys}
        items={menuItems}
        style={{ 
          borderRight: 0,
          background: isDark ? '#141414' : '#fff',
        }}
        theme={isDark ? 'dark' : 'light'}
      />

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '16px',
            borderTop: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
            background: isDark ? '#141414' : '#fff',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
          }}
        >
          <div>v1.0.0</div>
          <div style={{ marginTop: '4px' }}>
            <a href="#" style={{ color: '#0891B2', marginRight: '8px' }}>
              {t('menu.docs', 'Documentation')}
            </a>
            <a href="#" style={{ color: '#0891B2' }}>
              {t('menu.support', 'Support')}
            </a>
          </div>
        </div>
      )}
    </>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <>
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={280}
          styles={{
            body: { padding: 0, background: isDark ? '#141414' : '#fff' },
            header: { display: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  // Desktop: Use Sider
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
        background: isDark ? '#141414' : '#fff',
        borderRight: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
      }}
      trigger={
        <div style={{ 
          textAlign: 'center', 
          padding: '16px 0',
          background: isDark ? '#141414' : '#fff',
          borderTop: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
        }}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      }
    >
      {sidebarContent}
    </Sider>
  );
}

// Export mobile toggle function for header
export function useMobileSidebar() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  return { isMobile };
}
