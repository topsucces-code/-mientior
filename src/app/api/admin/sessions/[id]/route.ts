import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-admin';
import { Permission } from '@/lib/permissions';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/sessions/[id] - Revoke a session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(Permission.SETTINGS_WRITE);
    const { id } = await params;

    // Get current session token
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('session_token')?.value;

    // Find the session to revoke
    const session = await prisma.session.findUnique({ where: { id } });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Prevent revoking current session
    if (session.token === currentToken) {
      return NextResponse.json({ error: 'Cannot revoke current session' }, { status: 400 });
    }

    await prisma.session.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
