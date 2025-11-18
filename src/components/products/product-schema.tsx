import type { Product, Review } from '@/types'

interface ProductSchemaProps {
  product: Product
  reviews?: Review[]
}

export function ProductSchema({ product, reviews = [] }: ProductSchemaProps) {
  // Calculer la note moyenne et le nombre d'avis
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0

  // Déterminer le prix et la disponibilité
  const price = product.price // Use current selling price, not compareAtPrice
  const availability = product.stock && product.stock > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'

  // Construire l'URL du produit
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`
  
  // Validate vendor business name
  const validBusinessName = product.vendor?.businessName?.trim()
  const brandName = validBusinessName || 'Mientior'

  // Schema Product principal
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.url),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EUR',
      price: price.toFixed(2),
      availability,
      seller: {
        '@type': 'Organization',
        name: brandName,
      },
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ).toISOString().split('T')[0],
    },
    aggregateRating: totalReviews > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: averageRating.toFixed(1),
          reviewCount: totalReviews,
          bestRating: '5',
          worstRating: '1',
        }
      : undefined,
    review: reviews.slice(0, 5).map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.userName,
      },
      datePublished: review.createdAt instanceof Date
        ? review.createdAt.toISOString()
        : new Date(review.createdAt).toISOString(),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: review.comment,
    })),
  }

  // Nettoyer les propriétés undefined
  const cleanSchema = JSON.parse(JSON.stringify(productSchema))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(cleanSchema),
      }}
    />
  )
}
