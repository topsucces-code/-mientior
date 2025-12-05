import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { 
  getUserNotifications,
  markAllAsRead,
} from '@/lib/notifications-service';
import { NotificationType } from '@prisma/client';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as NotificationType | null;
    const readParam = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const read = readParam === null ? undefined : readParam === 'true';

    const result = await getUserNotifications(session.user.id, {
      type: type || undefined,
      read,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Mark all as read
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'mark_all_read') {
      const count = await markAllAsRead(session.user.id);
      return NextResponse.json({
        success: true,
        message: `${count} notifications marquées comme lues`,
        count,
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des notifications' },
      { status: 500 }
    );
  }
}
