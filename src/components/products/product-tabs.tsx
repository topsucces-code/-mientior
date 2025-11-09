'use client'

/**
 * Product tabs component for Description, Specifications, and Reviews sections
 */

import { useState } from 'react'
import { FileText, ListChecks, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StarRating } from '@/components/ui/star-rating'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Product, Review, ReviewStats } from '@/types'

interface ProductTabsProps {
  product: Product
  reviews?: Review[]
  reviewStats?: ReviewStats
}

export function ProductTabs({ product, reviews = [], reviewStats }: ProductTabsProps) {
  const [reviewSort, setReviewSort] = useState<'recent' | 'helpful' | 'rating'>('recent')

  // Sort reviews based on selected option
  const sortedReviews = [...reviews].sort((a, b) => {
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

  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="w-full justify-start border-b border-platinum-300 bg-transparent rounded-none h-auto p-0">
        <TabsTrigger
          value="description"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
        >
          <FileText className="w-4 h-4" />
          Description
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
        >
          <ListChecks className="w-4 h-4" />
          Caractéristiques
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
        >
          <MessageSquare className="w-4 h-4" />
          Avis ({reviews.length})
        </TabsTrigger>
      </TabsList>

      {/* Description Tab */}
      <TabsContent value="description" className="mt-8 space-y-6">
        <div className="prose prose-sm max-w-none">
          {product.description ? (
            <p className="text-nuanced-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          ) : (
            <p className="text-nuanced-500 italic">Aucune description disponible pour ce produit.</p>
          )}
        </div>

        {/* Key Features */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-anthracite-900 mb-4">Points clés</h3>
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
      <TabsContent value="specifications" className="mt-8">
        {product.specifications && Object.keys(product.specifications).length > 0 ? (
          <div className="divide-y divide-platinum-200">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex py-4">
                <dt className="w-1/3 font-medium text-anthracite-900">{key}</dt>
                <dd className="w-2/3 text-nuanced-700">{value}</dd>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-nuanced-500 italic py-8">Aucune caractéristique technique disponible.</p>
        )}
      </TabsContent>

      {/* Reviews Tab */}
      <TabsContent value="reviews" className="mt-8 space-y-8">
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
                    <div key={rating} className="flex items-center gap-3">
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
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sort Options */}
        {reviews.length > 0 && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-anthracite-900">
              Avis clients ({reviews.length})
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
        <div className="space-y-6">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-nuanced-400 mx-auto mb-4" />
              <p className="text-nuanced-600 mb-4">Aucun avis pour ce produit.</p>
              <Button variant="outline">Soyez le premier à donner votre avis</Button>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {reviews.length > 5 && (
          <div className="text-center pt-4">
            <Button variant="outline" className="min-w-[200px]">
              Voir plus d'avis
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

function ReviewItem({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(review.helpful)
  const [notHelpful, setNotHelpful] = useState(review.notHelpful)
  const [userVote, setUserVote] = useState<'helpful' | 'not-helpful' | null>(null)

  const handleVote = (type: 'helpful' | 'not-helpful') => {
    if (userVote === type) {
      // Remove vote
      if (type === 'helpful') {
        setHelpful((prev) => prev - 1)
      } else {
        setNotHelpful((prev) => prev - 1)
      }
      setUserVote(null)
    } else {
      // Add or change vote
      if (userVote === 'helpful') {
        setHelpful((prev) => prev - 1)
      } else if (userVote === 'not-helpful') {
        setNotHelpful((prev) => prev - 1)
      }

      if (type === 'helpful') {
        setHelpful((prev) => prev + 1)
      } else {
        setNotHelpful((prev) => prev + 1)
      }
      setUserVote(type)
    }
  }

  return (
    <div className="border border-platinum-200 rounded-lg p-6 space-y-4">
      {/* Review Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            {review.userAvatar ? (
              <img src={review.userAvatar} alt={review.userName} />
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
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-bold text-anthracite-900">{review.title}</h4>
      )}

      {/* Review Comment */}
      <p className="text-nuanced-700 leading-relaxed">{review.comment}</p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2">
          {review.images.map((image, index) => (
            <div
              key={index}
              className="w-20 h-20 rounded-lg overflow-hidden border border-platinum-200"
            >
              <img
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
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

      {/* Seller Response */}
      {review.response && (
        <div className="bg-platinum-50 rounded-lg p-4 border-l-4 border-orange-500">
          <p className="text-sm font-medium text-anthracite-900 mb-2">
            Réponse du vendeur - {new Date(review.response.respondedAt).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-sm text-nuanced-700">{review.response.text}</p>
        </div>
      )}
    </div>
  )
}
