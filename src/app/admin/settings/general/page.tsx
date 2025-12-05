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
  Upload,
  message,
  Tabs,
  Divider,
  Space,
  InputNumber,
  ColorPicker,
  Row,
  Col,
  Typography,
  Alert,
  Tag,
  Progress,
  Avatar,
  List,
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  UploadOutlined,
  GlobalOutlined,
  ShopOutlined,
  MailOutlined,
  BellOutlined,
  SearchOutlined,
  MobileOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  HeartOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  SafetyOutlined,
  PictureOutlined,
  BgColorsOutlined,
  ToolOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  YoutubeOutlined,
  LinkOutlined,
  FileProtectOutlined,
  RocketOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;

interface GeneralSettings {
  storeName: string;
  storeSlogan: string;
  storeDescription: string;
  storeEmail: string;
  storeSupportEmail: string;
  storePhone: string;
  storeWhatsapp: string;
  storeAddress: string;
  storeCity: string;
  storeCountry: string;
  storePostalCode: string;
  storeLogo: string;
  storeFavicon: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowGuestCheckout: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableCompare: boolean;
  enableQuickView: boolean;
  enableSocialSharing: boolean;
  lowStockThreshold: number;
  outOfStockVisibility: string;
  enableBackorders: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
  canonicalUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  returnPolicyUrl: string;
  gdprCompliance: boolean;
  cookieConsentEnabled: boolean;
  enableCaching: boolean;
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
}

const defaultSettings: GeneralSettings = {
  storeName: 'Mientior',
  storeSlogan: 'Your Premium Marketplace',
  storeDescription: 'Discover the best products at competitive prices',
  storeEmail: 'contact@mientior.com',
  storeSupportEmail: 'support@mientior.com',
  storePhone: '+33 1 23 45 67 89',
  storeWhatsapp: '+33 6 12 34 56 78',
  storeAddress: '123 Avenue des Champs-Élysées',
  storeCity: 'Paris',
  storeCountry: 'FR',
  storePostalCode: '75008',
  storeLogo: '',
  storeFavicon: '',
  defaultLanguage: 'fr',
  supportedLanguages: ['fr', 'en'],
  defaultCurrency: 'EUR',
  timezone: 'Europe/Paris',
  dateFormat: 'DD/MM/YYYY',
  primaryColor: '#f97316',
  secondaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  fontFamily: 'Inter',
  borderRadius: 8,
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
  allowGuestCheckout: true,
  enableReviews: true,
  enableWishlist: true,
  enableCompare: true,
  enableQuickView: true,
  enableSocialSharing: true,
  lowStockThreshold: 10,
  outOfStockVisibility: 'show_disabled',
  enableBackorders: false,
  metaTitle: 'Mientior - Premium Marketplace',
  metaDescription: 'Discover the best products at Mientior.',
  metaKeywords: 'marketplace, ecommerce, shopping',
  googleAnalyticsId: '',
  facebookPixelId: '',
  canonicalUrl: 'https://mientior.com',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  privacyPolicyUrl: '/privacy',
  termsOfServiceUrl: '/terms',
  returnPolicyUrl: '/returns',
  gdprCompliance: true,
  cookieConsentEnabled: true,
  enableCaching: true,
  enableImageOptimization: true,
  enableLazyLoading: true,
};

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const currencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'XOF', symbol: 'FCFA', name: 'CFA Franc' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
];

const timezones = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'Africa/Lagos', label: 'Lagos (UTC+1)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (UTC+0)' },
  { value: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
];

const countries = [
  { code: 'FR', name: 'France' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'MA', name: 'Morocco' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'CM', name: 'Cameroon' },
];

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
];

