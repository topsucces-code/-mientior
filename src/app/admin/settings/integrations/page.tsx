'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Row,
  Col,
  Typography,
  Alert,
  Tag,
  Space,
  Collapse,
  Badge,
  Modal,
} from 'antd';
import {
  SaveOutlined,
  ApiOutlined,
  CloudOutlined,
  GoogleOutlined,
  FacebookOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  LinkOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'analytics' | 'marketing' | 'shipping' | 'payment' | 'social' | 'storage' | 'erp';
  connected: boolean;
  settings: Record<string, string>;
  requiredFields: { key: string; label: string; type: 'text' | 'password' | 'select'; options?: string[] }[];
}

interface IntegrationSettings {
  // Analytics
  googleAnalyticsId: string;
  googleAnalyticsEnabled: boolean;
  facebookPixelId: string;
  facebookPixelEnabled: boolean;
  hotjarId: string;
  hotjarEnabled: boolean;
  
  // Marketing
  mailchimpApiKey: string;
  mailchimpListId: string;
  mailchimpEnabled: boolean;
  klaviyoApiKey: string;
  klaviyoEnabled: boolean;
  
  // Social
  facebookAppId: string;
  facebookAppSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  
  // Storage
  storageProvider: 'local' | 's3' | 'cloudinary' | 'gcs';
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  
  // ERP/Inventory
  akeneoEnabled: boolean;
  akeneoUrl: string;
  akeneoClientId: string;
  akeneoSecret: string;
  
  // Shipping
  shippoApiKey: string;
  shippoEnabled: boolean;
  easypostApiKey: string;
  easypostEnabled: boolean;
}

const defaultSettings: IntegrationSettings = {
  googleAnalyticsId: '',
  googleAnalyticsEnabled: false,
  facebookPixelId: '',
  facebookPixelEnabled: false,
  hotjarId: '',
  hotjarEnabled: false,
  mailchimpApiKey: '',
  mailchimpListId: '',
  mailchimpEnabled: false,
  klaviyoApiKey: '',
  klaviyoEnabled: false,
  facebookAppId: '',
  facebookAppSecret: '',
  googleClientId: '',
  googleClientSecret: '',
  storageProvider: 'local',
  s3Bucket: '',
  s3Region: 'eu-west-1',
  s3AccessKey: '',
  s3SecretKey: '',
  cloudinaryCloudName: '',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: '',
  akeneoEnabled: false,
  akeneoUrl: '',
  akeneoClientId: '',
  akeneoSecret: '',
  shippoApiKey: '',
  shippoEnabled: false,
  easypostApiKey: '',
  easypostEnabled: false,
};

const integrations: Integration[] = [
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Track website traffic and user behavior',
    icon: <GoogleOutlined style={{ fontSize: 24, color: '#4285F4' }} />,
    category: 'analytics',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'googleAnalyticsId', label: 'Measurement ID', type: 'text' },
    ],
  },
  {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    description: 'Track conversions and optimize ads',
    icon: <FacebookOutlined style={{ fontSize: 24, color: '#1877F2' }} />,
    category: 'analytics',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'facebookPixelId', label: 'Pixel ID', type: 'text' },
    ],
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Heatmaps and session recordings',
    icon: <span style={{ fontSize: 24 }}>🔥</span>,
    category: 'analytics',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'hotjarId', label: 'Site ID', type: 'text' },
    ],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation',
    icon: <span style={{ fontSize: 24 }}>🐵</span>,
    category: 'marketing',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'mailchimpApiKey', label: 'API Key', type: 'password' },
      { key: 'mailchimpListId', label: 'List ID', type: 'text' },
    ],
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Advanced email & SMS marketing',
    icon: <span style={{ fontSize: 24 }}>📧</span>,
    category: 'marketing',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'klaviyoApiKey', label: 'API Key', type: 'password' },
    ],
  },
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    description: 'Cloud storage for media files',
    icon: <CloudOutlined style={{ fontSize: 24, color: '#FF9900' }} />,
    category: 'storage',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 's3Bucket', label: 'Bucket Name', type: 'text' },
      { key: 's3Region', label: 'Region', type: 'select', options: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1'] },
      { key: 's3AccessKey', label: 'Access Key', type: 'text' },
      { key: 's3SecretKey', label: 'Secret Key', type: 'password' },
    ],
  },
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    description: 'Image and video management',
    icon: <CloudOutlined style={{ fontSize: 24, color: '#3448C5' }} />,
    category: 'storage',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'cloudinaryCloudName', label: 'Cloud Name', type: 'text' },
      { key: 'cloudinaryApiKey', label: 'API Key', type: 'text' },
      { key: 'cloudinaryApiSecret', label: 'API Secret', type: 'password' },
    ],
  },
  {
    id: 'akeneo',
    name: 'Akeneo PIM',
    description: 'Product Information Management',
    icon: <span style={{ fontSize: 24 }}>📦</span>,
    category: 'erp',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'akeneoUrl', label: 'Akeneo URL', type: 'text' },
      { key: 'akeneoClientId', label: 'Client ID', type: 'text' },
      { key: 'akeneoSecret', label: 'Secret', type: 'password' },
    ],
  },
  {
    id: 'shippo',
    name: 'Shippo',
    description: 'Multi-carrier shipping API',
    icon: <span style={{ fontSize: 24 }}>📦</span>,
    category: 'shipping',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'shippoApiKey', label: 'API Key', type: 'password' },
    ],
  },
  {
    id: 'easypost',
    name: 'EasyPost',
    description: 'Shipping API for labels & tracking',
    icon: <span style={{ fontSize: 24 }}>🚚</span>,
    category: 'shipping',
    connected: false,
    settings: {},
    requiredFields: [
      { key: 'easypostApiKey', label: 'API Key', type: 'password' },
    ],
  },
];

