'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Radio,
  Space,
  Typography,
  Divider,
  Switch,
  Select,
  ColorPicker,
  Row,
  Col,
} from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/theme-context';
import type { Color } from 'antd/es/color-picker';

const { Title, Text, Paragraph } = Typography;

type ThemeMode = 'light' | 'dark' | 'system';

export default function AppearanceSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { mode, setMode, isDark } = useTheme();

  const themeOptions = [
    {
      value: 'light' as ThemeMode,
      label: t('admin:theme.light'),
      icon: <SunOutlined style={{ fontSize: 24 }} />,
      description: t('admin:settings.appearance.lightDescription', 'Classic light theme'),
    },
    {
      value: 'dark' as ThemeMode,
      label: t('admin:theme.dark'),
      icon: <MoonOutlined style={{ fontSize: 24 }} />,
      description: t('admin:settings.appearance.darkDescription', 'Easy on the eyes'),
    },
    {
      value: 'system' as ThemeMode,
      label: t('admin:theme.system'),
      icon: <DesktopOutlined style={{ fontSize: 24 }} />,
      description: t('admin:settings.appearance.systemDescription', 'Follow system preference'),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {t('admin:settings.appearance.title', 'Appearance')}
        </Title>
        <Paragraph type="secondary">
          {t('admin:settings.appearance.subtitle', 'Customize the look and feel of your admin panel')}
        </Paragraph>
      </div>

      {/* Theme Selection */}
      <Card 
        title={
          <Space>
            <BgColorsOutlined />
            {t('admin:settings.appearance.themeSection', 'Theme')}
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            {themeOptions.map((option) => (
              <Col xs={24} sm={8} key={option.value}>
                <Radio.Button
                  value={option.value}
                  style={{
                    width: '100%',
                    height: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 8,
                    border: mode === option.value 
                      ? '2px solid #1890ff' 
                      : `1px solid ${isDark ? '#303030' : '#d9d9d9'}`,
                    background: mode === option.value 
                      ? (isDark ? '#1f1f1f' : '#e6f7ff') 
                      : 'transparent',
                  }}
                >
                  <div style={{ 
                    marginBottom: 8,
                    color: mode === option.value ? '#1890ff' : (isDark ? '#fff' : '#000'),
                  }}>
                    {option.icon}
                  </div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    {option.label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {option.description}
                  </Text>
                </Radio.Button>
              </Col>
            ))}
          </Row>
        </Radio.Group>

        <Divider />

        <div style={{ 
          padding: 16, 
          borderRadius: 8, 
          background: isDark ? '#1f1f1f' : '#fafafa',
          border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
        }}>
          <Text type="secondary">
            {t('admin:settings.appearance.currentTheme', 'Current theme')}: {' '}
            <Text strong>
              {mode === 'system' 
                ? `${t('admin:theme.system')} (${isDark ? t('admin:theme.dark') : t('admin:theme.light')})`
                : mode === 'dark' 
                  ? t('admin:theme.dark') 
                  : t('admin:theme.light')
              }
            </Text>
          </Text>
        </div>
      </Card>

      {/* Additional Appearance Options */}
      <Card 
        title={t('admin:settings.appearance.additionalOptions', 'Additional Options')}
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>{t('admin:settings.appearance.compactMode', 'Compact Mode')}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('admin:settings.appearance.compactModeDesc', 'Reduce spacing and padding')}
              </Text>
            </div>
            <Switch />
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>{t('admin:settings.appearance.animations', 'Animations')}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('admin:settings.appearance.animationsDesc', 'Enable smooth transitions')}
              </Text>
            </div>
            <Switch defaultChecked />
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>{t('admin:settings.appearance.fontSize', 'Font Size')}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('admin:settings.appearance.fontSizeDesc', 'Adjust text size')}
              </Text>
            </div>
            <Select
              defaultValue="medium"
              style={{ width: 120 }}
              options={[
                { value: 'small', label: t('admin:settings.appearance.small', 'Small') },
                { value: 'medium', label: t('admin:settings.appearance.medium', 'Medium') },
                { value: 'large', label: t('admin:settings.appearance.large', 'Large') },
              ]}
            />
          </div>
        </Space>
      </Card>

      {/* Preview */}
      <Card title={t('admin:settings.appearance.preview', 'Preview')}>
        <div 
          style={{ 
            padding: 24, 
            borderRadius: 8,
            background: isDark ? '#141414' : '#fff',
            border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <Title level={4} style={{ marginTop: 0 }}>
            {t('admin:settings.appearance.sampleTitle', 'Sample Content')}
          </Title>
          <Paragraph>
            {t('admin:settings.appearance.sampleText', 'This is how your content will look with the current theme settings.')}
          </Paragraph>
          <Space>
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                background: '#1890ff',
              }} 
            />
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                background: '#52c41a',
              }} 
            />
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                background: '#faad14',
              }} 
            />
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                background: '#ff4d4f',
              }} 
            />
          </Space>
        </div>
      </Card>
    </div>
  );
}