export default function GeneralSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/general');
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
  }, [form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (values: GeneralSettings) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...values }),
      });
      if (response.ok) {
        message.success(t('admin:settings.saveSuccess', 'Settings saved!'));
        setSettings(prev => ({ ...prev, ...values }));
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error(t('admin:settings.saveError', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (field: string, color: Color) => {
    const hex = color.toHexString();
    form.setFieldValue(field, hex);
    setSettings(prev => ({ ...prev, [field]: hex }));
  };

  const configScore = (() => {
    let score = 0;
    if (settings.storeName) score += 10;
    if (settings.storeEmail) score += 10;
    if (settings.storePhone) score += 10;
    if (settings.storeLogo || logoFileList.length > 0) score += 10;
    if (settings.metaTitle) score += 10;
    if (settings.metaDescription) score += 10;
    if (settings.googleAnalyticsId) score += 10;
    if (settings.facebookUrl || settings.instagramUrl) score += 10;
    if (settings.privacyPolicyUrl) score += 10;
    if (settings.gdprCompliance) score += 10;
    return score;
  })();

  const featuresList = [
    { name: 'enableReviews', label: 'Product Reviews', icon: <StarOutlined />, desc: 'Customer reviews & ratings' },
    { name: 'enableWishlist', label: 'Wishlist', icon: <HeartOutlined />, desc: 'Save favorite products' },
    { name: 'enableCompare', label: 'Compare', icon: <EyeOutlined />, desc: 'Compare products' },
    { name: 'enableQuickView', label: 'Quick View', icon: <ThunderboltOutlined />, desc: 'Preview without leaving page' },
    { name: 'enableSocialSharing', label: 'Social Sharing', icon: <GlobalOutlined />, desc: 'Share on social media' },
  ];

  const tabItems = [
    {
      key: 'store',
      label: <span><ShopOutlined /> Store</span>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title={<><ShopOutlined /> Store Information</>} loading={loading} style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="storeName" label="Store Name" rules={[{ required: true }]}>
                    <Input prefix={<ShopOutlined />} placeholder="Mientior" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="storeSlogan" label="Slogan">
                    <Input placeholder="Your Premium Marketplace" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="storeDescription" label="Description">
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>
              <Divider><PhoneOutlined /> Contact</Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="storeEmail" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="storeSupportEmail" label="Support Email">
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="storePhone" label="Phone">
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="storeWhatsapp" label="WhatsApp">
                    <Input prefix={<MobileOutlined style={{ color: '#25D366' }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Divider><EnvironmentOutlined /> Address</Divider>
              <Form.Item name="storeAddress" label="Street">
                <Input prefix={<EnvironmentOutlined />} />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item name="storeCity" label="City"><Input /></Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="storePostalCode" label="Postal Code"><Input /></Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="storeCountry" label="Country">
                    <Select showSearch optionFilterProp="children">
                      {countries.map(c => <Select.Option key={c.code} value={c.code}>{c.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title={<><PictureOutlined /> Branding</>} loading={loading} style={{ marginBottom: 24 }}>
              <Form.Item name="storeLogo" label="Logo">
                <Upload listType="picture-card" maxCount={1} fileList={logoFileList} onChange={({ fileList }) => setLogoFileList(fileList)} beforeUpload={() => false}>
                  {logoFileList.length === 0 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>}
                </Upload>
              </Form.Item>
              <Alert message="Recommended: PNG/SVG, 200x60px" type="info" showIcon />
            </Card>
            <Card title={<><SafetyOutlined /> Config Score</>}>
              <div style={{ textAlign: 'center' }}>
                <Progress type="dashboard" percent={configScore} status={configScore >= 80 ? 'success' : configScore >= 50 ? 'normal' : 'exception'} />
                <Paragraph type="secondary" style={{ marginTop: 16 }}>
                  {configScore >= 80 ? '✅ Excellent!' : configScore >= 50 ? '⚠️ Good, improve more' : '❌ Complete settings'}
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'branding',
      label: <span><BgColorsOutlined /> Branding</span>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title={<><BgColorsOutlined /> Colors</>} loading={loading}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item name="primaryColor" label="Primary">
                    <ColorPicker value={settings.primaryColor} onChange={(c) => handleColorChange('primaryColor', c)} showText />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="secondaryColor" label="Secondary">
                    <ColorPicker value={settings.secondaryColor} onChange={(c) => handleColorChange('secondaryColor', c)} showText />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="accentColor" label="Accent">
                    <ColorPicker value={settings.accentColor} onChange={(c) => handleColorChange('accentColor', c)} showText />
                  </Form.Item>
                </Col>
              </Row>
              <Divider>Preview</Divider>
              <Space wrap>
                <Button type="primary" style={{ backgroundColor: settings.primaryColor }}>Primary</Button>
                <Button style={{ borderColor: settings.secondaryColor, color: settings.secondaryColor }}>Secondary</Button>
                <Tag color={settings.accentColor}>Accent Tag</Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Typography & Style" loading={loading}>
              <Form.Item name="fontFamily" label="Font Family">
                <Select>{fonts.map(f => <Select.Option key={f.value} value={f.value}>{f.label}</Select.Option>)}</Select>
              </Form.Item>
              <Form.Item name="borderRadius" label="Border Radius (px)">
                <InputNumber min={0} max={24} style={{ width: '100%' }} />
              </Form.Item>
              <Divider>Preview</Divider>
              <div style={{ fontFamily: settings.fontFamily, padding: 16, border: '1px solid #eee', borderRadius: settings.borderRadius }}>
                <Title level={4} style={{ fontFamily: settings.fontFamily }}>{settings.storeName}</Title>
                <Paragraph style={{ fontFamily: settings.fontFamily }}>{settings.storeSlogan}</Paragraph>
                <Button type="primary" style={{ borderRadius: settings.borderRadius, backgroundColor: settings.primaryColor }}>Shop Now</Button>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'localization',
      label: <span><GlobalOutlined /> Localization</span>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title={<><GlobalOutlined /> Languages</>} loading={loading} style={{ marginBottom: 24 }}>
              <Form.Item name="defaultLanguage" label="Default Language">
                <Select>{languages.map(l => <Select.Option key={l.code} value={l.code}>{l.flag} {l.name}</Select.Option>)}</Select>
              </Form.Item>
              <Form.Item name="supportedLanguages" label="Supported Languages">
                <Select mode="multiple">{languages.map(l => <Select.Option key={l.code} value={l.code}>{l.flag} {l.name}</Select.Option>)}</Select>
              </Form.Item>
            </Card>
            <Card title={<><DollarOutlined /> Currency</>} loading={loading}>
              <Form.Item name="defaultCurrency" label="Default Currency">
                <Select>{currencies.map(c => <Select.Option key={c.code} value={c.code}><Tag>{c.symbol}</Tag> {c.name}</Select.Option>)}</Select>
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<><ClockCircleOutlined /> Date & Time</>} loading={loading}>
              <Form.Item name="timezone" label="Timezone">
                <Select showSearch optionFilterProp="children">{timezones.map(tz => <Select.Option key={tz.value} value={tz.value}>{tz.label}</Select.Option>)}</Select>
              </Form.Item>
              <Form.Item name="dateFormat" label="Date Format">
                <Select>
                  <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
                  <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
                  <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'features',
      label: <span><ToolOutlined /> Features</span>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title={<><ToolOutlined /> Store Features</>} loading={loading} style={{ marginBottom: 24 }}>
              <List
                itemLayout="horizontal"
                dataSource={featuresList}
                renderItem={(item) => (
                  <List.Item actions={[<Form.Item key={item.name} name={item.name} valuePropName="checked" style={{ margin: 0 }}><Switch /></Form.Item>]}>
                    <List.Item.Meta avatar={<Avatar icon={item.icon} style={{ backgroundColor: settings.primaryColor }} />} title={item.label} description={item.desc} />
                  </List.Item>
                )}
              />
            </Card>
            <Card title={<><ShoppingCartOutlined /> Checkout</>} loading={loading}>
              <Form.Item name="allowGuestCheckout" label="Guest Checkout" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="lowStockThreshold" label="Low Stock Threshold"><InputNumber min={1} max={100} style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="outOfStockVisibility" label="Out of Stock Display">
                <Select>
                  <Select.Option value="show">Show normally</Select.Option>
                  <Select.Option value="hide">Hide</Select.Option>
                  <Select.Option value="show_disabled">Show disabled</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="enableBackorders" label="Allow Backorders" valuePropName="checked"><Switch /></Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<><BellOutlined style={{ color: '#faad14' }} /> Maintenance</>} loading={loading}>
              <Alert message="Warning" description="Maintenance mode blocks customer access." type="warning" showIcon style={{ marginBottom: 16 }} />
              <Form.Item name="maintenanceMode" label="Enable Maintenance" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="maintenanceMessage" label="Message"><Input.TextArea rows={3} /></Form.Item>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'seo',
      label: <span><SearchOutlined /> SEO</span>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title={<><SearchOutlined /> SEO Settings</>} loading={loading} style={{ marginBottom: 24 }}>
              <Form.Item name="metaTitle" label="Meta Title" extra="50-60 characters recommended">
                <Input maxLength={70} showCount />
              </Form.Item>
              <Form.Item name="metaDescription" label="Meta Description" extra="150-160 characters recommended">
                <Input.TextArea rows={3} maxLength={160} showCount />
              </Form.Item>
              <Form.Item name="metaKeywords" label="Keywords">
                <Input placeholder="marketplace, ecommerce, shopping" />
              </Form.Item>
              <Form.Item name="canonicalUrl" label="Canonical URL">
                <Input prefix={<LinkOutlined />} placeholder="https://mientior.com" />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Analytics & Tracking" loading={loading} style={{ marginBottom: 24 }}>
              <Form.Item name="googleAnalyticsId" label="Google Analytics ID">
                <Input placeholder="G-XXXXXXXXXX" />
              </Form.Item>
              <Form.Item name="facebookPixelId" label="Facebook Pixel ID">
                <Input placeholder="XXXXXXXXXXXXXXX" />
              </Form.Item>
            </Card>
            <Card title={<><GlobalOutlined /> Social Media</>} loading={loading}>
              <Form.Item name="facebookUrl" label={<><FacebookOutlined style={{ color: '#1877F2' }} /> Facebook</>}>
                <Input placeholder="https://facebook.com/yourpage" />
              </Form.Item>
              <Form.Item name="instagramUrl" label={<><InstagramOutlined style={{ color: '#E4405F' }} /> Instagram</>}>
                <Input placeholder="https://instagram.com/yourpage" />
              </Form.Item>
              <Form.Item name="twitterUrl" label={<><TwitterOutlined style={{ color: '#1DA1F2' }} /> Twitter</>}>
                <Input placeholder="https://twitter.com/yourpage" />
              </Form.Item>
              <Form.Item name="youtubeUrl" label={<><YoutubeOutlined style={{ color: '#FF0000' }} /> YouTube</>}>
                <Input placeholder="https://youtube.com/yourchannel" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'legal',
      label: <span><FileProtectOutlined /> Legal</span>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title={<><FileProtectOutlined /> Legal Pages</>} loading={loading}>
              <Form.Item name="privacyPolicyUrl" label="Privacy Policy URL">
                <Input prefix={<LinkOutlined />} placeholder="/privacy" />
              </Form.Item>
              <Form.Item name="termsOfServiceUrl" label="Terms of Service URL">
                <Input prefix={<LinkOutlined />} placeholder="/terms" />
              </Form.Item>
              <Form.Item name="returnPolicyUrl" label="Return Policy URL">
                <Input prefix={<LinkOutlined />} placeholder="/returns" />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<><SafetyOutlined /> Compliance</>} loading={loading}>
              <Form.Item name="gdprCompliance" label="GDPR Compliance" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="cookieConsentEnabled" label="Cookie Consent Banner" valuePropName="checked"><Switch /></Form.Item>
              <Alert message="GDPR" description="Enable GDPR compliance for EU customers." type="info" showIcon />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'performance',
      label: <span><RocketOutlined /> Performance</span>,
      children: (
        <Card title={<><RocketOutlined /> Performance Optimization</>} loading={loading}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="enableCaching" label="Enable Caching" valuePropName="checked"><Switch /></Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="enableImageOptimization" label="Image Optimization" valuePropName="checked"><Switch /></Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="enableLazyLoading" label="Lazy Loading" valuePropName="checked"><Switch /></Form.Item>
            </Col>
          </Row>
          <Alert message="Performance Tips" description="Enable all options for best performance. Images will be automatically optimized and lazy loaded." type="success" showIcon />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><ToolOutlined /> {t('admin:settings.general.title', 'General Settings')}</Title>
          <Text type="secondary">{t('admin:settings.general.subtitle', 'Configure your store settings')}</Text>
        </div>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()} size="large">
          {t('common:buttons.save', 'Save')}
        </Button>
      </div>
      <Form form={form} layout="vertical" onFinish={handleSave} initialValues={defaultSettings}>
        <Tabs items={tabItems} size="large" />
      </Form>
    </div>
  );
}
