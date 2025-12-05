'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  message,
  Space,
  InputNumber,
  Tag,
  Popconfirm,
  Row,
  Col,
  Typography,
  Alert,
  Divider,
  List,
  Badge,
  Progress,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  LockOutlined,
  SafetyOutlined,
  KeyOutlined,
  GlobalOutlined,
  HistoryOutlined,
  UserOutlined,
  DesktopOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

interface SecuritySettings {
  // Password Policy
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  preventPasswordReuse: number;
  
  // Two-Factor Authentication
  enable2FA: boolean;
  require2FAForAdmins: boolean;
  allowed2FAMethods: string[];
  
  // Session Management
  sessionTimeout: number;
  maxConcurrentSessions: number;
  enforceSessionTimeout: boolean;
  
  // Login Security
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableCaptcha: boolean;
  captchaThreshold: number;
  
  // IP Security
  enableIPWhitelist: boolean;
  ipWhitelist: string[];
  enableIPBlacklist: boolean;
  ipBlacklist: string[];
  
  // API Security
  enableRateLimiting: boolean;
  rateLimit: number;
  rateLimitWindow: number;
  enableAPIKeyAuth: boolean;
  
  // Audit & Logging
  enableAuditLog: boolean;
  auditLogRetentionDays: number;
  logSensitiveActions: boolean;
  
  // HTTPS & Headers
  forceHTTPS: boolean;
  enableHSTS: boolean;
  hstsMaxAge: number;
  enableCSP: boolean;
  cspDirectives: string;
}

const defaultSettings: SecuritySettings = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
  preventPasswordReuse: 5,
  enable2FA: true,
  require2FAForAdmins: true,
  allowed2FAMethods: ['totp', 'email'],
  sessionTimeout: 30,
  maxConcurrentSessions: 3,
  enforceSessionTimeout: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  enableCaptcha: true,
  captchaThreshold: 3,
  enableIPWhitelist: false,
  ipWhitelist: [],
  enableIPBlacklist: true,
  ipBlacklist: [],
  enableRateLimiting: true,
  rateLimit: 100,
  rateLimitWindow: 60,
  enableAPIKeyAuth: true,
  enableAuditLog: true,
  auditLogRetentionDays: 365,
  logSensitiveActions: true,
  forceHTTPS: true,
  enableHSTS: true,
  hstsMaxAge: 31536000,
  enableCSP: true,
  cspDirectives: "default-src 'self'; script-src 'self' 'unsafe-inline'",
};

const mockSessions: ActiveSession[] = [
  {
    id: '1',
    userId: 'admin-1',
    userEmail: 'admin@mientior.com',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120 / Windows 10',
    location: 'Paris, France',
    lastActivity: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isCurrent: true,
  },
  {
    id: '2',
    userId: 'admin-1',
    userEmail: 'admin@mientior.com',
    ipAddress: '10.0.0.50',
    userAgent: 'Safari 17 / macOS',
    location: 'Lyon, France',
    lastActivity: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isCurrent: false,
  },
];

