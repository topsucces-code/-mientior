/**
 * Centralized API client for all frontend requests
 */

import type {
  Product,
  Category,
  Order,
  Review,
  ReviewStats,
  Filter,
  SortOption,
  ShippingOption,
  Address,
  SearchSuggestion,
  SearchResults,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ==================== ERROR HANDLING ====================

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, errorData.error || response.statusText, errorData)
  }
  return response.json()
}

// ==================== PRODUCT APIs ====================

export async function searchProducts(
  query?: string,
  filters?: Filter,
  sort: SortOption = 'relevance',
  page = 1,
  limit = 24
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
  })

  if (query) params.append('q', query)
  if (filters?.priceRange) {
    params.append('price_min', filters.priceRange.min.toString())
    params.append('price_max', filters.priceRange.max.toString())
  }
  if (filters?.categories) {
    filters.categories.forEach((cat) => params.append('categories[]', cat))
  }
  if (filters?.brands) {
    filters.brands.forEach((brand) => params.append('brands[]', brand))
  }
  if (filters?.colors) {
    filters.colors.forEach((color) => params.append('colors[]', color))
  }
  if (filters?.sizes) {
    filters.sizes.forEach((size) => params.append('sizes[]', size))
  }
  if (filters?.rating !== undefined) {
    params.append('rating', filters.rating.toString())
  }
  if (filters?.inStock !== undefined) {
    params.append('inStock', filters.inStock.toString())
  }
  if (filters?.onSale !== undefined) {
    params.append('onSale', filters.onSale.toString())
  }

  const response = await fetch(`${API_BASE_URL}/api/products/search?${params}`)
  return handleResponse<PaginatedResponse<Product>>(response)
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/products/${slug}`)
  return handleResponse<Product>(response)
}

export async function getRelatedProducts(productId: string, limit = 6): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/related?limit=${limit}`)
  const data = await handleResponse<ApiResponse<Product[]>>(response)
  return data.data
}

export async function getProductReviews(
  productId: string,
  page = 1,
  sort: 'recent' | 'helpful' | 'rating' = 'recent',
  filters?: { withPhotos?: boolean; verified?: boolean; rating?: number }
): Promise<{ reviews: Review[]; stats: ReviewStats; totalCount: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    sort,
  })

  if (filters?.withPhotos) params.append('withPhotos', 'true')
  if (filters?.verified) params.append('verified', 'true')
  if (filters?.rating) params.append('rating', filters.rating.toString())

  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews?${params}`)
  return handleResponse<{ reviews: Review[]; stats: ReviewStats; totalCount: number }>(response)
}

export async function submitReview(
  productId: string,
  review: {
    rating: number
    title?: string
    comment: string
    images?: File[]
  }
): Promise<ApiResponse<Review>> {
  const formData = new FormData()
  formData.append('rating', review.rating.toString())
  if (review.title) formData.append('title', review.title)
  formData.append('comment', review.comment)
  if (review.images) {
    review.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image)
    })
  }

  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse<ApiResponse<Review>>(response)
}

// ==================== CATEGORY APIs ====================

export async function getCategories(parentId?: string): Promise<Category[]> {
  const params = parentId ? `?parent=${parentId}` : ''
  const response = await fetch(`${API_BASE_URL}/api/categories${params}`)
  const data = await handleResponse<ApiResponse<Category[]>>(response)
  return data.data
}

export async function getCategoryProducts(
  slug: string,
  filters?: Filter,
  sort: SortOption = 'relevance',
  page = 1,
  limit = 24
): Promise<PaginatedResponse<Product>> {
  return searchProducts(undefined, { ...filters, categories: [slug] }, sort, page, limit)
}

// ==================== SHIPPING APIs ====================

export async function getShippingOptions(
  address: Address,
  items: { productId: string; quantity: number }[]
): Promise<ShippingOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/checkout/shipping-options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, items }),
  })
  const data = await handleResponse<ApiResponse<ShippingOption[]>>(response)
  return data.data
}

export async function validateAddress(address: Address): Promise<{ valid: boolean; suggestions?: Address[] }> {
  const response = await fetch(`${API_BASE_URL}/api/checkout/validate-address`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(address),
  })
  return handleResponse<{ valid: boolean; suggestions?: Address[] }>(response)
}

// ==================== PAYMENT APIs ====================

export async function createPaymentIntent(
  amount: number,
  currency: string,
  orderId?: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const response = await fetch(`${API_BASE_URL}/api/checkout/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency, orderId }),
  })
  return handleResponse<{ clientSecret: string; paymentIntentId: string }>(response)
}

