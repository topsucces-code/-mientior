'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Space, Button, Tag, Card, Typography, Row, Col, Statistic, List, Avatar, Badge, Tabs, Empty, Popconfirm, message } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ShoppingCartOutlined, UserOutlined, WarningOutlined, InfoCircleOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  adminUserId: string;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  order: { icon: <ShoppingCartOutlined />, color: '#1890ff' },
  user: { icon: <UserOutlined />, color: '#52c41a' },
  warning: { icon: <WarningOutlined />, color: '#faad14' },
  info: { icon: <InfoCircleOutlined />, color: '#1890ff' },
  system: { icon: <SettingOutlined />, color: '#722ed1' },
};

export default function NotificationsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState('all');

  const { tableProps } = useTable<Notification>({
    resource: 'notifications',
    pagination: { pageSize: 20 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: updateNotification } = useUpdate();
  const { mutate: deleteNotification } = useDelete();

  const handleMarkAsRead = (id: string) => {
    updateNotification({ resource: 'notifications', id, values: { read: true } }, {
      onSuccess: () => message.success('Marked as read'),
    });
  };

  const handleMarkAllAsRead = () => {
    // In a real app, this would be a bulk update
    message.success('All notifications marked as read');
  };

  const handleDelete = (id: string) => {
    deleteNotification({ resource: 'notifications', id }, {
      onSuccess: () => message.success('Notification deleted'),
    });
  };

  const handleClearAll = () => {
    message.success('All notifications cleared');
  };

  const notifications = tableProps.dataSource || [];
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread' 
      ? notifications.filter((n: Notification) => !n.read)
      : notifications.filter((n: Notification) => n.type === activeTab);

  const getIcon = (type: string) => {
    const config = typeConfig[type] ?? { icon: <InfoCircleOutlined />, color: '#1890ff' };
    return (
      <Avatar style={{ backgroundColor: config.color }} icon={config.icon} />
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <BellOutlined /> {t('admin:notifications.title', 'Notifications')}
            {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 8 }} />}
          </Title>
          <Text type="secondary">{t('admin:notifications.subtitle', 'Stay updated with important events')}</Text>
        </div>
        <Space>
          <Button icon={<CheckCircleOutlined />} onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
          <Popconfirm title="Clear all notifications?" onConfirm={handleClearAll}>
            <Button danger icon={<DeleteOutlined />}>
              Clear All
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total" value={notifications.length} prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Unread" value={unreadCount} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Orders" value={notifications.filter((n: Notification) => n.type === 'order').length} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Warnings" value={notifications.filter((n: Notification) => n.type === 'warning').length} prefix={<WarningOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'order', label: 'Orders' },
            { key: 'user', label: 'Users' },
            { key: 'warning', label: 'Warnings' },
            { key: 'system', label: 'System' },
          ]}
        />

        {filteredNotifications.length === 0 ? (
          <Empty description="No notifications" style={{ padding: 40 }} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={[...filteredNotifications]}
            renderItem={(item: Notification) => (
              <List.Item
                style={{ 
                  background: item.read ? 'transparent' : '#f6ffed',
                  padding: '16px',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
                actions={[
                  !item.read && (
                    <Button 
                      key="read" 
                      type="text" 
                      icon={<CheckOutlined />} 
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      Mark Read
                    </Button>
                  ),
                  <Popconfirm key="delete" title="Delete this notification?" onConfirm={() => handleDelete(item.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={!item.read}>
                      {getIcon(item.type)}
                    </Badge>
                  }
                  title={
                    <Space>
                      <Text strong={!item.read}>{item.title}</Text>
                      <Tag>{item.type}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2 }}>
                        {item.message}
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.createdAt).fromNow()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
