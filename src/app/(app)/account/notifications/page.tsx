import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import NotificationsPageClient from './notifications-client';

export const metadata: Metadata = {
  title: 'Notifications - Mientior',
  description: 'Gérez vos notifications et alertes',
};

export default async function NotificationsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login?redirect=/account/notifications');
  }

  return <NotificationsPageClient />;
}
