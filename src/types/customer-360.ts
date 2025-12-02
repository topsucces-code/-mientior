/**
 * Customer 360 Dashboard Type Definitions
 * 
 * These types define the data structures for the Customer 360 Dashboard feature,
 * providing a comprehensive view of customer data across all touchpoints.
 */

import { ChurnRiskLevel, LoyaltyLevel } from '@prisma/client'

// ============================================================================
// Core Customer 360 Types
// ============================================================================

export interface Customer360View {
  profile: CustomerProfile
  metrics: CustomerMetrics
  healthScore: HealthScore
  churnRisk: ChurnRisk
  segments: Segment[]
  tags: Tag[]
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  registrationDate: Date
  accountStatus: string
  addresses: Address[]
  loyaltyLevel: LoyaltyLevel
}

export interface Address {
  id: string
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface CustomerMetrics {
  lifetimeValue: number
  totalOrders: number
  averageOrderValue: number
  totalSpent: number
  daysSinceLastPurchase: number
  purchaseFrequency: number
  customerTenure: number
}

export interface OrderMetrics {
  orders: OrderSummary[]
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
}

export interface OrderSummary {
  id: string
  orderNumber: string
  date: Date
  status: string
  total: number
  itemsCount: number
}

// ============================================================================
// Health Score Types
// ============================================================================

export interface HealthScore {
  score: number // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor'
  factors: {
    purchase: number
    engagement: number
    support: number
    recency: number
  }
  recommendations: string[]
}

// ============================================================================
// Churn Risk Types
// ============================================================================

export interface ChurnRisk {
  level: ChurnRiskLevel
  score: number // 0-100
  factors: {
    daysSinceLastPurchase: number
    engagementDecline: number
    supportIssues: number
  }
  retentionStrategies: string[]
}

// ============================================================================
// Loyalty Types
// ============================================================================

export interface LoyaltyStatus {
  tier: LoyaltyLevel
  pointsBalance: number
  lifetimePoints: number
  pointsToNextTier?: number
  referralCode: string
  referralCount: number
  recentTransactions: PointsTransaction[]
  expiringPoints?: {
    amount: number
    expiryDate: Date
  }
}

export interface PointsTransaction {
  id: string
  type: 'earned' | 'redeemed' | 'expired'
  amount: number
  description: string
  date: Date
}

// ============================================================================
// Marketing Types
// ============================================================================

export interface MarketingEngagement {
  emailOptIn: boolean
  smsOptIn: boolean
  pushOptIn: boolean
  campaigns: Campaign[]
  openRate: number
  clickRate: number
  lastEmailOpened?: Date
  lastCampaignClicked?: Date
  segments: string[]
}

export interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'push'
  sentDate: Date
  opened: boolean
  clicked: boolean
}

// ============================================================================
// Support Types
// ============================================================================

export interface SupportHistory {
  tickets: SupportTicket[]
  totalTickets: number
  averageResolutionTime: number
  openTickets: number
}

export interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  resolvedAt?: Date
}

// ============================================================================
// Timeline Types
// ============================================================================

export interface TimelineEvent {
  id: string
  type: 'order' | 'support' | 'loyalty' | 'marketing' | 'account'
  title: string
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface TimelineResponse {
  events: TimelineEvent[]
  hasMore: boolean
}

// ============================================================================
// Notes and Tags Types
// ============================================================================

export interface CustomerNote {
  id: string
  content: string
  author: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  color: string
  description?: string
}

export interface Segment {
  id: string
  name: string
  description?: string
  isAutomatic: boolean
  assignedAt: Date
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface BehavioralAnalytics {
  topCategories: CategoryStat[]
  sessionStats: SessionStats
  deviceBreakdown: DeviceStats
  shoppingTimes: TimeStats
}

export interface CategoryStat {
  categoryId: string
  categoryName: string
  viewCount: number
  purchaseCount: number
  revenue: number
}

export interface SessionStats {
  totalSessions: number
  averageDuration: number // in seconds
  averagePageViews: number
  bounceRate: number
}

export interface DeviceStats {
  mobile: number
  desktop: number
  tablet: number
}

export interface TimeStats {
  dayOfWeek: Record<string, number>
  hourOfDay: Record<string, number>
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'mobile_money'
  last4: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface PaymentTransaction {
  id: string
  amount: number
  date: Date
  status: 'success' | 'failed' | 'refunded'
  paymentMethod: string
  orderId?: string
}

export interface BillingHistory {
  paymentMethods: PaymentMethod[]
  transactions: PaymentTransaction[]
  totalSuccessful: number
  totalRefunded: number
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface CustomerSearchParams {
  query?: string
  segments?: string[]
  loyaltyTiers?: LoyaltyLevel[]
  tags?: string[]
  registrationDateFrom?: Date
  registrationDateTo?: Date
  lastPurchaseDateFrom?: Date
  lastPurchaseDateTo?: Date
  clvMin?: number
  clvMax?: number
  orderCountMin?: number
  orderCountMax?: number
  page?: number
  limit?: number
}

export interface CustomerSearchResult {
  customers: CustomerProfile[]
  total: number
  page: number
  limit: number
}

// ============================================================================
// Comparison Types
// ============================================================================

export interface CustomerComparison {
  customers: CustomerProfile[]
  metrics: CustomerMetrics[]
  segmentOverlap: string[]
  differences: ComparisonDifference[]
}

export interface ComparisonDifference {
  metric: string
  values: number[]
  variance: number
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportOptions {
  format: 'pdf' | 'csv'
  includeOrders?: boolean
  includeLoyalty?: boolean
  includeMarketing?: boolean
  includeSupport?: boolean
  includeAnalytics?: boolean
}

export interface ExportMetadata {
  exportedAt: Date
  exportedBy: {
    id: string
    name: string
  }
  customerId: string
  format: 'pdf' | 'csv'
}

// ============================================================================
// Quick Actions Types
// ============================================================================

export interface QuickAction {
  type: 'send_email' | 'create_ticket' | 'adjust_points' | 'add_note'
  label: string
  icon: string
  requiresInput: boolean
}

export interface SendEmailAction {
  to: string
  subject: string
  body: string
  template?: string
}

export interface CreateTicketAction {
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface AdjustPointsAction {
  amount: number
  reason: string
  type: 'add' | 'subtract'
}

export interface AddNoteAction {
  content: string
}

// ============================================================================
// Real-time Update Types
// ============================================================================

export interface Customer360UpdateData {
  customerId: string
  updateType: 'order' | 'loyalty' | 'support' | 'profile' | 'notes' | 'tags'
  timestamp: Date
  data: Record<string, any>
}
