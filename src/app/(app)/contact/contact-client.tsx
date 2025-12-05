'use client'

import React, { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface ContactFormData {
  name: string
  email: string
  subject: string
  orderNumber: string
  message: string
}

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  subject: 'general',
  orderNumber: '',
  message: '',
}

const subjects = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'order', label: 'Order Issue' },
  { value: 'return', label: 'Return / Refund' },
  { value: 'product', label: 'Product Question' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'partnership', label: 'Partnership' },
]

export function ContactPageClient() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Message sent!',
          description: 'We\'ll get back to you within 24-48 hours.',
        })
        setFormData(initialFormData)
      } else {
        throw new Error('Failed to send')
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-anthracite-700">Contact Us</h1>
        <p className="mt-2 text-nuanced-600">
          We&apos;re here to help! Send us a message and we&apos;ll respond as soon as possible.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="rounded-lg border border-platinum-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-anthracite-700">Quick Help</h2>
            <div className="space-y-3">
              <a href="/faq" className="flex items-center gap-3 rounded-lg p-3 text-nuanced-600 transition-colors hover:bg-platinum-50 hover:text-anthracite-700">
                <HelpCircle className="h-5 w-5 text-orange-500" />
                <span>Frequently Asked Questions</span>
              </a>
              <a href="/account/orders" className="flex items-center gap-3 rounded-lg p-3 text-nuanced-600 transition-colors hover:bg-platinum-50 hover:text-anthracite-700">
                <Package className="h-5 w-5 text-orange-500" />
                <span>Track Your Order</span>
              </a>
              <a href="/livraison" className="flex items-center gap-3 rounded-lg p-3 text-nuanced-600 transition-colors hover:bg-platinum-50 hover:text-anthracite-700">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                <span>Shipping Information</span>
              </a>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-lg border border-platinum-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-anthracite-700">Contact Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-anthracite-700">Email</p>
                  <a href="mailto:support@mientior.com" className="text-nuanced-600 hover:text-orange-600">
                    support@mientior.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-anthracite-700">Phone</p>
                  <a href="tel:+33123456789" className="text-nuanced-600 hover:text-orange-600">
                    +33 1 23 45 67 89
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-anthracite-700">Address</p>
                  <p className="text-nuanced-600">
                    123 Commerce Street<br />
                    75001 Paris, France
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-anthracite-700">Business Hours</p>
                  <p className="text-nuanced-600">
                    Mon - Fri: 9:00 AM - 6:00 PM<br />
                    Sat: 10:00 AM - 4:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-platinum-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-anthracite-700">Send us a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-anthracite-700">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-platinum-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-anthracite-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-platinum-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-anthracite-700">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-platinum-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-anthracite-700">
                    Order Number (optional)
                  </label>
                  <input
                    type="text"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-platinum-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    placeholder="ORD-XXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-anthracite-700">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full rounded-lg border border-platinum-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  placeholder="How can we help you?"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
