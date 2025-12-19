import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Platform settings for currencies, languages, countries, shipping zones
export interface PlatformSettings {
  // Supported currencies with exchange rates
  currencies: {
    code: string;
    name: string;
    symbol: string;
    rate: number; // Exchange rate from EUR
    decimals: number;
    enabled: boolean;
    isDefault: boolean;
  }[];
  
  // Supported languages
  languages: {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    enabled: boolean;
    isDefault: boolean;
    rtl: boolean;
  }[];
  
  // Supported countries with shipping info
  countries: {
    code: string;
    name: string;
    nameLocal: string;
    currency: string;
    language: string;
    enabled: boolean;
    shippingZone: string;
    freeShippingThreshold: number; // In EUR cents
    baseShippingCost: number; // In EUR cents
  }[];
  
  // Shipping zones
  shippingZones: {
    id: string;
    name: string;
    countries: string[];
    baseRate: number;
    freeThreshold: number;
    estimatedDays: { min: number; max: number };
  }[];
  
  // Payment methods
  paymentMethods: {
    id: string;
    name: string;
    type: 'card' | 'mobile_money' | 'bank_transfer' | 'cod' | 'wallet';
    provider: string;
    enabled: boolean;
    countries: string[]; // Empty = all countries
    icon: string;
    fees: { type: 'fixed' | 'percentage'; value: number };
  }[];
  
  // Feature flags
  features: {
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
  };
  
  // Business rules
  businessRules: {
    minOrderAmount: number; // In EUR cents
    maxOrderAmount: number;
    lowStockThreshold: number;
    outOfStockBehavior: 'hide' | 'show_disabled' | 'allow_backorder';
    cartExpirationHours: number;
    abandonedCartReminderHours: number;
    orderCancellationHours: number;
    returnWindowDays: number;
    reviewModeration: 'auto' | 'manual' | 'ai';
  };
}

