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
  france: {
    firstName: 'Jean',
    lastName: 'Dupont',
    line1: '123 Rue de la Paix',
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
    phone: '+33612345678',
    email: 'jean.dupont@example.com',
  },
  frenchSuburb: {
    firstName: 'Marie',
    lastName: 'Martin',
    line1: '45 Avenue des Champs',
    line2: 'Appartement 3B',
    city: 'Lyon',
    postalCode: '69001',
    country: 'FR',
    phone: '+33687654321',
    email: 'marie.martin@example.com',
  },
  belgium: {
    firstName: 'Pierre',
    lastName: 'Dubois',
    line1: '78 Rue de la Loi',
    city: 'Brussels',
    postalCode: '1000',
    country: 'BE',
    phone: '+32475123456',
    email: 'pierre.dubois@example.com',
  },
  germany: {
    firstName: 'Hans',
    lastName: 'Schmidt',
    line1: '12 Hauptstrasse',
    city: 'Berlin',
    postalCode: '10115',
    country: 'DE',
    phone: '+491701234567',
    email: 'hans.schmidt@example.com',
  },
  uk: {
    firstName: 'John',
    lastName: 'Smith',
    line1: '10 Downing Street',
    city: 'London',
    postalCode: 'SW1A 2AA',
    country: 'GB',
    phone: '+447700900123',
    email: 'john.smith@example.com',
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
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
    phone: '+33612345678',
    ...overrides,
  }
}
