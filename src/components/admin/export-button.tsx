'use client';

import React, { useState } from 'react';
import { Button, Dropdown, App } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { toCSV, downloadCSV, ExportColumn } from '@/lib/export-utils';
import type { MenuProps } from 'antd';

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  loading?: boolean;
  disabled?: boolean;
  onExport?: (format: 'csv' | 'excel') => void;
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  loading = false,
  disabled = false,
  onExport,
}: ExportButtonProps<T>) {
  const { t } = useTranslation(['admin', 'common']);
  const { message } = App.useApp();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel') => {
    if (data.length === 0) {
      message.warning(t('admin:export.noData', 'No data to export'));
      return;
    }

    setExporting(true);
    try {
      if (onExport) {
        onExport(format);
      }

      const csv = toCSV(data, columns);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `${filename}_${timestamp}`);
      
      message.success(t('admin:export.success', 'Export completed successfully'));
    } catch (error) {
      console.error('Export error:', error);
      message.error(t('admin:export.error', 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'csv',
      icon: <FileExcelOutlined />,
      label: t('admin:export.csv', 'Export as CSV'),
      onClick: () => handleExport('csv'),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} disabled={disabled || data.length === 0}>
      <Button 
        icon={<DownloadOutlined />} 
        loading={loading || exporting}
        disabled={disabled || data.length === 0}
      >
        {t('admin:export.button', 'Export')} ({data.length})
      </Button>
    </Dropdown>
  );
}

// Pre-configured export buttons for common entities

interface CustomerExportButtonProps {
  customers: Array<{
    id: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    loyaltyLevel?: string | null;
    loyaltyPoints?: number | null;
    totalOrders?: number | null;
    totalSpent?: number | null;
    createdAt: string;
  }>;
  loading?: boolean;
}

export function CustomerExportButton({ customers, loading }: CustomerExportButtonProps) {
  const { t } = useTranslation('admin');
  
  const columns: ExportColumn<typeof customers[0]>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: t('customers.fields.name', 'Name'), formatter: (_, row) => row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : row.name || '' },
    { key: 'email', header: t('customers.fields.email', 'Email') },
    { key: 'phone', header: t('customers.fields.phone', 'Phone') },
    { key: 'loyaltyLevel', header: t('customers.fields.loyaltyLevel', 'Loyalty Level') },
    { key: 'loyaltyPoints', header: t('customers.fields.loyaltyPoints', 'Loyalty Points') },
    { key: 'totalOrders', header: t('customers.fields.totalOrders', 'Total Orders') },
    { key: 'totalSpent', header: t('customers.fields.totalSpent', 'Total Spent'), formatter: (v) => v ? `€${(v as number).toFixed(2)}` : '' },
    { key: 'createdAt', header: t('customers.fields.createdAt', 'Registered'), formatter: (v) => v ? new Date(v as string).toLocaleDateString() : '' },
  ];

  return (
    <ExportButton
      data={customers}
      columns={columns}
      filename="customers"
      loading={loading}
    />
  );
}

interface OrderExportButtonProps {
  orders: Array<{
    id: string;
    orderNumber?: string;
    status: string;
    total: number;
    paymentStatus?: string;
    createdAt: string;
  }>;
  loading?: boolean;
}

export function OrderExportButton({ orders, loading }: OrderExportButtonProps) {
  const { t } = useTranslation('admin');
  
  const columns: ExportColumn<typeof orders[0]>[] = [
    { key: 'orderNumber', header: t('orders.fields.orderNumber', 'Order Number'), formatter: (v, row) => (v as string) || row.id },
    { key: 'status', header: t('orders.fields.status', 'Status') },
    { key: 'total', header: t('orders.fields.total', 'Total'), formatter: (v) => v ? `€${(v as number).toFixed(2)}` : '' },
    { key: 'paymentStatus', header: t('orders.fields.paymentStatus', 'Payment Status') },
    { key: 'createdAt', header: t('orders.fields.createdAt', 'Date'), formatter: (v) => v ? new Date(v as string).toLocaleString() : '' },
  ];

  return (
    <ExportButton
      data={orders}
      columns={columns}
      filename="orders"
      loading={loading}
    />
  );
}

interface ProductExportButtonProps {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    status: string;
    createdAt: string;
  }>;
  loading?: boolean;
}

export function ProductExportButton({ products, loading }: ProductExportButtonProps) {
  const { t } = useTranslation('admin');
  
  const columns: ExportColumn<typeof products[0]>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: t('products.fields.name', 'Name') },
    { key: 'slug', header: 'Slug' },
    { key: 'price', header: t('products.fields.price', 'Price'), formatter: (v) => v ? `€${(v as number).toFixed(2)}` : '' },
    { key: 'stock', header: t('products.fields.stock', 'Stock') },
    { key: 'status', header: t('products.fields.status', 'Status') },
    { key: 'createdAt', header: t('products.fields.createdAt', 'Created'), formatter: (v) => v ? new Date(v as string).toLocaleDateString() : '' },
  ];

  return (
    <ExportButton
      data={products}
      columns={columns}
      filename="products"
      loading={loading}
    />
  );
}
