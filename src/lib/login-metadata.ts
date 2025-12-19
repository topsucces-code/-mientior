/**
 * Login Metadata Utilities
 * 
 * Handles extraction and storage of login metadata including IP address,
 * user agent, and timestamp updates for user sessions.
 */

import { prisma } from './prisma'

/**
 * Extract IP address from request headers
 * Checks multiple headers in order of preference:
 * 1. x-forwarded-for (proxy/load balancer)
 * 2. x-real-ip (alternative proxy header)
 * 3. request connection remote address
 */
export function extractIpAddress(request: Request): string | null {
  // Check x-forwarded-for header (may contain multiple IPs)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the list (client IP)
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0] || null
  }

  // Check x-real-ip header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // No IP found in headers
  return null
}

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(request: Request): string | null {
  return request.headers.get('user-agent')
}

/**
 * Update login metadata for a user session
 * 
 * @param userId - The user ID from Better Auth
 * @param sessionToken - The session token to update
 * @param request - The Next.js request object
 */
export async function updateLoginMetadata(
  userId: string,
  sessionToken: string,
  request: Request
): Promise<void> {
  const ipAddress = extractIpAddress(request)
  const userAgent = extractUserAgent(request)

  // Update the session with device info
  await prisma.sessions.update({
    where: { token: sessionToken },
    data: {
      ipAddress,
      userAgent,
      updatedAt: new Date(),
    },
  })

  // Update the users updatedAt timestamp
  await prisma.users.update({
    where: { id: userId },
    data: {
      updatedAt: new Date(),
    },
  })
}
