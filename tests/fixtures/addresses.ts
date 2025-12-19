/**
 * Address test data fixtures
 */

export interface TestAddress {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  phone: string
  email?: string
}

export const TEST_ADDRESSES: Record<string, TestAddress> = {
  cotedivoire: {
    firstName: 'Amadou',
    lastName: 'Diallo',
    line1: 'Cocody Riviera 2, Rue des Jardins',
    city: 'Abidjan',
    postalCode: 'BP 1234',
    country: 'CI',
    phone: '+225 07 07 12 34 56',
    email: 'amadou.diallo@example.com',
  },
  senegal: {
    firstName: 'Fatou',
    lastName: 'Sow',
    line1: 'Plateau, Avenue Léopold Sédar Senghor',
    line2: 'Immeuble 3, Appartement 2B',
    city: 'Dakar',
    postalCode: 'BP 5678',
    country: 'SN',
    phone: '+221 77 123 45 67',
    email: 'fatou.sow@example.com',
  },
  cameroon: {
    firstName: 'Ibrahim',
    lastName: 'Nkomo',
    line1: 'Akwa, Rue Joffre',
    city: 'Douala',
    postalCode: 'BP 9012',
    country: 'CM',
    phone: '+237 6 55 12 34 56',
    email: 'ibrahim.nkomo@example.com',
  },
  nigeria: {
    firstName: 'Chukwu',
    lastName: 'Okafor',
    line1: '12 Victoria Island Road',
    city: 'Lagos',
    postalCode: '101241',
    country: 'NG',
    phone: '+234 802 123 4567',
    email: 'chukwu.okafor@example.com',
  },
  ghana: {
    firstName: 'Kwame',
    lastName: 'Mensah',
    line1: '10 Independence Avenue',
    city: 'Accra',
    postalCode: 'GA-123-4567',
    country: 'GH',
    phone: '+233 24 123 4567',
    email: 'kwame.mensah@example.com',
  },
}

/**
 * Generate a random test address
 */
export function generateTestAddress(overrides?: Partial<TestAddress>): TestAddress {
  return {
    firstName: 'Test',
    lastName: 'User',
    line1: `${Math.floor(Math.random() * 999)} Test Street`,
    city: 'Abidjan',
    postalCode: 'BP 1234',
    country: 'CI',
    phone: '+225 07 07 12 34 56',
    ...overrides,
  }
}
