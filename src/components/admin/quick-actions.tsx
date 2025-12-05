'use client';

import React from 'react';
import { Card, Button, Space, Typography, Row, Col, Tooltip } from 'antd';
import {
  PlusOutlined,
  ShoppingOutlined,
  UserAddOutlined,
  TagOutlined,
  FileTextOutlined,
  MailOutlined,
  SyncOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface QuickAction {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color: string;
}

export function QuickActions() {
  const { t } = useTranslation(['admin', 'common']);
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      key: 'add-product',
      icon: <ShoppingOutlined />,
      label: t('admin:quickActions.addProduct', 'Add Product'),
      description: t('admin:quickActions.addProductDesc', 'Create a new product'),
      href: '/admin/products/create',
      color: '#1890ff',
    },
    {
      key: 'add-customer',
      icon: <UserAddOutlined />,
      label: t('admin:quickActions.addCustomer', 'Add Customer'),
      description: t('admin:quickActions.addCustomerDesc', 'Register a new customer'),
      href: '/admin/customers/create',
      color: '#52c41a',
    },
    {
      key: 'create-promo',
      icon: <TagOutlined />,
      label: t('admin:quickActions.createPromo', 'Create Promo'),
      description: t('admin:quickActions.createPromoDesc', 'New promo code'),
      href: '/admin/marketing/promo-codes',
      color: '#fa8c16',
    },
    {
      key: 'new-page',
      icon: <FileTextOutlined />,
      label: t('admin:quickActions.newPage', 'New Page'),
      description: t('admin:quickActions.newPageDesc', 'Create CMS page'),
      href: '/admin/cms/pages',
      color: '#722ed1',
    },
    {
      key: 'send-newsletter',
      icon: <MailOutlined />,
      label: t('admin:quickActions.sendNewsletter', 'Newsletter'),
      description: t('admin:quickActions.sendNewsletterDesc', 'Send to subscribers'),
      href: '/admin/newsletter',
      color: '#eb2f96',
    },
    {
      key: 'sync-pim',
      icon: <SyncOutlined />,
      label: t('admin:quickActions.syncPim', 'Sync PIM'),
      description: t('admin:quickActions.syncPimDesc', 'Sync with Akeneo'),
      href: '/admin/pim',
      color: '#13c2c2',
    },
    {
      key: 'import-data',
      icon: <UploadOutlined />,
      label: t('admin:quickActions.importData', 'Import'),
      description: t('admin:quickActions.importDataDesc', 'Import products/customers'),
      href: '/admin/settings/integrations',
      color: '#2f54eb',
    },
    {
      key: 'export-data',
      icon: <DownloadOutlined />,
      label: t('admin:quickActions.exportData', 'Export'),
      description: t('admin:quickActions.exportDataDesc', 'Export data to CSV'),
      href: '/admin/customers/search',
      color: '#a0d911',
    },
  ];

  return (
    <Card 
      title={
        <Space>
          <PlusOutlined />
          <span>{t('admin:quickActions.title', 'Quick Actions')}</span>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col xs={12} sm={8} md={6} lg={3} key={action.key}>
            <Tooltip title={action.description}>
              <Button
                type="text"
                style={{
                  width: '100%',
                  height: 'auto',
                  padding: '16px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                }}
                onClick={() => router.push(action.href)}
              >
                <span style={{ fontSize: 24, color: action.color }}>
                  {action.icon}
                </span>
                <Text style={{ fontSize: 12 }}>{action.label}</Text>
              </Button>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export default QuickActions;
