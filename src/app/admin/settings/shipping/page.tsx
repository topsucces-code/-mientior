'use client';

import React, { useState, useEffect } from 'react';
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
  Divider,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions: string[];
  enabled: boolean;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  type: 'flat' | 'weight' | 'price' | 'free';
  cost: number;
  minWeight?: number;
  maxWeight?: number;
  minOrderAmount?: number;
  freeShippingThreshold?: number;
  estimatedDays: { min: number; max: number };
  enabled: boolean;
}

interface ShippingSettings {
  enableShipping: boolean;
  defaultShippingMethod: string;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  calculateTaxOnShipping: boolean;
  shippingOrigin: {
    country: string;
    city: string;
    postalCode: string;
    address: string;
  };
  zones: ShippingZone[];
  methods: ShippingMethod[];
}

const defaultSettings: ShippingSettings = {
  enableShipping: true,
  defaultShippingMethod: '',
  freeShippingEnabled: false,
  freeShippingThreshold: 25000,
  calculateTaxOnShipping: false,
  shippingOrigin: {
    country: 'CI',
    city: 'Abidjan',
    postalCode: '01 BP 1234',
    address: 'Plateau, Rue du Commerce',
  },
  zones: [
    {
      id: 'zone-1',
      name: 'Afrique de l\'Ouest (UEMOA)',
      countries: ['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN'],
      regions: [],
      enabled: true,
    },
    {
      id: 'zone-2',
      name: 'Afrique Centrale',
      countries: ['CM', 'GA', 'CG', 'CD', 'CF', 'TD'],
      regions: [],
      enabled: true,
    },
    {
      id: 'zone-3',
      name: 'Afrique du Nord & Est',
      countries: ['MA', 'TN', 'DZ', 'EG', 'KE', 'TZ', 'UG', 'ET'],
      regions: [],
      enabled: true,
    },
  ],
  methods: [
    {
      id: 'method-1',
      name: 'Standard',
      description: 'Livraison standard',
      zoneId: 'zone-1',
      type: 'flat',
      cost: 5990,
      estimatedDays: { min: 3, max: 5 },
      enabled: true,
    },
    {
      id: 'method-2',
      name: 'Express',
      description: 'Livraison express',
      zoneId: 'zone-1',
      type: 'flat',
      cost: 12990,
      estimatedDays: { min: 1, max: 2 },
      enabled: true,
    },
  ],
};

const countryOptions = [
  { value: 'CI', label: 'Côte d\'Ivoire' },
  { value: 'SN', label: 'Sénégal' },
  { value: 'ML', label: 'Mali' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'TG', label: 'Togo' },
  { value: 'BJ', label: 'Bénin' },
  { value: 'NE', label: 'Niger' },
  { value: 'GN', label: 'Guinée' },
  { value: 'CM', label: 'Cameroun' },
  { value: 'GA', label: 'Gabon' },
  { value: 'CG', label: 'Congo' },
  { value: 'CD', label: 'RD Congo' },
  { value: 'CF', label: 'Centrafrique' },
  { value: 'TD', label: 'Tchad' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'MA', label: 'Maroc' },
  { value: 'TN', label: 'Tunisie' },
  { value: 'DZ', label: 'Algérie' },
  { value: 'EG', label: 'Égypte' },
  { value: 'KE', label: 'Kenya' },
  { value: 'TZ', label: 'Tanzanie' },
  { value: 'UG', label: 'Ouganda' },
  { value: 'ET', label: 'Éthiopie' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'ES', label: 'Espagne' },
  { value: 'IT', label: 'Italie' },
  { value: 'BE', label: 'Belgique' },
  { value: 'NL', label: 'Pays-Bas' },
  { value: 'PT', label: 'Portugal' },
  { value: 'GB', label: 'Royaume-Uni' },
  { value: 'US', label: 'États-Unis' },
  { value: 'CA', label: 'Canada' },
];

