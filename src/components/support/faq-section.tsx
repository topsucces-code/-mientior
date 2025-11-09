'use client'

import * as React from 'react'
import { Search, HelpCircle, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface FAQ {
  id: string
  question: string
  answer: string | { root: { children: Array<any> } } // Rich text support
  category: 'Livraison' | 'Paiement' | 'Retours' | 'Compte' | 'Produits' | 'Autre'
  order?: number
  views?: number
  helpful?: number
  notHelpful?: number
  relatedFAQs?: Array<{ id: string; question: string }>
  relatedArticles?: Array<{ title: string; url: string }>
  isActive?: boolean
  keywords?: Array<{ keyword: string }>
}

export interface FAQSectionProps {
  faqs: FAQ[]
  onVoteHelpful?: (faqId: string) => void
  onVoteNotHelpful?: (faqId: string) => void
  className?: string
}

const categoryConfig = {
  Livraison: { label: 'Delivery', icon: '📦', color: 'bg-blue-50 text-blue-700' },
  Paiement: { label: 'Payment', icon: '💳', color: 'bg-green-50 text-green-700' },
  Retours: { label: 'Returns', icon: '↩️', color: 'bg-purple-50 text-purple-700' },
  Compte: { label: 'Account', icon: '👤', color: 'bg-orange-50 text-orange-700' },
  Produits: { label: 'Products', icon: '📦', color: 'bg-pink-50 text-pink-700' },
  Autre: { label: 'Other', icon: '❓', color: 'bg-gray-50 text-gray-700' },
}

function renderRichText(content: string | { root: { children: Array<any> } }): string {
  if (typeof content === 'string') return content

  // Simple rich text to HTML conversion
  // In a real app, you'd want a more robust solution
  try {
    const children = content.root.children
    return children
      .map((child: any) => {
        if (child.type === 'paragraph') {
          const text = child.children?.map((c: any) => c.text).join('') || ''
          return `<p class="mb-3">${text}</p>`
        }
        return ''
      })
      .join('')
  } catch {
    return String(content)
  }
}

export function FAQSection({
  faqs,
  onVoteHelpful,
  onVoteNotHelpful,
  className,
}: FAQSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [votedFAQs, setVotedFAQs] = React.useState<Record<string, 'helpful' | 'not-helpful'>>({})

  const activeFAQs = faqs.filter((faq) => faq.isActive !== false)

  const filteredFAQs = React.useMemo(() => {
    let filtered = activeFAQs

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((faq) => faq.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((faq) => {
        const questionMatch = faq.question.toLowerCase().includes(query)
        const answerMatch =
          typeof faq.answer === 'string'
            ? faq.answer.toLowerCase().includes(query)
            : false
        const keywordMatch = faq.keywords?.some((k) =>
          k.keyword.toLowerCase().includes(query)
        )
        return questionMatch || answerMatch || keywordMatch
      })
    }

    // Sort by order then by views
    return filtered.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      return (b.views || 0) - (a.views || 0)
    })
  }, [activeFAQs, selectedCategory, searchQuery])

  const categories = React.useMemo(() => {
    const categoryCount: Record<string, number> = {}
    activeFAQs.forEach((faq) => {
      categoryCount[faq.category] = (categoryCount[faq.category] || 0) + 1
    })
    return categoryCount
  }, [activeFAQs])

  const handleVote = (faqId: string, type: 'helpful' | 'not-helpful') => {
    if (votedFAQs[faqId]) return // Already voted

    setVotedFAQs((prev) => ({ ...prev, [faqId]: type }))

    if (type === 'helpful') {
      onVoteHelpful?.(faqId)
    } else {
      onVoteNotHelpful?.(faqId)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-anthracite-700">
          Frequently Asked Questions
        </h1>
        <p className="text-nuanced-600">Find answers to common questions about our service</p>
      </div>

      {/* Search */}
      <div className="relative mx-auto w-full max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nuanced-500" />
        <Input
          type="search"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 text-base"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:grid-cols-7">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary">{activeFAQs.length}</Badge>
            </TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <span>{config.icon}</span>
                {config.label}
                {categories[key] > 0 && (
                  <Badge variant="secondary">{categories[key]}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* FAQ List */}
        <TabsContent value={selectedCategory} className="mt-6">
          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="mb-4 h-12 w-12 text-nuanced-400" />
                <h3 className="mb-2 text-lg font-semibold text-anthracite-700">
                  No FAQs found
                </h3>
                <p className="text-sm text-nuanced-600">
                  {searchQuery
                    ? 'Try adjusting your search query or browse different categories'
                    : 'No FAQs available in this category'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((faq) => {
                const config = categoryConfig[faq.category]
                const hasVoted = votedFAQs[faq.id]

                return (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="rounded-lg border border-platinum-300 bg-white px-6"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-start gap-3 text-left">
                        <span className="text-2xl">{config.icon}</span>
                        <div className="flex-1 space-y-1">
                          <h3 className="text-base font-semibold text-anthracite-700">
                            {faq.question}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                            {faq.views && faq.views > 0 && (
                              <span className="text-xs text-nuanced-500">
                                {faq.views} views
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {/* Answer */}
                      <div
                        className="prose prose-sm max-w-none text-nuanced-700"
                        dangerouslySetInnerHTML={{
                          __html: renderRichText(faq.answer),
                        }}
                      />

                      {/* Related FAQs */}
                      {faq.relatedFAQs && faq.relatedFAQs.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-anthracite-700">
                            Related Questions:
                          </h4>
                          <ul className="space-y-1">
                            {faq.relatedFAQs.map((related) => (
                              <li key={related.id}>
                                <button
                                  onClick={() => {
                                    const element = document.querySelector(
                                      `[data-faq-id="${related.id}"]`
                                    )
                                    element?.scrollIntoView({ behavior: 'smooth' })
                                  }}
                                  className="text-sm text-orange-500 hover:underline"
                                >
                                  {related.question}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Articles */}
                      {faq.relatedArticles && faq.relatedArticles.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-anthracite-700">
                            Related Articles:
                          </h4>
                          <ul className="space-y-1">
                            {faq.relatedArticles.map((article, index) => (
                              <li key={index}>
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-orange-500 hover:underline"
                                >
                                  {article.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Helpful Voting */}
                      <div className="flex items-center gap-3 border-t border-platinum-200 pt-4">
                        <span className="text-sm text-nuanced-600">Was this helpful?</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(faq.id, 'helpful')}
                            disabled={!!hasVoted}
                            className={cn(
                              hasVoted === 'helpful' && 'bg-green-50 text-green-700'
                            )}
                          >
                            <ThumbsUp className="mr-1 h-4 w-4" />
                            Yes
                            {faq.helpful && faq.helpful > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {faq.helpful}
                              </Badge>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(faq.id, 'not-helpful')}
                            disabled={!!hasVoted}
                            className={cn(
                              hasVoted === 'not-helpful' && 'bg-red-50 text-red-700'
                            )}
                          >
                            <ThumbsDown className="mr-1 h-4 w-4" />
                            No
                            {faq.notHelpful && faq.notHelpful > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {faq.notHelpful}
                              </Badge>
                            )}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-orange-50 to-aurore-50">
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? Our support team is here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="gradient" asChild>
              <a href="mailto:support@mientior.com">Contact Support</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/support">Visit Help Center</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
