import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public API to fetch platform settings for the frontend
// Only returns enabled currencies, languages, and countries

interface PublicPlatformSettings {
  currencies: {
    code: string;
    name: string;
    symbol: string;
    rate: number;
    decimals: number;
  }[];
  languages: {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    rtl: boolean;
  }[];
  countries: {
    code: string;
    name: string;
    nameLocal: string;
    currency: string;
    language: string;
  }[];
  defaultCurrency: string;
  defaultLanguage: string;
  features: {
    enableMultiCurrency: boolean;
    enableMultiLanguage: boolean;
    enableGuestCheckout: boolean;
    enableReviews: boolean;
    enableWishlist: boolean;
    enableCompare: boolean;
    enableQuickView: boolean;
    enableMobileMoneyPayments: boolean;
    enableCOD: boolean;
    enableExpressCheckout: boolean;
  };
  paymentMethods: {
    id: string;
    name: string;
    type: string;
    icon: string;
    countries: string[];
  }[];
}

// Default settings if database is not available
const defaultPublicSettings: PublicPlatformSettings = {
  currencies: [
    { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'FCFA', rate: 655.957, decimals: 0 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 1, decimals: 2 },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.08, decimals: 2 },
  ],
  languages: [
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  ],
  countries: [
    { code: 'SN', name: 'Senegal', nameLocal: 'Sénégal', currency: 'XOF', language: 'fr' },
    { code: 'CI', name: "Côte d'Ivoire", nameLocal: "Côte d'Ivoire", currency: 'XOF', language: 'fr' },
    { code: 'FR', name: 'France', nameLocal: 'France', currency: 'EUR', language: 'fr' },
  ],
  defaultCurrency: 'XOF',
  defaultLanguage: 'fr',
  features: {
    enableMultiCurrency: true,
    enableMultiLanguage: true,
    enableGuestCheckout: true,
    enableReviews: true,
    enableWishlist: true,
    enableCompare: true,
    enableQuickView: true,
    enableMobileMoneyPayments: true,
    enableCOD: true,
    enableExpressCheckout: true,
  },
  paymentMethods: [
    { id: 'card', name: 'Credit/Debit Card', type: 'card', icon: 'credit-card', countries: [] },
    { id: 'orange-money', name: 'Orange Money', type: 'mobile_money', icon: 'orange-money', countries: ['SN', 'CI', 'ML', 'BF', 'CM'] },
    { id: 'wave', name: 'Wave', type: 'mobile_money', icon: 'wave', countries: ['SN', 'CI', 'ML', 'BF'] },
  ],
};

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'platform' },
    });

    if (!setting) {
      return NextResponse.json(defaultPublicSettings, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const fullSettings = JSON.parse(setting.value);

    // Filter to only enabled items and remove sensitive data
    const publicSettings: PublicPlatformSettings = {
      currencies: (fullSettings.currencies || [])
        .filter((c: { enabled: boolean }) => c.enabled)
        .map((c: { code: string; name: string; symbol: string; rate: number; decimals: number }) => ({
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          rate: c.rate,
          decimals: c.decimals,
        })),
      
      languages: (fullSettings.languages || [])
        .filter((l: { enabled: boolean }) => l.enabled)
        .map((l: { code: string; name: string; nativeName: string; flag: string; rtl: boolean }) => ({
          code: l.code,
          name: l.name,
          nativeName: l.nativeName,
          flag: l.flag,
          rtl: l.rtl,
        })),
      
      countries: (fullSettings.countries || [])
        .filter((c: { enabled: boolean }) => c.enabled)
        .map((c: { code: string; name: string; nameLocal: string; currency: string; language: string }) => ({
          code: c.code,
          name: c.name,
          nameLocal: c.nameLocal,
          currency: c.currency,
          language: c.language,
        })),
      
      defaultCurrency: (fullSettings.currencies || []).find((c: { isDefault: boolean; enabled: boolean }) => c.isDefault && c.enabled)?.code || 'XOF',
      defaultLanguage: (fullSettings.languages || []).find((l: { isDefault: boolean; enabled: boolean }) => l.isDefault && l.enabled)?.code || 'fr',
      
      features: {
        enableMultiCurrency: fullSettings.features?.enableMultiCurrency ?? true,
        enableMultiLanguage: fullSettings.features?.enableMultiLanguage ?? true,
        enableGuestCheckout: fullSettings.features?.enableGuestCheckout ?? true,
        enableReviews: fullSettings.features?.enableReviews ?? true,
        enableWishlist: fullSettings.features?.enableWishlist ?? true,
        enableCompare: fullSettings.features?.enableCompare ?? true,
        enableQuickView: fullSettings.features?.enableQuickView ?? true,
        enableMobileMoneyPayments: fullSettings.features?.enableMobileMoneyPayments ?? true,
        enableCOD: fullSettings.features?.enableCOD ?? true,
        enableExpressCheckout: fullSettings.features?.enableExpressCheckout ?? true,
      },
      
      paymentMethods: (fullSettings.paymentMethods || [])
        .filter((p: { enabled: boolean }) => p.enabled)
        .map((p: { id: string; name: string; type: string; icon: string; countries: string[] }) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          icon: p.icon,
          countries: p.countries,
        })),
    };

    return NextResponse.json(publicSettings, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(defaultPublicSettings, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  }
}
