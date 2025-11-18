'use client';

import { Dropdown, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language || 'en';

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    // Store preference in localStorage
    localStorage.setItem('language', lang);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'fr',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🇫🇷</span>
          <span>Français</span>
          {currentLanguage === 'fr' && <span style={{ marginLeft: 'auto', color: '#3b82f6' }}>✓</span>}
        </div>
      ),
      onClick: () => handleLanguageChange('fr'),
    },
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🇬🇧</span>
          <span>English</span>
          {currentLanguage === 'en' && <span style={{ marginLeft: 'auto', color: '#3b82f6' }}>✓</span>}
        </div>
      ),
      onClick: () => handleLanguageChange('en'),
    },
  ];

  const currentFlag = currentLanguage === 'fr' ? '🇫🇷' : '🇬🇧';
  const currentCode = currentLanguage === 'fr' ? 'FR' : 'EN';

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
      <Button type="text" icon={<GlobalOutlined />}>
        {currentFlag} {currentCode}
      </Button>
    </Dropdown>
  );
}
