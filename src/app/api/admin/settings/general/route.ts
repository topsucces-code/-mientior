import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Settings are stored in a simple key-value table or JSON field
// For now, we'll use a Settings model or store in a JSON file

interface GeneralSettings {
  storeName: string;
  storeDescription: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeLogo: string;
  favicon: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  primaryColor: string;
  secondaryColor: string;
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableCompare: boolean;
  metaTitle: string;
  metaDescription: string;
  googleAnalyticsId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  emailFromName: string;
  emailFromAddress: string;
  orderNotificationEmail: string;
  lowStockThreshold: number;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
}

const defaultSettings: GeneralSettings = {
  storeName: 'Mientior',
  storeDescription: 'Your premium marketplace',
  storeEmail: 'contact@mientior.com',
  storePhone: '+1 234 567 890',
  storeAddress: '123 Commerce Street, City, Country',
  storeLogo: '',
  favicon: '',
  defaultLanguage: 'fr',
  defaultCurrency: 'XOF',
  timezone: 'Africa/Dakar',
  dateFormat: 'DD/MM/YYYY',
  primaryColor: '#f97316',
  secondaryColor: '#3b82f6',
  maintenanceMode: false,
  allowGuestCheckout: true,
  enableReviews: true,
  enableWishlist: true,
  enableCompare: true,
  metaTitle: 'Mientior - Premium Marketplace',
  metaDescription: 'Discover the best products at Mientior',
  googleAnalyticsId: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  emailFromName: 'Mientior',
  emailFromAddress: 'noreply@mientior.com',
  orderNotificationEmail: 'orders@mientior.com',
  lowStockThreshold: 10,
  enableEmailNotifications: true,
  enablePushNotifications: false,
};

export async function GET() {
  try {
    // Try to get settings from database
    const setting = await prisma.settings.findUnique({
      where: { key: 'general' },
    });

    if (setting) {
      return NextResponse.json({
        settings: JSON.parse(setting.value),
      });
    }

    // Return default settings if not found
    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    // Return defaults on error
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.storeName || !body.storeEmail) {
      return NextResponse.json(
        { error: 'Store name and email are required' },
        { status: 400 }
      );
    }

    // Upsert settings
    await prisma.settings.upsert({
      where: { key: 'general' },
      update: {
        value: JSON.stringify(body),
        updatedAt: new Date(),
      },
      create: {
        key: 'general',
        value: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving general settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
