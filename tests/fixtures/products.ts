/**
 * Product test data fixtures
 */

export interface TestProduct {
  name: string
  description: string
  price: number
  stock: number
  categoryId?: string
  tags?: string[]
  images?: string[]
}

export const TEST_PRODUCTS: Record<string, TestProduct> = {
  simple: {
    name: 'Simple Test Product',
    description: 'A simple product for testing',
    price: 29.99,
    stock: 100,
    tags: ['test', 'simple'],
  },
  expensive: {
    name: 'Expensive Test Product',
    description: 'An expensive product for testing high-value scenarios',
    price: 999.99,
    stock: 10,
    tags: ['test', 'premium'],
  },
  cheap: {
    name: 'Cheap Test Product',
    description: 'A cheap product for testing low-value scenarios',
    price: 5.99,
    stock: 500,
    tags: ['test', 'budget'],
  },
  outOfStock: {
    name: 'Out of Stock Product',
    description: 'A product that is out of stock',
    price: 49.99,
    stock: 0,
    tags: ['test', 'unavailable'],
  },
  withVariants: {
    name: 'Product with Variants',
    description: 'A product with size and color variants',
    price: 39.99,
    stock: 200,
    tags: ['test', 'variants'],
  },
}

export const TEST_VARIANTS = [
  {
    size: 'S',
    color: 'Red',
    sku: 'TEST-S-RED',
    stock: 50,
  },
  {
    size: 'M',
    color: 'Blue',
    sku: 'TEST-M-BLUE',
    stock: 75,
  },
  {
    size: 'L',
    color: 'Green',
    sku: 'TEST-L-GREEN',
    stock: 75,
  },
]

export const TEST_CATEGORIES = [
  {
    name: 'Test Category 1',
    slug: 'test-category-1',
    description: 'First test category',
  },
  {
    name: 'Test Category 2',
    slug: 'test-category-2',
    description: 'Second test category',
  },
]

/**
 * Generate a unique product name for testing
 */
export function generateProductName(prefix = 'Test Product'): string {
  return `${prefix} ${Date.now()}`
}

/**
 * Generate test product data
 */
export function generateTestProduct(overrides?: Partial<TestProduct>): TestProduct {
  return {
    name: generateProductName(),
    description: 'This is a test product',
    price: 29.99,
    stock: 100,
    tags: ['test'],
    ...overrides,
  }
}
