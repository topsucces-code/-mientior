import './globals.css'
import React from 'react'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import Providers from './providers'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Mientior - Premium E-commerce Marketplace',
    template: '%s | Mientior',
  },
  description: 'Discover exceptional products at Mientior. Your premier destination for quality, variety, and unmatched customer service. Shop the latest trends and exclusive deals.',
  keywords: ['e-commerce', 'marketplace', 'shopping', 'online store', 'premium products'],
  authors: [{ name: 'Mientior' }],
  creator: 'Mientior',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Mientior - Premium E-commerce Marketplace',
    description: 'Discover exceptional products at Mientior. Your premier destination for quality, variety, and unmatched customer service.',
    siteName: 'Mientior',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mientior - Premium E-commerce Marketplace',
    description: 'Discover exceptional products at Mientior. Your premier destination for quality, variety, and unmatched customer service.',
    creator: '@mientior',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, poppins.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans text-anthracite-700 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
