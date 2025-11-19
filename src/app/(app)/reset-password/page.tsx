import { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe | Mientior',
  description: 'Réinitialisez votre mot de passe Mientior',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <ResetPasswordForm token={params.token || ''} />
    </div>
  )
}
