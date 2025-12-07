/**
 * Promo Code Validator
 * Validates and calculates discounts for promo codes
 */

import { prisma } from "@/lib/prisma";

// Types
export interface PromoCodeValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  discount: number;
  promoCode?: {
    id: string;
    code: string;
    type: string;
    value: number;
    scope: string;
  };
}

export interface CartItem {
  productId: string;
  categoryId?: string;
  price: number;
  quantity: number;
  name?: string;
}

export interface ValidationContext {
  code: string;
  userId: string;
  cartItems: CartItem[];
  subtotal: number;
  shippingCost?: number;
  isFirstOrder?: boolean;
}

// Error codes
export const PromoCodeErrors = {
  NOT_FOUND: "PROMO_CODE_NOT_FOUND",
  INACTIVE: "PROMO_CODE_INACTIVE",
  EXPIRED: "PROMO_CODE_EXPIRED",
  NOT_YET_VALID: "PROMO_CODE_NOT_YET_VALID",
  USAGE_LIMIT_REACHED: "PROMO_CODE_USAGE_LIMIT_REACHED",
  USER_LIMIT_REACHED: "PROMO_CODE_USER_LIMIT_REACHED",
  MIN_PURCHASE_NOT_MET: "PROMO_CODE_MIN_PURCHASE_NOT_MET",
  FIRST_ORDER_ONLY: "PROMO_CODE_FIRST_ORDER_ONLY",
  CATEGORY_NOT_APPLICABLE: "PROMO_CODE_CATEGORY_NOT_APPLICABLE",
  PRODUCT_NOT_APPLICABLE: "PROMO_CODE_PRODUCT_NOT_APPLICABLE",
  INVALID_SCOPE: "PROMO_CODE_INVALID_SCOPE",
} as const;

/**
 * Validate a promo code and calculate the discount
 */
