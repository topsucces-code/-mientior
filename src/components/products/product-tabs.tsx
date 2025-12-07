'use client'

/**
 * Product tabs component for Description, Specifications, and Reviews sections
 */

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { FileText, ListChecks, MessageSquare, ThumbsUp, ThumbsDown, HelpCircle, Truck, X, ChevronLeft, ChevronRight, Search, MessageSquarePlus, ShieldCheck, MessageCircle, RotateCcw, Globe, Check, Store } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StarRating } from '@/components/ui/star-rating'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PDP_CONFIG } from '@/lib/constants'
import type { Product, Review, ReviewStats, QA, ShippingInfo } from '@/types'

interface ProductTabsProps {
  product: Product
  reviews?: Review[]
  reviewStats?: ReviewStats
  qa?: QA[]
  shippingInfo?: ShippingInfo
}

/**
 * Helper function to format specification values with units
 * Detects and formats measurements with appropriate units
 */
function formatSpecificationValue(value: string): string {
  if (!value) return value
  
  // Check if value already has a unit (common units)
  const hasUnit = /\d+\s*(cm|mm|m|km|kg|g|mg|l|ml|cl|w|kw|v|a|hz|khz|mhz|ghz|gb|mb|tb|kb|inch|in|lb|oz|ft|yd|°c|°f|%|px|dpi)$/i.test(value)
  if (hasUnit) return value
  
  // Check for dimension patterns (e.g., "30 x 20 x 10")
  const dimensionMatch = value.match(/^(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)$/i)
  if (dimensionMatch) {
    // Dimensions without units - return as-is
    return value
  }
  
  // Check if it's a pure number that might need a unit
  const numMatch = value.match(/^(\d+\.?\d*)$/)
  if (numMatch) {
    // Return as-is, unit should be in the key or context
    return value
  }
  
  return value
}

/**
 * Helper function to parse specifications and group them
 */
function parseSpecifications(specs: Record<string, string> | undefined): Array<{ category: string; items: Array<{ key: string; value: string }> }> {
  if (!specs || Object.keys(specs).length === 0) return []
  
  // For now, return all specs in a single "General" category
  // In the future, this could be enhanced to group by category
  return [{
    category: 'Caractéristiques générales',
    items: Object.entries(specs).map(([key, value]) => ({
      key,
      value: formatSpecificationValue(value)
    }))
  }]
}

