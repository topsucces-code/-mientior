/**
 * Contact Page
 * Contact form and support information
 */

import { Metadata } from 'next'
import { ContactPageClient } from './contact-client'

export const metadata: Metadata = {
  title: 'Contact Us | Mientior',
  description: 'Get in touch with our support team',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <ContactPageClient />
      </div>
    </div>
  )
}