export async function validatePromoCode(
  context: ValidationContext
): Promise<PromoCodeValidationResult> {
  const { code, userId, cartItems, subtotal, shippingCost = 0, isFirstOrder } = context;

  // 1. Retrieve promo code
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      usages: {
        where: { userId },
      },
    },
  });

  if (!promoCode) {
    return {
      valid: false,
      error: "Promo code not found",
      errorCode: PromoCodeErrors.NOT_FOUND,
      discount: 0,
    };
  }

  // 2. Check if active
  if (!promoCode.isActive) {
    return {
      valid: false,
      error: "This promo code is no longer active",
      errorCode: PromoCodeErrors.INACTIVE,
      discount: 0,
    };
  }

  // 3. Check validity dates
  const now = new Date();

  if (promoCode.validFrom && now < promoCode.validFrom) {
    return {
      valid: false,
      error: "This promo code is not yet valid",
      errorCode: PromoCodeErrors.NOT_YET_VALID,
      discount: 0,
    };
  }

  if (promoCode.validTo && now > promoCode.validTo) {
    return {
      valid: false,
      error: "This promo code has expired",
      errorCode: PromoCodeErrors.EXPIRED,
      discount: 0,
    };
  }

  // 4. Check global usage limit
  if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
    return {
      valid: false,
      error: "This promo code has reached its usage limit",
      errorCode: PromoCodeErrors.USAGE_LIMIT_REACHED,
      discount: 0,
    };
  }

  // 5. Check per-user limit
  const conditions = (promoCode.conditions as Record<string, unknown>) || {};
  const perUserLimit = conditions.perUserLimit as number | undefined;

  if (perUserLimit && promoCode.usages.length >= perUserLimit) {
    return {
      valid: false,
      error: "You have already used this promo code the maximum number of times",
      errorCode: PromoCodeErrors.USER_LIMIT_REACHED,
      discount: 0,
    };
  }

  // 6. Check first order only
  const firstOrderOnly = conditions.firstOrderOnly as boolean | undefined;

  if (firstOrderOnly) {
    // Check if user has previous orders
    const previousOrders = await prisma.order.count({
      where: {
        userId,
        status: { notIn: ["CANCELLED"] },
      },
    });

    if (previousOrders > 0 && !isFirstOrder) {
      return {
        valid: false,
        error: "This promo code is only valid for first orders",
        errorCode: PromoCodeErrors.FIRST_ORDER_ONLY,
        discount: 0,
      };
    }
  }

  // 7. Check minimum purchase amount
  if (promoCode.minOrderAmount && subtotal < promoCode.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum purchase of $${promoCode.minOrderAmount} required`,
      errorCode: PromoCodeErrors.MIN_PURCHASE_NOT_MET,
      discount: 0,
    };
  }

  // 8. Calculate discount based on scope
  const scope = (conditions.scope as string) || "CART";
  let discount = 0;
  let applicableAmount = subtotal;

  switch (scope) {
    case "CART":
      // Apply to entire cart
      applicableAmount = subtotal;
      break;

    case "SHIPPING":
      // Apply to shipping cost
      applicableAmount = shippingCost;
      break;

    case "CATEGORY": {
      // Apply only to items in specified categories
      const categoryIds = (conditions.categoryIds as string[]) || [];
      if (categoryIds.length === 0) {
        return {
          valid: false,
          error: "Invalid promo code configuration",
          errorCode: PromoCodeErrors.INVALID_SCOPE,
          discount: 0,
        };
      }

      applicableAmount = cartItems
        .filter((item) => item.categoryId && categoryIds.includes(item.categoryId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (applicableAmount === 0) {
        return {
          valid: false,
          error: "This promo code is not applicable to items in your cart",
          errorCode: PromoCodeErrors.CATEGORY_NOT_APPLICABLE,
          discount: 0,
        };
      }
      break;
    }

    case "PRODUCT": {
      // Apply only to specified products
      const productIds = (conditions.productIds as string[]) || [];
      if (productIds.length === 0) {
        return {
          valid: false,
          error: "Invalid promo code configuration",
          errorCode: PromoCodeErrors.INVALID_SCOPE,
          discount: 0,
        };
      }

      applicableAmount = cartItems
        .filter((item) => productIds.includes(item.productId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (applicableAmount === 0) {
        return {
          valid: false,
          error: "This promo code is not applicable to items in your cart",
          errorCode: PromoCodeErrors.PRODUCT_NOT_APPLICABLE,
          discount: 0,
        };
      }
      break;
    }

    default:
      applicableAmount = subtotal;
  }

  // 9. Calculate discount based on type
  switch (promoCode.type) {
    case "PERCENTAGE":
      discount = (applicableAmount * promoCode.value) / 100;
      break;

    case "FIXED_AMOUNT":
      discount = Math.min(promoCode.value, applicableAmount);
      break;

    case "FREE_SHIPPING":
      discount = shippingCost;
      break;

    default:
      discount = 0;
  }

  // 10. Apply max discount limit
  if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
    discount = promoCode.maxDiscount;
  }

  // 11. Round to 2 decimal places
  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    discount,
    promoCode: {
      id: promoCode.id,
      code: promoCode.code,
      type: promoCode.type,
      value: promoCode.value,
      scope,
    },
  };
}

/**
 * Record promo code usage after successful order
 */
export async function recordPromoCodeUsage(
  promoCodeId: string,
  orderId: string,
  userId: string,
  discountAmount: number
): Promise<void> {
  await prisma.$transaction([
    // Create usage record
    prisma.promoCodeUsage.create({
      data: {
        promoCodeId,
        orderId,
        userId,
        discountAmount,
      },
    }),
    // Increment usage count
    prisma.promoCode.update({
      where: { id: promoCodeId },
      data: {
        usageCount: { increment: 1 },
      },
    }),
  ]);
}

/**
 * Check if a promo code is valid (quick check without calculating discount)
 */
export async function isPromoCodeValid(code: string): Promise<boolean> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!promoCode || !promoCode.isActive) return false;

  const now = new Date();
  if (promoCode.validFrom && now < promoCode.validFrom) return false;
  if (promoCode.validTo && now > promoCode.validTo) return false;
  if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) return false;

  return true;
}

/**
 * Get promo code details for display
 */
export async function getPromoCodeDetails(code: string): Promise<{
  code: string;
  type: string;
  value: number;
  description: string;
} | null> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!promoCode) return null;

  let description = "";
  switch (promoCode.type) {
    case "PERCENTAGE":
      description = `${promoCode.value}% off`;
      break;
    case "FIXED_AMOUNT":
      description = `$${promoCode.value} off`;
      break;
    case "FREE_SHIPPING":
      description = "Free shipping";
      break;
  }

  if (promoCode.minOrderAmount) {
    description += ` on orders over $${promoCode.minOrderAmount}`;
  }

  return {
    code: promoCode.code,
    type: promoCode.type,
    value: promoCode.value,
    description,
  };
}

export default {
  validatePromoCode,
  recordPromoCodeUsage,
  isPromoCodeValid,
  getPromoCodeDetails,
  PromoCodeErrors,
};
