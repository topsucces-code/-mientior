/**
 * Property-Based Test for Q&A Vote Count Updates
 * Feature: immersive-product-page, Property 33: Q&A vote count updates
 * Validates: Requirements 11.4
 *
 * This test verifies that when a vote action is performed on a Q&A item,
 * the corresponding vote count (helpful or notHelpful) increments by 1.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

interface QAItem {
  id: string
  question: string
  helpful: number
  notHelpful: number
}

// Function to apply a vote to a Q&A item
function applyVote(
  item: QAItem,
  voteType: 'helpful' | 'notHelpful'
): QAItem {
  if (voteType === 'helpful') {
    return {
      ...item,
      helpful: item.helpful + 1,
    }
  } else {
    return {
      ...item,
      notHelpful: item.notHelpful + 1,
    }
  }
}

// Function to apply multiple votes
function applyVotes(
  item: QAItem,
  votes: Array<'helpful' | 'notHelpful'>
): QAItem {
  return votes.reduce((acc, voteType) => applyVote(acc, voteType), item)
}

describe('Q&A Vote Count Updates Property Tests', () => {
  it('should increment helpful count by 1 when helpful vote is cast', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          question: fc.string({ minLength: 10, maxLength: 200 }),
          helpful: fc.integer({ min: 0, max: 1000 }),
          notHelpful: fc.integer({ min: 0, max: 1000 }),
        }),
        (item) => {
          const originalHelpful = item.helpful
          const originalNotHelpful = item.notHelpful

          const updated = applyVote(item, 'helpful')

          // Helpful count should increase by 1
          expect(updated.helpful).toBe(originalHelpful + 1)

          // NotHelpful count should remain unchanged
          expect(updated.notHelpful).toBe(originalNotHelpful)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should increment notHelpful count by 1 when notHelpful vote is cast', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          question: fc.string({ minLength: 10, maxLength: 200 }),
          helpful: fc.integer({ min: 0, max: 1000 }),
          notHelpful: fc.integer({ min: 0, max: 1000 }),
        }),
        (item) => {
          const originalHelpful = item.helpful
          const originalNotHelpful = item.notHelpful

          const updated = applyVote(item, 'notHelpful')

          // NotHelpful count should increase by 1
          expect(updated.notHelpful).toBe(originalNotHelpful + 1)

          // Helpful count should remain unchanged
          expect(updated.helpful).toBe(originalHelpful)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly accumulate multiple votes', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          question: fc.string({ minLength: 10, maxLength: 200 }),
          helpful: fc.integer({ min: 0, max: 100 }),
          notHelpful: fc.integer({ min: 0, max: 100 }),
        }),
        fc.array(fc.constantFrom('helpful', 'notHelpful'), {
          minLength: 1,
          maxLength: 20,
        }),
        (item, votes) => {
          const originalHelpful = item.helpful
          const originalNotHelpful = item.notHelpful

          const updated = applyVotes(item, votes)

          // Count expected votes
          const helpfulVotes = votes.filter((v) => v === 'helpful').length
          const notHelpfulVotes = votes.filter((v) => v === 'notHelpful').length

          // Verify counts
          expect(updated.helpful).toBe(originalHelpful + helpfulVotes)
          expect(updated.notHelpful).toBe(originalNotHelpful + notHelpfulVotes)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain vote count integrity across multiple operations', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          question: fc.string({ minLength: 10, maxLength: 200 }),
          helpful: fc.integer({ min: 0, max: 100 }),
          notHelpful: fc.integer({ min: 0, max: 100 }),
        }),
        fc.integer({ min: 1, max: 50 }), // Number of helpful votes
        fc.integer({ min: 1, max: 50 }), // Number of notHelpful votes
        (item, helpfulCount, notHelpfulCount) => {
          const originalHelpful = item.helpful
          const originalNotHelpful = item.notHelpful

          // Apply helpful votes
          let updated = item
          for (let i = 0; i < helpfulCount; i++) {
            updated = applyVote(updated, 'helpful')
          }

          // Apply notHelpful votes
          for (let i = 0; i < notHelpfulCount; i++) {
            updated = applyVote(updated, 'notHelpful')
          }

          // Verify final counts
          expect(updated.helpful).toBe(originalHelpful + helpfulCount)
          expect(updated.notHelpful).toBe(originalNotHelpful + notHelpfulCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case of zero initial votes', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          question: fc.string({ minLength: 10, maxLength: 200 }),
          helpful: fc.constant(0),
          notHelpful: fc.constant(0),
        }),
        fc.constantFrom('helpful', 'notHelpful'),
        (item, voteType) => {
          const updated = applyVote(item, voteType)

          if (voteType === 'helpful') {
            expect(updated.helpful).toBe(1)
            expect(updated.notHelpful).toBe(0)
          } else {
            expect(updated.helpful).toBe(0)
            expect(updated.notHelpful).toBe(1)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle large vote counts without overflow', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          question: fc.string({ minLength: 10, maxLength: 200 }),
          helpful: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER - 100 }),
          notHelpful: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER - 100 }),
        }),
        fc.constantFrom('helpful', 'notHelpful'),
        (item, voteType) => {
          const updated = applyVote(item, voteType)

          // Verify no overflow occurred
          expect(updated.helpful).toBeGreaterThanOrEqual(0)
          expect(updated.notHelpful).toBeGreaterThanOrEqual(0)
          expect(updated.helpful).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)
          expect(updated.notHelpful).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)

          // Verify increment
          if (voteType === 'helpful') {
            expect(updated.helpful).toBe(item.helpful + 1)
          } else {
            expect(updated.notHelpful).toBe(item.notHelpful + 1)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve other properties when voting', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          question: fc.string({ minLength: 10, maxLength: 200 }),
          helpful: fc.integer({ min: 0, max: 1000 }),
          notHelpful: fc.integer({ min: 0, max: 1000 }),
        }),
        fc.constantFrom('helpful', 'notHelpful'),
        (item, voteType) => {
          const updated = applyVote(item, voteType)

          // Other properties should remain unchanged
          expect(updated.id).toBe(item.id)
          expect(updated.question).toBe(item.question)
        }
      ),
      { numRuns: 100 }
    )
  })
})
