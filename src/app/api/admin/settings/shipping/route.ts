import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  freeShippingThreshold: 100,
  calculateTaxOnShipping: false,
  shippingOrigin: {
    country: 'FR',
    city: 'Paris',
    postalCode: '75001',
    address: '123 Rue du Commerce',
  },
  zones: [
    {
      id: 'zone-1',
      name: 'France Métropolitaine',
      countries: ['FR'],
      regions: [],
      enabled: true,
    },
    {
      id: 'zone-2',
      name: 'Europe',
      countries: ['DE', 'ES', 'IT', 'BE', 'NL', 'PT'],
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
      cost: 5.99,
      estimatedDays: { min: 3, max: 5 },
      enabled: true,
    },
    {
      id: 'method-2',
      name: 'Express',
      description: 'Livraison express',
      zoneId: 'zone-1',
      type: 'flat',
      cost: 12.99,
      estimatedDays: { min: 1, max: 2 },
      enabled: true,
    },
  ],
};

export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'shipping' },
    });

    if (setting) {
      return NextResponse.json({
        settings: JSON.parse(setting.value),
      });
    }

    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    await prisma.settings.upsert({
      where: { key: 'shipping' },
      update: {
        value: JSON.stringify(body),
        updatedAt: new Date(),
      },
      create: {
        key: 'shipping',
        value: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Shipping settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