// ==================== ORDER APIs ====================

export async function createOrder(orderData: {
  items: Array<{ productId: string; variantId?: string; quantity: number }>
  shippingAddress: Address
  billingAddress?: Address
  shippingOption: string
  paymentIntentId: string
  promoCode?: string
}): Promise<{ orderId: string; orderNumber: string; estimatedDelivery: { min: Date; max: Date } }> {
  const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })
  // Server returns dates as ISO strings; parse them to Date objects
  const data = await handleResponse<{ orderId: string; orderNumber: string; estimatedDelivery: { min: string; max: string } }>(
    response
  )
  return {
    ...data,
    estimatedDelivery: {
      min: new Date(data.estimatedDelivery.min),
      max: new Date(data.estimatedDelivery.max),
    },
  }
}

export async function getUserOrders(page = 1, limit = 10): Promise<PaginatedResponse<Order>> {
  const response = await fetch(`${API_BASE_URL}/api/orders?page=${page}&limit=${limit}`)
  return handleResponse<PaginatedResponse<Order>>(response)
}

export async function getOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`)
  return handleResponse<Order>(response)
}

export async function trackOrder(orderNumber: string): Promise<{
  order: Order
  tracking: {
    status: string
    location: string
    timestamp: Date
    events: Array<{ status: string; location: string; timestamp: Date; description: string }>
  }
}> {
  const response = await fetch(`${API_BASE_URL}/api/orders/track/${orderNumber}`)
  return handleResponse<any>(response)
}

// ==================== SEARCH APIs ====================

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) return []

  const response = await fetch(`${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(query)}`)
  const data = await handleResponse<{ suggestions: SearchSuggestion[] }>(response)
  return data.suggestions
}

export async function getTrendingSearches(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/search/trending`)
  const data = await handleResponse<ApiResponse<string[]>>(response)
  return data.data
}

export async function performSearch(
  query: string,
  filters?: { type?: 'all' | 'products' | 'brands' | 'articles' | 'videos' },
  page = 1
): Promise<SearchResults & { totalCount: number }> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
  })

  if (filters?.type && filters.type !== 'all') {
    params.append('type', filters.type)
  }

  const response = await fetch(`${API_BASE_URL}/api/search?${params}`)
  return handleResponse<SearchResults & { totalCount: number }>(response)
}

// ==================== USER APIs ====================

export async function updateRecentlyViewed(productId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/user/recently-viewed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId }),
  })
}

export async function saveAddress(address: Address): Promise<ApiResponse<Address>> {
  const response = await fetch(`${API_BASE_URL}/api/user/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(address),
  })
  return handleResponse<ApiResponse<Address>>(response)
}

// ==================== PROMO CODE APIs ====================

export async function validatePromoCode(code: string, cartTotal: number): Promise<{
  valid: boolean
  discount: number
  discountType: 'percentage' | 'fixed'
  message?: string
}> {
  const response = await fetch(`${API_BASE_URL}/api/promo/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, cartTotal }),
  })
  return handleResponse<{
    valid: boolean
    discount: number
    discountType: 'percentage' | 'fixed'
    message?: string
  }>(response)
}

// ==================== WISHLIST SYNC API ====================

export async function syncWishlist(productIds: string[]): Promise<void> {
  await fetch(`${API_BASE_URL}/api/user/wishlist/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productIds }),
  })
}

// ==================== EXPORT ====================

export { ApiError }
