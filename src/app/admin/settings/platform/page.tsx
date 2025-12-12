'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  message,
  Tabs,
  Table,
  Space,
  InputNumber,
  Row,
  Col,
  Typography,
  Tag,
  Modal,
  Popconfirm,
  Tooltip,
  Badge,
  Statistic,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  BankOutlined,
  MobileOutlined,
  TruckOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  decimals: number;
  enabled: boolean;
  isDefault: boolean;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  enabled: boolean;
  isDefault: boolean;
  rtl: boolean;
}

interface Country {
  code: string;
  name: string;
  nameLocal: string;
  currency: string;
  language: string;
  enabled: boolean;
  shippingZone: string;
  freeShippingThreshold: number;
  baseShippingCost: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'mobile_money' | 'bank_transfer' | 'cod' | 'wallet';
  provider: string;
  enabled: boolean;
  countries: string[];
  icon: string;
  fees: { type: 'fixed' | 'percentage'; value: number };
}

interface Features {
  enableMultiCurrency: boolean;
  enableMultiLanguage: boolean;
  enableGuestCheckout: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableCompare: boolean;
  enableQuickView: boolean;
  enableSocialLogin: boolean;
  enableMobileMoneyPayments: boolean;
  enableCOD: boolean;
  enableExpressCheckout: boolean;
  enableProductQuestions: boolean;
  enableVendorMarketplace: boolean;
  enableLoyaltyProgram: boolean;
  enableReferralProgram: boolean;
  enablePushNotifications: boolean;
  enableSMS: boolean;
  enableWhatsApp: boolean;
}

interface BusinessRules {
  minOrderAmount: number;
  maxOrderAmount: number;
  lowStockThreshold: number;
  outOfStockBehavior: 'hide' | 'show_disabled' | 'allow_backorder';
  cartExpirationHours: number;
  abandonedCartReminderHours: number;
  orderCancellationHours: number;
  returnWindowDays: number;
  reviewModeration: 'auto' | 'manual' | 'ai';
}

interface PlatformSettings {
  currencies: Currency[];
  languages: Language[];
  countries: Country[];
  paymentMethods: PaymentMethod[];
  features: Features;
  businessRules: BusinessRules;
  shippingZones: Array<{
    id: string;
    name: string;
    countries: string[];
    baseRate: number;
    freeThreshold: number;
    estimatedDays: { min: number; max: number };
  }>;
}

