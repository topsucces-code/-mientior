import { prisma } from '@/lib/prisma';
import { TicketStatus, TicketPriority, TicketCategory, Prisma } from '@prisma/client';

// Generate unique ticket number
export function generateTicketNumber(): string {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Create a new support ticket
export async function createTicket(data: {
  userId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  orderId?: string;
  vendorId?: string;
  attachments?: string[];
}) {
  const ticketNumber = generateTicketNumber();
  
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority || TicketPriority.MEDIUM,
      userId: data.userId,
      orderId: data.orderId,
      vendorId: data.vendorId,
      attachments: data.attachments,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      messages: true,
    },
  });

  // Create initial message from description
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      content: data.description,
      senderId: data.userId,
      senderName: `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email,
      isStaff: false,
    },
  });

  return ticket;
}

// Get tickets for a user
export async function getUserTickets(
  userId: string,
  options?: {
    status?: TicketStatus;
    limit?: number;
    offset?: number;
  }
) {
  const where: Prisma.SupportTicketWhereInput = {
    userId,
    ...(options?.status && { status: options.status }),
  };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 10,
      skip: options?.offset || 0,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { tickets, total };
}

// Get single ticket with messages
export async function getTicketById(ticketId: string, userId?: string) {
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      ...(userId && { userId }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      messages: {
        where: userId ? { isInternal: false } : {},
        orderBy: { createdAt: 'asc' },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return ticket;
}

// Add message to ticket
export async function addTicketMessage(data: {
  ticketId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  isStaff: boolean;
  isInternal?: boolean;
  attachments?: string[];
}) {
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: data.ticketId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      content: data.content,
      isStaff: data.isStaff,
      isInternal: data.isInternal || false,
      attachments: data.attachments,
    },
  });

  // Update ticket status and timestamps
  const updateData: Prisma.SupportTicketUpdateInput = {
    updatedAt: new Date(),
  };

  if (data.isStaff) {
    // Staff replied - update first response time if not set
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
      select: { firstResponseAt: true, status: true },
    });

    if (!ticket?.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    if (ticket?.status === TicketStatus.OPEN) {
      updateData.status = TicketStatus.IN_PROGRESS;
    } else if (ticket?.status === TicketStatus.WAITING_CUSTOMER) {
      updateData.status = TicketStatus.IN_PROGRESS;
    }
  } else {
    // Customer replied
    updateData.status = TicketStatus.WAITING_CUSTOMER;
  }

  await prisma.supportTicket.update({
    where: { id: data.ticketId },
    data: updateData,
  });

  return message;
}

// Update ticket status
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  _adminId?: string
) {
  const updateData: Prisma.SupportTicketUpdateInput = {
    status,
  };

  if (status === TicketStatus.RESOLVED) {
    updateData.resolvedAt = new Date();
  } else if (status === TicketStatus.CLOSED) {
    updateData.closedAt = new Date();
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  return ticket;
}

// Assign ticket to admin
export async function assignTicket(ticketId: string, adminId: string) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedToId: adminId,
      status: TicketStatus.IN_PROGRESS,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return ticket;
}

// Get ticket statistics for admin
export async function getTicketStats() {
  const [
    total,
    open,
    inProgress,
    waitingCustomer,
    resolved,
    closed,
    avgResponseTime,
  ] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
    prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
    prisma.supportTicket.count({ where: { status: TicketStatus.WAITING_CUSTOMER } }),
    prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
    prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
    prisma.$queryRaw<[{ avg: number }]>`
      SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))) as avg
      FROM support_tickets
      WHERE first_response_at IS NOT NULL
    `,
  ]);

  return {
    total,
    open,
    inProgress,
    waitingCustomer,
    resolved,
    closed,
    avgResponseTimeMinutes: avgResponseTime[0]?.avg ? Math.round(avgResponseTime[0].avg / 60) : null,
  };
}

// Category labels
export const ticketCategoryLabels: Record<TicketCategory, string> = {
  ORDER_ISSUE: 'Problème de commande',
  PAYMENT_ISSUE: 'Problème de paiement',
  DELIVERY_ISSUE: 'Problème de livraison',
  PRODUCT_QUESTION: 'Question sur un produit',
  RETURN_REFUND: 'Retour / Remboursement',
  ACCOUNT_ISSUE: 'Problème de compte',
  VENDOR_ISSUE: 'Problème avec un vendeur',
  TECHNICAL_ISSUE: 'Problème technique',
  OTHER: 'Autre',
};

// Status labels
export const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_CUSTOMER: 'En attente client',
  WAITING_VENDOR: 'En attente vendeur',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

// Priority labels
export const ticketPriorityLabels: Record<TicketPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};