export function ProductTabs({ product, reviews = [], reviewStats, qa = [], shippingInfo }: ProductTabsProps) {
  const [reviewSort, setReviewSort] = useState<'recent' | 'helpful' | 'rating'>('recent')
  const [filters, setFilters] = useState<{ photos: boolean; videos: boolean; verified: boolean; rating: number | null }>({ photos: false, videos: false, verified: false, rating: null })
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [allReviews, setAllReviews] = useState(reviews)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()
  
  // Q&A state
  const [searchQuery, setSearchQuery] = useState('')
  const [showAskModal, setShowAskModal] = useState(false)
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'notHelpful' | null>>({})
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({})

  // Parse specifications
  const specificationGroups = parseSpecifications(product.specifications)

  // Initialize reviews when they change
  useEffect(() => {
    setAllReviews(reviews)
    setCurrentPage(1)
    setHasMore(reviewStats ? reviews.length < reviewStats.total : false)
  }, [reviews, reviewStats])

  // Reset pagination when filters or sort change
  useEffect(() => {
    setCurrentPage(1)
    setAllReviews(reviews)
    setHasMore(reviewStats ? reviews.length < reviewStats.total : false)
  }, [filters, reviewSort, reviews, reviewStats])

  // Load more reviews handler
  const loadMoreReviews = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams({
        page: nextPage.toString(),
        sort: reviewSort,
      })

      if (filters.photos) params.append('withPhotos', 'true')
      if (filters.videos) params.append('withVideos', 'true')
      if (filters.verified) params.append('verified', 'true')
      if (filters.rating !== null) params.append('rating', filters.rating.toString())

      const response = await fetch(`/api/reviews/products/${product.slug}/reviews?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to load more reviews')
      }

      const data = await response.json()

      setAllReviews(prev => [...prev, ...data.reviews])
      setCurrentPage(nextPage)
      setHasMore(data.reviews.length === 10 && allReviews.length + data.reviews.length < data.totalCount)
    } catch (error) {
      console.error('Error loading more reviews:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger plus d\'avis',
        variant: 'destructive',
      })
    } finally {
      setLoadingMore(false)
    }
  }

  // Sort reviews based on selected option
  const sortedReviews = [...allReviews].sort((a, b) => {
    switch (reviewSort) {
      case 'helpful':
        return b.helpful - a.helpful
      case 'rating':
        return b.rating - a.rating
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Apply filters to sorted reviews
  const filteredReviews = sortedReviews.filter(review => {
    if (filters.photos && (!review.images || review.images.length === 0)) {
      return false
    }
    if (filters.videos && (!review.videos || review.videos.length === 0)) {
      return false
    }
    if (filters.verified && !review.verified) {
      return false
    }
    if (filters.rating !== null && review.rating !== filters.rating) {
      return false
    }
    return true
  })

  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList 
        className="w-full justify-start border-b border-platinum-300 bg-transparent rounded-none h-auto p-0"
        aria-label="Informations produit"
      >
        <TabsTrigger
          value="description"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
          aria-label="Description du produit"
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          Description
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
          aria-label="Caractéristiques techniques"
        >
          <ListChecks className="w-4 h-4" aria-hidden="true" />
          Caractéristiques
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
          aria-label={`Avis clients, ${reviews.length} avis`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Avis ({reviews.length})
        </TabsTrigger>
        <TabsTrigger
          value="qa"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
          aria-label={`Questions et réponses, ${qa.length} questions`}
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
          Questions & Réponses ({qa.length})
        </TabsTrigger>
        <TabsTrigger
          value="shipping"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
          aria-label="Informations de livraison et retours"
        >
          <Truck className="w-4 h-4" aria-hidden="true" />
          Livraison & Retours
        </TabsTrigger>
      </TabsList>

      {/* Description Tab */}
      <TabsContent value="description" className="mt-8 space-y-6" role="tabpanel" aria-labelledby="description-tab">
        <div className="prose prose-sm max-w-none">
          {product.description ? (
            <div className="text-nuanced-700 leading-relaxed space-y-4">
              {product.description.split('\n\n').map((paragraph, index) => {
                // Check if paragraph is a heading (starts with #)
                if (paragraph.startsWith('# ')) {
                  return (
                    <h2 key={index} className="text-2xl font-bold text-anthracite-900 mt-6 mb-3">
                      {paragraph.substring(2)}
                    </h2>
                  )
                }
                if (paragraph.startsWith('## ')) {
                  return (
                    <h3 key={index} className="text-xl font-bold text-anthracite-900 mt-5 mb-2">
                      {paragraph.substring(3)}
                    </h3>
                  )
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h4 key={index} className="text-lg font-bold text-anthracite-900 mt-4 mb-2">
                      {paragraph.substring(4)}
                    </h4>
                  )
                }
                
                // Check if paragraph is a list (lines starting with - or *)
                const lines = paragraph.split('\n')
                if (lines.every(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim() === '')) {
                  return (
                    <ul key={index} className="list-none space-y-2 my-4">
                      {lines.filter(line => line.trim()).map((line, lineIndex) => (
                        <li key={lineIndex} className="flex items-start gap-3">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{line.replace(/^[-*]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  )
                }
                
                // Regular paragraph with inline formatting
                return (
                  <p key={index} className="whitespace-pre-wrap">
                    {paragraph.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, partIndex) => {
                      // Bold text (**text**)
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={partIndex} className="font-bold text-anthracite-900">{part.slice(2, -2)}</strong>
                      }
                      // Italic text (*text*)
                      if (part.startsWith('*') && part.endsWith('*')) {
                        return <em key={partIndex} className="italic">{part.slice(1, -1)}</em>
                      }
                      return part
                    })}
                  </p>
                )
              })}
            </div>
          ) : (
            <p className="text-nuanced-500 italic">Aucune description disponible pour ce produit.</p>
          )}
        </div>

        {/* Key Features */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-8 bg-platinum-50 rounded-lg p-6 border border-platinum-200">
            <h3 className="text-lg font-bold text-anthracite-900 mb-4 flex items-center gap-2">
              <span className="text-orange-500">✓</span>
              Points clés
            </h3>
            <div className="grid gap-3">
              {Object.entries(product.specifications).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-nuanced-700">
                    <strong className="text-anthracite-900">{key}:</strong> {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      {/* Specifications Tab */}
      <TabsContent value="specifications" className="mt-8" role="tabpanel" aria-labelledby="specifications-tab">
        {specificationGroups.length > 0 ? (
          <div className="space-y-8">
            {specificationGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {specificationGroups.length > 1 && (
                  <h3 className="text-lg font-bold text-anthracite-900 mb-4">{group.category}</h3>
                )}
                <div className="border border-platinum-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-platinum-200">
                      {group.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-platinum-50 transition-colors">
                          <td className="w-1/3 px-6 py-4 font-medium text-anthracite-900 bg-platinum-50/50">
                            {item.key}
                          </td>
                          <td className="w-2/3 px-6 py-4 text-nuanced-700">
                            {item.value || <span className="text-nuanced-400 italic">Non spécifié</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ListChecks className="w-12 h-12 text-nuanced-400 mx-auto mb-4" />
            <p className="text-nuanced-500 italic">Aucune caractéristique technique disponible pour ce produit.</p>
          </div>
        )}
      </TabsContent>

      {/* Reviews Tab */}
      <TabsContent value="reviews" className="mt-8 space-y-8" role="tabpanel" aria-labelledby="reviews-tab">
        {/* Review Summary */}
        {reviewStats && (
          <div className="bg-platinum-50 rounded-lg p-6 border border-platinum-200">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Overall Rating */}
              <div className="flex flex-col items-center justify-center text-center min-w-[200px]">
                <div className="text-5xl font-bold text-anthracite-900 mb-2">
                  {reviewStats.average.toFixed(1)}
                </div>
                <StarRating rating={reviewStats.average} size="lg" />
                <p className="text-sm text-nuanced-600 mt-2">
                  Basé sur {reviewStats.total} avis
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((rating) => {
                  const count = reviewStats.distribution[rating]
                  const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0

                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, rating: prev.rating === rating ? null : rating }))}
                      className={`flex items-center gap-3 w-full hover:bg-platinum-100 rounded px-2 py-1 transition-colors ${filters.rating === rating ? 'bg-orange-50' : ''}`}
                      data-testid={`filter-rating-${rating}`}
                    >
                      <span className="text-sm font-medium text-anthracite-900 w-12">
                        {rating} étoiles
                      </span>
                      <div className="flex-1 h-3 bg-platinum-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-aurore-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-nuanced-600 w-12 text-right">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Prominent Write Review CTA */}
            <div className="mt-6">
              <Dialog open={isWriteReviewOpen} onOpenChange={setIsWriteReviewOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    Écrire un avis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Écrire un avis pour {product.name}</DialogTitle>
                  </DialogHeader>
                  <WriteReviewModal product={product} onClose={() => setIsWriteReviewOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        {reviews.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-nuanced-600 mr-2">Filtrer par:</span>
            <Button
              variant={!filters.photos && !filters.videos && !filters.verified && filters.rating === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ photos: false, videos: false, verified: false, rating: null })}
              className={!filters.photos && !filters.videos && !filters.verified && filters.rating === null ? 'bg-orange-600 hover:bg-orange-700' : ''}
              data-testid="filter-all"
            >
              Tous
            </Button>
            <Button
              variant={filters.photos ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, photos: !prev.photos }))}
              className={filters.photos ? 'bg-orange-600 hover:bg-orange-700' : ''}
              data-testid="filter-photos"
            >
              Avec photos
            </Button>
            <Button
              variant={filters.videos ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, videos: !prev.videos }))}
              className={filters.videos ? 'bg-orange-600 hover:bg-orange-700' : ''}
              data-testid="filter-videos"
            >
              Avec vidéos
            </Button>
            <Button
              variant={filters.verified ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, verified: !prev.verified }))}
              className={filters.verified ? 'bg-orange-600 hover:bg-orange-700' : ''}
              data-testid="filter-verified"
            >
              Achat vérifié
            </Button>
          </div>
        )}

        {/* Sort Options */}
        {reviews.length > 0 && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-anthracite-900">
              {filteredReviews.length === reviews.length 
                ? `Avis clients (${reviews.length})`
                : `${filteredReviews.length} sur ${reviews.length} avis affichés`
              }
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-nuanced-600">Trier par:</span>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as typeof reviewSort)}
                className="px-3 py-1.5 border border-platinum-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="recent">Plus récents</option>
                <option value="helpful">Plus utiles</option>
                <option value="rating">Note la plus élevée</option>
              </select>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6" data-testid="reviews-list">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))
          ) : reviews.length > 0 ? (
            <div className="text-center py-12" data-testid="no-results-message">
              <MessageSquare className="w-12 h-12 text-nuanced-400 mx-auto mb-4" />
              <p className="text-nuanced-600 mb-4">Aucun avis ne correspond à vos filtres.</p>
              <Button
                variant="outline"
                onClick={() => setFilters({ photos: false, videos: false, verified: false, rating: null })}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-nuanced-400 mx-auto mb-4" />
              <p className="text-nuanced-600 mb-4">Aucun avis pour ce produit.</p>
              <Button 
                variant="outline"
                onClick={() => setIsWriteReviewOpen(true)}
              >
                Soyez le premier à donner votre avis
              </Button>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && filteredReviews.length > 0 && reviewStats && allReviews.length < reviewStats.total && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              className="min-w-[200px]"
              onClick={loadMoreReviews}
              disabled={loadingMore}
              data-testid="load-more-reviews"
            >
              {loadingMore ? 'Chargement...' : 'Voir plus d\'avis'}
            </Button>
            {reviewStats && (
              <p className="text-sm text-nuanced-500 mt-2">
                {allReviews.length} sur {reviewStats.total} avis affichés
              </p>
            )}
          </div>
        )}
      </TabsContent>

      {/* Q&A Tab */}
      <TabsContent value="qa" className="mt-8 space-y-6" role="tabpanel" aria-labelledby="qa-tab">
        {/* Header with search and ask button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-nuanced-400" />
            <Input
              type="text"
              placeholder="Rechercher dans les questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowAskModal(true)} className="w-full sm:w-auto">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Poser une question
          </Button>
        </div>

        {/* Questions List */}
        {qa.length > 0 ? (
          <div className="space-y-4">
            {qa
              .filter((item) => 
                searchQuery.length < PDP_CONFIG.qaSearchMinLength || 
                item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item) => (
                <QuestionCard
                  key={item.id}
                  question={item}
                  userVote={userVotes[item.id]}
                  onVote={(type) => {
                    setUserVotes((prev) => ({
                      ...prev,
                      [item.id]: prev[item.id] === type ? null : type,
                    }))
                  }}
                  expanded={expandedAnswers[item.id] ?? false}
                  onToggleExpand={() => {
                    setExpandedAnswers((prev) => ({
                      ...prev,
                      [item.id]: !prev[item.id],
                    }))
                  }}
                />
              ))}
            {qa.filter((item) => 
              searchQuery.length >= PDP_CONFIG.qaSearchMinLength && 
              !item.question.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !item.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === qa.length && (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-platinum-400 mx-auto mb-4" />
                <p className="text-nuanced-500">Aucune question ne correspond à votre recherche</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-platinum-400 mx-auto mb-4" />
            <p className="text-nuanced-500 mb-4">Aucune question pour le moment</p>
            <Button variant="outline" onClick={() => setShowAskModal(true)}>
              Poser une question
            </Button>
          </div>
        )}

        {/* Ask Question Modal */}
        <AskQuestionModal
          open={showAskModal}
          onClose={() => setShowAskModal(false)}
          product={product}
        />
      </TabsContent>

      {/* Shipping & Returns Tab */}
      <TabsContent value="shipping" className="mt-8 space-y-8" role="tabpanel" aria-labelledby="shipping-tab">
        {shippingInfo ? (
          <>
            {/* Shipping Options Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Truck className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-bold text-anthracite-900 uppercase tracking-wide">
                  Modes de livraison
                </h3>
              </div>
              <div className="grid gap-4">
                {shippingInfo.options.map((option, index) => (
                  <div
                    key={index}
                    className="border-2 border-platinum-300 rounded-xl p-6 flex items-center gap-4 hover:border-orange-500 transition-all duration-300 bg-white hover:shadow-lg"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-anthracite-900 mb-1">{option.name}</p>
                      <p className="text-sm text-nuanced-600">{option.description}</p>
                      <p className="text-sm text-nuanced-500 mt-1">
                        📦 Livraison estimée : {option.estimatedDays} jours ouvrés
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${option.price === 0 ? 'text-green-600' : 'text-anthracite-900'}`}>
                        {option.price === 0 ? 'GRATUIT' : `${option.price.toFixed(2)} €`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {shippingInfo.freeShippingThreshold && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800 font-medium">
                    Livraison gratuite pour les commandes de plus de {shippingInfo.freeShippingThreshold} €
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Returns Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <RotateCcw className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-bold text-anthracite-900 uppercase tracking-wide">
                  Retours gratuits
                </h3>
              </div>
              
              <div className="bg-platinum-50 rounded-xl p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-nuanced-700">Retours gratuits sous 30 jours</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-nuanced-700">Remboursement intégral garanti</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-nuanced-700">Étiquette de retour prépayée</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <p className="font-bold text-anthracite-900 mb-3">Instructions de retour :</p>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li className="text-nuanced-700">Connectez-vous à votre compte et accédez à vos commandes</li>
                    <li className="text-nuanced-700">Sélectionnez l'article à retourner et indiquez la raison</li>
                    <li className="text-nuanced-700">Téléchargez et imprimez l'étiquette de retour</li>
                    <li className="text-nuanced-700">Emballez l'article dans son emballage d'origine</li>
                    <li className="text-nuanced-700">Déposez le colis dans un point relais</li>
                  </ol>
                </div>

                <Button variant="outline" className="w-full sm:w-auto mt-4">
                  En savoir plus sur les retours
                </Button>
              </div>
            </div>

            {shippingInfo.internationalShipping && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Globe className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-anthracite-900 uppercase tracking-wide">
                      Livraison internationale
                    </h3>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                    <p className="text-nuanced-700">
                      Nous expédions dans de nombreux pays à travers le monde. Les frais et délais de livraison varient selon la destination.
                    </p>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Voir les pays et tarifs
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-nuanced-500 italic">Informations de livraison non disponibles.</p>
        )}
      </TabsContent>

    </Tabs>
  )
}

