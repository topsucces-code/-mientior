import { addBusinessDays } from "date-fns";
import type { PrismaClient } from "@prisma/client";

/**
 * Calculate shipping cost based on subtotal, option, and country
 */
export function calculateShipping(
  subtotal: number,
  option: string,
  country: string = "CI"
): number {
  // Free shipping threshold for Ivory Coast (in XOF)
  const freeShippingThreshold = 25000;

  if (country === "CI") {
    if (option === "standard" && subtotal >= freeShippingThreshold) {
      return 0;
    }
    if (option === "standard") return 2500;
    if (option === "express") return 5000;
    if (option === "relay") return 2000;
  }

  // International shipping (simplified)
  if (option === "standard") return 6500;
  if (option === "express") return 12500;

  return 0;
}

/**
 * Calculate tax (TVA) based on subtotal and country
 */
export function calculateTax(
  subtotal: number,
  country: string = "CI"
): number {
  if (country === "CI") {
    return subtotal * 0.18; // 18% TVA in Côte d'Ivoire
  }
  // Other African countries would have different rates
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
 * Validate African phone number (supports multiple countries)
 */
export function validateAfricanPhone(phone: string): boolean {
  // Remove spaces, dots, and dashes
  const cleaned = phone.replace(/[\s.-]/g, "");

  // Support multiple African country codes
  const patterns = [
    /^(?:\+225|0)[0-9]{10}$/,  // Côte d'Ivoire
    /^(?:\+221|0)[0-9]{9}$/,   // Sénégal
    /^(?:\+237|0)[0-9]{9}$/,   // Cameroun
    /^(?:\+234|0)[0-9]{10}$/,  // Nigeria
    /^(?:\+233|0)[0-9]{9}$/,   // Ghana
  ];

  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Format African phone number
 */
export function formatAfricanPhone(phone: string): string {
  const cleaned = phone.replace(/[\s.-]/g, "");

  // Côte d'Ivoire format: +225 07 07 12 34 56
  if (cleaned.startsWith("+225")) {
    const number = cleaned.slice(4);
    return `+225 ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 6)} ${number.slice(6, 8)} ${number.slice(8, 10)}`;
  }

  // Sénégal format: +221 77 123 45 67
  if (cleaned.startsWith("+221")) {
    const number = cleaned.slice(4);
    return `+221 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
  }

  // Cameroun format: +237 6 55 12 34 56
  if (cleaned.startsWith("+237")) {
    const number = cleaned.slice(4);
    return `+237 ${number.slice(0, 1)} ${number.slice(1, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
  }

  return phone;
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use validateAfricanPhone instead
 */
export function validateFrenchPhone(phone: string): boolean {
  return validateAfricanPhone(phone);
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use formatAfricanPhone instead
 */
export function formatFrenchPhone(phone: string): string {
  return formatAfricanPhone(phone);
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
  prisma: PrismaClient
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
      include: {
        variants: item.variantId
          ? {
              where: { id: item.variantId },
            }
          : false,
      },
    })

    if (!product) {
      throw new Error(`Product ${item.productId} not found`)
    }

    // Check stock availability
    const variant = item.variantId && product.variants && product.variants.length > 0
      ? product.variants[0]
      : null
    const availableStock = variant ? variant.stock : product.stock

    if (availableStock < item.quantity) {
      throw new Error(`Stock insuffisant pour ${product.name}`)
    }

    // Calculate item price
    let itemPrice = Math.round(product.price * 100) // Convert to cents
    if (variant && variant.price_modifier) {
      itemPrice += Math.round(variant.price_modifier * 100)
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
