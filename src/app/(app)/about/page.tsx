/**
 * About Page
 * Company information and story
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Users, Globe, Heart, ShieldCheck, Truck, Headphones, Leaf } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Mientior',
  description: 'Learn about our story, mission, and the team behind Mientior',
}

const stats = [
  { label: 'Happy Customers', value: '50K+' },
  { label: 'Products', value: '10K+' },
  { label: 'Vendors', value: '500+' },
  { label: 'Countries', value: '25+' },
]

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'Every decision we make starts with our customers in mind.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Quality',
    description: 'We partner only with verified vendors who meet our quality standards.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Committed to eco-friendly practices and sustainable products.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Connecting buyers and sellers across Africa and beyond.',
  },
]

const team = [
  { name: 'Sarah Johnson', role: 'CEO & Founder', image: '/images/team/ceo.jpg' },
  { name: 'Michael Chen', role: 'CTO', image: '/images/team/cto.jpg' },
  { name: 'Amara Diallo', role: 'Head of Operations', image: '/images/team/ops.jpg' },
  { name: 'David Okonkwo', role: 'Head of Vendors', image: '/images/team/vendors.jpg' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-anthracite-800 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">About Mientior</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-platinum-300">
            Empowering commerce across Africa by connecting buyers with trusted vendors 
            and quality products.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-platinum-200 bg-platinum-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-orange-600 md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-nuanced-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-anthracite-700">Our Story</h2>
              <div className="mt-6 space-y-4 text-nuanced-600">
                <p>
                  Founded in 2020, Mientior was born from a simple idea: make quality products 
                  accessible to everyone across Africa while empowering local vendors to reach 
                  a global audience.
                </p>
                <p>
                  What started as a small marketplace has grown into a thriving ecosystem 
                  connecting thousands of buyers with hundreds of trusted vendors. We believe 
                  in the power of commerce to transform lives and communities.
                </p>
                <p>
                  Today, we continue to innovate and expand, always keeping our core mission 
                  at heart: to be the most trusted and customer-centric marketplace in Africa.
                </p>
              </div>
            </div>
            <div className="relative h-80 overflow-hidden rounded-2xl bg-platinum-200 lg:h-96">
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-24 w-24 text-platinum-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-platinum-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-anthracite-700">Our Values</h2>
            <p className="mx-auto mt-4 max-w-2xl text-nuanced-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex rounded-lg bg-orange-100 p-3">
                  <value.icon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-anthracite-700">{value.title}</h3>
                <p className="mt-2 text-sm text-nuanced-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-anthracite-700">Why Choose Mientior?</h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-anthracite-700">Verified Vendors</h3>
              <p className="mt-2 text-nuanced-600">
                Every vendor is thoroughly vetted to ensure quality and reliability.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-anthracite-700">Fast Delivery</h3>
              <p className="mt-2 text-nuanced-600">
                Reliable shipping across Africa with real-time tracking.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Headphones className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-anthracite-700">24/7 Support</h3>
              <p className="mt-2 text-nuanced-600">
                Our dedicated team is always here to help you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-platinum-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-anthracite-700">Meet Our Team</h2>
            <p className="mx-auto mt-4 max-w-2xl text-nuanced-600">
              The passionate people behind Mientior
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full bg-platinum-200">
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-12 w-12 text-platinum-400" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-anthracite-700">{member.name}</h3>
                <p className="text-sm text-nuanced-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orange-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Start Shopping?</h2>
          <p className="mx-auto mt-4 max-w-xl text-orange-100">
            Join thousands of happy customers and discover amazing products from trusted vendors.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/products"
              className="rounded-lg bg-white px-8 py-3 font-semibold text-orange-600 transition-colors hover:bg-orange-50"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
