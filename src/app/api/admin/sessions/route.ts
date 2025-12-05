import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-admin';
import { Permission } from '@/lib/permissions';
import { cookies } from 'next/headers';

// GET /api/admin/sessions - List all sessions
export async function GET(_request: NextRequest) {
  try {
    await requirePermission(Permission.SETTINGS_WRITE);

    // Get current session token to mark it
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('session_token')?.value;

    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Mark current session
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.token === currentToken,
    }));

    return NextResponse.json(sessionsWithCurrent);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