export default function SecuritySettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [sessions, setSessions] = useState<ActiveSession[]>(mockSessions);
  const [newIP, setNewIP] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/security');
      if (response.ok) {
        const data = await response.json();
        const newSettings = { ...defaultSettings, ...data.settings };
        setSettings(newSettings);
        form.setFieldsValue(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (values: Partial<SecuritySettings>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...values }),
      });

      if (response.ok) {
        message.success(t('admin:settings.saveSuccess', 'Settings saved successfully'));
        setSettings(prev => ({ ...prev, ...values }));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error(t('admin:settings.saveError', 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const addToWhitelist = () => {
    if (newIP && !settings.ipWhitelist.includes(newIP)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIP],
      }));
      setNewIP('');
    }
  };

  const removeFromWhitelist = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip),
    }));
  };

  const terminateSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    message.success(t('admin:settings.security.sessionTerminated', 'Session terminated'));
  };

  const calculatePasswordStrength = () => {
    let score = 0;
    if (settings.minPasswordLength >= 8) score += 20;
    if (settings.minPasswordLength >= 12) score += 10;
    if (settings.requireUppercase) score += 15;
    if (settings.requireLowercase) score += 15;
    if (settings.requireNumbers) score += 15;
    if (settings.requireSpecialChars) score += 15;
    if (settings.preventPasswordReuse > 0) score += 10;
    return Math.min(score, 100);
  };

  const passwordStrength = calculatePasswordStrength();

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <SafetyOutlined style={{ marginRight: 12 }} />
          {t('admin:settings.security.title', 'Security Settings')}
        </Title>
        <Text type="secondary">
          {t('admin:settings.security.subtitle', 'Configure security policies and protect your platform')}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={handleSave}
      >
        {/* Security Score */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={24} align="middle">
            <Col xs={24} md={12}>
              <Title level={4} style={{ margin: 0 }}>
                {t('admin:settings.security.securityScore', 'Security Score')}
              </Title>
              <Paragraph type="secondary">
                {t('admin:settings.security.scoreDescription', 'Based on your current security configuration')}
              </Paragraph>
            </Col>
            <Col xs={24} md={12}>
              <Progress
                type="dashboard"
                percent={passwordStrength}
                status={passwordStrength >= 80 ? 'success' : passwordStrength >= 50 ? 'normal' : 'exception'}
                format={(percent) => (
                  <span style={{ fontSize: 24 }}>
                    {percent}%
                  </span>
                )}
              />
            </Col>
          </Row>
        </Card>

        {/* Password Policy */}
        <Card 
          title={
            <Space>
              <KeyOutlined />
              {t('admin:settings.security.passwordPolicy', 'Password Policy')}
            </Space>
          }
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="minPasswordLength"
                label={t('admin:settings.security.minLength', 'Minimum Length')}
              >
                <InputNumber min={6} max={32} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="passwordExpiryDays"
                label={t('admin:settings.security.expiryDays', 'Password Expiry (days)')}
              >
                <InputNumber min={0} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="preventPasswordReuse"
                label={t('admin:settings.security.preventReuse', 'Prevent Reuse (last N)')}
              >
                <InputNumber min={0} max={24} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            {t('admin:settings.security.requirements', 'Requirements')}
          </Divider>

          <Row gutter={24}>
            <Col xs={12} md={6}>
              <Form.Item name="requireUppercase" valuePropName="checked">
                <Switch /> {t('admin:settings.security.uppercase', 'Uppercase')}
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="requireLowercase" valuePropName="checked">
                <Switch /> {t('admin:settings.security.lowercase', 'Lowercase')}
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="requireNumbers" valuePropName="checked">
                <Switch /> {t('admin:settings.security.numbers', 'Numbers')}
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="requireSpecialChars" valuePropName="checked">
                <Switch /> {t('admin:settings.security.special', 'Special Chars')}
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Two-Factor Authentication */}
        <Card 
          title={
            <Space>
              <LockOutlined />
              {t('admin:settings.security.twoFactor', 'Two-Factor Authentication')}
            </Space>
          }
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="enable2FA"
                label={t('admin:settings.security.enable2FA', 'Enable 2FA')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="require2FAForAdmins"
                label={t('admin:settings.security.require2FAAdmins', 'Require for Admins')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="allowed2FAMethods"
                label={t('admin:settings.security.methods', 'Allowed Methods')}
              >
                <Select mode="multiple">
                  <Select.Option value="totp">Authenticator App (TOTP)</Select.Option>
                  <Select.Option value="email">Email OTP</Select.Option>
                  <Select.Option value="sms">SMS OTP</Select.Option>
                  <Select.Option value="webauthn">Security Key (WebAuthn)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Session Management */}
        <Card 
          title={
            <Space>
              <HistoryOutlined />
              {t('admin:settings.security.sessionManagement', 'Session Management')}
            </Space>
          }
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="sessionTimeout"
                label={t('admin:settings.security.timeout', 'Session Timeout (minutes)')}
              >
                <InputNumber min={5} max={1440} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="maxConcurrentSessions"
                label={t('admin:settings.security.maxSessions', 'Max Concurrent Sessions')}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="enforceSessionTimeout"
                label={t('admin:settings.security.enforceTimeout', 'Enforce Timeout')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            {t('admin:settings.security.activeSessions', 'Active Sessions')}
          </Divider>

          <List
            dataSource={sessions}
            renderItem={(session) => (
              <List.Item
                actions={[
                  session.isCurrent ? (
                    <Tag color="green">{t('admin:settings.security.current', 'Current')}</Tag>
                  ) : (
                    <Popconfirm
                      title={t('admin:settings.security.terminateConfirm', 'Terminate this session?')}
                      onConfirm={() => terminateSession(session.id)}
                    >
                      <Button type="text" danger size="small">
                        {t('admin:settings.security.terminate', 'Terminate')}
                      </Button>
                    </Popconfirm>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<DesktopOutlined style={{ fontSize: 24 }} />}
                  title={
                    <Space>
                      {session.userAgent}
                      {session.isCurrent && <Badge status="success" />}
                    </Space>
                  }
                  description={
                    <Space split={<Divider type="vertical" />}>
                      <span>{session.ipAddress}</span>
                      <span>{session.location}</span>
                      <span>{new Date(session.lastActivity).toLocaleString()}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        {/* Login Security */}
        <Card 
          title={
            <Space>
              <UserOutlined />
              {t('admin:settings.security.loginSecurity', 'Login Security')}
            </Space>
          }
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Row gutter={24}>
            <Col xs={24} md={6}>
              <Form.Item
                name="maxLoginAttempts"
                label={t('admin:settings.security.maxAttempts', 'Max Login Attempts')}
              >
                <InputNumber min={3} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="lockoutDuration"
                label={t('admin:settings.security.lockoutDuration', 'Lockout (minutes)')}
              >
                <InputNumber min={5} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="enableCaptcha"
                label={t('admin:settings.security.enableCaptcha', 'Enable CAPTCHA')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="captchaThreshold"
                label={t('admin:settings.security.captchaAfter', 'CAPTCHA After N Fails')}
              >
                <InputNumber min={1} max={5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* IP Security */}
        <Card 
          title={
            <Space>
              <GlobalOutlined />
              {t('admin:settings.security.ipSecurity', 'IP Security')}
            </Space>
          }
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="enableIPWhitelist"
                label={t('admin:settings.security.enableWhitelist', 'Enable IP Whitelist')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              {settings.enableIPWhitelist && (
                <>
                  <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                    <Input
                      placeholder="192.168.1.0/24"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={addToWhitelist}>
                      {t('admin:common.add', 'Add')}
                    </Button>
                  </Space.Compact>

                  <Space wrap>
                    {settings.ipWhitelist.map((ip) => (
                      <Tag
                        key={ip}
                        closable
                        onClose={() => removeFromWhitelist(ip)}
                        color="green"
                      >
                        {ip}
                      </Tag>
                    ))}
                  </Space>
                </>
              )}
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="enableIPBlacklist"
                label={t('admin:settings.security.enableBlacklist', 'Enable IP Blacklist')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Alert
                message={t('admin:settings.security.blacklistInfo', 'Blocked IPs')}
                description={t('admin:settings.security.blacklistDescription', 'IPs are automatically added after multiple failed login attempts')}
                type="warning"
                showIcon
              />
            </Col>
          </Row>
        </Card>

        {/* Rate Limiting */}
        <Card 
          title={t('admin:settings.security.rateLimiting', 'Rate Limiting')}
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="enableRateLimiting"
                label={t('admin:settings.security.enableRateLimit', 'Enable Rate Limiting')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="rateLimit"
                label={t('admin:settings.security.requestsPerWindow', 'Requests per Window')}
              >
                <InputNumber min={10} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="rateLimitWindow"
                label={t('admin:settings.security.windowSeconds', 'Window (seconds)')}
              >
                <InputNumber min={10} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Save Button */}
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            size="large"
          >
            {t('admin:settings.save', 'Save Settings')}
          </Button>
        </div>
      </Form>
    </div>
  );
}
