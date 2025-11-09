/**
 * API endpoint for trending searches
 */

import { NextResponse } from 'next/server'

// In production, this would be fetched from Redis or a database
// tracking actual user search queries
const TRENDING_SEARCHES = [
  'smartphone',
  'laptop',
  'casque audio',
  'montre connectée',
  'écouteurs sans fil',
  'tablette',
  'appareil photo',
  'clavier mécanique',
]

export async function GET() {
  try {
    return NextResponse.json({
      data: TRENDING_SEARCHES,
      success: true,
    })
  } catch (error) {
    console.error('Trending searches error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending searches', success: false },
      { status: 500 }
    )
  }
}

