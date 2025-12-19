/**
 * Legal Page
 * Terms of Service, Privacy Policy, and Legal Information
 */

import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legal Information | Mientior',
  description: 'Terms of Service, Privacy Policy, and Legal Information',
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-anthracite-700">Legal Information</h1>
          <p className="mt-2 text-nuanced-600">
            Important legal documents and policies
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <a href="#terms" className="rounded-lg border border-platinum-200 bg-white p-6 text-center transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-anthracite-700">Terms of Service</h3>
            <p className="mt-1 text-sm text-nuanced-600">Rules for using our platform</p>
          </a>
          <a href="#privacy" className="rounded-lg border border-platinum-200 bg-white p-6 text-center transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-anthracite-700">Privacy Policy</h3>
            <p className="mt-1 text-sm text-nuanced-600">How we handle your data</p>
          </a>
          <a href="#cookies" className="rounded-lg border border-platinum-200 bg-white p-6 text-center transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-anthracite-700">Cookie Policy</h3>
            <p className="mt-1 text-sm text-nuanced-600">Our use of cookies</p>
          </a>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Terms of Service */}
          <section id="terms" className="rounded-lg border border-platinum-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-anthracite-700">Terms of Service</h2>
            <p className="mt-2 text-sm text-nuanced-500">Last updated: January 2024</p>

            <div className="mt-6 space-y-6 text-nuanced-600">
              <div>
                <h3 className="font-semibold text-anthracite-700">1. Acceptance of Terms</h3>
                <p className="mt-2">
                  By accessing and using Mientior, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by these terms, 
                  please do not use this service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">2. Use of Service</h3>
                <p className="mt-2">
                  You agree to use the service only for lawful purposes and in accordance with 
                  these Terms. You agree not to use the service in any way that violates any 
                  applicable local, national, or international law.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">3. User Accounts</h3>
                <p className="mt-2">
                  When you create an account with us, you must provide accurate and complete 
                  information. You are responsible for safeguarding your password and for any 
                  activities or actions under your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">4. Products and Vendors</h3>
                <p className="mt-2">
                  Mientior acts as a marketplace connecting buyers with vendors. While we verify 
                  our vendors, we are not responsible for the quality, safety, or legality of 
                  items listed by vendors.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">5. Payments and Refunds</h3>
                <p className="mt-2">
                  All payments are processed securely through our payment partners. Refund 
                  policies vary by vendor and product. Please review the specific return policy 
                  before making a purchase.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section id="privacy" className="rounded-lg border border-platinum-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-anthracite-700">Privacy Policy</h2>
            <p className="mt-2 text-sm text-nuanced-500">Last updated: January 2024</p>

            <div className="mt-6 space-y-6 text-nuanced-600">
              <div>
                <h3 className="font-semibold text-anthracite-700">1. Information We Collect</h3>
                <p className="mt-2">
                  We collect information you provide directly to us, such as when you create 
                  an account, make a purchase, or contact us for support. This may include 
                  your name, email address, postal address, phone number, and payment information.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">2. How We Use Your Information</h3>
                <p className="mt-2">We use the information we collect to:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Process transactions and send related information</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Respond to your comments and questions</li>
                  <li>Analyze usage patterns to improve our service</li>
                  <li>Detect and prevent fraud</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">3. Information Sharing</h3>
                <p className="mt-2">
                  We do not sell your personal information. We may share your information with 
                  vendors to fulfill orders, with payment processors to complete transactions, 
                  and with service providers who assist in our operations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">4. Your Rights (GDPR)</h3>
                <p className="mt-2">
                  If you are in the European Economic Area, you have the right to access, 
                  correct, or delete your personal data. You may also object to processing 
                  or request data portability. Contact us to exercise these rights.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">5. Data Security</h3>
                <p className="mt-2">
                  We implement appropriate technical and organizational measures to protect 
                  your personal data against unauthorized access, alteration, disclosure, 
                  or destruction.
                </p>
              </div>
            </div>
          </section>

          {/* Cookie Policy */}
          <section id="cookies" className="rounded-lg border border-platinum-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-anthracite-700">Cookie Policy</h2>
            <p className="mt-2 text-sm text-nuanced-500">Last updated: January 2024</p>

            <div className="mt-6 space-y-6 text-nuanced-600">
              <div>
                <h3 className="font-semibold text-anthracite-700">What Are Cookies?</h3>
                <p className="mt-2">
                  Cookies are small text files stored on your device when you visit a website. 
                  They help us provide you with a better experience by remembering your 
                  preferences and understanding how you use our site.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">Types of Cookies We Use</h3>
                <ul className="mt-2 space-y-3">
                  <li>
                    <strong>Essential Cookies:</strong> Required for the website to function 
                    properly (e.g., shopping cart, authentication).
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand how visitors 
                    interact with our website.
                  </li>
                  <li>
                    <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements 
                    and track campaign effectiveness.
                  </li>
                  <li>
                    <strong>Preference Cookies:</strong> Remember your settings and preferences 
                    (e.g., language, currency).
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-anthracite-700">Managing Cookies</h3>
                <p className="mt-2">
                  You can control and manage cookies through your browser settings. Please note 
                  that disabling certain cookies may affect the functionality of our website.
                </p>
              </div>
            </div>
          </section>

          {/* Company Information */}
          <section className="rounded-lg border border-platinum-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-anthracite-700">Company Information</h2>

            <div className="mt-6 space-y-4 text-nuanced-600">
              <p><strong>Company Name:</strong> Mientior SARL</p>
              <p><strong>Registration Number:</strong> CI-ABJ-2024-B-12345</p>
              <p><strong>Tax ID:</strong> 1234567890123</p>
              <p><strong>Registered Address:</strong> Plateau, Rue du Commerce, Abidjan, Côte d'Ivoire</p>
              <p><strong>Email:</strong> legal@mientior.com</p>
              <p><strong>Phone:</strong> +225 27 20 00 00 00</p>
            </div>
          </section>

          {/* Contact */}
          <div className="text-center">
            <p className="text-nuanced-600">
              If you have any questions about these legal documents, please{' '}
              <Link href="/contact" className="text-orange-600 hover:underline">
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
