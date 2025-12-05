import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { 
  createTicket, 
  getUserTickets,
  ticketCategoryLabels 
} from '@/lib/support-service';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

// GET /api/support/tickets - Get user's tickets
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
    const status = searchParams.get('status') as TicketStatus | null;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { tickets, total } = await getUserTickets(session.user.id, {
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      tickets,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tickets' },
      { status: 500 }
    );
  }
}

// POST /api/support/tickets - Create new ticket
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
    const { subject, description, category, priority, orderId, attachments } = body;

    // Validation
    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: 'Sujet, description et catégorie sont requis' },
        { status: 400 }
      );
    }

    if (!Object.keys(ticketCategoryLabels).includes(category)) {
      return NextResponse.json(
        { error: 'Catégorie invalide' },
        { status: 400 }
      );
    }

    const ticket = await createTicket({
      userId: session.user.id,
      subject,
      description,
      category: category as TicketCategory,
      priority: priority as TicketPriority,
      orderId,
      attachments,
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Ticket créé avec succès',
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du ticket' },
      { status: 500 }
    );
  }
}