/**
 * Write Review Modal Component
 */
interface WriteReviewModalProps {
  product: Product
  onClose: () => void
}

function WriteReviewModal({ product, onClose }: WriteReviewModalProps) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Validation
  const isValid = rating > 0 && title.trim().length > 0 && comment.trim().length >= 10 && comment.length <= 2000

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('rating', rating.toString())
      formData.append('title', title)
      formData.append('comment', comment)

      // Ajouter les images si présentes
      images.forEach((file, index) => {
        formData.append(`images[${index}]`, file)
      })

      // Ajouter les vidéos si présentes
      videos.forEach((file, index) => {
        formData.append(`videos[${index}]`, file)
      })

      const response = await fetch(`/api/reviews/products/${product.slug}/reviews`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission')
      }

      // Afficher un toast de succès
      toast({
        title: 'Avis soumis !',
        description: 'Votre avis est en attente de modération.',
      })

      onClose()

      // Optionnel : Rafraîchir la page pour afficher le nouvel avis (si approuvé automatiquement)
      // window.location.reload()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Rating Selector */}
      <div>
        <label className="block text-sm font-medium text-anthracite-900 mb-2">
          Note globale *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-3xl focus:outline-none transition-colors"
            >
              {star <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-anthracite-900 mb-2">
          Titre de votre avis *
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Résumez votre expérience"
          className="w-full px-4 py-2 border border-platinum-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Comment Textarea */}
      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-anthracite-900 mb-2">
          Votre avis *
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit..."
          rows={6}
          className="w-full px-4 py-2 border border-platinum-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      </div>

      {/* Media Upload (Images and Videos) */}
      <div>
        <label className="block text-sm font-medium text-anthracite-900 mb-2">
          Ajouter des photos ou vidéos (optionnel)
        </label>
        <div className="border-2 border-dashed border-platinum-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="review-media"
            accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              const imageFiles: File[] = []
              const videoFiles: File[] = []

              // Séparer les images et les vidéos
              files.forEach(file => {
                if (file.type.startsWith('image/')) {
                  imageFiles.push(file)
                } else if (file.type.startsWith('video/')) {
                  videoFiles.push(file)
                }
              })

              // Limiter à 5 fichiers au total
              const totalFiles = images.length + videos.length + imageFiles.length + videoFiles.length
              if (totalFiles > 5) {
                toast({
                  title: 'Limite dépassée',
                  description: 'Vous ne pouvez ajouter que 5 fichiers au total (images + vidéos)',
                  variant: 'destructive',
                })
                return
              }

              // Ajouter les nouvelles images
              if (imageFiles.length > 0) {
                setImages(prev => [...prev, ...imageFiles])
                const newPreviews = imageFiles.map(file => URL.createObjectURL(file))
                setImagePreviews(prev => [...prev, ...newPreviews])
              }

              // Ajouter les nouvelles vidéos
              if (videoFiles.length > 0) {
                setVideos(prev => [...prev, ...videoFiles])
                const newPreviews = videoFiles.map(file => URL.createObjectURL(file))
                setVideoPreviews(prev => [...prev, ...newPreviews])
              }

              // Réinitialiser l'input pour permettre de sélectionner les mêmes fichiers à nouveau
              e.target.value = ''
            }}
            className="hidden"
          />
          <label htmlFor="review-media" className="cursor-pointer">
            <p className="text-sm text-nuanced-500 mb-3">
              Ajoutez jusqu'à 5 fichiers au total (photos et vidéos)
            </p>
            <p className="text-xs text-nuanced-400 mb-3">
              Images: JPG, PNG, WebP (max 10MB) • Vidéos: MP4, WebM, MOV (max 50MB)
            </p>
            <Button variant="outline" size="sm" type="button">
              Choisir des fichiers
            </Button>
          </label>

          {/* Afficher les previews d'images */}
          {(imagePreviews.length > 0 || videoPreviews.length > 0) && (
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              {imagePreviews.map((preview, index) => (
                <div key={`img-${index}`} className="relative">
                  <img src={preview} alt={`Image ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setImages(prev => prev.filter((_, i) => i !== index))
                      setImagePreviews(prev => prev.filter((_, i) => i !== index))
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {videoPreviews.map((preview, index) => (
                <div key={`vid-${index}`} className="relative">
                  <video src={preview} className="w-20 h-20 object-cover rounded" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                    <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-anthracite-900 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideos(prev => prev.filter((_, i) => i !== index))
                      setVideoPreviews(prev => prev.filter((_, i) => i !== index))
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variant Info */}
      {(product.variants && product.variants.length > 0) && (
        <div className="bg-platinum-50 rounded-lg p-4">
          <p className="text-sm text-nuanced-600">
            Votre avis portera sur : <span className="font-medium text-anthracite-900">{product.name}</span>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Publier mon avis'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Review Item Component
 */
function ReviewItem({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(review.helpful)
  const [notHelpful, setNotHelpful] = useState(review.notHelpful)
  const [userVote, setUserVote] = useState<'helpful' | 'not-helpful' | null>(null)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null)
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null)
  const { toast } = useToast()

  // Combine images and videos into a single media array
  const allMedia = React.useMemo(() => [
    ...(review.images || []).map(url => ({ type: 'image' as const, url })),
    ...(review.videos || []).map(url => ({ type: 'video' as const, url }))
  ], [review.images, review.videos])

  // Load saved vote from localStorage on mount
  useEffect(() => {
    const savedVote = localStorage.getItem(`review-vote-${review.id}`)
    if (savedVote === 'helpful' || savedVote === 'not-helpful') {
      setUserVote(savedVote)
    }
  }, [review.id])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedMediaIndex === null || allMedia.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMediaIndex(null)
        setSelectedMediaType(null)
      } else if (e.key === 'ArrowLeft' && selectedMediaIndex > 0) {
        const newIndex = selectedMediaIndex - 1
        setSelectedMediaIndex(newIndex)
        setSelectedMediaType(allMedia[newIndex]?.type || null)
      } else if (e.key === 'ArrowRight' && selectedMediaIndex < allMedia.length - 1) {
        const newIndex = selectedMediaIndex + 1
        setSelectedMediaIndex(newIndex)
        setSelectedMediaType(allMedia[newIndex]?.type || null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMediaIndex, allMedia])

  const handleVote = async (type: 'helpful' | 'not-helpful') => {
    if (userVote === type) return // Déjà voté

    try {
      const response = await fetch(`/api/reviews/${review.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voteType: type === 'helpful' ? 'helpful' : 'notHelpful'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data = await response.json()

      // Mettre à jour l'état local
      setHelpful(data.helpful)
      setNotHelpful(data.notHelpful)
      setUserVote(type)

      // Sauvegarder dans localStorage pour éviter les votes multiples
      localStorage.setItem(`review-vote-${review.id}`, type)
    } catch (error) {
      console.error('Vote error:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer votre vote',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="border border-platinum-200 rounded-lg p-6 space-y-4" data-testid="review-item">
      {/* Review Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            {review.userAvatar ? (
              <Image 
                src={review.userAvatar} 
                alt={review.userName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-platinum-300 flex items-center justify-center text-anthracite-900 font-bold">
                {review.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-anthracite-900">{review.userName}</p>
              {review.verified && (
                <Badge variant="success" size="sm">
                  Achat vérifié
                </Badge>
              )}
            </div>
            <p className="text-sm text-nuanced-500">
              {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div data-testid="review-rating">
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-bold text-anthracite-900">{review.title}</h4>
      )}

      {/* Review Comment */}
      <p className="text-nuanced-700 leading-relaxed">{review.comment}</p>

      {/* Review Media (Images and Videos) */}
      {allMedia.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {allMedia.map((media, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelectedMediaIndex(index)
                  setSelectedMediaType(media.type)
                }}
                className="w-20 h-20 rounded-lg overflow-hidden border border-platinum-200 relative hover:opacity-80 transition-opacity cursor-pointer"
              >
                {media.type === 'image' ? (
                  <Image
                    src={media.url}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[8px] border-l-anthracite-900 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Media Lightbox */}
          {selectedMediaIndex !== null && selectedMediaType && (
            <Dialog open={selectedMediaIndex !== null} onOpenChange={() => {
              setSelectedMediaIndex(null)
              setSelectedMediaType(null)
            }}>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95">
                <div className="relative w-full h-[90vh] flex items-center justify-center">
                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setSelectedMediaIndex(null)
                      setSelectedMediaType(null)
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>

                  {/* Previous Button */}
                  {allMedia.length > 1 && selectedMediaIndex > 0 && (
                    <button
                      onClick={() => {
                        const newIndex = selectedMediaIndex - 1
                        setSelectedMediaIndex(newIndex)
                        setSelectedMediaType(allMedia[newIndex]?.type || null)
                      }}
                      className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      aria-label="Média précédent"
                    >
                      <ChevronLeft className="w-8 h-8 text-white" />
                    </button>
                  )}

                  {/* Media Content */}
                  <div className="relative w-full h-full flex items-center justify-center p-12">
                    <div className="relative max-w-full max-h-full">
                      {selectedMediaType === 'image' && allMedia[selectedMediaIndex] ? (
                        <Image
                          src={allMedia[selectedMediaIndex].url}
                          alt={`Review media ${selectedMediaIndex + 1}`}
                          width={1200}
                          height={900}
                          className="max-w-full max-h-[80vh] object-contain"
                        />
                      ) : selectedMediaType === 'video' && allMedia[selectedMediaIndex] ? (
                        <video
                          src={allMedia[selectedMediaIndex].url}
                          controls
                          autoPlay
                          className="max-w-full max-h-[80vh]"
                          onError={(e) => {
                            console.error('Video playback error:', e)
                          }}
                        >
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                      ) : null}
                    </div>
                  </div>

                  {/* Next Button */}
                  {allMedia.length > 1 && selectedMediaIndex < allMedia.length - 1 && (
                    <button
                      onClick={() => {
                        const newIndex = selectedMediaIndex + 1
                        setSelectedMediaIndex(newIndex)
                        setSelectedMediaType(allMedia[newIndex]?.type || null)
                      }}
                      className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      aria-label="Média suivant"
                    >
                      <ChevronRight className="w-8 h-8 text-white" />
                    </button>
                  )}

                  {/* Media Counter */}
                  {allMedia.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full">
                      <span className="text-white text-sm font-medium">
                        {selectedMediaIndex + 1} / {allMedia.length}
                      </span>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      {/* Helpful Votes */}
      <Separator />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-nuanced-600">Cet avis vous a-t-il été utile ?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('helpful')}
              className={userVote === 'helpful' ? 'bg-green-50 border-green-500' : ''}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Oui ({helpful})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('not-helpful')}
              className={userVote === 'not-helpful' ? 'bg-red-50 border-red-500' : ''}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Non ({notHelpful})
            </Button>
          </div>
        </div>
      </div>

      {/* Merchant Response */}
      {review.response && (
        <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-anthracite-900 mb-1">
                Réponse du vendeur
              </p>
              <p className="text-sm text-nuanced-700">
                {review.response.text}
              </p>
              <p className="text-xs text-nuanced-500 mt-2">
                {new Date(review.response.respondedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Question Card Component - Display individual Q&A with voting
 */
interface QuestionCardProps {
  question: QA
  userVote: 'helpful' | 'notHelpful' | null | undefined
  onVote: (type: 'helpful' | 'notHelpful') => void
  expanded: boolean
  onToggleExpand: () => void
}

function QuestionCard({ question, userVote, onVote, expanded, onToggleExpand }: QuestionCardProps) {
  // Determine which answer to show (official or first answer)
  const officialAnswer = question.answers?.find(a => a.isOfficial)
  const displayAnswer = officialAnswer || (question.answers && question.answers[0]) || { text: question.answer, isOfficial: false }
  const additionalAnswersCount = question.answers ? question.answers.length - 1 : 0
  
  // Format relative time
  const timeAgo = question.askedAt 
    ? formatDistanceToNow(question.askedAt, { addSuffix: true, locale: fr })
    : question.createdAt 
    ? formatDistanceToNow(question.createdAt, { addSuffix: true, locale: fr })
    : null

  // Calculate display counts based on user vote
  const baseHelpful = question.helpful
  const baseNotHelpful = question.notHelpful || 0
  
  let displayHelpful = baseHelpful
  let displayNotHelpful = baseNotHelpful
  
  if (userVote === 'helpful') {
    displayHelpful = baseHelpful + 1
  } else if (userVote === 'notHelpful') {
    displayNotHelpful = baseNotHelpful + 1
  }

  return (
    <div className="border border-platinum-300 rounded-lg p-6 hover:border-platinum-400 transition-colors">
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-4">
        <HelpCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="font-medium text-anthracite-900">{question.question}</p>
            {question.verified && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                <Check className="w-3 h-3 mr-1" />
                Achat vérifié
              </Badge>
            )}
          </div>
          
          {/* Author and Time */}
          <div className="flex items-center gap-2 text-sm text-nuanced-500 mb-3">
            {question.author && (
              <>
                <span className="font-medium">{question.author.name}</span>
                <span>•</span>
              </>
            )}
            {timeAgo && <span>{timeAgo}</span>}
          </div>

          {/* Official Answer */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
            {displayAnswer.isOfficial && (
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <Badge className="bg-green-600 text-white text-xs">
                  Réponse vérifiée (Vendeur officiel)
                </Badge>
              </div>
            )}
            <p className="text-nuanced-700">{displayAnswer.text}</p>
          </div>

          {/* Additional Answers */}
          {additionalAnswersCount > 0 && (
            <div className="mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="text-orange-500 hover:text-orange-600"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {expanded ? 'Masquer' : `Voir ${additionalAnswersCount} autre${additionalAnswersCount > 1 ? 's' : ''} réponse${additionalAnswersCount > 1 ? 's' : ''}`}
              </Button>
              
              {expanded && question.answers && question.answers.slice(1).map((answer) => (
                <div key={answer.id} className="bg-platinum-50 border border-platinum-200 rounded-lg p-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-nuanced-500 mb-2">
                    <span className="font-medium">{answer.author.name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(answer.createdAt, { addSuffix: true, locale: fr })}</span>
                  </div>
                  <p className="text-nuanced-700">{answer.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Helpful Voting */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote('helpful')}
                className={userVote === 'helpful' ? 'text-green-600 bg-green-50' : 'text-nuanced-500'}
                aria-pressed={userVote === 'helpful'}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span className="text-sm">{displayHelpful}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote('notHelpful')}
                className={userVote === 'notHelpful' ? 'text-red-600 bg-red-50' : 'text-nuanced-500'}
                aria-pressed={userVote === 'notHelpful'}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                <span className="text-sm">{displayNotHelpful}</span>
              </Button>
            </div>

            {/* Reply Button (placeholder) */}
            <Button variant="ghost" size="sm" className="text-nuanced-500 hover:text-orange-500">
              <MessageCircle className="w-4 h-4 mr-2" />
              Répondre
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Ask Question Modal Component
 */
interface AskQuestionModalProps {
  open: boolean
  onClose: () => void
  product: Product
}

function AskQuestionModal({ open, onClose, product }: AskQuestionModalProps) {
  const [questionText, setQuestionText] = useState('')

  const handleSubmit = () => {
    // TODO: Implement actual question submission to API
    console.log('Question submitted:', {
      productId: product.id,
      question: questionText,
    })
    
    // Show success message (would use useToast in production)
    alert('Votre question a été soumise avec succès ! Elle sera visible après modération.')
    setQuestionText('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Poser une question sur ce produit</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 bg-platinum-50 rounded-lg">
            {product.images[0] && (
              <Image
                src={product.images[0].url}
                alt={product.name}
                width={60}
                height={60}
                className="rounded object-cover"
              />
            )}
            <div>
              <p className="font-medium text-sm text-anthracite-900">{product.name}</p>
              <p className="text-sm text-nuanced-500">{product.price.toFixed(2)} €</p>
            </div>
          </div>

          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-anthracite-900 mb-2">
              Votre question *
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Posez une question sur ce produit..."
              className="w-full min-h-[120px] p-3 border border-platinum-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-nuanced-500 mt-1">
              {questionText.length} / 500 caractères
            </p>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 Votre question sera visible publiquement après validation par notre équipe.
              Vous recevrez une notification par email lorsqu'une réponse sera publiée.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={questionText.trim().length < 10}
            >
              Envoyer la question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

