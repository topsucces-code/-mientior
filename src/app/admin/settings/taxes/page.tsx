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
  InputNumber,
  Modal,
  Tag,
  Popconfirm,
  Row,
  Col,
  Typography,
  Tooltip,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PercentageOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface TaxRate {
  id: string;
  name: string;
  country: string;
  region?: string;
  rate: number;
  type: 'standard' | 'reduced' | 'zero' | 'exempt';
  applyToShipping: boolean;
  enabled: boolean;
  priority: number;
}

interface TaxClass {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
}

interface TaxSettings {
  enableTaxes: boolean;
  pricesIncludeTax: boolean;
  calculateTaxBasedOn: 'shipping' | 'billing' | 'store';
  shippingTaxClass: string;
  displayPricesInShop: 'including' | 'excluding';
  displayPricesInCart: 'including' | 'excluding';
  displayTaxTotals: 'single' | 'itemized';
  roundTaxAtSubtotal: boolean;
  euVatEnabled: boolean;
  euVatNumber: string;
  validateVatNumbers: boolean;
  taxClasses: TaxClass[];
  taxRates: TaxRate[];
}

const defaultSettings: TaxSettings = {
  enableTaxes: true,
  pricesIncludeTax: true,
  calculateTaxBasedOn: 'shipping',
  shippingTaxClass: 'standard',
  displayPricesInShop: 'including',
  displayPricesInCart: 'including',
  displayTaxTotals: 'itemized',
  roundTaxAtSubtotal: false,
  euVatEnabled: false,
  euVatNumber: '',
  validateVatNumbers: false,
  taxClasses: [
    { id: 'standard', name: 'Standard', description: 'Taux standard', isDefault: true },
    { id: 'reduced', name: 'Réduit', description: 'Taux réduit (alimentation, etc.)', isDefault: false },
    { id: 'zero', name: 'Taux zéro', description: 'Produits exonérés', isDefault: false },
  ],
  taxRates: [
    { id: '1', name: 'TVA France', country: 'FR', rate: 20, type: 'standard', applyToShipping: true, enabled: true, priority: 1 },
    { id: '2', name: 'TVA France Réduit', country: 'FR', rate: 5.5, type: 'reduced', applyToShipping: false, enabled: true, priority: 2 },
    { id: '3', name: 'TVA Allemagne', country: 'DE', rate: 19, type: 'standard', applyToShipping: true, enabled: true, priority: 1 },
    { id: '4', name: 'TVA Belgique', country: 'BE', rate: 21, type: 'standard', applyToShipping: true, enabled: true, priority: 1 },
    { id: '5', name: 'TVA Espagne', country: 'ES', rate: 21, type: 'standard', applyToShipping: true, enabled: true, priority: 1 },
  ],
};

const countries = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'BE', name: 'Belgique' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'CH', name: 'Suisse' },
  { code: 'US', name: 'États-Unis' },
  { code: 'CA', name: 'Canada' },
];

