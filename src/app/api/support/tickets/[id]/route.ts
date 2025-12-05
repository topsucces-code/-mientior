import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { 
  getTicketById, 
  addTicketMessage,
  updateTicketStatus 
} from '@/lib/support-service';
import { TicketStatus } from '@prisma/client';

// GET /api/support/tickets/[id] - Get single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ticket = await getTicketById(id, session.user.id);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du ticket' },
      { status: 500 }
    );
  }
}

// POST /api/support/tickets/[id] - Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { content, attachments } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Le message est requis' },
        { status: 400 }
      );
    }

    // Verify ticket belongs to user
    const ticket = await getTicketById(id, session.user.id);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    const message = await addTicketMessage({
      ticketId: id,
      senderId: session.user.id,
      senderName: session.user.name || session.user.email || 'Client',
      content,
      isStaff: false,
      attachments,
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}

// PATCH /api/support/tickets/[id] - Update ticket (close)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Verify ticket belongs to user
    const ticket = await getTicketById(id, session.user.id);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    if (action === 'close') {
      await updateTicketStatus(id, TicketStatus.CLOSED);
      return NextResponse.json({
        success: true,
        message: 'Ticket fermé',
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du ticket' },
      { status: 500 }
    );
  }
}
