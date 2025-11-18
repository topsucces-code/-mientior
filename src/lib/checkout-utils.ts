import { addBusinessDays } from "date-fns";

/**
 * Calculate shipping cost based on subtotal, option, and country
 */
export function calculateShipping(
  subtotal: number,
  option: string,
  country: string = "FR"
): number {
  // Free shipping threshold for France
  const freeShippingThreshold = 50;

  if (country === "FR") {
    if (option === "standard" && subtotal >= freeShippingThreshold) {
      return 0;
    }
    if (option === "standard") return 4.99;
    if (option === "express") return 9.99;
    if (option === "relay") return 3.99;
  }

  // International shipping (simplified)
  if (option === "standard") return 12.99;
  if (option === "express") return 24.99;

  return 0;
}

/**
 * Calculate tax (TVA) based on subtotal and country
 */
export function calculateTax(
  subtotal: number,
  country: string = "FR"
): number {
  if (country === "FR") {
    return subtotal * 0.2; // 20% TVA in France
  }
  // EU countries would have different rates
  return 0;
}

/**
 * Format card number with spaces (XXXX XXXX XXXX XXXX)
 */
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\s/g, "");
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(" ");
}

/**
 * Format expiry date (MM/YY)
 */
export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(value: string): boolean {
  const cleaned = value.replace(/\s/g, "");

  if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate expiry date (MM/YY)
 */
export function validateExpiry(value: string): boolean {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length !== 4) return false;

  const month = parseInt(cleaned.slice(0, 2), 10);
  const year = parseInt(cleaned.slice(2, 4), 10);

  if (month < 1 || month > 12) return false;

  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

/**
 * Detect card type from card number
 */
export function detectCardType(
  number: string
): "visa" | "mastercard" | "amex" | "unknown" {
  const cleaned = number.replace(/\s/g, "");

  if (/^4/.test(cleaned)) return "visa";
  if (/^5[1-5]/.test(cleaned)) return "mastercard";
  if (/^3[47]/.test(cleaned)) return "amex";

  return "unknown";
}

/**
 * Generate unique order number
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `ORD-${year}-${random}`;
}

/**
 * Calculate estimated delivery date
 */
export function calculateEstimatedDelivery(
  shippingOption: string,
  orderDate: Date = new Date()
): Date {
  switch (shippingOption) {
    case "express":
      return addBusinessDays(orderDate, 1); // Next business day
    case "relay":
      return addBusinessDays(orderDate, 3); // 3 business days
    case "standard":
    default:
      return addBusinessDays(orderDate, 5); // 5 business days
  }
}

/**
 * Validate French phone number
 */
export function validateFrenchPhone(phone: string): boolean {
  // Remove spaces, dots, and dashes
  const cleaned = phone.replace(/[\s.-]/g, "");

  // Check for +33 or 0 prefix
  const regex = /^(?:\+33|0)[1-9](?:\d{8})$/;
  return regex.test(cleaned);
}

/**
 * Format French phone number
 */
export function formatFrenchPhone(phone: string): string {
  const cleaned = phone.replace(/[\s.-]/g, "");

  if (cleaned.startsWith("+33")) {
    const number = cleaned.slice(3);
    return `+33 ${number.slice(0, 1)} ${number.slice(1, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
  }

  if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }

  return phone;
}

/**
 * Validate French postal code
 */
export function validateFrenchPostalCode(postalCode: string): boolean {
  const regex = /^(?:0[1-9]|[1-8]\d|9[0-5])\d{3}$/;
  return regex.test(postalCode);
}

/**
 * Shipping costs in cents
 */
export const SHIPPING_COSTS = {
  standard: 490,
  express: 990,
  relay: 390,
  pickup: 0,
} as const

/**
 * Free shipping threshold in cents (25€)
 */
export const FREE_SHIPPING_THRESHOLD = 2500

/**
 * VAT rate for France
 */
export const VAT_RATE = 0.2

/**
 * Compute checkout totals server-side for security
 * Prevents client tampering with amounts
 */
export interface ComputedTotals {
  subtotal: number // in cents
  shippingCost: number // in cents
  tax: number // in cents
  discount: number // in cents
  total: number // in cents
}

export function computeCheckoutTotals(
  subtotal: number,
  shippingOption: string,
  discount: number = 0
): ComputedTotals {
  let shippingCost: number = (SHIPPING_COSTS as Record<string, number>)[shippingOption] ?? SHIPPING_COSTS.standard

  // Apply free shipping threshold for standard shipping
  if (shippingOption === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0
  }

  const tax = Math.round((subtotal + shippingCost) * VAT_RATE)
  const total = subtotal + shippingCost + tax - discount

  return {
    subtotal,
    shippingCost,
    tax,
    discount,
    total,
  }
}

/**
 * Server-side order totals computation with stock validation
 * Used for provisional order creation and payment initialization
 */
export interface OrderItem {
  productId: string
  variantId?: string
  quantity: number
}

export interface ComputeOrderTotalsOptions {
  items: OrderItem[]
  shippingOption?: string
  promoCode?: string
}

export interface ComputeOrderTotalsResult {
  subtotal: number // in cents
  shippingCost: number // in cents
  tax: number // in cents
  discount: number // in cents
  total: number // in cents
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    price: number // unit price in cents
    subtotal: number // line total in cents
  }>
}

/**
 * Compute order totals with item validation and stock checking
 * This is the authoritative server-side calculation
 */
export async function computeOrderTotals(
  options: ComputeOrderTotalsOptions,
  prisma: any // Prisma client instance
): Promise<ComputeOrderTotalsResult> {
  const { items, shippingOption = 'standard', promoCode } = options

  if (!items || items.length === 0) {
    throw new Error('No items provided')
  }

  let subtotal = 0
  const validatedItems: ComputeOrderTotalsResult['items'] = []

  // Validate each item and compute subtotals
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        variants: item.variantId
          ? {
              where: { id: item.variantId },
              select: {
                id: true,
                priceModifier: true,
                stock: true,
              },
            }
          : false,
      },
    })

    if (!product) {
      throw new Error(`Product ${item.productId} not found`)
    }

    // Check stock availability
    const availableStock = item.variantId && product.variants && product.variants.length > 0
      ? product.variants[0].stock
      : product.stock

    if (availableStock < item.quantity) {
      throw new Error(`Stock insuffisant pour ${product.name}`)
    }

    // Calculate item price
    let itemPrice = Math.round(product.price * 100) // Convert to cents
    if (item.variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants[0]
      if (variant.priceModifier) {
        itemPrice += Math.round(variant.priceModifier * 100)
      }
    }

    const lineSubtotal = itemPrice * item.quantity
    subtotal += lineSubtotal

    validatedItems.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: itemPrice,
      subtotal: lineSubtotal,
    })
  }

  // Calculate shipping cost
  let shippingCost: number = (SHIPPING_COSTS as Record<string, number>)[shippingOption] ?? SHIPPING_COSTS.standard
  if (shippingOption === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0
  }

  // Calculate discount from promo code (if any)
  let discount = 0
  if (promoCode) {
    // TODO: Implement promo code validation
    // For now, placeholder logic
    discount = 0
  }

  // Calculate tax (VAT)
  const tax = Math.round((subtotal + shippingCost) * VAT_RATE)

  // Calculate total
  const total = subtotal + shippingCost + tax - discount

  return {
    subtotal,
    shippingCost,
    tax,
    discount,
    total,
    items: validatedItems,
  }
}
