import { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Mot de passe oublié | Mientior',
  description: 'Réinitialisez votre mot de passe Mientior',
}

export default function ForgotPasswordPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <ForgotPasswordForm />
    </div>
  )
}
