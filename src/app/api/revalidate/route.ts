import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (token !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (body.path) {
    revalidatePath(body.path)
  }

  if (body.tag) {
    revalidateTag(body.tag)
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
