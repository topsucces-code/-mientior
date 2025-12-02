/**
 * Instagram API Integration Utility
 * 
 * This module provides functions to interact with Instagram Graph API
 * for fetching and caching Instagram posts.
 */

export interface InstagramPost {
  id: string
  imageUrl: string
  caption: string
  likes: number
  comments: number
  permalink: string
  timestamp: string
}

export interface InstagramApiResponse {
  posts: InstagramPost[]
  cachedAt: string
  source: 'api' | 'cache' | 'fallback'
}

interface InstagramGraphApiPost {
  id: string
  caption?: string
  media_type: string
  media_url: string
  permalink: string
  like_count?: number
  comments_count?: number
  timestamp: string
}

interface InstagramGraphApiResponse {
  data: InstagramGraphApiPost[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}

// In-memory cache (consider using Redis for production)
let cachedPosts: InstagramPost[] | null = null
let cacheTimestamp: number | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Fetch Instagram posts from Graph API
 */
async function fetchFromInstagramApi(): Promise<InstagramPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID

  if (!accessToken || !userId) {
    throw new Error('Instagram credentials not configured')
  }

  const fields = 'id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp'
  const url = `https://graph.instagram.com/${userId}/media?fields=${fields}&access_token=${accessToken}&limit=12`

  const response = await fetch(url, {
    next: { revalidate: 3600 }, // Next.js cache for 1 hour
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorData
    try {
      errorData = JSON.parse(errorText)
    } catch {
      // ignore JSON parse error
    }

    // Handle specific error codes
    if (response.status === 400 || response.status === 401) {
      const code = errorData?.error?.code
      if (code === 190) {
        console.warn('Instagram Access Token invalid or expired. Using fallback data.')
        throw new Error('Instagram Token Invalid')
      }
    }

    console.error('Instagram API error:', response.status, errorText)
    throw new Error(`Instagram API error: ${response.status}`)
  }

  const data: InstagramGraphApiResponse = await response.json()

  // Transform API response to our format
  const posts: InstagramPost[] = data.data
    .filter((post) => post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM')
    .map((post) => ({
      id: post.id,
      imageUrl: post.media_url,
      caption: post.caption || '',
      likes: post.like_count || 0,
      comments: post.comments_count || 0,
      permalink: post.permalink,
      timestamp: post.timestamp,
    }))
    .slice(0, 12) // Limit to 12 posts

  return posts
}

/**
 * Get cached posts if still valid
 */
export function getCachedPosts(): InstagramPost[] | null {
  if (!cachedPosts || !cacheTimestamp) {
    return null
  }

  const now = Date.now()
  const cacheAge = now - cacheTimestamp

  if (cacheAge > CACHE_TTL) {
    // Cache expired
    return null
  }

  return cachedPosts
}

/**
 * Store posts in cache
 */
export function setCachedPosts(posts: InstagramPost[]): void {
  cachedPosts = posts
  cacheTimestamp = Date.now()
}

/**
 * Get fallback posts (static placeholder data)
 */
export function getFallbackPosts(): InstagramPost[] {
  return [
    {
      id: 'fallback-1',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
      caption: 'Découvrez notre nouvelle collection',
      likes: 1234,
      comments: 56,
      permalink: 'https://instagram.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'fallback-2',
      imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80',
      caption: 'Les tendances de la saison',
      likes: 2341,
      comments: 78,
      permalink: 'https://instagram.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'fallback-3',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80',
      caption: 'Offres exclusives',
      likes: 3456,
      comments: 92,
      permalink: 'https://instagram.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'fallback-4',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
      caption: 'Style et élégance',
      likes: 4567,
      comments: 123,
      permalink: 'https://instagram.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'fallback-5',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
      caption: 'Nouveautés du mois',
      likes: 5678,
      comments: 145,
      permalink: 'https://instagram.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'fallback-6',
      imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80',
      caption: 'Inspirations mode',
      likes: 6789,
      comments: 167,
      permalink: 'https://instagram.com',
      timestamp: new Date().toISOString(),
    },
  ]
}

/**
 * Fetch Instagram posts with caching and fallback
 */
export async function fetchInstagramPosts(): Promise<InstagramApiResponse> {
  // Check cache first
  const cached = getCachedPosts()
  if (cached) {
    return {
      posts: cached,
      cachedAt: new Date(cacheTimestamp!).toISOString(),
      source: 'cache',
    }
  }

  // Try to fetch from API
  try {
    const posts = await fetchFromInstagramApi()
    setCachedPosts(posts)

    return {
      posts,
      cachedAt: new Date().toISOString(),
      source: 'api',
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Instagram Token Invalid') {
      // Already logged warning above
    } else {
      console.error('Failed to fetch Instagram posts:', error)
    }

    // Return fallback data
    const fallbackPosts = getFallbackPosts()

    return {
      posts: fallbackPosts,
      cachedAt: new Date().toISOString(),
      source: 'fallback',
    }
  }
}

/**
 * Validate Instagram access token
 */
export async function validateAccessToken(): Promise<boolean> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    return false
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    )

    return response.ok
  } catch (error) {
    console.error('Failed to validate access token:', error)
    return false
  }
}

/**
 * Refresh long-lived access token (if applicable)
 * Note: This is for Instagram Basic Display API
 */
export async function refreshAccessToken(currentToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
    )

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Failed to refresh access token:', error)
    return null
  }
}
