'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Space, Button, Tag, Card, Typography, Row, Col, Statistic, Popconfirm, Tooltip, App, Alert } from 'antd';
import { LaptopOutlined, MobileOutlined, GlobalOutlined, DeleteOutlined, SafetyOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  isCurrent?: boolean;
}

export default function SessionsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { message, modal } = App.useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      message.error(t('admin:sessions.fetchError', 'Failed to load sessions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, { method: 'DELETE' });
      if (response.ok) {
        message.success(t('admin:sessions.revoked', 'Session revoked'));
        fetchSessions();
      } else {
        throw new Error('Revoke failed');
      }
    } catch {
      message.error(t('admin:sessions.revokeError', 'Failed to revoke session'));
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllOther = () => {
    modal.confirm({
      title: t('admin:sessions.revokeAllTitle', 'Revoke All Other Sessions'),
      content: t('admin:sessions.revokeAllContent', 'This will log out all other devices. Are you sure?'),
      okText: t('admin:sessions.revokeAll', 'Revoke All'),
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch('/api/admin/sessions/revoke-all', { method: 'POST' });
          if (response.ok) {
            message.success(t('admin:sessions.allRevoked', 'All other sessions revoked'));
            fetchSessions();
          } else {
            throw new Error('Revoke all failed');
          }
        } catch {
          message.error(t('admin:sessions.revokeAllError', 'Failed to revoke sessions'));
        }
      },
    });
  };

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
    
    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    else if (/tablet/i.test(userAgent)) device = 'Tablet';

    // Detect browser
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    // Detect OS
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

    return { device, browser, os };
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile': return <MobileOutlined />;
      case 'Tablet': return <MobileOutlined />;
      default: return <LaptopOutlined />;
    }
  };

  const activeSessions = sessions.filter(s => new Date(s.expiresAt) > new Date());
  const currentSession = sessions.find(s => s.isCurrent);

  const columns = [
    {
      title: t('admin:sessions.device', 'Device'),
      key: 'device',
      render: (_: unknown, record: Session) => {
        const { device, browser, os } = parseUserAgent(record.userAgent);
        return (
          <Space>
            {getDeviceIcon(device)}
            <Space direction="vertical" size={0}>
              <Text strong>
                {browser} on {os}
                {record.isCurrent && <Tag color="green" style={{ marginLeft: 8 }}>{t('admin:sessions.current', 'Current')}</Tag>}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{device}</Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: t('admin:sessions.user', 'User'),
      key: 'user',
      render: (_: unknown, record: Session) => (
        record.user ? (
          <Space direction="vertical" size={0}>
            <Text>{record.user.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.user.email}</Text>
          </Space>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: t('admin:sessions.ipAddress', 'IP Address'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip: string) => ip ? (
        <Space>
          <GlobalOutlined />
          <Text code>{ip}</Text>
        </Space>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: t('admin:sessions.lastActive', 'Last Active'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
          <Text>{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin:sessions.expires', 'Expires'),
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => {
        const isExpired = new Date(date) < new Date();
        return (
          <Tag color={isExpired ? 'red' : 'green'}>
            {isExpired ? t('admin:sessions.expired', 'Expired') : dayjs(date).fromNow()}
          </Tag>
        );
      },
    },
    {
      title: t('common:actions', 'Actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Session) => (
        record.isCurrent ? (
          <Tooltip title={t('admin:sessions.cannotRevokeCurrent', 'Cannot revoke current session')}>
            <Button type="text" icon={<CheckCircleOutlined />} disabled />
          </Tooltip>
        ) : (
          <Popconfirm 
            title={t('admin:sessions.confirmRevoke', 'Revoke this session?')}
            onConfirm={() => handleRevokeSession(record.id)}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              loading={revoking === record.id}
            />
          </Popconfirm>
        )
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><SafetyOutlined /> {t('admin:sessions.title', 'Active Sessions')}</Title>
          <Text type="secondary">{t('admin:sessions.subtitle', 'Manage logged-in devices and sessions')}</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchSessions} loading={loading}>
            {t('admin:sessions.refresh', 'Refresh')}
          </Button>
          <Button danger onClick={handleRevokeAllOther} disabled={activeSessions.length <= 1}>
            {t('admin:sessions.revokeAllOther', 'Revoke All Other')}
          </Button>
        </Space>
      </div>

      {currentSession && (
        <Alert
          message={t('admin:sessions.currentSessionInfo', 'Current Session')}
          description={`${parseUserAgent(currentSession.userAgent).browser} on ${parseUserAgent(currentSession.userAgent).os} - ${currentSession.ipAddress || 'Unknown IP'}`}
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title={t('admin:sessions.activeSessions', 'Active Sessions')} 
              value={activeSessions.length} 
              prefix={<SafetyOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title={t('admin:sessions.totalSessions', 'Total Sessions')} 
              value={sessions.length} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title={t('admin:sessions.expiredSessions', 'Expired')} 
              value={sessions.length - activeSessions.length} 
              valueStyle={{ color: sessions.length - activeSessions.length > 0 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table 
          columns={columns} 
          dataSource={sessions} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
