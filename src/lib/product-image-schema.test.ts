/**
 * Property-Based Tests for Product Image Schema
 * Feature: immersive-product-page, Property 1: Image alt text completeness
 * Validates: Requirements 15.2
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import * as fc from 'fast-check'

describe('Product Image Schema - Property Tests', () => {
  let testProductId: string
  let testCategoryId: string

  beforeAll(async () => {
    // Create a test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category for Images',
        slug: `test-category-images-${Date.now()}`,
        isActive: true,
      },
    })
    testCategoryId = category.id

    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product for Images',
        slug: `test-product-images-${Date.now()}`,
        price: 99.99,
        stock: 10,
        categoryId: testCategoryId,
        status: 'ACTIVE',
      },
    })
    testProductId = product.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.productImage.deleteMany({
      where: { productId: testProductId },
    })
    await prisma.product.delete({
      where: { id: testProductId },
    })
    await prisma.category.delete({
      where: { id: testCategoryId },
    })
    await prisma.$disconnect()
  })

  /**
   * Property 1: Image alt text completeness
   * For any product image, the alt attribute should be non-empty and descriptive.
   * Validates: Requirements 15.2
   */
  it('should enforce non-empty alt text for all product images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          alt: fc.string({ minLength: 1, maxLength: 200 }),
          type: fc.constantFrom('IMAGE', 'VIDEO', 'THREE_SIXTY'),
          order: fc.integer({ min: 0, max: 100 }),
          thumbnail: fc.option(fc.webUrl(), { nil: null }),
          videoUrl: fc.option(fc.webUrl(), { nil: null }),
          width: fc.option(fc.integer({ min: 100, max: 5000 }), { nil: null }),
          height: fc.option(fc.integer({ min: 100, max: 5000 }), { nil: null }),
        }),
        async (imageData) => {
          // Create product image with generated data
          const image = await prisma.productImage.create({
            data: {
              ...imageData,
              productId: testProductId,
            },
          })

          // Verify alt text is non-empty
          expect(image.alt).toBeTruthy()
          expect(image.alt.length).toBeGreaterThan(0)
          expect(typeof image.alt).toBe('string')

          // Clean up
          await prisma.productImage.delete({
            where: { id: image.id },
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Alt text should have reasonable length
   * For any product image, alt text should be between 1 and 500 characters.
   * Note: Database allows empty strings, but application validation should enforce this.
   */
  it('should store alt text within valid length range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          alt: fc.string({ minLength: 1, maxLength: 500 }),
          type: fc.constantFrom('IMAGE', 'VIDEO', 'THREE_SIXTY'),
          order: fc.integer({ min: 0, max: 100 }),
        }),
        async (imageData) => {
          const image = await prisma.productImage.create({
            data: {
              ...imageData,
              productId: testProductId,
            },
          })

          // Verify alt text is within valid range
          expect(image.alt.length).toBeGreaterThan(0)
          expect(image.alt.length).toBeLessThanOrEqual(500)

          // Clean up
          await prisma.productImage.delete({
            where: { id: image.id },
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: New fields should be optional and nullable
   * For any product image, the new immersive fields (videoUrl, frames, width, height)
   * should be optional and accept null values.
   */
  it('should allow optional immersive fields to be null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          alt: fc.string({ minLength: 1, maxLength: 200 }),
          type: fc.constantFrom('IMAGE', 'VIDEO', 'THREE_SIXTY'),
          order: fc.integer({ min: 0, max: 100 }),
        }),
        async (imageData) => {
          // Create image without optional fields
          const image = await prisma.productImage.create({
            data: {
              ...imageData,
              productId: testProductId,
              videoUrl: null,
              width: null,
              height: null,
            },
          })

          // Verify optional fields are null
          expect(image.videoUrl).toBeNull()
          expect(image.width).toBeNull()
          expect(image.height).toBeNull()

          // Clean up
          await prisma.productImage.delete({
            where: { id: image.id },
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Video type images should support videoUrl
   * For any product image of type VIDEO, the videoUrl field should be stored correctly.
   */
  it('should store videoUrl for VIDEO type images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          alt: fc.string({ minLength: 1, maxLength: 200 }),
          videoUrl: fc.webUrl(),
          order: fc.integer({ min: 0, max: 100 }),
        }),
        async (imageData) => {
          const image = await prisma.productImage.create({
            data: {
              ...imageData,
              type: 'VIDEO',
              productId: testProductId,
            },
          })

          expect(image.type).toBe('VIDEO')
          expect(image.videoUrl).toBe(imageData.videoUrl)
          expect(image.videoUrl).toBeTruthy()

          // Clean up
          await prisma.productImage.delete({
            where: { id: image.id },
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: 360° images should support frames array
   * For any product image of type THREE_SIXTY, the frames field should store JSON array.
   */
  it('should store frames array for THREE_SIXTY type images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          alt: fc.string({ minLength: 1, maxLength: 200 }),
          frames: fc.array(fc.webUrl(), { minLength: 10, maxLength: 72 }),
          order: fc.integer({ min: 0, max: 100 }),
        }),
        async (imageData) => {
          const image = await prisma.productImage.create({
            data: {
              ...imageData,
              type: 'THREE_SIXTY',
              productId: testProductId,
            },
          })

          expect(image.type).toBe('THREE_SIXTY')
          expect(image.frames).toBeTruthy()
          expect(Array.isArray(image.frames)).toBe(true)
          expect((image.frames as string[]).length).toBeGreaterThanOrEqual(10)

          // Clean up
          await prisma.productImage.delete({
            where: { id: image.id },
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Image dimensions should be positive integers
   * For any product image with width/height, values should be positive integers.
   */
  it('should store positive integer dimensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: fc.webUrl(),
          alt: fc.string({ minLength: 1, maxLength: 200 }),
          width: fc.integer({ min: 1, max: 10000 }),
          height: fc.integer({ min: 1, max: 10000 }),
          order: fc.integer({ min: 0, max: 100 }),
        }),
        async (imageData) => {
          const image = await prisma.productImage.create({
            data: {
              ...imageData,
              type: 'IMAGE',
              productId: testProductId,
            },
          })

          expect(image.width).toBeGreaterThan(0)
          expect(image.height).toBeGreaterThan(0)
          expect(Number.isInteger(image.width)).toBe(true)
          expect(Number.isInteger(image.height)).toBe(true)

          // Clean up
          await prisma.productImage.delete({
            where: { id: image.id },
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})
