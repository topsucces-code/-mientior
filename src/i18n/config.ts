// Internationalization configuration for African markets
export const locales = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

// Locale metadata
export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ar: '🇸🇦',
};

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// African countries with their primary languages and currencies
export const africanCountries = {
  // West Africa - FCFA Zone (XOF)
  SN: { name: 'Sénégal', locale: 'fr', currency: 'XOF', flag: '🇸🇳' },
  CI: { name: "Côte d'Ivoire", locale: 'fr', currency: 'XOF', flag: '🇨🇮' },
  ML: { name: 'Mali', locale: 'fr', currency: 'XOF', flag: '🇲🇱' },
  BF: { name: 'Burkina Faso', locale: 'fr', currency: 'XOF', flag: '🇧🇫' },
  NE: { name: 'Niger', locale: 'fr', currency: 'XOF', flag: '🇳🇪' },
  TG: { name: 'Togo', locale: 'fr', currency: 'XOF', flag: '🇹🇬' },
  BJ: { name: 'Bénin', locale: 'fr', currency: 'XOF', flag: '🇧🇯' },
  GW: { name: 'Guinée-Bissau', locale: 'fr', currency: 'XOF', flag: '🇬🇼' },
  
  // Central Africa - FCFA Zone (XAF)
  CM: { name: 'Cameroun', locale: 'fr', currency: 'XAF', flag: '🇨🇲' },
  GA: { name: 'Gabon', locale: 'fr', currency: 'XAF', flag: '🇬🇦' },
  CG: { name: 'Congo', locale: 'fr', currency: 'XAF', flag: '🇨🇬' },
  TD: { name: 'Tchad', locale: 'fr', currency: 'XAF', flag: '🇹🇩' },
  CF: { name: 'Centrafrique', locale: 'fr', currency: 'XAF', flag: '🇨🇫' },
  GQ: { name: 'Guinée équatoriale', locale: 'fr', currency: 'XAF', flag: '🇬🇶' },
  
  // Other Francophone
  CD: { name: 'RD Congo', locale: 'fr', currency: 'CDF', flag: '🇨🇩' },
  GN: { name: 'Guinée', locale: 'fr', currency: 'GNF', flag: '🇬🇳' },
  MG: { name: 'Madagascar', locale: 'fr', currency: 'MGA', flag: '🇲🇬' },
  
  // Anglophone
  NG: { name: 'Nigeria', locale: 'en', currency: 'NGN', flag: '🇳🇬' },
  GH: { name: 'Ghana', locale: 'en', currency: 'GHS', flag: '🇬🇭' },
  KE: { name: 'Kenya', locale: 'en', currency: 'KES', flag: '🇰🇪' },
  ZA: { name: 'South Africa', locale: 'en', currency: 'ZAR', flag: '🇿🇦' },
  TZ: { name: 'Tanzania', locale: 'en', currency: 'TZS', flag: '🇹🇿' },
  UG: { name: 'Uganda', locale: 'en', currency: 'UGX', flag: '🇺🇬' },
  RW: { name: 'Rwanda', locale: 'en', currency: 'RWF', flag: '🇷🇼' },
  
  // North Africa (Arabic)
  MA: { name: 'Maroc', locale: 'ar', currency: 'MAD', flag: '🇲🇦' },
  DZ: { name: 'Algérie', locale: 'ar', currency: 'DZD', flag: '🇩🇿' },
  TN: { name: 'Tunisie', locale: 'ar', currency: 'TND', flag: '🇹🇳' },
  EG: { name: 'Égypte', locale: 'ar', currency: 'EGP', flag: '🇪🇬' },
} as const;

export type AfricanCountryCode = keyof typeof africanCountries;

// Currency configurations
export const currencies = {
  // West African CFA Franc
  XOF: {
    code: 'XOF',
    name: 'Franc CFA (BCEAO)',
    symbol: 'FCFA',
    decimals: 0,
    rate: 655.957, // Fixed rate to EUR
  },
  // Central African CFA Franc
  XAF: {
    code: 'XAF',
    name: 'Franc CFA (BEAC)',
    symbol: 'FCFA',
    decimals: 0,
    rate: 655.957, // Fixed rate to EUR
  },
  // Nigerian Naira
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    decimals: 2,
    rate: 1650, // Approximate rate to EUR
  },
  // Kenyan Shilling
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimals: 2,
    rate: 165, // Approximate rate to EUR
  },
  // South African Rand
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimals: 2,
    rate: 20, // Approximate rate to EUR
  },
  // Moroccan Dirham
  MAD: {
    code: 'MAD',
    name: 'Dirham Marocain',
    symbol: 'DH',
    decimals: 2,
    rate: 11, // Approximate rate to EUR
  },
  // Ghanaian Cedi
  GHS: {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: 'GH₵',
    decimals: 2,
    rate: 15, // Approximate rate to EUR
  },
  // Euro (for reference)
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    rate: 1,
  },
} as const;

export type CurrencyCode = keyof typeof currencies;

// Payment methods available in Africa
export const africanPaymentMethods = {
  // Mobile Money
  ORANGE_MONEY: {
    id: 'orange_money',
    name: 'Orange Money',
    icon: '/images/payments/orange-money.svg',
    countries: ['SN', 'CI', 'ML', 'BF', 'NE', 'CM', 'GN', 'MG'],
  },
  MTN_MOMO: {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    icon: '/images/payments/mtn-momo.svg',
    countries: ['CI', 'CM', 'GH', 'UG', 'RW', 'BJ', 'CG'],
  },
  MPESA: {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: '/images/payments/mpesa.svg',
    countries: ['KE', 'TZ', 'GH', 'EG'],
  },
  WAVE: {
    id: 'wave',
    name: 'Wave',
    icon: '/images/payments/wave.svg',
    countries: ['SN', 'CI', 'ML', 'BF'],
  },
  MOOV_MONEY: {
    id: 'moov_money',
    name: 'Moov Money',
    icon: '/images/payments/moov-money.svg',
    countries: ['CI', 'BJ', 'TG', 'NE', 'BF'],
  },
  FREE_MONEY: {
    id: 'free_money',
    name: 'Free Money',
    icon: '/images/payments/free-money.svg',
    countries: ['SN'],
  },
  
  // Cards
  VISA: {
    id: 'visa',
    name: 'Visa',
    icon: '/images/payments/visa.svg',
    countries: 'all',
  },
  MASTERCARD: {
    id: 'mastercard',
    name: 'Mastercard',
    icon: '/images/payments/mastercard.svg',
    countries: 'all',
  },
  
  // Bank transfers
  BANK_TRANSFER: {
    id: 'bank_transfer',
    name: 'Virement Bancaire',
    icon: '/images/payments/bank.svg',
    countries: 'all',
  },
  
  // Cash on delivery
  COD: {
    id: 'cod',
    name: 'Paiement à la livraison',
    icon: '/images/payments/cash.svg',
    countries: ['SN', 'CI', 'CM', 'NG', 'GH', 'KE', 'MA'],
  },
} as const;

// Get available payment methods for a country
export function getPaymentMethodsForCountry(countryCode: AfricanCountryCode) {
  return Object.values(africanPaymentMethods).filter(method => 
    method.countries === 'all' || 
    (Array.isArray(method.countries) && method.countries.includes(countryCode as never))
  );
}
