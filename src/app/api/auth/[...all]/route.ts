import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { linkOAuthAccount } from '@/lib/oauth-account-linking'
import { NextRequest } from 'next/server'

// Get the base handlers from Better Auth
const { GET: betterAuthGET, POST: betterAuthPOST } = toNextJsHandler(auth.handler)

// Wrap GET handler to add OAuth account linking
export async function GET(request: NextRequest) {
  const response = await betterAuthGET(request)
  
  // Check if this is an OAuth callback
  const url = new URL(request.url)
  if (url.pathname.includes('/callback/')) {
    // After OAuth callback, check if we need to link accounts
    try {
      // Get the session to find the user
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      
      if (session?.user?.id && session?.user?.email) {
        // Link the OAuth account
        await linkOAuthAccount({
          authUserId: session.user.id,
          email: session.user.email,
          name: session.user.name || undefined,
          image: session.user.image || undefined,
        })
      }
    } catch (error) {
      // Log error but don't fail the OAuth flow
      console.error('[OAuth] Account linking error:', error)
    }
  }
  
  return response
}

// POST handler remains the same
export const POST = betterAuthPOST
