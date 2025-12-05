import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import TicketDetail from './ticket-detail';

export const metadata: Metadata = {
  title: 'Détail du ticket - Mientior',
  description: 'Détails et historique de votre ticket de support',
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  
  if (!session?.user) {
    redirect(`/login?redirect=/support/tickets/${id}`);
  }

  // Fetch ticket data
  let ticket;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/support/tickets/${id}`,
      {
        headers: {
          cookie: `better-auth.session_token=${session.session.token}`,
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      throw new Error('Failed to fetch ticket');
    }

    ticket = await res.json();
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw new Error('Failed to load ticket');
  }

  // Redirect if user doesn't have access to this ticket
  if (ticket.userId !== session.user.id) {
    redirect('/support');
  }

  return <TicketDetail initialTicket={ticket} user={session.user} />;
}
