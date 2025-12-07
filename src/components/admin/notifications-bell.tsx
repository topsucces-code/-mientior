'use client'

import React, { useState, useEffect } from 'react'
import { Badge, Button, Drawer, List, Avatar, Tag, Space, Typography, Empty } from 'antd'
import {
  BellOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  WarningOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Pusher from 'pusher-js'

dayjs.extend(relativeTime)

const { Text } = Typography

interface Notification {
  id: string
  type: 'order' | 'user' | 'system' | 'warning'
  title: string
  message: string
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

const TYPE_ICONS = {
  order: <ShoppingCartOutlined />,
  user: <UserOutlined />,
  system: <BellOutlined />,
  warning: <WarningOutlined />,
}

const TYPE_COLORS = {
  order: 'blue',
  user: 'purple',
  system: 'green',
  warning: 'orange',
}

export const NotificationsBell: React.FC = () => {
  const { t } = useTranslation(['common', 'admin'])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = React.useCallback(async (readFilter?: string) => {
    try {
      const url = readFilter 
        ? `/api/admin/notifications?read=${readFilter}`
        : '/api/admin/notifications'
      const response = await fetch(url)
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return []
    }
  }, [])

  const refreshNotifications = React.useCallback(() => {
    fetchNotifications('false').then((data) => {
      setUnreadCount(data.length)
    })
    if (drawerOpen) {
      fetchNotifications().then((data) => {
        setNotifications(data)
      })
    }
  }, [fetchNotifications, drawerOpen])

  // Fetch unread count
  React.useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  // Pusher real-time updates
  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'

    // Check for placeholder values that indicate unconfigured Pusher
    const isConfigured = pusherKey && 
      !pusherKey.includes('your_pusher') && 
      !pusherCluster.includes('your_pusher')

    if (!isConfigured) {
      // Silently skip Pusher initialization if not configured
      return
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    })

    const channel = pusher.subscribe('admin-notifications')

    // Listen for new notifications
    channel.bind('notification-created', (data: Notification) => {
      setNotifications((prev) => [data, ...prev])
      refreshNotifications()
    })

    // Listen for order updates
    channel.bind('order-updated', (data: { orderId: string; orderNumber: string; status: string }) => {
      const notification: Notification = {
        id: `order-${data.orderId}-${Date.now()}`,
        type: 'order',
        title: t('admin.notifications.orderUpdated'),
        message: t('admin.notifications.orderStatus', { 
          orderId: data.orderNumber,
          status: data.status 
        }),
        read: false,
        createdAt: new Date().toISOString(),
        metadata: data,
      }
      setNotifications((prev) => [notification, ...prev])
      refreshNotifications()
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [t, refreshNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      refreshNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      
      await fetch('/api/admin/notifications/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds }),
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      refreshNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <>
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          onClick={() => setDrawerOpen(true)}
        />
      </Badge>

      <Drawer
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <BellOutlined />
              {t('admin.notifications.title')}
            </Space>
            {unreadCount > 0 && (
              <Button size="small" type="link" onClick={handleMarkAllAsRead}>
                {t('admin.notifications.markAllRead')}
              </Button>
            )}
          </Space>
        }
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {notifications.length === 0 ? (
          <Empty description={t('admin.notifications.empty')} />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: item.read ? 'transparent' : '#f0f5ff',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
                actions={[
                  !item.read && (
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      {t('admin.notifications.markRead')}
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={TYPE_ICONS[item.type]}
                      style={{ backgroundColor: TYPE_COLORS[item.type] }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong={!item.read}>{item.title}</Text>
                      <Tag color={TYPE_COLORS[item.type]}>
                        {t(`admin.notifications.types.${item.type}`)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">{item.message}</Text>
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
      </Drawer>
    </>
  )
}
