import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import SupportClient from './support-client';

export const metadata: Metadata = {
  title: 'Support - Mientior',
  description: 'Centre de support et assistance client',
};

export default async function SupportPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login?redirect=/support');
  }

  return <SupportClient user={session.user} />;
}