export default function ShippingSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [zoneForm] = Form.useForm();
  const [methodForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ShippingSettings>(defaultSettings);
  const [zoneModalVisible, setZoneModalVisible] = useState(false);
  const [methodModalVisible, setMethodModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/shipping');
      if (response.ok) {
        const data = await response.json();
        const newSettings = { ...defaultSettings, ...data.settings };
        setSettings(newSettings);
        form.setFieldsValue(newSettings);
      } else {
        form.setFieldsValue(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      form.setFieldsValue(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const payload = { ...values, zones: settings.zones, methods: settings.methods };
      
      const response = await fetch('/api/admin/settings/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(t('admin:settings.saveSuccess'));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error(t('admin:settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Zone handlers
  const handleAddZone = () => {
    setEditingZone(null);
    zoneForm.resetFields();
    setZoneModalVisible(true);
  };

  const handleEditZone = (zone: ShippingZone) => {
    setEditingZone(zone);
    zoneForm.setFieldsValue(zone);
    setZoneModalVisible(true);
  };

  const handleDeleteZone = (zoneId: string) => {
    setSettings({
      ...settings,
      zones: settings.zones.filter((z) => z.id !== zoneId),
      methods: settings.methods.filter((m) => m.zoneId !== zoneId),
    });
    message.success(t('admin:settings.shipping.zoneDeleted'));
  };

  const handleSaveZone = (values: Partial<ShippingZone>) => {
    if (editingZone) {
      setSettings({
        ...settings,
        zones: settings.zones.map((z) =>
          z.id === editingZone.id ? { ...z, ...values } : z
        ),
      });
    } else {
      const newZone: ShippingZone = {
        id: `zone-${Date.now()}`,
        name: values.name || '',
        countries: values.countries || [],
        regions: values.regions || [],
        enabled: values.enabled ?? true,
      };
      setSettings({ ...settings, zones: [...settings.zones, newZone] });
    }
    setZoneModalVisible(false);
    message.success(t('admin:settings.shipping.zoneSaved'));
  };

  // Method handlers
  const handleAddMethod = () => {
    setEditingMethod(null);
    methodForm.resetFields();
    setMethodModalVisible(true);
  };

  const handleEditMethod = (method: ShippingMethod) => {
    setEditingMethod(method);
    methodForm.setFieldsValue(method);
    setMethodModalVisible(true);
  };

  const handleDeleteMethod = (methodId: string) => {
    setSettings({
      ...settings,
      methods: settings.methods.filter((m) => m.id !== methodId),
    });
    message.success(t('admin:settings.shipping.methodDeleted'));
  };

  const handleSaveMethod = (values: Partial<ShippingMethod>) => {
    if (editingMethod) {
      setSettings({
        ...settings,
        methods: settings.methods.map((m) =>
          m.id === editingMethod.id ? { ...m, ...values } : m
        ),
      });
    } else {
      const newMethod: ShippingMethod = {
        id: `method-${Date.now()}`,
        name: values.name || '',
        description: values.description || '',
        zoneId: values.zoneId || '',
        type: values.type || 'flat',
        cost: values.cost || 0,
        estimatedDays: values.estimatedDays || { min: 1, max: 5 },
        enabled: values.enabled ?? true,
      };
      setSettings({ ...settings, methods: [...settings.methods, newMethod] });
    }
    setMethodModalVisible(false);
    message.success(t('admin:settings.shipping.methodSaved'));
  };

  const zoneColumns = [
    {
      title: t('admin:settings.shipping.zoneName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin:settings.shipping.countries'),
      dataIndex: 'countries',
      key: 'countries',
      render: (countries: string[]) => (
        <Space wrap>
          {countries.slice(0, 3).map((c) => (
            <Tag key={c}>{countryOptions.find((o) => o.value === c)?.label || c}</Tag>
          ))}
          {countries.length > 3 && <Tag>+{countries.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: t('admin:settings.shipping.status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? t('common:status.active') : t('common:status.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common:labels.actions'),
      key: 'actions',
      render: (_: unknown, record: ShippingZone) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditZone(record)}
          />
          <Popconfirm
            title={t('admin:settings.shipping.deleteZoneConfirm')}
            onConfirm={() => handleDeleteZone(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const methodColumns = [
    {
      title: t('admin:settings.shipping.methodName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin:settings.shipping.zone'),
      dataIndex: 'zoneId',
      key: 'zoneId',
      render: (zoneId: string) => {
        const zone = settings.zones.find((z) => z.id === zoneId);
        return zone?.name || zoneId;
      },
    },
    {
      title: t('admin:settings.shipping.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag>
          {t(`admin:settings.shipping.types.${type}`)}
        </Tag>
      ),
    },
    {
      title: t('admin:settings.shipping.cost'),
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number, record: ShippingMethod) =>
        record.type === 'free' ? t('admin:settings.shipping.free') : `${(cost/100).toLocaleString()} FCFA`,
    },
    {
      title: t('admin:settings.shipping.estimatedDays'),
      dataIndex: 'estimatedDays',
      key: 'estimatedDays',
      render: (days: { min: number; max: number }) => `${days.min}-${days.max} jours`,
    },
    {
      title: t('admin:settings.shipping.status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? t('common:status.active') : t('common:status.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common:labels.actions'),
      key: 'actions',
      render: (_: unknown, record: ShippingMethod) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditMethod(record)}
          />
          <Popconfirm
            title={t('admin:settings.shipping.deleteMethodConfirm')}
            onConfirm={() => handleDeleteMethod(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('admin:settings.shipping.title')}</h1>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            {t('admin:settings.shipping.subtitle')}
          </p>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          {t('common:buttons.save')}
        </Button>
      </div>

      <Form form={form} layout="vertical" initialValues={defaultSettings}>
        {/* General Settings */}
        <Card 
          title={
            <span>
              <CarOutlined /> {t('admin:settings.shipping.generalSettings')}
            </span>
          }
          loading={loading}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="enableShipping"
                label={t('admin:settings.shipping.enableShipping')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="freeShippingEnabled"
                label={t('admin:settings.shipping.freeShippingEnabled')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="freeShippingThreshold"
                label={t('admin:settings.shipping.freeShippingThreshold')}
              >
                <InputNumber min={0} style={{ width: '100%' }} prefix="FCFA " />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="calculateTaxOnShipping"
            label={t('admin:settings.shipping.calculateTaxOnShipping')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        {/* Shipping Origin */}
        <Card 
          title={
            <span>
              <EnvironmentOutlined /> {t('admin:settings.shipping.shippingOrigin')}
            </span>
          }
          loading={loading}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name={['shippingOrigin', 'country']}
                label={t('admin:settings.shipping.country')}
              >
                <Select options={countryOptions} showSearch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['shippingOrigin', 'city']}
                label={t('admin:settings.shipping.city')}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name={['shippingOrigin', 'postalCode']}
                label={t('admin:settings.shipping.postalCode')}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['shippingOrigin', 'address']}
                label={t('admin:settings.shipping.address')}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Shipping Zones */}
        <Card 
          title={
            <span>
              <GlobalOutlined /> {t('admin:settings.shipping.zones')}
            </span>
          }
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddZone}>
              {t('admin:settings.shipping.addZone')}
            </Button>
          }
          loading={loading}
          style={{ marginBottom: 24 }}
        >
          <Table
            dataSource={settings.zones}
            columns={zoneColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* Shipping Methods */}
        <Card 
          title={
            <span>
              <CarOutlined /> {t('admin:settings.shipping.methods')}
            </span>
          }
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMethod}>
              {t('admin:settings.shipping.addMethod')}
            </Button>
          }
          loading={loading}
        >
          <Table
            dataSource={settings.methods}
            columns={methodColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </Form>

      {/* Zone Modal */}
      <Modal
        title={editingZone ? t('admin:settings.shipping.editZone') : t('admin:settings.shipping.addZone')}
        open={zoneModalVisible}
        onCancel={() => setZoneModalVisible(false)}
        onOk={() => zoneForm.submit()}
      >
        <Form form={zoneForm} layout="vertical" onFinish={handleSaveZone}>
          <Form.Item
            name="name"
            label={t('admin:settings.shipping.zoneName')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="countries"
            label={t('admin:settings.shipping.countries')}
            rules={[{ required: true }]}
          >
            <Select mode="multiple" options={countryOptions} />
          </Form.Item>
          <Form.Item
            name="enabled"
            label={t('admin:settings.shipping.enabled')}
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Method Modal */}
      <Modal
        title={editingMethod ? t('admin:settings.shipping.editMethod') : t('admin:settings.shipping.addMethod')}
        open={methodModalVisible}
        onCancel={() => setMethodModalVisible(false)}
        onOk={() => methodForm.submit()}
        width={600}
      >
        <Form form={methodForm} layout="vertical" onFinish={handleSaveMethod}>
          <Form.Item
            name="name"
            label={t('admin:settings.shipping.methodName')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('admin:settings.shipping.description')}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="zoneId"
            label={t('admin:settings.shipping.zone')}
            rules={[{ required: true }]}
          >
            <Select
              options={settings.zones.map((z) => ({ value: z.id, label: z.name }))}
            />
          </Form.Item>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="type"
                label={t('admin:settings.shipping.type')}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'flat', label: t('admin:settings.shipping.types.flat') },
                    { value: 'weight', label: t('admin:settings.shipping.types.weight') },
                    { value: 'price', label: t('admin:settings.shipping.types.price') },
                    { value: 'free', label: t('admin:settings.shipping.types.free') },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cost"
                label={t('admin:settings.shipping.cost')}
              >
                <InputNumber min={0} style={{ width: '100%' }} prefix="FCFA " />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name={['estimatedDays', 'min']}
                label={t('admin:settings.shipping.minDays')}
                initialValue={1}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['estimatedDays', 'max']}
                label={t('admin:settings.shipping.maxDays')}
                initialValue={5}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="enabled"
            label={t('admin:settings.shipping.enabled')}
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
