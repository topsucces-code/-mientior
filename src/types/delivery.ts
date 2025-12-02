/**
 * Delivery estimation types for immersive product page
 */

export interface ShippingOption {
  id: string
  name: string
  price: number
  estimatedDays: number
  description: string
}

export interface DeliveryEstimate {
  minDate: Date
  maxDate: Date
  shippingOption: ShippingOption
  processingDays: number
}

export interface Location {
  country?: string
  region?: string
  city?: string
  postalCode?: string
}

export interface DeliveryCalculationParams {
  productId: string
  variantId?: string
  location?: Location
  shippingMethod?: string
  processingDays: number
  isBackordered?: boolean
  restockDate?: Date
}
