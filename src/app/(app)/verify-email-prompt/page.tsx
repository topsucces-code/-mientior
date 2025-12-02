import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EmailVerificationPrompt } from '@/components/auth/email-verification-prompt'
import { getSession } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Verify Your Email | Mientior',
  description: 'Please verify your email address to continue',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function VerifyEmailPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams
  const session = await getSession()

  // If user is logged in and email is verified, redirect to home
  if (session?.user?.emailVerified) {
    redirect('/')
  }

  // Get email from query params or session
  const email = params.email || session?.user?.email

  if (!email) {
    // If no email is available, redirect to login
    redirect('/login')
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <EmailVerificationPrompt email={email} />
      </div>
    </div>
  )
}
