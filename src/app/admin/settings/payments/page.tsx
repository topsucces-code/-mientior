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
  Tabs,
  Divider,
  Space,
  InputNumber,
  Tag,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  CreditCardOutlined,
  BankOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';

interface PaymentSettings {
  // Stripe
  stripeEnabled: boolean;
  stripeTestMode: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  
  // PayPal
  paypalEnabled: boolean;
  paypalTestMode: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  
  // Flutterwave
  flutterwaveEnabled: boolean;
  flutterwaveTestMode: boolean;
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  flutterwaveEncryptionKey: string;
  
  // Paystack
  paystackEnabled: boolean;
  paystackTestMode: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  
  // General
  defaultCurrency: string;
  allowedCurrencies: string[];
  minimumOrderAmount: number;
  maximumOrderAmount: number;
  
  // Checkout
  enableCOD: boolean;
  enableBankTransfer: boolean;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankSwiftCode: string;
}

const defaultSettings: PaymentSettings = {
  stripeEnabled: false,
  stripeTestMode: true,
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  paypalEnabled: false,
  paypalTestMode: true,
  paypalClientId: '',
  paypalClientSecret: '',
  flutterwaveEnabled: false,
  flutterwaveTestMode: true,
  flutterwavePublicKey: '',
  flutterwaveSecretKey: '',
  flutterwaveEncryptionKey: '',
  paystackEnabled: false,
  paystackTestMode: true,
  paystackPublicKey: '',
  paystackSecretKey: '',
  defaultCurrency: 'EUR',
  allowedCurrencies: ['EUR', 'USD', 'XOF'],
  minimumOrderAmount: 1,
  maximumOrderAmount: 10000,
  enableCOD: false,
  enableBankTransfer: false,
  bankAccountName: '',
  bankAccountNumber: '',
  bankName: '',
  bankSwiftCode: '',
};

