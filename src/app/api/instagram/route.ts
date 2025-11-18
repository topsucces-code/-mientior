import { NextResponse } from 'next/server'
import { fetchInstagramPosts } from '@/lib/instagram'

export const dynamic = 'force-dynamic' // Disable static optimization
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const result = await fetchInstagramPosts()

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (error) {
    console.error('Instagram API route error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Instagram posts',
        posts: [],
      },
      { status: 500 }
    )
  }
}
