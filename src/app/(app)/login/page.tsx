import { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Connexion | Mientior',
  description: 'Connectez-vous à votre compte Mientior',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <AuthForm mode="login" redirectTo={params.redirectTo} />
    </div>
  )
}
