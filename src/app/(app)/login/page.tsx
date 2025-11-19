import { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Connexion | Mientior',
  description: 'Connectez-vous à votre compte Mientior',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string }
}) {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <AuthForm mode="login" redirectTo={searchParams.redirectTo} />
    </div>
  )
}
