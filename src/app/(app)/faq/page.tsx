/**
 * FAQ Page
 * Frequently Asked Questions with search and categorization
 */

import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FAQPageClient } from './faq-client'
import type { FAQ } from '@/components/support/faq-section'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | Mientior',
  description: 'Find answers to common questions about our products, shipping, returns, and more',
}

async function getFAQs(): Promise<FAQ[]> {
  try {
    // Fetch FAQs from Prisma
    const faqs = await prisma.fAQ.findMany({
      take: 100,
      orderBy: { order: 'asc' },
    })

    if (faqs && faqs.length > 0) {
      return faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order,
        views: faq.views,
        helpful: faq.helpful,
        notHelpful: faq.notHelpful,
        relatedFAQs: faq.relatedFAQs,
        isActive: true,
      }))
    }

    // Return mock FAQs if no FAQs exist
    return getMockFAQs()
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return getMockFAQs()
  }
}

function getMockFAQs(): FAQ[] {
  return [
    {
      id: '1',
      question: 'What are your shipping options?',
      answer: 'We offer three shipping options: Standard (5-7 business days, free), Express (2-3 business days, $15), and Overnight (1 business day, $30). All orders are shipped via trusted carriers like USPS, FedEx, and UPS.',
      category: 'Livraison',
      order: 1,
      views: 1234,
      helpful: 89,
      notHelpful: 3,
      isActive: true,
    },
    {
      id: '2',
      question: 'How can I track my order?',
      answer: 'Once your order ships, you will receive a tracking number via email. You can use this number to track your package on the carrier\'s website. You can also view your order status in your account dashboard.',
      category: 'Livraison',
      order: 2,
      views: 987,
      helpful: 72,
      notHelpful: 2,
      isActive: true,
    },
    {
      id: '3',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All payments are processed securely through Stripe with SSL encryption.',
      category: 'Paiement',
      order: 3,
      views: 856,
      helpful: 65,
      notHelpful: 1,
      isActive: true,
    },
    {
      id: '4',
      question: 'Is my payment information secure?',
      answer: 'Yes, absolutely! We use industry-standard SSL encryption and PCI-compliant payment processing through Stripe. We never store your full credit card information on our servers.',
      category: 'Paiement',
      order: 4,
      views: 743,
      helpful: 58,
      notHelpful: 0,
      isActive: true,
    },
    {
      id: '5',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day money-back guarantee on all products. If you\'re not satisfied, you can return any item in its original condition for a full refund. Return shipping is free for defective items.',
      category: 'Retours',
      order: 5,
      views: 1456,
      helpful: 112,
      notHelpful: 8,
      isActive: true,
    },
    {
      id: '6',
      question: 'How do I initiate a return?',
      answer: 'To start a return, log into your account, go to your order history, and click "Request Return" on the order you wish to return. Follow the instructions to print a return label and ship the item back to us.',
      category: 'Retours',
      order: 6,
      views: 892,
      helpful: 67,
      notHelpful: 4,
      isActive: true,
    },
    {
      id: '7',
      question: 'How do I create an account?',
      answer: 'Click the "Sign In" button in the top right corner, then select "Create Account". You can sign up using your email address or use Google authentication for quick access.',
      category: 'Compte',
      order: 7,
      views: 654,
      helpful: 45,
      notHelpful: 2,
      isActive: true,
    },
    {
      id: '8',
      question: 'Can I change my account information?',
      answer: 'Yes! Go to your account dashboard and click on "Settings" to update your email, password, shipping addresses, and payment methods. Changes are saved instantly.',
      category: 'Compte',
      order: 8,
      views: 432,
      helpful: 34,
      notHelpful: 1,
      isActive: true,
    },
    {
      id: '9',
      question: 'Are your products authentic?',
      answer: 'Yes, all products sold on Mientior are 100% authentic. We work directly with authorized distributors and manufacturers to ensure product authenticity and quality.',
      category: 'Produits',
      order: 9,
      views: 1123,
      helpful: 95,
      notHelpful: 2,
      isActive: true,
    },
    {
      id: '10',
      question: 'Do you offer product warranties?',
      answer: 'Yes, all products come with manufacturer warranties. The warranty period varies by product and manufacturer. Specific warranty information is available on each product page.',
      category: 'Produits',
      order: 10,
      views: 567,
      helpful: 48,
      notHelpful: 3,
      isActive: true,
    },
    {
      id: '11',
      question: 'Can I cancel or modify my order?',
      answer: 'You can cancel or modify your order within 1 hour of placing it. After that, orders are processed for shipping and cannot be changed. Contact customer support immediately if you need assistance.',
      category: 'Autre',
      order: 11,
      views: 789,
      helpful: 61,
      notHelpful: 5,
      isActive: true,
    },
    {
      id: '12',
      question: 'How do I contact customer support?',
      answer: 'You can reach our customer support team via email at support@mientior.com, through the contact form on our website, or by phone at 1-800-MIENTIOR. Our team is available Monday-Friday, 9am-6pm EST.',
      category: 'Autre',
      order: 12,
      views: 923,
      helpful: 73,
      notHelpful: 2,
      isActive: true,
    },
  ]
}

export default async function FAQPage() {
  const faqs = await getFAQs()

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <FAQPageClient faqs={faqs} />
      </div>
    </div>
  )
}
