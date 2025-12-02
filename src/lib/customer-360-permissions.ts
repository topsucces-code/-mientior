import { Role } from '@prisma/client'
import { Permission } from './permissions'
import { hasPermission } from './rbac'

/**
 * Customer 360 data masking utilities
 * Masks sensitive customer data based on admin role and permissions
 */

export interface MaskingOptions {
  role: Role
  permissions: Permission[]
}

/**
 * Mask payment information based on role
 * VIEWER and SUPPORT roles see masked payment details
 * MANAGER, ADMIN, SUPER_ADMIN see full details
 */
export function maskPaymentInfo(
  paymentInfo: any,
  options: MaskingOptions
): any {
  // SUPER_ADMIN, ADMIN, and MANAGER can see full payment info
  if (
    options.role === 'SUPER_ADMIN' ||
    options.role === 'ADMIN' ||
    options.role === 'MANAGER'
  ) {
    return paymentInfo
  }

  // SUPPORT and VIEWER see masked payment info
  if (!paymentInfo) {
    return null
  }

  return {
    ...paymentInfo,
    // Mask card numbers - show only last 4 digits
    cardNumber: paymentInfo.cardNumber
      ? `****-****-****-${paymentInfo.cardNumber.slice(-4)}`
      : undefined,
    // Mask CVV completely
    cvv: paymentInfo.cvv ? '***' : undefined,
    // Keep other non-sensitive fields
    cardType: paymentInfo.cardType,
    expiryDate: paymentInfo.expiryDate,
    isDefault: paymentInfo.isDefault,
  }
}

/**
 * Mask customer contact information based on role
 * VIEWER role sees partially masked email and phone
 * All other roles see full contact info
 */
export function maskContactInfo(
  contactInfo: { email?: string; phone?: string },
  options: MaskingOptions
): { email?: string; phone?: string } {
  // Only VIEWER role gets masked contact info
  if (options.role !== 'VIEWER') {
    return contactInfo
  }

  return {
    email: contactInfo.email ? maskEmail(contactInfo.email) : undefined,
    phone: contactInfo.phone ? maskPhone(contactInfo.phone) : undefined,
  }
}

/**
 * Mask email address - show first 2 chars and domain
 * Example: john.doe@example.com -> jo***@example.com
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) {
    return email
  }

  const visibleChars = Math.min(2, localPart.length)
  const masked = localPart.substring(0, visibleChars) + '***'
  return `${masked}@${domain}`
}

/**
 * Mask phone number - show only last 4 digits
 * Example: +33612345678 -> ***-***-5678
 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) {
    return '***'
  }

  const lastFour = digits.slice(-4)
  return `***-***-${lastFour}`
}

/**
 * Mask customer notes based on role and note visibility
 * VIEWER role cannot see notes
 * SUPPORT can see notes but not edit
 * MANAGER, ADMIN, SUPER_ADMIN can see and edit all notes
 */
export function filterNotesByPermission(
  notes: any[],
  options: MaskingOptions
): any[] {
  // VIEWER cannot see notes at all
  if (options.role === 'VIEWER') {
    return []
  }

  // All other roles can see notes
  return notes
}

/**
 * Check if user can perform write operations on customer data
 */
export function canWriteCustomerData(options: MaskingOptions): boolean {
  return hasPermission(options.role, Permission.USERS_WRITE)
}

/**
 * Check if user can delete customer data
 */
export function canDeleteCustomerData(options: MaskingOptions): boolean {
  return hasPermission(options.role, Permission.USERS_DELETE)
}

/**
 * Check if user can view sensitive financial data
 */
export function canViewFinancialData(options: MaskingOptions): boolean {
  return (
    options.role === 'SUPER_ADMIN' ||
    options.role === 'ADMIN' ||
    options.role === 'MANAGER'
  )
}

/**
 * Check if user can modify customer segments
 */
export function canModifySegments(options: MaskingOptions): boolean {
  return hasPermission(options.role, Permission.SEGMENTS_WRITE)
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(options: MaskingOptions): boolean {
  return hasPermission(options.role, Permission.AUDIT_LOGS_READ)
}

/**
 * Mask customer 360 view based on role
 * Applies all masking rules to the complete customer 360 data
 */
export function maskCustomer360View(
  customer360: any,
  options: MaskingOptions
): any {
  if (!customer360) {
    return null
  }

  const masked = { ...customer360 }

  // Mask profile contact information
  if (masked.profile) {
    const contactInfo = maskContactInfo(
      {
        email: masked.profile.email,
        phone: masked.profile.phone,
      },
      options
    )
    masked.profile = {
      ...masked.profile,
      email: contactInfo.email,
      phone: contactInfo.phone,
    }
  }

  // Mask payment information
  if (masked.paymentMethods) {
    masked.paymentMethods = masked.paymentMethods.map((pm: any) =>
      maskPaymentInfo(pm, options)
    )
  }

  // Filter notes based on permissions
  if (masked.notes) {
    masked.notes = filterNotesByPermission(masked.notes, options)
  }

  // Hide financial metrics for VIEWER role
  if (options.role === 'VIEWER' && masked.metrics) {
    masked.metrics = {
      ...masked.metrics,
      lifetimeValue: undefined,
      totalSpent: undefined,
      averageOrderValue: undefined,
    }
  }

  return masked
}

/**
 * Get permission-based error message
 */
export function getPermissionDeniedMessage(
  action: string,
  requiredPermission?: Permission
): string {
  if (requiredPermission) {
    return `Access denied: ${action} requires ${requiredPermission} permission`
  }
  return `Access denied: You do not have permission to ${action}`
}

/**
 * Check if user has permission to access customer 360 dashboard
 */
export function canAccessCustomer360(options: MaskingOptions): boolean {
  return hasPermission(options.role, Permission.USERS_READ)
}

/**
 * Get allowed actions for a role on customer data
 */
export function getAllowedActions(options: MaskingOptions): {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canViewFinancials: boolean
  canAddNotes: boolean
  canManageTags: boolean
  canManageSegments: boolean
  canExport: boolean
  canViewAuditLogs: boolean
} {
  return {
    canView: hasPermission(options.role, Permission.USERS_READ),
    canEdit: hasPermission(options.role, Permission.USERS_WRITE),
    canDelete: hasPermission(options.role, Permission.USERS_DELETE),
    canViewFinancials: canViewFinancialData(options),
    canAddNotes: hasPermission(options.role, Permission.USERS_WRITE),
    canManageTags: hasPermission(options.role, Permission.USERS_WRITE),
    canManageSegments: hasPermission(options.role, Permission.SEGMENTS_WRITE),
    canExport: hasPermission(options.role, Permission.USERS_READ),
    canViewAuditLogs: hasPermission(options.role, Permission.AUDIT_LOGS_READ),
  }
}
