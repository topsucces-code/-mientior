import { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Créer un compte | Mientior',
  description: 'Créez votre compte Mientior pour commencer vos achats',
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <AuthForm mode="register" redirectTo={params.redirectTo} />
    </div>
  )
}
