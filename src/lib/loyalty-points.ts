/**
 * Loyalty Points System
 * Manages earning and redeeming loyalty points
 */

import { prisma } from "@/lib/prisma";

// Configuration
export const LOYALTY_CONFIG = {
  // Points earned per currency unit spent
  POINTS_PER_CURRENCY: 1, // 1 point per $1 spent
  
  // Points to currency conversion rate
  POINTS_TO_CURRENCY_RATE: 100, // 100 points = $1
  
  // Minimum points required for redemption
  MIN_REDEMPTION_POINTS: 500, // Minimum 500 points to redeem
  
  // Maximum percentage of order that can be paid with points
  MAX_POINTS_PERCENTAGE: 50, // Max 50% of order value
  
  // Bonus points for specific actions
  BONUS_POINTS: {
    FIRST_ORDER: 100,
    REVIEW: 50,
    REFERRAL: 200,
    BIRTHDAY: 100,
  },
  
  // Loyalty levels and their multipliers
  LEVELS: {
    BRONZE: { minPoints: 0, multiplier: 1.0 },
    SILVER: { minPoints: 1000, multiplier: 1.25 },
    GOLD: { minPoints: 5000, multiplier: 1.5 },
    PLATINUM: { minPoints: 10000, multiplier: 2.0 },
  },
};

// Types
export interface LoyaltyPointsResult {
  success: boolean;
  error?: string;
  pointsUsed?: number;
  discountAmount?: number;
  remainingPoints?: number;
}

export interface PointsEarnedResult {
  success: boolean;
  pointsEarned: number;
  bonusPoints: number;
  totalPoints: number;
  newLevel?: string;
}

/**
 * Get user's current loyalty points and level
 */
export async function getUserLoyaltyInfo(userId: string): Promise<{
  points: number;
  level: string;
  multiplier: number;
  nextLevel?: string;
  pointsToNextLevel?: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      loyaltyPoints: true,
      loyaltyLevel: true,
    },
  });

  if (!user) {
    return {
      points: 0,
      level: "BRONZE",
      multiplier: 1.0,
    };
  }

  const points = user.loyaltyPoints || 0;
  const level = user.loyaltyLevel || "BRONZE";
  const levelConfig = LOYALTY_CONFIG.LEVELS[level as keyof typeof LOYALTY_CONFIG.LEVELS];
  const multiplier = levelConfig?.multiplier || 1.0;

  // Calculate next level
  const levels = Object.entries(LOYALTY_CONFIG.LEVELS);
  const currentLevelIndex = levels.findIndex(([name]) => name === level);
  const nextLevelEntry = levels[currentLevelIndex + 1];

  return {
    points,
    level,
    multiplier,
    nextLevel: nextLevelEntry?.[0],
    pointsToNextLevel: nextLevelEntry ? nextLevelEntry[1].minPoints - points : undefined,
  };
}

/**
 * Calculate loyalty level based on total points earned
 */
export function calculateLoyaltyLevel(totalPointsEarned: number): string {
  const levels = Object.entries(LOYALTY_CONFIG.LEVELS).reverse();
  
  for (const [name, config] of levels) {
    if (totalPointsEarned >= config.minPoints) {
      return name;
    }
  }
  
  return "BRONZE";
}

/**
 * Redeem loyalty points for a discount
 */
export async function redeemLoyaltyPoints(
  userId: string,
  pointsToRedeem: number,
  orderSubtotal: number
): Promise<LoyaltyPointsResult> {
  // Get user's current points
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      loyaltyPoints: true,
    },
  });

  if (!user) {
    return {
      success: false,
      error: "User not found",
    };
  }

  const currentPoints = user.loyaltyPoints || 0;

  // Check if user has enough points
  if (pointsToRedeem > currentPoints) {
    return {
      success: false,
      error: `Insufficient points. You have ${currentPoints} points.`,
    };
  }

  // Check minimum redemption
  if (pointsToRedeem < LOYALTY_CONFIG.MIN_REDEMPTION_POINTS) {
    return {
      success: false,
      error: `Minimum ${LOYALTY_CONFIG.MIN_REDEMPTION_POINTS} points required for redemption`,
    };
  }

  // Calculate discount amount
  let discountAmount = pointsToRedeem / LOYALTY_CONFIG.POINTS_TO_CURRENCY_RATE;

  // Check max percentage limit
  const maxDiscount = orderSubtotal * (LOYALTY_CONFIG.MAX_POINTS_PERCENTAGE / 100);
  if (discountAmount > maxDiscount) {
    discountAmount = maxDiscount;
    pointsToRedeem = Math.floor(discountAmount * LOYALTY_CONFIG.POINTS_TO_CURRENCY_RATE);
  }

  // Round discount to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;

  // Deduct points from user
  await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyPoints: { decrement: pointsToRedeem },
    },
  });

  return {
    success: true,
    pointsUsed: pointsToRedeem,
    discountAmount,
    remainingPoints: currentPoints - pointsToRedeem,
  };
}