export default function PlatformSettingsPage() {
    const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  
  // Modal states
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Currency | Language | Country | PaymentMethod | null>(null);
  const [modalForm] = Form.useForm();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/platform');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        message.success('Settings saved successfully!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (key: keyof Features, value: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      features: { ...settings.features, [key]: value },
    });
  };

  const updateBusinessRule = (key: keyof BusinessRules, value: number | string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      businessRules: { ...settings.businessRules, [key]: value },
    });
  };

  // Currency handlers
  const handleAddCurrency = () => {
    setEditingItem(null);
    modalForm.resetFields();
    setCurrencyModalOpen(true);
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingItem(currency);
    modalForm.setFieldsValue(currency);
    setCurrencyModalOpen(true);
  };

  const handleSaveCurrency = async () => {
    try {
      const values = await modalForm.validateFields();
      if (!settings) return;

      let newCurrencies: Currency[];
      if (editingItem) {
        newCurrencies = settings.currencies.map(c => 
          c.code === (editingItem as Currency).code ? { ...c, ...values } : c
        );
      } else {
        newCurrencies = [...settings.currencies, { ...values, enabled: true, isDefault: false }];
      }

      // If setting as default, unset others
      if (values.isDefault) {
        newCurrencies = newCurrencies.map(c => ({ ...c, isDefault: c.code === values.code }));
      }

      setSettings({ ...settings, currencies: newCurrencies });
      setCurrencyModalOpen(false);
      message.success('Currency saved');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteCurrency = (code: string) => {
    if (!settings) return;
    const currency = settings.currencies.find(c => c.code === code);
    if (currency?.isDefault) {
      message.error('Cannot delete default currency');
      return;
    }
    setSettings({
      ...settings,
      currencies: settings.currencies.filter(c => c.code !== code),
    });
    message.success('Currency deleted');
  };

  const toggleCurrencyEnabled = (code: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      currencies: settings.currencies.map(c => 
        c.code === code ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  // Language handlers
  const handleAddLanguage = () => {
    setEditingItem(null);
    modalForm.resetFields();
    setLanguageModalOpen(true);
  };

  const handleEditLanguage = (language: Language) => {
    setEditingItem(language);
    modalForm.setFieldsValue(language);
    setLanguageModalOpen(true);
  };

  const handleSaveLanguage = async () => {
    try {
      const values = await modalForm.validateFields();
      if (!settings) return;

      let newLanguages: Language[];
      if (editingItem) {
        newLanguages = settings.languages.map(l => 
          l.code === (editingItem as Language).code ? { ...l, ...values } : l
        );
      } else {
        newLanguages = [...settings.languages, { ...values, enabled: true, isDefault: false }];
      }

      if (values.isDefault) {
        newLanguages = newLanguages.map(l => ({ ...l, isDefault: l.code === values.code }));
      }

      setSettings({ ...settings, languages: newLanguages });
      setLanguageModalOpen(false);
      message.success('Language saved');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const toggleLanguageEnabled = (code: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      languages: settings.languages.map(l => 
        l.code === code ? { ...l, enabled: !l.enabled } : l
      ),
    });
  };

  // Country handlers
  const toggleCountryEnabled = (code: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      countries: settings.countries.map(c => 
        c.code === code ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  // Payment handlers
  const togglePaymentEnabled = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      paymentMethods: settings.paymentMethods.map(p => 
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    });
  };

  // Table columns
  const currencyColumns: ColumnsType<Currency> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string, record: Currency) => (
        <Space>
          <Tag color={record.isDefault ? 'gold' : 'default'}>{code}</Tag>
          {record.isDefault && <Badge status="success" text="Default" />}
        </Space>
      ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
    {
      title: 'Rate (vs EUR)',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => rate.toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: Currency) => (
        <Switch checked={enabled} onChange={() => toggleCurrencyEnabled(record.code)} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Currency) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEditCurrency(record)} />
          <Popconfirm
            title="Delete this currency?"
            onConfirm={() => handleDeleteCurrency(record.code)}
            disabled={record.isDefault}
          >
            <Button icon={<DeleteOutlined />} size="small" danger disabled={record.isDefault} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const languageColumns: ColumnsType<Language> = [
    {
      title: 'Language',
      key: 'language',
      render: (_: unknown, record: Language) => (
        <Space>
          <span style={{ fontSize: 20 }}>{record.flag}</span>
          <span>{record.name}</span>
          {record.isDefault && <Tag color="gold">Default</Tag>}
          {record.rtl && <Tag color="purple">RTL</Tag>}
        </Space>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Native Name', dataIndex: 'nativeName', key: 'nativeName' },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: Language) => (
        <Switch checked={enabled} onChange={() => toggleLanguageEnabled(record.code)} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Language) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => handleEditLanguage(record)} />
      ),
    },
  ];

  const countryColumns: ColumnsType<Country> = [
    {
      title: 'Country',
      key: 'country',
      render: (_: unknown, record: Country) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.nameLocal}</Text>
        </Space>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', width: 80 },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      render: (currency: string) => <Tag>{currency}</Tag>,
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      render: (lang: string) => <Tag color="blue">{lang.toUpperCase()}</Tag>,
    },
    {
      title: 'Free Shipping',
      dataIndex: 'freeShippingThreshold',
      key: 'freeShippingThreshold',
      render: (val: number) => `${(val / 100).toFixed(0)} €`,
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: Country) => (
        <Switch checked={enabled} onChange={() => toggleCountryEnabled(record.code)} />
      ),
    },
  ];

  const paymentColumns: ColumnsType<PaymentMethod> = [
    {
      title: 'Payment Method',
      key: 'method',
      render: (_: unknown, record: PaymentMethod) => (
        <Space>
          {record.type === 'mobile_money' && <MobileOutlined style={{ color: '#faad14' }} />}
          {record.type === 'card' && <CreditCardOutlined style={{ color: '#1890ff' }} />}
          {record.type === 'cod' && <BankOutlined style={{ color: '#52c41a' }} />}
          <Text strong>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'mobile_money' ? 'orange' : type === 'card' ? 'blue' : 'green'}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    { title: 'Provider', dataIndex: 'provider', key: 'provider' },
    {
      title: 'Fees',
      key: 'fees',
      render: (_: unknown, record: PaymentMethod) => (
        record.fees.type === 'percentage' 
          ? `${record.fees.value}%` 
          : `${(record.fees.value / 100).toFixed(2)} €`
      ),
    },
    {
      title: 'Countries',
      dataIndex: 'countries',
      key: 'countries',
      render: (countries: string[]) => (
        countries.length === 0 
          ? <Tag color="green">All</Tag>
          : <Tooltip title={countries.join(', ')}><Tag>{countries.length} countries</Tag></Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: PaymentMethod) => (
        <Switch checked={enabled} onChange={() => togglePaymentEnabled(record.id)} />
      ),
    },
  ];

  const featuresList = [
    { key: 'enableMultiCurrency', label: 'Multi-Currency', desc: 'Allow customers to view prices in different currencies', icon: <DollarOutlined /> },
    { key: 'enableMultiLanguage', label: 'Multi-Language', desc: 'Support multiple languages on the storefront', icon: <GlobalOutlined /> },
    { key: 'enableGuestCheckout', label: 'Guest Checkout', desc: 'Allow checkout without account creation', icon: <SafetyOutlined /> },
    { key: 'enableReviews', label: 'Product Reviews', desc: 'Allow customers to leave reviews', icon: <CheckCircleOutlined /> },
    { key: 'enableWishlist', label: 'Wishlist', desc: 'Allow customers to save products', icon: <CheckCircleOutlined /> },
    { key: 'enableCompare', label: 'Product Compare', desc: 'Allow comparing products side by side', icon: <CheckCircleOutlined /> },
    { key: 'enableQuickView', label: 'Quick View', desc: 'Preview products without leaving page', icon: <CheckCircleOutlined /> },
    { key: 'enableMobileMoneyPayments', label: 'Mobile Money', desc: 'Accept Orange Money, MTN MoMo, Wave, M-Pesa', icon: <MobileOutlined /> },
    { key: 'enableCOD', label: 'Cash on Delivery', desc: 'Allow payment on delivery', icon: <BankOutlined /> },
    { key: 'enableExpressCheckout', label: 'Express Checkout', desc: 'One-click checkout for returning customers', icon: <CheckCircleOutlined /> },
    { key: 'enableProductQuestions', label: 'Product Q&A', desc: 'Allow customers to ask questions', icon: <CheckCircleOutlined /> },
    { key: 'enableSocialLogin', label: 'Social Login', desc: 'Login with Google, Facebook, etc.', icon: <GlobalOutlined /> },
    { key: 'enablePushNotifications', label: 'Push Notifications', desc: 'Send browser push notifications', icon: <CheckCircleOutlined /> },
    { key: 'enableSMS', label: 'SMS Notifications', desc: 'Send order updates via SMS', icon: <MobileOutlined /> },
    { key: 'enableWhatsApp', label: 'WhatsApp', desc: 'Send notifications via WhatsApp', icon: <MobileOutlined /> },
  ];

  const tabItems = [
    {
      key: 'currencies',
      label: <span><DollarOutlined /> Currencies</span>,
      children: (
        <Card 
          title="Supported Currencies" 
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddCurrency}>Add Currency</Button>}
        >
          <Alert 
            message="Currency Exchange Rates" 
            description="Exchange rates are relative to EUR. Update rates regularly for accurate pricing."
            type="info" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
          <Table 
            columns={currencyColumns} 
            dataSource={settings?.currencies || []} 
            rowKey="code"
            loading={loading}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'languages',
      label: <span><GlobalOutlined /> Languages</span>,
      children: (
        <Card 
          title="Supported Languages" 
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddLanguage}>Add Language</Button>}
        >
          <Table 
            columns={languageColumns} 
            dataSource={settings?.languages || []} 
            rowKey="code"
            loading={loading}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'countries',
      label: <span><EnvironmentOutlined /> Countries</span>,
      children: (
        <Card title="Supported Countries & Shipping">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic 
                title="Total Countries" 
                value={settings?.countries.length || 0} 
                prefix={<EnvironmentOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Enabled" 
                value={settings?.countries.filter(c => c.enabled).length || 0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Shipping Zones" 
                value={settings?.shippingZones?.length || 0}
                prefix={<TruckOutlined />}
              />
            </Col>
          </Row>
          <Table 
            columns={countryColumns} 
            dataSource={settings?.countries || []} 
            rowKey="code"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'payments',
      label: <span><CreditCardOutlined /> Payments</span>,
      children: (
        <Card title="Payment Methods">
          <Alert 
            message="African Payment Methods" 
            description="Mobile Money payments (Orange Money, MTN MoMo, Wave, M-Pesa) are essential for African markets. Enable them for better conversion."
            type="success" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
          <Table 
            columns={paymentColumns} 
            dataSource={settings?.paymentMethods || []} 
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'features',
      label: <span><SettingOutlined /> Features</span>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Store Features" loading={loading}>
              <Row gutter={[16, 16]}>
                {featuresList.map(feature => (
                  <Col xs={24} md={12} key={feature.key}>
                    <Card size="small" style={{ height: '100%' }}>
                      <Space align="start">
                        <div style={{ fontSize: 24, color: '#1890ff' }}>{feature.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>{feature.label}</Text>
                            <Switch 
                              checked={settings?.features?.[feature.key as keyof Features] ?? false}
                              onChange={(checked) => updateFeature(feature.key as keyof Features, checked)}
                            />
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{feature.desc}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Business Rules" loading={loading}>
              <Form layout="vertical">
                <Form.Item label="Minimum Order Amount (EUR cents)">
                  <InputNumber 
                    value={settings?.businessRules?.minOrderAmount}
                    onChange={(val) => updateBusinessRule('minOrderAmount', val || 0)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Low Stock Threshold">
                  <InputNumber 
                    value={settings?.businessRules?.lowStockThreshold}
                    onChange={(val) => updateBusinessRule('lowStockThreshold', val || 10)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Out of Stock Behavior">
                  <Select 
                    value={settings?.businessRules?.outOfStockBehavior}
                    onChange={(val) => updateBusinessRule('outOfStockBehavior', val)}
                  >
                    <Select.Option value="hide">Hide product</Select.Option>
                    <Select.Option value="show_disabled">Show as disabled</Select.Option>
                    <Select.Option value="allow_backorder">Allow backorder</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Cart Expiration (hours)">
                  <InputNumber 
                    value={settings?.businessRules?.cartExpirationHours}
                    onChange={(val) => updateBusinessRule('cartExpirationHours', val || 72)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Return Window (days)">
                  <InputNumber 
                    value={settings?.businessRules?.returnWindowDays}
                    onChange={(val) => updateBusinessRule('returnWindowDays', val || 14)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Review Moderation">
                  <Select 
                    value={settings?.businessRules?.reviewModeration}
                    onChange={(val) => updateBusinessRule('reviewModeration', val)}
                  >
                    <Select.Option value="auto">Auto-approve</Select.Option>
                    <Select.Option value="manual">Manual review</Select.Option>
                    <Select.Option value="ai">AI moderation</Select.Option>
                  </Select>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1600 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <SettingOutlined /> Platform Configuration
          </Title>
          <Text type="secondary">
            Configure currencies, languages, countries, payment methods and features
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchSettings} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} size="large">
            Save All Changes
          </Button>
        </Space>
      </div>

      <Tabs items={tabItems} size="large" />

      {/* Currency Modal */}
      <Modal
        title={editingItem ? 'Edit Currency' : 'Add Currency'}
        open={currencyModalOpen}
        onOk={handleSaveCurrency}
        onCancel={() => setCurrencyModalOpen(false)}
      >
        <Form form={modalForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="Currency Code" rules={[{ required: true }]}>
                <Input placeholder="XOF" maxLength={3} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
                <Input placeholder="FCFA" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="name" label="Currency Name" rules={[{ required: true }]}>
            <Input placeholder="CFA Franc BCEAO" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="rate" label="Exchange Rate (vs EUR)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="decimals" label="Decimal Places" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={4} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isDefault" valuePropName="checked">
            <Switch /> Set as default currency
          </Form.Item>
        </Form>
      </Modal>

      {/* Language Modal */}
      <Modal
        title={editingItem ? 'Edit Language' : 'Add Language'}
        open={languageModalOpen}
        onOk={handleSaveLanguage}
        onCancel={() => setLanguageModalOpen(false)}
      >
        <Form form={modalForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="Language Code" rules={[{ required: true }]}>
                <Input placeholder="fr" maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="flag" label="Flag Emoji" rules={[{ required: true }]}>
                <Input placeholder="🇫🇷" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Name (English)" rules={[{ required: true }]}>
                <Input placeholder="French" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nativeName" label="Native Name" rules={[{ required: true }]}>
                <Input placeholder="Français" />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Form.Item name="rtl" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch /> RTL (Right-to-Left)
            </Form.Item>
            <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch /> Set as default
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
