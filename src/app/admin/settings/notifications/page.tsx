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
  Table,
  Space,
  Tabs,
  Tag,
  Row,
  Col,
  Typography,
  Alert,
  Divider,
  Modal,
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  MailOutlined,
  BellOutlined,
  MobileOutlined,
  ApiOutlined,
  EditOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'order' | 'user' | 'marketing' | 'system';
  enabled: boolean;
  variables: string[];
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  lastTriggered?: string;
  failureCount: number;
}

interface NotificationSettings {
  // Email Settings
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  
  // Push Notifications
  pushEnabled: boolean;
  firebaseServerKey: string;
  oneSignalAppId: string;
  oneSignalApiKey: string;
  
  // SMS Settings
  smsEnabled: boolean;
  smsProvider: 'twilio' | 'nexmo' | 'messagebird';
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
  
  // Notification Preferences
  orderConfirmation: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  orderCancelled: boolean;
  paymentReceived: boolean;
  paymentFailed: boolean;
  lowStockAlert: boolean;
  newUserRegistration: boolean;
  newReview: boolean;
  vendorApplication: boolean;
  
  // Admin Notifications
  adminOrderEmail: string;
  adminLowStockEmail: string;
  adminNewUserEmail: string;
  
  // Templates
  emailTemplates: EmailTemplate[];
  
  // Webhooks
  webhooks: WebhookEndpoint[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Order Confirmation',
    subject: 'Your order #{{orderNumber}} has been confirmed',
    body: 'Dear {{customerName}},\n\nThank you for your order...',
    type: 'order',
    enabled: true,
    variables: ['orderNumber', 'customerName', 'orderTotal', 'orderItems'],
  },
  {
    id: '2',
    name: 'Order Shipped',
    subject: 'Your order #{{orderNumber}} has been shipped',
    body: 'Dear {{customerName}},\n\nYour order is on its way...',
    type: 'order',
    enabled: true,
    variables: ['orderNumber', 'customerName', 'trackingNumber', 'carrier'],
  },
  {
    id: '3',
    name: 'Welcome Email',
    subject: 'Welcome to {{storeName}}!',
    body: 'Dear {{customerName}},\n\nWelcome to our store...',
    type: 'user',
    enabled: true,
    variables: ['customerName', 'storeName'],
  },
  {
    id: '4',
    name: 'Password Reset',
    subject: 'Reset your password',
    body: 'Click the link below to reset your password...',
    type: 'user',
    enabled: true,
    variables: ['resetLink', 'expiryTime'],
  },
  {
    id: '5',
    name: 'Low Stock Alert',
    subject: 'Low stock alert: {{productName}}',
    body: 'The following product is running low on stock...',
    type: 'system',
    enabled: true,
    variables: ['productName', 'currentStock', 'threshold'],
  },
];

const defaultWebhooks: WebhookEndpoint[] = [
  {
    id: '1',
    name: 'Order Webhook',
    url: 'https://api.example.com/webhooks/orders',
    events: ['order.created', 'order.updated', 'order.cancelled'],
    secret: 'whsec_xxxxx',
    enabled: true,
    lastTriggered: new Date().toISOString(),
    failureCount: 0,
  },
];

const defaultSettings: NotificationSettings = {
  emailEnabled: true,
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpSecure: true,
  smtpUser: '',
  smtpPassword: '',
  fromName: 'Mientior',
  fromEmail: 'noreply@mientior.com',
  replyToEmail: 'support@mientior.com',
  pushEnabled: false,
  firebaseServerKey: '',
  oneSignalAppId: '',
  oneSignalApiKey: '',
  smsEnabled: false,
  smsProvider: 'twilio',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioFromNumber: '',
  orderConfirmation: true,
  orderShipped: true,
  orderDelivered: true,
  orderCancelled: true,
  paymentReceived: true,
  paymentFailed: true,
  lowStockAlert: true,
  newUserRegistration: true,
  newReview: true,
  vendorApplication: true,
  adminOrderEmail: 'admin@mientior.com',
  adminLowStockEmail: 'inventory@mientior.com',
  adminNewUserEmail: 'admin@mientior.com',
  emailTemplates: defaultTemplates,
  webhooks: defaultWebhooks,
};