/**
 * Award loyalty points for an order
 */
export async function awardOrderPoints(
  userId: string,
  orderTotal: number,
  isFirstOrder: boolean = false
): Promise<PointsEarnedResult> {
  // Get user's current info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      loyaltyPoints: true,
      loyaltyLevel: true,
      totalSpent: true,
    },
  });

  if (!user) {
    return {
      success: false,
      pointsEarned: 0,
      bonusPoints: 0,
      totalPoints: 0,
    };
  }

  const currentLevel = user.loyaltyLevel || "BRONZE";
  const levelConfig = LOYALTY_CONFIG.LEVELS[currentLevel as keyof typeof LOYALTY_CONFIG.LEVELS];
  const multiplier = levelConfig?.multiplier || 1.0;

  // Calculate base points
  const basePoints = Math.floor(orderTotal * LOYALTY_CONFIG.POINTS_PER_CURRENCY);
  const pointsEarned = Math.floor(basePoints * multiplier);

  // Calculate bonus points
  let bonusPoints = 0;
  if (isFirstOrder) {
    bonusPoints += LOYALTY_CONFIG.BONUS_POINTS.FIRST_ORDER;
  }

  const totalPointsToAdd = pointsEarned + bonusPoints;
  const newTotalPoints = (user.loyaltyPoints || 0) + totalPointsToAdd;

  // Calculate new level based on total spent
  const newTotalSpent = (user.totalSpent || 0) + orderTotal;
  const estimatedTotalPointsEarned = Math.floor(newTotalSpent * LOYALTY_CONFIG.POINTS_PER_CURRENCY);
  const newLevel = calculateLoyaltyLevel(estimatedTotalPointsEarned);

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyPoints: { increment: totalPointsToAdd },
      loyaltyLevel: newLevel,
    },
  });

  return {
    success: true,
    pointsEarned,
    bonusPoints,
    totalPoints: newTotalPoints,
    newLevel: newLevel !== currentLevel ? newLevel : undefined,
  };
}

/**
 * Award bonus points for specific actions
 */
export async function awardBonusPoints(
  userId: string,
  action: keyof typeof LOYALTY_CONFIG.BONUS_POINTS
): Promise<{ success: boolean; pointsAwarded: number }> {
  const points = LOYALTY_CONFIG.BONUS_POINTS[action];

  if (!points) {
    return { success: false, pointsAwarded: 0 };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyPoints: { increment: points },
    },
  });

  return { success: true, pointsAwarded: points };
}

/**
 * Calculate how many points would be earned for an order
 */
export async function calculatePointsPreview(
  userId: string,
  orderTotal: number
): Promise<{
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  level: string;
}> {
  const loyaltyInfo = await getUserLoyaltyInfo(userId);

  const basePoints = Math.floor(orderTotal * LOYALTY_CONFIG.POINTS_PER_CURRENCY);
  const totalPoints = Math.floor(basePoints * loyaltyInfo.multiplier);

  return {
    basePoints,
    multiplier: loyaltyInfo.multiplier,
    totalPoints,
    level: loyaltyInfo.level,
  };
}

/**
 * Calculate discount amount from points
 */
export function calculateDiscountFromPoints(points: number): number {
  return Math.round((points / LOYALTY_CONFIG.POINTS_TO_CURRENCY_RATE) * 100) / 100;
}

/**
 * Calculate points needed for a specific discount
 */
export function calculatePointsNeeded(discountAmount: number): number {
  return Math.ceil(discountAmount * LOYALTY_CONFIG.POINTS_TO_CURRENCY_RATE);
}

/**
 * Get loyalty points history for a user
 */
export async function getPointsHistory(
  userId: string,
  limit: number = 20
): Promise<Array<{
  type: "EARNED" | "REDEEMED" | "BONUS" | "EXPIRED";
  points: number;
  description: string;
  createdAt: Date;
  orderId?: string;
}>> {
  // This would typically query a points_transactions table
  // For now, we'll return mock data based on orders
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      total: true,
      createdAt: true,
    },
  });

  return orders.map((order) => ({
    type: "EARNED" as const,
    points: Math.floor(order.total * LOYALTY_CONFIG.POINTS_PER_CURRENCY),
    description: `Points earned from order ${order.orderNumber}`,
    createdAt: order.createdAt,
    orderId: order.id,
  }));
}

export default {
  LOYALTY_CONFIG,
  getUserLoyaltyInfo,
  calculateLoyaltyLevel,
  redeemLoyaltyPoints,
  awardOrderPoints,
  awardBonusPoints,
  calculatePointsPreview,
  calculateDiscountFromPoints,
  calculatePointsNeeded,
  getPointsHistory,
};
