import { EmailVerificationBanner } from '@/components/auth/email-verification-banner'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <EmailVerificationBanner />
      </div>
      {children}
    </>
  )
}
