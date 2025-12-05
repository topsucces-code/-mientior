import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PaymentSettings {
  stripeEnabled: boolean;
  stripeTestMode: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  paypalEnabled: boolean;
  paypalTestMode: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  flutterwaveEnabled: boolean;
  flutterwaveTestMode: boolean;
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  flutterwaveEncryptionKey: string;
  paystackEnabled: boolean;
  paystackTestMode: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  defaultCurrency: string;
  allowedCurrencies: string[];
  minimumOrderAmount: number;
  maximumOrderAmount: number;
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

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'payments' },
    });

    if (setting) {
      // Mask sensitive keys for security
      const settings = JSON.parse(setting.value);
      return NextResponse.json({
        settings: {
          ...settings,
          stripeSecretKey: settings.stripeSecretKey ? '••••••••' : '',
          stripeWebhookSecret: settings.stripeWebhookSecret ? '••••••••' : '',
          paypalClientSecret: settings.paypalClientSecret ? '••••••••' : '',
          flutterwaveSecretKey: settings.flutterwaveSecretKey ? '••••••••' : '',
          flutterwaveEncryptionKey: settings.flutterwaveEncryptionKey ? '••••••••' : '',
          paystackSecretKey: settings.paystackSecretKey ? '••••••••' : '',
        },
      });
    }

    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing settings to preserve masked values
    const existing = await prisma.setting.findUnique({
      where: { key: 'payments' },
    });

    let settingsToSave = body;

    if (existing) {
      const existingSettings = JSON.parse(existing.value);
      
      // Preserve existing secret keys if masked value is sent
      const secretFields = [
        'stripeSecretKey',
        'stripeWebhookSecret',
        'paypalClientSecret',
        'flutterwaveSecretKey',
        'flutterwaveEncryptionKey',
        'paystackSecretKey',
      ];

      secretFields.forEach((field) => {
        if (body[field] === '••••••••') {
          settingsToSave[field] = existingSettings[field];
        }
      });
    }

    await prisma.setting.upsert({
      where: { key: 'payments' },
      update: {
        value: JSON.stringify(settingsToSave),
        updatedAt: new Date(),
      },
      create: {
        key: 'payments',
        value: JSON.stringify(settingsToSave),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
