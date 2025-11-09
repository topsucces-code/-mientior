'use client'

import * as React from 'react'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, CreditCard, Lock, Truck, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RippleButton } from '@/components/ui/ripple-button'

const footerLinks = {
  shop: [
    { href: '/products', label: 'All Products' },
    { href: '/categories', label: 'Categories' },
    { href: '/deals', label: 'Deals & Offers' },
    { href: '/new-arrivals', label: 'New Arrivals' },
    { href: '/bestsellers', label: 'Bestsellers' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/careers', label: 'Careers' },
    { href: '/blog', label: 'Blog' },
    { href: '/press', label: 'Press Kit' },
    { href: '/sustainability', label: 'Sustainability' },
  ],
  support: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/faq', label: 'FAQ' },
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns & Exchanges' },
    { href: '/track-order', label: 'Track Order' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
    { href: '/accessibility', label: 'Accessibility' },
  ],
}

const socialLinks = [
  { href: 'https://facebook.com', label: 'Facebook', icon: Facebook },
  { href: 'https://twitter.com', label: 'Twitter', icon: Twitter },
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
  { href: 'https://youtube.com', label: 'YouTube', icon: Youtube },
]

const trustBadges = [
  { icon: Lock, text: 'Secure Payment' },
  { icon: Truck, text: 'Fast Delivery' },
  { icon: RefreshCw, text: 'Easy Returns' },
  { icon: CreditCard, text: 'Flexible Payment' },
]

export default function Footer() {
  const [email, setEmail] = React.useState('')
  const [subscribeStatus, setSubscribeStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSubscribeStatus('loading')

    // TODO: Implement newsletter subscription
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubscribeStatus('success')
      setEmail('')
      setTimeout(() => setSubscribeStatus('idle'), 3000)
    } catch (error) {
      setSubscribeStatus('error')
      setTimeout(() => setSubscribeStatus('idle'), 3000)
    }
  }

  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      {/* Main Content Grid */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12 md:px-6 md:py-16 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link href="/" className="mb-4 inline-block font-display text-3xl font-bold text-white">
                Mientior
              </Link>
              <p className="mb-6 text-sm leading-relaxed text-blue-100">
                Your premier destination for quality products and exceptional service. We bring you the best selection with unmatched customer care.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 text-sm">
                <a
                  href="mailto:support@mientior.com"
                  className="flex items-center gap-3 text-blue-100 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>support@mientior.com</span>
                </a>
                <a
                  href="tel:+1234567890"
                  className="flex items-center gap-3 text-blue-100 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>+1 (234) 567-890</span>
                </a>
                <div className="flex items-center gap-3 text-blue-100">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>123 Commerce St, Business District</span>
                </div>
              </div>
            </div>

            {/* Shop Links */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Shop</h3>
              <ul className="space-y-2.5">
                {footerLinks.shop.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-blue-100 transition-colors hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Company</h3>
              <ul className="space-y-2.5">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-blue-100 transition-colors hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Support</h3>
              <ul className="space-y-2.5">
                {footerLinks.support.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-blue-100 transition-colors hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-lg font-semibold text-white">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-sm text-blue-100">
                Get exclusive deals, new product launches, and insider tips
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={cn(
                  'flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-blue-200',
                  'focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20',
                  'backdrop-blur-sm transition-all'
                )}
                disabled={subscribeStatus === 'loading'}
              />
              <RippleButton
                type="submit"
                variant="gradient"
                disabled={subscribeStatus === 'loading'}
                className="px-6"
              >
                {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </RippleButton>
            </form>
          </div>

          {/* Subscribe Status Messages */}
          {subscribeStatus === 'success' && (
            <p className="mt-3 text-center text-sm text-green-300">
              Thanks for subscribing! Check your email for confirmation.
            </p>
          )}
          {subscribeStatus === 'error' && (
            <p className="mt-3 text-center text-sm text-red-300">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {trustBadges.map((badge) => {
              const Icon = badge.icon
              return (
                <div
                  key={badge.text}
                  className="flex items-center gap-3 rounded-lg bg-white/5 p-4 backdrop-blur-sm"
                >
                  <Icon className="h-6 w-6 flex-shrink-0 text-aurore-400" />
                  <span className="text-sm font-medium text-white">{badge.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white/5">
        <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Copyright */}
            <p className="text-sm text-blue-100">
              © {new Date().getFullYear()} Mientior. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-100">We accept:</span>
              <div className="flex gap-2">
                {/* Payment icons placeholder */}
                <div className="h-6 w-10 rounded bg-white/20 flex items-center justify-center text-[8px] font-bold">VISA</div>
                <div className="h-6 w-10 rounded bg-white/20 flex items-center justify-center text-[8px] font-bold">MC</div>
                <div className="h-6 w-10 rounded bg-white/20 flex items-center justify-center text-[8px] font-bold">AMEX</div>
                <div className="h-6 w-10 rounded bg-white/20 flex items-center justify-center text-[8px] font-bold">PAY</div>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 border-t border-white/10 pt-4 text-xs text-blue-200 md:justify-start">
            {footerLinks.legal.map((link, index) => (
              <React.Fragment key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white hover:underline">
                  {link.label}
                </Link>
                {index < footerLinks.legal.length - 1 && <span className="text-white/30">•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