export default function PaymentSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/payments');
      if (response.ok) {
        const data = await response.json();
        const newSettings = { ...defaultSettings, ...data.settings };
        setSettings(newSettings);
        form.setFieldsValue(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      message.error(t('admin:settings.payments.loadError', 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [form, t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (values: PaymentSettings) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(t('admin:settings.saveSuccess'));
        setSettings(values);
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

  const GatewayStatus = ({ enabled, testMode }: { enabled: boolean; testMode: boolean }) => (
    <Space>
      {enabled ? (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {t('admin:settings.payments.enabled')}
        </Tag>
      ) : (
        <Tag icon={<CloseCircleOutlined />} color="default">
          {t('admin:settings.payments.disabled')}
        </Tag>
      )}
      {enabled && testMode && (
        <Tag color="warning">{t('admin:settings.payments.testMode')}</Tag>
      )}
      {enabled && !testMode && (
        <Tag color="success">{t('admin:settings.payments.liveMode')}</Tag>
      )}
    </Space>
  );

  const tabItems = [
    {
      key: 'stripe',
      label: (
        <span>
          <CreditCardOutlined /> Stripe
        </span>
      ),
      children: (
        <Card 
          loading={loading}
          title="Stripe"
          extra={<GatewayStatus enabled={settings.stripeEnabled} testMode={settings.stripeTestMode} />}
        >
          <Alert
            message={t('admin:settings.payments.stripeInfo')}
            description={t('admin:settings.payments.stripeDescription')}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="stripeEnabled"
                label={t('admin:settings.payments.enableGateway')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stripeTestMode"
                label={t('admin:settings.payments.testMode')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, stripeTestMode: checked })} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="stripePublishableKey"
            label={t('admin:settings.payments.publishableKey')}
            rules={[{ required: settings.stripeEnabled }]}
          >
            <Input placeholder="pk_test_..." />
          </Form.Item>

          <Form.Item
            name="stripeSecretKey"
            label={t('admin:settings.payments.secretKey')}
            rules={[{ required: settings.stripeEnabled }]}
          >
            <Input.Password placeholder="sk_test_..." />
          </Form.Item>

          <Form.Item
            name="stripeWebhookSecret"
            label={t('admin:settings.payments.webhookSecret')}
          >
            <Input.Password placeholder="whsec_..." />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: 'paypal',
      label: (
        <span>
          <WalletOutlined /> PayPal
        </span>
      ),
      children: (
        <Card 
          loading={loading}
          title="PayPal"
          extra={<GatewayStatus enabled={settings.paypalEnabled} testMode={settings.paypalTestMode} />}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="paypalEnabled"
                label={t('admin:settings.payments.enableGateway')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, paypalEnabled: checked })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paypalTestMode"
                label={t('admin:settings.payments.testMode')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, paypalTestMode: checked })} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="paypalClientId"
            label={t('admin:settings.payments.clientId')}
            rules={[{ required: settings.paypalEnabled }]}
          >
            <Input placeholder="Client ID" />
          </Form.Item>

          <Form.Item
            name="paypalClientSecret"
            label={t('admin:settings.payments.clientSecret')}
            rules={[{ required: settings.paypalEnabled }]}
          >
            <Input.Password placeholder="Client Secret" />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: 'flutterwave',
      label: (
        <span>
          <CreditCardOutlined /> Flutterwave
        </span>
      ),
      children: (
        <Card 
          loading={loading}
          title="Flutterwave"
          extra={<GatewayStatus enabled={settings.flutterwaveEnabled} testMode={settings.flutterwaveTestMode} />}
        >
          <Alert
            message={t('admin:settings.payments.flutterwaveInfo')}
            description={t('admin:settings.payments.flutterwaveDescription')}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="flutterwaveEnabled"
                label={t('admin:settings.payments.enableGateway')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, flutterwaveEnabled: checked })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="flutterwaveTestMode"
                label={t('admin:settings.payments.testMode')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, flutterwaveTestMode: checked })} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="flutterwavePublicKey"
            label={t('admin:settings.payments.publicKey')}
            rules={[{ required: settings.flutterwaveEnabled }]}
          >
            <Input placeholder="FLWPUBK-..." />
          </Form.Item>

          <Form.Item
            name="flutterwaveSecretKey"
            label={t('admin:settings.payments.secretKey')}
            rules={[{ required: settings.flutterwaveEnabled }]}
          >
            <Input.Password placeholder="FLWSECK-..." />
          </Form.Item>

          <Form.Item
            name="flutterwaveEncryptionKey"
            label={t('admin:settings.payments.encryptionKey')}
          >
            <Input.Password placeholder="Encryption Key" />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: 'paystack',
      label: (
        <span>
          <CreditCardOutlined /> Paystack
        </span>
      ),
      children: (
        <Card 
          loading={loading}
          title="Paystack"
          extra={<GatewayStatus enabled={settings.paystackEnabled} testMode={settings.paystackTestMode} />}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="paystackEnabled"
                label={t('admin:settings.payments.enableGateway')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, paystackEnabled: checked })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paystackTestMode"
                label={t('admin:settings.payments.testMode')}
                valuePropName="checked"
              >
                <Switch onChange={(checked) => setSettings({ ...settings, paystackTestMode: checked })} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="paystackPublicKey"
            label={t('admin:settings.payments.publicKey')}
            rules={[{ required: settings.paystackEnabled }]}
          >
            <Input placeholder="pk_test_..." />
          </Form.Item>

          <Form.Item
            name="paystackSecretKey"
            label={t('admin:settings.payments.secretKey')}
            rules={[{ required: settings.paystackEnabled }]}
          >
            <Input.Password placeholder="sk_test_..." />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: 'other',
      label: (
        <span>
          <BankOutlined /> {t('admin:settings.payments.otherMethods')}
        </span>
      ),
      children: (
        <Card loading={loading}>
          <Form.Item
            name="enableCOD"
            label={t('admin:settings.payments.enableCOD')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider>{t('admin:settings.payments.bankTransfer')}</Divider>

          <Form.Item
            name="enableBankTransfer"
            label={t('admin:settings.payments.enableBankTransfer')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="bankAccountName"
            label={t('admin:settings.payments.bankAccountName')}
          >
            <Input placeholder="Company Name" />
          </Form.Item>

          <Form.Item
            name="bankAccountNumber"
            label={t('admin:settings.payments.bankAccountNumber')}
          >
            <Input placeholder="IBAN or Account Number" />
          </Form.Item>

          <Form.Item
            name="bankName"
            label={t('admin:settings.payments.bankName')}
          >
            <Input placeholder="Bank Name" />
          </Form.Item>

          <Form.Item
            name="bankSwiftCode"
            label={t('admin:settings.payments.bankSwiftCode')}
          >
            <Input placeholder="SWIFT/BIC Code" />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined /> {t('admin:settings.payments.generalSettings')}
        </span>
      ),
      children: (
        <Card loading={loading}>
          <Form.Item
            name="defaultCurrency"
            label={t('admin:settings.payments.defaultCurrency')}
          >
            <Select
              options={[
                { value: 'EUR', label: 'Euro (€)' },
                { value: 'USD', label: 'US Dollar ($)' },
                { value: 'GBP', label: 'British Pound (£)' },
                { value: 'XOF', label: 'CFA Franc (FCFA)' },
                { value: 'NGN', label: 'Nigerian Naira (₦)' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="allowedCurrencies"
            label={t('admin:settings.payments.allowedCurrencies')}
          >
            <Select
              mode="multiple"
              options={[
                { value: 'EUR', label: 'Euro (€)' },
                { value: 'USD', label: 'US Dollar ($)' },
                { value: 'GBP', label: 'British Pound (£)' },
                { value: 'XOF', label: 'CFA Franc (FCFA)' },
                { value: 'NGN', label: 'Nigerian Naira (₦)' },
              ]}
            />
          </Form.Item>

          <Divider>{t('admin:settings.payments.orderLimits')}</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="minimumOrderAmount"
                label={t('admin:settings.payments.minimumOrderAmount')}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maximumOrderAmount"
                label={t('admin:settings.payments.maximumOrderAmount')}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('admin:settings.payments.title')}</h1>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            {t('admin:settings.payments.subtitle')}
          </p>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => form.submit()}
        >
          {t('common:buttons.save')}
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={defaultSettings}
      >
        <Tabs items={tabItems} />
      </Form>
    </div>
  );
}