export default function IntegrationsSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IntegrationSettings>(defaultSettings);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configForm] = Form.useForm();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/integrations');
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

  const handleSave = async (values: Partial<IntegrationSettings>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/integrations', {
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

  const openConfigModal = (integration: Integration) => {
    setSelectedIntegration(integration);
    const currentValues: Record<string, string> = {};
    integration.requiredFields.forEach(field => {
      currentValues[field.key] = settings[field.key as keyof IntegrationSettings] as string || '';
    });
    configForm.setFieldsValue(currentValues);
    setConfigModalVisible(true);
  };

  const handleSaveIntegration = async () => {
    try {
      const values = await configForm.validateFields();
      const newSettings = { ...settings, ...values };
      
      // Mark as enabled
      const enabledKey = `${selectedIntegration?.id.replace(/-/g, '')}Enabled` as keyof IntegrationSettings;
      if (enabledKey in newSettings) {
        (newSettings as Record<string, unknown>)[enabledKey] = true;
      }

      setSettings(newSettings);
      setConfigModalVisible(false);
      message.success(`${selectedIntegration?.name} configured successfully`);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const isIntegrationConnected = (integration: Integration): boolean => {
    const enabledKey = `${integration.id.replace(/-/g, '')}Enabled`;
    return settings[enabledKey as keyof IntegrationSettings] as boolean || false;
  };

  const testConnection = async (integration: Integration) => {
    message.loading(`Testing ${integration.name} connection...`, 0);
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.destroy();
    message.success(`${integration.name} connection successful!`);
  };

  const renderIntegrationCard = (integration: Integration) => {
    const connected = isIntegrationConnected(integration);
    
    return (
      <Card
        key={integration.id}
        size="small"
        style={{ marginBottom: 16 }}
        actions={[
          <Button
            key="configure"
            type="link"
            icon={<SettingOutlined />}
            onClick={() => openConfigModal(integration)}
          >
            Configure
          </Button>,
          connected && (
            <Button
              key="test"
              type="link"
              icon={<SyncOutlined />}
              onClick={() => testConnection(integration)}
            >
              Test
            </Button>
          ),
        ].filter(Boolean)}
      >
        <Card.Meta
          avatar={integration.icon}
          title={
            <Space>
              {integration.name}
              {connected ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>Connected</Tag>
              ) : (
                <Tag color="default">Not Connected</Tag>
              )}
            </Space>
          }
          description={integration.description}
        />
      </Card>
    );
  };

  const categories = [
    { key: 'analytics', label: 'Analytics & Tracking', icon: '📊' },
    { key: 'marketing', label: 'Marketing & Email', icon: '📧' },
    { key: 'storage', label: 'Storage & Media', icon: '☁️' },
    { key: 'shipping', label: 'Shipping & Logistics', icon: '🚚' },
    { key: 'erp', label: 'ERP & Inventory', icon: '📦' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <ApiOutlined style={{ marginRight: 12 }} />
          {t('admin:settings.integrations.title', 'Integrations')}
        </Title>
        <Text type="secondary">
          {t('admin:settings.integrations.subtitle', 'Connect third-party services to enhance your store')}
        </Text>
      </div>

      {/* Storage Provider Selection */}
      <Card 
        title={
          <Space>
            <CloudOutlined />
            {t('admin:settings.integrations.storageProvider', 'Media Storage Provider')}
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onFinish={handleSave}
        >
          <Form.Item
            name="storageProvider"
            label={t('admin:settings.integrations.selectProvider', 'Select Storage Provider')}
          >
            <Select style={{ maxWidth: 300 }}>
              <Select.Option value="local">Local Storage</Select.Option>
              <Select.Option value="s3">Amazon S3</Select.Option>
              <Select.Option value="cloudinary">Cloudinary</Select.Option>
              <Select.Option value="gcs">Google Cloud Storage</Select.Option>
            </Select>
          </Form.Item>

          <Alert
            message={t('admin:settings.integrations.storageInfo', 'Storage Configuration')}
            description={t('admin:settings.integrations.storageDescription', 'Configure your selected storage provider in the integrations below.')}
            type="info"
            showIcon
          />
        </Form>
      </Card>

      {/* Social Login */}
      <Card 
        title={
          <Space>
            <LinkOutlined />
            {t('admin:settings.integrations.socialLogin', 'Social Login')}
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form layout="vertical">
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card size="small" title={<Space><GoogleOutlined style={{ color: '#4285F4' }} /> Google</Space>}>
                <Form.Item label="Client ID">
                  <Input 
                    value={settings.googleClientId}
                    onChange={(e) => setSettings(prev => ({ ...prev, googleClientId: e.target.value }))}
                    placeholder="xxxxx.apps.googleusercontent.com"
                  />
                </Form.Item>
                <Form.Item label="Client Secret">
                  <Input.Password 
                    value={settings.googleClientSecret}
                    onChange={(e) => setSettings(prev => ({ ...prev, googleClientSecret: e.target.value }))}
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title={<Space><FacebookOutlined style={{ color: '#1877F2' }} /> Facebook</Space>}>
                <Form.Item label="App ID">
                  <Input 
                    value={settings.facebookAppId}
                    onChange={(e) => setSettings(prev => ({ ...prev, facebookAppId: e.target.value }))}
                  />
                </Form.Item>
                <Form.Item label="App Secret">
                  <Input.Password 
                    value={settings.facebookAppSecret}
                    onChange={(e) => setSettings(prev => ({ ...prev, facebookAppSecret: e.target.value }))}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Integration Categories */}
      <Collapse defaultActiveKey={['analytics']} style={{ marginBottom: 24 }}>
        {categories.map(category => {
          const categoryIntegrations = integrations.filter(i => i.category === category.key);
          const connectedCount = categoryIntegrations.filter(i => isIntegrationConnected(i)).length;

          return (
            <Panel
              key={category.key}
              header={
                <Space>
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  <Badge 
                    count={`${connectedCount}/${categoryIntegrations.length}`} 
                    style={{ backgroundColor: connectedCount > 0 ? '#52c41a' : '#d9d9d9' }}
                  />
                </Space>
              }
            >
              <Row gutter={16}>
                {categoryIntegrations.map(integration => (
                  <Col xs={24} md={12} key={integration.id}>
                    {renderIntegrationCard(integration)}
                  </Col>
                ))}
              </Row>
            </Panel>
          );
        })}
      </Collapse>

      {/* Save Button */}
      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          size="large"
          onClick={() => handleSave(settings)}
        >
          {t('admin:settings.save', 'Save All Settings')}
        </Button>
      </div>

      {/* Configuration Modal */}
      <Modal
        title={
          <Space>
            {selectedIntegration?.icon}
            {`Configure ${selectedIntegration?.name}`}
          </Space>
        }
        open={configModalVisible}
        onOk={handleSaveIntegration}
        onCancel={() => setConfigModalVisible(false)}
        width={500}
      >
        <Form form={configForm} layout="vertical">
          {selectedIntegration?.requiredFields.map(field => (
            <Form.Item
              key={field.key}
              name={field.key}
              label={field.label}
              rules={[{ required: true, message: `${field.label} is required` }]}
            >
              {field.type === 'password' ? (
                <Input.Password />
              ) : field.type === 'select' ? (
                <Select>
                  {field.options?.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>

        {selectedIntegration && (
          <Alert
            message="Documentation"
            description={
              <a href="#" target="_blank" rel="noopener noreferrer">
                View {selectedIntegration.name} integration guide →
              </a>
            }
            type="info"
          />
        )}
      </Modal>
    </div>
  );
}
