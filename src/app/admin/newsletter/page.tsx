'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, message, Popconfirm, Typography, Row, Col, Statistic, DatePicker } from 'antd';
import { DeleteOutlined, MailOutlined, UserAddOutlined, CheckCircleOutlined, StopOutlined, DownloadOutlined } from '@ant-design/icons';
import { useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface NewsletterSubscription {
  id: string;
  email: string;
  acceptMarketing: boolean;
  ipAddress?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  isActive: boolean;
}

export default function NewsletterPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps } = useTable<NewsletterSubscription>({
    resource: 'newsletter-subscriptions',
    pagination: { pageSize: 20 },
    sorters: { initial: [{ field: 'subscribedAt', order: 'desc' }] },
  });

  const { mutate: deleteSubscription } = useDelete();

  const handleDelete = (id: string) => {
    deleteSubscription({ resource: 'newsletter-subscriptions', id }, {
      onSuccess: () => message.success('Subscription deleted'),
    });
  };

  const handleBulkDelete = () => {
    message.success(`${selectedRowKeys.length} subscriptions deleted`);
    setSelectedRowKeys([]);
  };

  const handleExport = () => {
    message.success('Exporting subscribers...');
    // Export logic here
  };

  // Mock stats
  const stats = {
    total: tableProps.dataSource?.length || 0,
    active: tableProps.dataSource?.filter((s: NewsletterSubscription) => s.isActive).length || 0,
    thisMonth: tableProps.dataSource?.filter((s: NewsletterSubscription) => 
      dayjs(s.subscribedAt).isAfter(dayjs().startOf('month'))
    ).length || 0,
  };

  const columns = [
    {
      title: t('admin:newsletter.email', 'Email'),
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <Text copyable>{email}</Text>,
    },
    {
      title: t('admin:newsletter.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'} icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}>
          {isActive ? 'Active' : 'Unsubscribed'}
        </Tag>
      ),
    },
    {
      title: t('admin:newsletter.marketing', 'Marketing'),
      dataIndex: 'acceptMarketing',
      key: 'acceptMarketing',
      render: (accept: boolean) => (
        <Tag color={accept ? 'blue' : 'default'}>{accept ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: t('admin:newsletter.subscribedAt', 'Subscribed'),
      dataIndex: 'subscribedAt',
      key: 'subscribedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('admin:newsletter.ipAddress', 'IP Address'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip: string) => <Text type="secondary">{ip || '-'}</Text>,
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: NewsletterSubscription) => (
        <Popconfirm title="Delete this subscription?" onConfirm={() => handleDelete(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><MailOutlined /> {t('admin:newsletter.title', 'Newsletter Subscribers')}</Title>
          <Text type="secondary">{t('admin:newsletter.subtitle', 'Manage email subscriptions')}</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Subscribers" value={stats.total} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Active" value={stats.active} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="This Month" value={stats.thisMonth} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search by email..." allowClear />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            {selectedRowKeys.length > 0 && (
              <Popconfirm title={`Delete ${selectedRowKeys.length} subscriptions?`} onConfirm={handleBulkDelete}>
                <Button danger icon={<DeleteOutlined />}>
                  Delete Selected ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </Col>
        </Row>
        <Table 
          {...tableProps} 
          columns={columns} 
          rowKey="id" 
          rowSelection={rowSelection}
        />
      </Card>
    </div>
  );
}