const defaultPlatformSettings: PlatformSettings = {
  currencies: [
    { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'FCFA', rate: 655.957, decimals: 0, enabled: true, isDefault: true },
    { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'FCFA', rate: 655.957, decimals: 0, enabled: true, isDefault: false },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 1, decimals: 2, enabled: true, isDefault: false },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.08, decimals: 2, enabled: true, isDefault: false },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1650, decimals: 0, enabled: true, isDefault: false },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', rate: 15.5, decimals: 2, enabled: true, isDefault: false },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 165, decimals: 0, enabled: true, isDefault: false },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 20.5, decimals: 2, enabled: true, isDefault: false },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', rate: 10.8, decimals: 2, enabled: true, isDefault: false },
  ],
  
  languages: [
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', enabled: true, isDefault: true, rtl: false },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', enabled: true, isDefault: false, rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', enabled: true, isDefault: false, rtl: true },
  ],
  
  countries: [
    // West Africa - FCFA Zone
    { code: 'SN', name: 'Senegal', nameLocal: 'Sénégal', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 3000, baseShippingCost: 300 },
    { code: 'CI', name: "Côte d'Ivoire", nameLocal: "Côte d'Ivoire", currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 3000, baseShippingCost: 300 },
    { code: 'ML', name: 'Mali', nameLocal: 'Mali', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 3500, baseShippingCost: 400 },
    { code: 'BF', name: 'Burkina Faso', nameLocal: 'Burkina Faso', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 3500, baseShippingCost: 400 },
    { code: 'NE', name: 'Niger', nameLocal: 'Niger', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    { code: 'TG', name: 'Togo', nameLocal: 'Togo', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 3000, baseShippingCost: 300 },
    { code: 'BJ', name: 'Benin', nameLocal: 'Bénin', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 3000, baseShippingCost: 300 },
    { code: 'GW', name: 'Guinea-Bissau', nameLocal: 'Guiné-Bissau', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-fcfa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    
    // Central Africa - FCFA Zone
    { code: 'CM', name: 'Cameroon', nameLocal: 'Cameroun', currency: 'XAF', language: 'fr', enabled: true, shippingZone: 'central-africa', freeShippingThreshold: 3500, baseShippingCost: 400 },
    { code: 'GA', name: 'Gabon', nameLocal: 'Gabon', currency: 'XAF', language: 'fr', enabled: true, shippingZone: 'central-africa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    { code: 'CG', name: 'Congo', nameLocal: 'Congo', currency: 'XAF', language: 'fr', enabled: true, shippingZone: 'central-africa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    { code: 'TD', name: 'Chad', nameLocal: 'Tchad', currency: 'XAF', language: 'fr', enabled: true, shippingZone: 'central-africa', freeShippingThreshold: 4500, baseShippingCost: 600 },
    { code: 'CF', name: 'Central African Republic', nameLocal: 'République centrafricaine', currency: 'XAF', language: 'fr', enabled: true, shippingZone: 'central-africa', freeShippingThreshold: 5000, baseShippingCost: 700 },
    
    // West Africa - Other
    { code: 'NG', name: 'Nigeria', nameLocal: 'Nigeria', currency: 'NGN', language: 'en', enabled: true, shippingZone: 'west-africa-other', freeShippingThreshold: 3500, baseShippingCost: 400 },
    { code: 'GH', name: 'Ghana', nameLocal: 'Ghana', currency: 'GHS', language: 'en', enabled: true, shippingZone: 'west-africa-other', freeShippingThreshold: 3500, baseShippingCost: 400 },
    { code: 'GN', name: 'Guinea', nameLocal: 'Guinée', currency: 'XOF', language: 'fr', enabled: true, shippingZone: 'west-africa-other', freeShippingThreshold: 4000, baseShippingCost: 500 },
    
    // East Africa
    { code: 'KE', name: 'Kenya', nameLocal: 'Kenya', currency: 'KES', language: 'en', enabled: true, shippingZone: 'east-africa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    { code: 'TZ', name: 'Tanzania', nameLocal: 'Tanzania', currency: 'KES', language: 'en', enabled: true, shippingZone: 'east-africa', freeShippingThreshold: 4500, baseShippingCost: 600 },
    { code: 'UG', name: 'Uganda', nameLocal: 'Uganda', currency: 'KES', language: 'en', enabled: true, shippingZone: 'east-africa', freeShippingThreshold: 4500, baseShippingCost: 600 },
    { code: 'RW', name: 'Rwanda', nameLocal: 'Rwanda', currency: 'KES', language: 'fr', enabled: true, shippingZone: 'east-africa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    
    // North Africa
    { code: 'MA', name: 'Morocco', nameLocal: 'المغرب', currency: 'MAD', language: 'ar', enabled: true, shippingZone: 'north-africa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    { code: 'DZ', name: 'Algeria', nameLocal: 'الجزائر', currency: 'MAD', language: 'ar', enabled: true, shippingZone: 'north-africa', freeShippingThreshold: 4500, baseShippingCost: 600 },
    { code: 'TN', name: 'Tunisia', nameLocal: 'تونس', currency: 'MAD', language: 'ar', enabled: true, shippingZone: 'north-africa', freeShippingThreshold: 4000, baseShippingCost: 500 },
    { code: 'EG', name: 'Egypt', nameLocal: 'مصر', currency: 'MAD', language: 'ar', enabled: true, shippingZone: 'north-africa', freeShippingThreshold: 4500, baseShippingCost: 600 },
    
    // Southern Africa
    { code: 'ZA', name: 'South Africa', nameLocal: 'South Africa', currency: 'ZAR', language: 'en', enabled: true, shippingZone: 'southern-africa', freeShippingThreshold: 5000, baseShippingCost: 700 },
  ],
  
  shippingZones: [
    { id: 'west-africa-fcfa', name: 'West Africa (FCFA)', countries: ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GW'], baseRate: 300, freeThreshold: 3000, estimatedDays: { min: 2, max: 5 } },
    { id: 'central-africa', name: 'Central Africa', countries: ['CM', 'GA', 'CG', 'TD', 'CF'], baseRate: 400, freeThreshold: 3500, estimatedDays: { min: 3, max: 7 } },
    { id: 'west-africa-other', name: 'West Africa (Other)', countries: ['NG', 'GH', 'GN'], baseRate: 400, freeThreshold: 3500, estimatedDays: { min: 3, max: 7 } },
    { id: 'east-africa', name: 'East Africa', countries: ['KE', 'TZ', 'UG', 'RW'], baseRate: 500, freeThreshold: 4000, estimatedDays: { min: 5, max: 10 } },
    { id: 'north-africa', name: 'North Africa', countries: ['MA', 'DZ', 'TN', 'EG'], baseRate: 500, freeThreshold: 4000, estimatedDays: { min: 4, max: 8 } },
    { id: 'southern-africa', name: 'Southern Africa', countries: ['ZA'], baseRate: 700, freeThreshold: 5000, estimatedDays: { min: 5, max: 10 } },
  ],
  
  paymentMethods: [
    { id: 'card', name: 'Credit/Debit Card', type: 'card', provider: 'stripe', enabled: true, countries: [], icon: 'credit-card', fees: { type: 'percentage', value: 2.9 } },
    { id: 'orange-money', name: 'Orange Money', type: 'mobile_money', provider: 'orange', enabled: true, countries: ['SN', 'CI', 'ML', 'BF', 'CM'], icon: 'orange-money', fees: { type: 'percentage', value: 1.5 } },
    { id: 'mtn-momo', name: 'MTN Mobile Money', type: 'mobile_money', provider: 'mtn', enabled: true, countries: ['CI', 'CM', 'GH', 'NG', 'UG', 'RW'], icon: 'mtn-momo', fees: { type: 'percentage', value: 1.5 } },
    { id: 'wave', name: 'Wave', type: 'mobile_money', provider: 'wave', enabled: true, countries: ['SN', 'CI', 'ML', 'BF'], icon: 'wave', fees: { type: 'percentage', value: 1 } },
    { id: 'mpesa', name: 'M-Pesa', type: 'mobile_money', provider: 'safaricom', enabled: true, countries: ['KE', 'TZ'], icon: 'mpesa', fees: { type: 'percentage', value: 1.5 } },
    { id: 'paystack', name: 'Paystack', type: 'card', provider: 'paystack', enabled: true, countries: ['NG', 'GH', 'ZA', 'KE'], icon: 'paystack', fees: { type: 'percentage', value: 1.5 } },
    { id: 'flutterwave', name: 'Flutterwave', type: 'card', provider: 'flutterwave', enabled: true, countries: ['NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'RW'], icon: 'flutterwave', fees: { type: 'percentage', value: 1.4 } },
    { id: 'cod', name: 'Cash on Delivery', type: 'cod', provider: 'internal', enabled: true, countries: ['SN', 'CI', 'CM', 'MA'], icon: 'cash', fees: { type: 'fixed', value: 100 } },
  ],
  
  features: {
    enableMultiCurrency: true,
    enableMultiLanguage: true,
    enableGuestCheckout: true,
    enableReviews: true,
    enableWishlist: true,
    enableCompare: true,
    enableQuickView: true,
    enableSocialLogin: true,
    enableMobileMoneyPayments: true,
    enableCOD: true,
    enableExpressCheckout: true,
    enableProductQuestions: true,
    enableVendorMarketplace: false,
    enableLoyaltyProgram: false,
    enableReferralProgram: false,
    enablePushNotifications: true,
    enableSMS: true,
    enableWhatsApp: true,
  },
  
  businessRules: {
    minOrderAmount: 500, // 5 EUR in cents
    maxOrderAmount: 100000000, // 1M EUR in cents
    lowStockThreshold: 10,
    outOfStockBehavior: 'show_disabled',
    cartExpirationHours: 72,
    abandonedCartReminderHours: 24,
    orderCancellationHours: 24,
    returnWindowDays: 14,
    reviewModeration: 'auto',
  },
};

export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'platform' },
    });

    if (setting) {
      const savedSettings = JSON.parse(setting.value);
      // Merge with defaults to ensure new fields are included
      return NextResponse.json({
        settings: { ...defaultPlatformSettings, ...savedSettings },
      });
    }

    return NextResponse.json({ settings: defaultPlatformSettings });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return NextResponse.json({ settings: defaultPlatformSettings });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.currencies || body.currencies.length === 0) {
      return NextResponse.json(
        { error: 'At least one currency is required' },
        { status: 400 }
      );
    }

    if (!body.languages || body.languages.length === 0) {
      return NextResponse.json(
        { error: 'At least one language is required' },
        { status: 400 }
      );
    }

    // Ensure at least one default currency and language
    const hasDefaultCurrency = body.currencies.some((c: { isDefault: boolean }) => c.isDefault);
    const hasDefaultLanguage = body.languages.some((l: { isDefault: boolean }) => l.isDefault);

    if (!hasDefaultCurrency) {
      body.currencies[0].isDefault = true;
    }

    if (!hasDefaultLanguage) {
      body.languages[0].isDefault = true;
    }

    await prisma.settings.upsert({
      where: { key: 'platform' },
      update: {
        value: JSON.stringify(body),
        updatedAt: new Date(),
      },
      create: {
        key: 'platform',
        value: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Platform settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving platform settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
