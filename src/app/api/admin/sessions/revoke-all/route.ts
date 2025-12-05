import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-admin';
import { Permission } from '@/lib/permissions';
import { cookies } from 'next/headers';

// POST /api/admin/sessions/revoke-all - Revoke all other sessions
export async function POST(_request: NextRequest) {
  try {
    await requirePermission(Permission.SETTINGS_WRITE);

    // Get current session token
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('session_token')?.value;

    if (!currentToken) {
      return NextResponse.json({ error: 'No current session found' }, { status: 400 });
    }

    // Delete all sessions except current
    const result = await prisma.session.deleteMany({
      where: {
        token: { not: currentToken },
      },
    });

    return NextResponse.json({ 
      success: true, 
      revokedCount: result.count 
    });
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}