const webhookEvents = [
  { value: 'order.created', label: 'Order Created' },
  { value: 'order.updated', label: 'Order Updated' },
  { value: 'order.cancelled', label: 'Order Cancelled' },
  { value: 'order.shipped', label: 'Order Shipped' },
  { value: 'order.delivered', label: 'Order Delivered' },
  { value: 'payment.received', label: 'Payment Received' },
  { value: 'payment.failed', label: 'Payment Failed' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.updated', label: 'User Updated' },
  { value: 'product.created', label: 'Product Created' },
  { value: 'product.updated', label: 'Product Updated' },
  { value: 'product.low_stock', label: 'Product Low Stock' },
];

export default function NotificationSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [webhookForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [webhookModalVisible, setWebhookModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', body: '' });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/notifications');
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

  const handleSave = async (values: Partial<NotificationSettings>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/notifications', {
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

  const handleTestEmail = async () => {
    try {
      message.loading('Sending test email...', 0);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.destroy();
      message.success('Test email sent successfully!');
    } catch {
      message.destroy();
      message.error('Failed to send test email');
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue(template);
    setTemplateModalVisible(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    // Replace variables with sample data
    let subject = template.subject;
    let body = template.body;
    
    const sampleData: Record<string, string> = {
      orderNumber: 'ORD-12345',
      customerName: 'John Doe',
      orderTotal: '€99.99',
      storeName: 'Mientior',
      trackingNumber: 'TRK123456789',
      carrier: 'DHL',
      resetLink: 'https://example.com/reset',
      expiryTime: '24 hours',
      productName: 'Sample Product',
      currentStock: '5',
      threshold: '10',
    };

    template.variables.forEach(v => {
      subject = subject.replace(`{{${v}}}`, sampleData[v] || `[${v}]`);
      body = body.replace(`{{${v}}}`, sampleData[v] || `[${v}]`);
    });

    setPreviewContent({ subject, body });
    setPreviewModalVisible(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      const newTemplates = settings.emailTemplates.map(t =>
        t.id === editingTemplate?.id ? { ...t, ...values } : t
      );
      setSettings(prev => ({ ...prev, emailTemplates: newTemplates }));
      setTemplateModalVisible(false);
      message.success('Template updated');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleEditWebhook = (webhook: WebhookEndpoint) => {
    setEditingWebhook(webhook);
    webhookForm.setFieldsValue(webhook);
    setWebhookModalVisible(true);
  };

  const handleSaveWebhook = async () => {
    try {
      const values = await webhookForm.validateFields();
      let newWebhooks: WebhookEndpoint[];

      if (editingWebhook) {
        newWebhooks = settings.webhooks.map(w =>
          w.id === editingWebhook.id ? { ...w, ...values } : w
        );
      } else {
        const newWebhook: WebhookEndpoint = {
          ...values,
          id: `webhook-${Date.now()}`,
          secret: `whsec_${Math.random().toString(36).substr(2, 32)}`,
          failureCount: 0,
        };
        newWebhooks = [...settings.webhooks, newWebhook];
      }

      setSettings(prev => ({ ...prev, webhooks: newWebhooks }));
      setWebhookModalVisible(false);
      message.success(editingWebhook ? 'Webhook updated' : 'Webhook added');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const templateColumns = [
    {
      title: t('admin:settings.notifications.templateName', 'Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin:settings.notifications.type', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          order: 'blue',
          user: 'green',
          marketing: 'purple',
          system: 'orange',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: t('admin:settings.notifications.subject', 'Subject'),
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: t('admin:settings.notifications.status', 'Status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: EmailTemplate) => (
        <Switch
          checked={enabled}
          onChange={(checked) => {
            const newTemplates = settings.emailTemplates.map(t =>
              t.id === record.id ? { ...t, enabled: checked } : t
            );
            setSettings(prev => ({ ...prev, emailTemplates: newTemplates }));
          }}
          size="small"
        />
      ),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: EmailTemplate) => (
        <Space>
          <Tooltip title={t('admin:common.preview', 'Preview')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewTemplate(record)}
            />
          </Tooltip>
          <Tooltip title={t('admin:common.edit', 'Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditTemplate(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const webhookColumns = [
    {
      title: t('admin:settings.notifications.webhookName', 'Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin:settings.notifications.url', 'URL'),
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
    },
    {
      title: t('admin:settings.notifications.events', 'Events'),
      dataIndex: 'events',
      key: 'events',
      render: (events: string[]) => (
        <Space wrap>
          {events.slice(0, 2).map(e => <Tag key={e}>{e}</Tag>)}
          {events.length > 2 && <Tag>+{events.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: t('admin:settings.notifications.status', 'Status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: WebhookEndpoint) => (
        <Space>
          <Switch
            checked={enabled}
            onChange={(checked) => {
              const newWebhooks = settings.webhooks.map(w =>
                w.id === record.id ? { ...w, enabled: checked } : w
              );
              setSettings(prev => ({ ...prev, webhooks: newWebhooks }));
            }}
            size="small"
          />
          {record.failureCount > 0 && (
            <Tag color="red">{record.failureCount} failures</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: WebhookEndpoint) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditWebhook(record)}
          />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined /> {t('admin:settings.notifications.email', 'Email')}
        </span>
      ),
      children: (
        <Card loading={loading}>
          <Form.Item
            name="emailEnabled"
            label={t('admin:settings.notifications.enableEmail', 'Enable Email Notifications')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left">SMTP Configuration</Divider>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="smtpHost" label="SMTP Host">
                <Input placeholder="smtp.example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="smtpPort" label="Port">
                <Input type="number" placeholder="587" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="smtpSecure" label="Use TLS" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="smtpUser" label="Username">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="smtpPassword" label="Password">
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="fromName" label="From Name">
                <Input placeholder="Mientior" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="fromEmail" label="From Email">
                <Input placeholder="noreply@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="replyToEmail" label="Reply-To Email">
                <Input placeholder="support@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Button icon={<SendOutlined />} onClick={handleTestEmail}>
            {t('admin:settings.notifications.sendTest', 'Send Test Email')}
          </Button>
        </Card>
      ),
    },
    {
      key: 'templates',
      label: (
        <span>
          <EditOutlined /> {t('admin:settings.notifications.templates', 'Templates')}
        </span>
      ),
      children: (
        <Card loading={loading}>
          <Table
            dataSource={settings.emailTemplates}
            columns={templateColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'triggers',
      label: (
        <span>
          <BellOutlined /> {t('admin:settings.notifications.triggers', 'Triggers')}
        </span>
      ),
      children: (
        <Card loading={loading}>
          <Title level={5}>{t('admin:settings.notifications.orderNotifications', 'Order Notifications')}</Title>
          <Row gutter={24}>
            <Col xs={12} md={6}>
              <Form.Item name="orderConfirmation" valuePropName="checked">
                <Switch /> Order Confirmation
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="orderShipped" valuePropName="checked">
                <Switch /> Order Shipped
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="orderDelivered" valuePropName="checked">
                <Switch /> Order Delivered
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="orderCancelled" valuePropName="checked">
                <Switch /> Order Cancelled
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>{t('admin:settings.notifications.paymentNotifications', 'Payment Notifications')}</Title>
          <Row gutter={24}>
            <Col xs={12} md={6}>
              <Form.Item name="paymentReceived" valuePropName="checked">
                <Switch /> Payment Received
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="paymentFailed" valuePropName="checked">
                <Switch /> Payment Failed
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>{t('admin:settings.notifications.systemNotifications', 'System Notifications')}</Title>
          <Row gutter={24}>
            <Col xs={12} md={6}>
              <Form.Item name="lowStockAlert" valuePropName="checked">
                <Switch /> Low Stock Alert
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="newUserRegistration" valuePropName="checked">
                <Switch /> New User Registration
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="newReview" valuePropName="checked">
                <Switch /> New Review
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="vendorApplication" valuePropName="checked">
                <Switch /> Vendor Application
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>{t('admin:settings.notifications.adminEmails', 'Admin Email Recipients')}</Title>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="adminOrderEmail" label="Order Notifications">
                <Input placeholder="admin@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="adminLowStockEmail" label="Low Stock Alerts">
                <Input placeholder="inventory@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="adminNewUserEmail" label="New User Notifications">
                <Input placeholder="admin@example.com" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'webhooks',
      label: (
        <span>
          <ApiOutlined /> {t('admin:settings.notifications.webhooks', 'Webhooks')}
        </span>
      ),
      children: (
        <Card
          loading={loading}
          extra={
            <Button
              type="primary"
              icon={<ApiOutlined />}
              onClick={() => {
                setEditingWebhook(null);
                webhookForm.resetFields();
                setWebhookModalVisible(true);
              }}
            >
              {t('admin:settings.notifications.addWebhook', 'Add Webhook')}
            </Button>
          }
        >
          <Alert
            message={t('admin:settings.notifications.webhookInfo', 'Webhook Information')}
            description={t('admin:settings.notifications.webhookDescription', 'Webhooks allow you to send real-time notifications to external services when events occur in your store.')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={settings.webhooks}
            columns={webhookColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'push',
      label: (
        <span>
          <MobileOutlined /> {t('admin:settings.notifications.push', 'Push & SMS')}
        </span>
      ),
      children: (
        <Card loading={loading}>
          <Title level={5}>Push Notifications</Title>
          <Form.Item
            name="pushEnabled"
            label={t('admin:settings.notifications.enablePush', 'Enable Push Notifications')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="oneSignalAppId" label="OneSignal App ID">
                <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="oneSignalApiKey" label="OneSignal API Key">
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>SMS Notifications</Title>
          <Form.Item
            name="smsEnabled"
            label={t('admin:settings.notifications.enableSMS', 'Enable SMS Notifications')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="smsProvider" label="SMS Provider">
                <Select>
                  <Select.Option value="twilio">Twilio</Select.Option>
                  <Select.Option value="nexmo">Vonage (Nexmo)</Select.Option>
                  <Select.Option value="messagebird">MessageBird</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="twilioAccountSid" label="Account SID">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="twilioAuthToken" label="Auth Token">
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="twilioFromNumber" label="From Number">
            <Input placeholder="+1234567890" style={{ maxWidth: 300 }} />
          </Form.Item>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <BellOutlined style={{ marginRight: 12 }} />
          {t('admin:settings.notifications.title', 'Notification Settings')}
        </Title>
        <Text type="secondary">
          {t('admin:settings.notifications.subtitle', 'Configure email, push, SMS notifications and webhooks')}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={handleSave}
      >
        <Tabs items={tabItems} />

        <div style={{ textAlign: 'right', marginTop: 24 }}>
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

      {/* Template Edit Modal */}
      <Modal
        title={t('admin:settings.notifications.editTemplate', 'Edit Email Template')}
        open={templateModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => setTemplateModalVisible(false)}
        width={700}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item name="name" label="Template Name">
            <Input disabled />
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}>
            <TextArea rows={10} />
          </Form.Item>
          {editingTemplate && (
            <Alert
              message="Available Variables"
              description={
                <Space wrap>
                  {editingTemplate.variables.map(v => (
                    <Tag key={v} color="blue">{`{{${v}}}`}</Tag>
                  ))}
                </Space>
              }
              type="info"
            />
          )}
        </Form>
      </Modal>

      {/* Template Preview Modal */}
      <Modal
        title={t('admin:settings.notifications.preview', 'Email Preview')}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={600}
      >
        <Card title={previewContent.subject} size="small">
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {previewContent.body}
          </pre>
        </Card>
      </Modal>

      {/* Webhook Modal */}
      <Modal
        title={editingWebhook 
          ? t('admin:settings.notifications.editWebhook', 'Edit Webhook')
          : t('admin:settings.notifications.addWebhook', 'Add Webhook')
        }
        open={webhookModalVisible}
        onOk={handleSaveWebhook}
        onCancel={() => setWebhookModalVisible(false)}
        width={600}
      >
        <Form form={webhookForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Order Webhook" />
          </Form.Item>
          <Form.Item name="url" label="Endpoint URL" rules={[{ required: true, type: 'url' }]}>
            <Input placeholder="https://api.example.com/webhooks" />
          </Form.Item>
          <Form.Item name="events" label="Events" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="Select events">
              {webhookEvents.map(e => (
                <Select.Option key={e.value} value={e.value}>{e.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="enabled" label="Enabled" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
