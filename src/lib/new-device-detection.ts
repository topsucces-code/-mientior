/**
 * New Device Login Detection
 * 
 * Detects when a user logs in from a new device or location
 * and sends a security alert email.
 * 
 * Requirements: 8.6, 9.5
 */

import { prisma } from './prisma'
import { sendSecurityAlertEmail } from './email'
import { extractIpAddress, extractUserAgent } from './login-metadata'

/**
 * Check if this is a new device/location for the user
 * and send security alert if needed
 * 
 * @param userId - The user ID
 * @param request - The request object
 * @param currentSessionToken - The current session token (to exclude from check)
 */
export async function detectAndAlertNewDevice(
  userId: string,
  request: Request,
  currentSessionToken: string
): Promise<void> {
  try {
    const ipAddress = extractIpAddress(request)
    const userAgent = extractUserAgent(request)

    if (!ipAddress || !userAgent) {
      // Can't detect without IP or user agent
      return
    }

    // Check if we've seen this IP address or user agent before
    const isNewDevice = await isNewDeviceOrLocation(
      userId,
      ipAddress,
      userAgent,
      currentSessionToken
    )

    if (isNewDevice) {
      // Get user info for email
      // User model has firstName/lastName, BetterAuthUser has name
      const [user, authUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true },
        }),
        prisma.betterAuthUser.findFirst({
          where: { id: userId },
          select: { name: true },
        }),
      ])

      if (!user) {
        console.error('User not found for new device alert:', userId)
        return
      }
      
      // Construct display name from available sources
      const displayName = authUser?.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User'

      // Parse device info from user agent
      const deviceInfo = parseDeviceInfo(userAgent)

      // Send security alert email (async, don't wait)
      sendSecurityAlertEmail({
        name: displayName,
        email: user.email,
        deviceInfo,
        location: `IP: ${ipAddress}`,
        ipAddress,
        timestamp: new Date().toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'long',
        }),
      }).catch((error) => {
        console.error('Failed to send security alert email:', error)
      })

      console.log(`New device login detected for user ${userId} from ${ipAddress}`)
    }
  } catch (error) {
    // Don't fail the login if detection fails
    console.error('Error in new device detection:', error)
  }
}

/**
 * Check if this is a new device or location for the user
 * 
 * @param userId - The user ID
 * @param ipAddress - The IP address
 * @param userAgent - The user agent string
 * @param currentSessionToken - The current session token to exclude
 * @returns true if this is a new device/location
 */
async function isNewDeviceOrLocation(
  userId: string,
  ipAddress: string,
  userAgent: string,
  currentSessionToken: string
): Promise<boolean> {
  // Look for any previous sessions with the same IP or user agent
  const previousSessions = await prisma.session.findMany({
    where: {
      userId,
      token: { not: currentSessionToken },
      OR: [
        { ipAddress },
        { userAgent },
      ],
    },
    take: 1,
  })

  // If we found any previous sessions with this IP or user agent, it's not new
  return previousSessions.length === 0
}

/**
 * Parse device information from user agent string
 * 
 * @param userAgent - The user agent string
 * @returns A human-readable device description
 */
function parseDeviceInfo(userAgent: string): string {
  if (!userAgent) {
    return 'Unknown Device'
  }

  // Detect mobile devices
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    if (userAgent.includes('Chrome')) return 'Mobile Chrome Browser'
    if (userAgent.includes('Safari')) return 'Mobile Safari Browser'
    if (userAgent.includes('Firefox')) return 'Mobile Firefox Browser'
    if (userAgent.includes('Edge')) return 'Mobile Edge Browser'
    return 'Mobile Browser'
  }

  // Detect tablets
  if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    if (userAgent.includes('Chrome')) return 'Tablet Chrome Browser'
    if (userAgent.includes('Safari')) return 'Tablet Safari Browser'
    return 'Tablet Browser'
  }

  // Desktop browsers
  if (userAgent.includes('Windows')) {
    if (userAgent.includes('Chrome')) return 'Windows PC - Chrome'
    if (userAgent.includes('Firefox')) return 'Windows PC - Firefox'
    if (userAgent.includes('Edge')) return 'Windows PC - Edge'
    return 'Windows PC'
  }

  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) {
    if (userAgent.includes('Chrome')) return 'Mac - Chrome'
    if (userAgent.includes('Safari')) return 'Mac - Safari'
    if (userAgent.includes('Firefox')) return 'Mac - Firefox'
    return 'Mac Computer'
  }

  if (userAgent.includes('Linux')) {
    if (userAgent.includes('Chrome')) return 'Linux - Chrome'
    if (userAgent.includes('Firefox')) return 'Linux - Firefox'
    return 'Linux Computer'
  }

  // Fallback
  if (userAgent.includes('Chrome')) return 'Desktop Chrome Browser'
  if (userAgent.includes('Safari')) return 'Desktop Safari Browser'
  if (userAgent.includes('Firefox')) return 'Desktop Firefox Browser'
  if (userAgent.includes('Edge')) return 'Desktop Edge Browser'

  return 'Desktop Browser'
}
