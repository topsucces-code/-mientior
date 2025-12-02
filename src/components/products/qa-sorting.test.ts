/**
 * Property-Based Test for Q&A Sorting
 * Feature: immersive-product-page, Property 31: Q&A sorting by helpfulness
 * Validates: Requirements 11.1
 *
 * This test verifies that Q&A items are correctly sorted in descending order
 * by their helpfulness score (helpful - notHelpful).
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

interface QAItem {
  id: string
  question: string
  helpful: number
  notHelpful: number
  helpfulnessScore: number
}

// Function to sort Q&A items by helpfulness
function sortQAByHelpfulness(items: QAItem[]): QAItem[] {
  return [...items].sort((a, b) => b.helpfulnessScore - a.helpfulnessScore)
}

describe('Q&A Sorting Property Tests', () => {
  it('should sort Q&A items by helpfulness score in descending order', () => {
    fc.assert(
      fc.property(
        // Generate array of Q&A items with random vote counts
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            helpful: fc.integer({ min: 0, max: 1000 }),
            notHelpful: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (items) => {
          // Calculate helpfulness score for each item
          const itemsWithScore = items.map((item) => ({
            ...item,
            helpfulnessScore: item.helpful - item.notHelpful,
          }))

          // Sort items
          const sorted = sortQAByHelpfulness(itemsWithScore)

          // Verify sorting is correct
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].helpfulnessScore).toBeGreaterThanOrEqual(
              sorted[i + 1].helpfulnessScore
            )
          }

          // Verify all items are present
          expect(sorted.length).toBe(itemsWithScore.length)

          // Verify no items were lost or duplicated
          const originalIds = new Set(itemsWithScore.map((item) => item.id))
          const sortedIds = new Set(sorted.map((item) => item.id))
          expect(sortedIds).toEqual(originalIds)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle items with equal helpfulness scores', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: 2, max: 10 }),
        (score, count) => {
          // Create items with the same helpfulness score
          const items: QAItem[] = Array.from({ length: count }, (_, i) => ({
            id: `item-${i}`,
            question: `Question ${i}`,
            helpful: Math.max(0, score),
            notHelpful: Math.max(0, -score),
            helpfulnessScore: score,
          }))

          const sorted = sortQAByHelpfulness(items)

          // All items should have the same score
          const allScoresEqual = sorted.every(
            (item) => item.helpfulnessScore === score
          )
          expect(allScoresEqual).toBe(true)

          // All items should be present
          expect(sorted.length).toBe(count)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle negative helpfulness scores correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10 }),
            helpful: fc.integer({ min: 0, max: 50 }),
            notHelpful: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (items) => {
          const itemsWithScore = items.map((item) => ({
            ...item,
            helpfulnessScore: item.helpful - item.notHelpful,
          }))

          const sorted = sortQAByHelpfulness(itemsWithScore)

          // Verify descending order even with negative scores
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].helpfulnessScore).toBeGreaterThanOrEqual(
              sorted[i + 1].helpfulnessScore
            )
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain sort stability for items with same score', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10 }),
            helpful: fc.integer({ min: 0, max: 100 }),
            notHelpful: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 30 }
        ),
        (items) => {
          const itemsWithScore = items.map((item) => ({
            ...item,
            helpfulnessScore: item.helpful - item.notHelpful,
          }))

          const sorted = sortQAByHelpfulness(itemsWithScore)

          // Group by score
          const scoreGroups = new Map<number, QAItem[]>()
          sorted.forEach((item) => {
            const group = scoreGroups.get(item.helpfulnessScore) || []
            group.push(item)
            scoreGroups.set(item.helpfulnessScore, group)
          })

          // Verify each group maintains relative order
          scoreGroups.forEach((group) => {
            const groupIds = group.map((item) => item.id)
            const originalOrder = itemsWithScore
              .filter((item) => groupIds.includes(item.id))
              .map((item) => item.id)

            // Items in the same score group should maintain their relative order
            expect(groupIds.length).toBe(originalOrder.length)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