export default function TaxSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [rateForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TaxSettings>(defaultSettings);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/taxes');
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

  const handleSave = async (values: Partial<TaxSettings>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/taxes', {
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

  const handleAddRate = () => {
    setEditingRate(null);
    rateForm.resetFields();
    setRateModalVisible(true);
  };

  const handleEditRate = (rate: TaxRate) => {
    setEditingRate(rate);
    rateForm.setFieldsValue(rate);
    setRateModalVisible(true);
  };

  const handleDeleteRate = (id: string) => {
    const newRates = settings.taxRates.filter(r => r.id !== id);
    setSettings(prev => ({ ...prev, taxRates: newRates }));
    message.success(t('admin:settings.taxes.rateDeleted', 'Tax rate deleted'));
  };

  const handleSaveRate = async () => {
    try {
      const values = await rateForm.validateFields();
      let newRates: TaxRate[];

      if (editingRate) {
        newRates = settings.taxRates.map(r =>
          r.id === editingRate.id ? { ...r, ...values } : r
        );
      } else {
        const newRate: TaxRate = {
          ...values,
          id: `rate-${Date.now()}`,
        };
        newRates = [...settings.taxRates, newRate];
      }

      setSettings(prev => ({ ...prev, taxRates: newRates }));
      setRateModalVisible(false);
      message.success(editingRate 
        ? t('admin:settings.taxes.rateUpdated', 'Tax rate updated')
        : t('admin:settings.taxes.rateAdded', 'Tax rate added')
      );
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const rateColumns = [
    {
      title: t('admin:settings.taxes.rateName', 'Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin:settings.taxes.country', 'Country'),
      dataIndex: 'country',
      key: 'country',
      render: (code: string) => {
        const country = countries.find(c => c.code === code);
        return country?.name || code;
      },
    },
    {
      title: t('admin:settings.taxes.rate', 'Rate'),
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => <Tag color="blue">{rate}%</Tag>,
    },
    {
      title: t('admin:settings.taxes.type', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          standard: 'green',
          reduced: 'orange',
          zero: 'default',
          exempt: 'red',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: t('admin:settings.taxes.shipping', 'Shipping'),
      dataIndex: 'applyToShipping',
      key: 'applyToShipping',
      render: (apply: boolean) => apply ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : '-',
    },
    {
      title: t('admin:settings.taxes.status', 'Status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: TaxRate) => (
        <Switch
          checked={enabled}
          onChange={(checked) => {
            const newRates = settings.taxRates.map(r =>
              r.id === record.id ? { ...r, enabled: checked } : r
            );
            setSettings(prev => ({ ...prev, taxRates: newRates }));
          }}
          size="small"
        />
      ),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: TaxRate) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditRate(record)}
          />
          <Popconfirm
            title={t('admin:settings.taxes.deleteConfirm', 'Delete this tax rate?')}
            onConfirm={() => handleDeleteRate(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <PercentageOutlined style={{ marginRight: 12 }} />
          {t('admin:settings.taxes.title', 'Tax Settings')}
        </Title>
        <Text type="secondary">
          {t('admin:settings.taxes.subtitle', 'Configure tax rates and VAT settings for your store')}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={handleSave}
      >
        {/* General Tax Settings */}
        <Card 
          title={t('admin:settings.taxes.generalSettings', 'General Tax Settings')}
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="enableTaxes"
                label={t('admin:settings.taxes.enableTaxes', 'Enable Taxes')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="pricesIncludeTax"
                label={t('admin:settings.taxes.pricesIncludeTax', 'Prices Include Tax')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="calculateTaxBasedOn"
                label={t('admin:settings.taxes.calculateBasedOn', 'Calculate Tax Based On')}
              >
                <Select>
                  <Select.Option value="shipping">
                    {t('admin:settings.taxes.shippingAddress', 'Shipping Address')}
                  </Select.Option>
                  <Select.Option value="billing">
                    {t('admin:settings.taxes.billingAddress', 'Billing Address')}
                  </Select.Option>
                  <Select.Option value="store">
                    {t('admin:settings.taxes.storeAddress', 'Store Base Address')}
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="displayPricesInShop"
                label={t('admin:settings.taxes.displayInShop', 'Display Prices in Shop')}
              >
                <Select>
                  <Select.Option value="including">
                    {t('admin:settings.taxes.includingTax', 'Including Tax')}
                  </Select.Option>
                  <Select.Option value="excluding">
                    {t('admin:settings.taxes.excludingTax', 'Excluding Tax')}
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="displayTaxTotals"
                label={t('admin:settings.taxes.displayTotals', 'Display Tax Totals')}
              >
                <Select>
                  <Select.Option value="single">
                    {t('admin:settings.taxes.singleTotal', 'As a Single Total')}
                  </Select.Option>
                  <Select.Option value="itemized">
                    {t('admin:settings.taxes.itemized', 'Itemized')}
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="roundTaxAtSubtotal"
            label={t('admin:settings.taxes.roundAtSubtotal', 'Round Tax at Subtotal Level')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        {/* EU VAT Settings */}
        <Card 
          title={
            <Space>
              <GlobalOutlined />
              {t('admin:settings.taxes.euVat', 'EU VAT Settings')}
            </Space>
          }
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Alert
            message={t('admin:settings.taxes.euVatInfo', 'EU VAT Information')}
            description={t('admin:settings.taxes.euVatDescription', 'Enable EU VAT handling for B2B transactions. Valid VAT numbers will be exempt from VAT charges.')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="euVatEnabled"
                label={t('admin:settings.taxes.enableEuVat', 'Enable EU VAT')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="euVatNumber"
                label={t('admin:settings.taxes.vatNumber', 'Your VAT Number')}
              >
                <Input placeholder="FR12345678901" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="validateVatNumbers"
                label={
                  <Space>
                    {t('admin:settings.taxes.validateVat', 'Validate VAT Numbers')}
                    <Tooltip title={t('admin:settings.taxes.validateVatTooltip', 'Automatically validate VAT numbers via VIES')}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Tax Rates */}
        <Card 
          title={t('admin:settings.taxes.taxRates', 'Tax Rates')}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRate}>
              {t('admin:settings.taxes.addRate', 'Add Tax Rate')}
            </Button>
          }
          style={{ marginBottom: 24 }}
          loading={loading}
        >
          <Table
            dataSource={settings.taxRates}
            columns={rateColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
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

      {/* Tax Rate Modal */}
      <Modal
        title={editingRate 
          ? t('admin:settings.taxes.editRate', 'Edit Tax Rate')
          : t('admin:settings.taxes.addRate', 'Add Tax Rate')
        }
        open={rateModalVisible}
        onOk={handleSaveRate}
        onCancel={() => setRateModalVisible(false)}
        width={600}
      >
        <Form form={rateForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('admin:settings.taxes.rateName', 'Name')}
                rules={[{ required: true }]}
              >
                <Input placeholder="TVA France" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="country"
                label={t('admin:settings.taxes.country', 'Country')}
                rules={[{ required: true }]}
              >
                <Select showSearch optionFilterProp="children">
                  {countries.map(c => (
                    <Select.Option key={c.code} value={c.code}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="rate"
                label={t('admin:settings.taxes.rate', 'Rate (%)')}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="type"
                label={t('admin:settings.taxes.type', 'Type')}
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="standard">Standard</Select.Option>
                  <Select.Option value="reduced">Reduced</Select.Option>
                  <Select.Option value="zero">Zero Rate</Select.Option>
                  <Select.Option value="exempt">Exempt</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label={t('admin:settings.taxes.priority', 'Priority')}
                initialValue={1}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="applyToShipping"
                label={t('admin:settings.taxes.applyToShipping', 'Apply to Shipping')}
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label={t('admin:settings.taxes.enabled', 'Enabled')}
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
