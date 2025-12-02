/**
 * Property-Based Test for Q&A Search Filtering
 * Feature: immersive-product-page, Property 32: Q&A search filtering
 * Validates: Requirements 11.2
 *
 * This test verifies that Q&A search correctly filters items where the query
 * appears as a substring in either the question or answer (case-insensitive).
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

interface QAItem {
  id: string
  question: string
  answers?: Array<{ answer: string }>
}

// Function to filter Q&A items by search query
function filterQABySearch(items: QAItem[], query: string): QAItem[] {
  if (!query.trim()) return items

  const lowerQuery = query.toLowerCase()

  return items.filter((item) => {
    // Check if query matches question
    if (item.question.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Check if query matches any answer
    if (item.answers) {
      return item.answers.some((answer) =>
        answer.answer.toLowerCase().includes(lowerQuery)
      )
    }

    return false
  })
}

describe('Q&A Search Filtering Property Tests', () => {
  it('should return all items when query is empty', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answers: fc.option(
              fc.array(
                fc.record({
                  answer: fc.string({ minLength: 10, maxLength: 200 }),
                }),
                { minLength: 0, maxLength: 5 }
              )
            ),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (items) => {
          const filtered = filterQABySearch(items, '')
          expect(filtered.length).toBe(items.length)
          expect(filtered).toEqual(items)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all items when query is only whitespace', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answers: fc.option(
              fc.array(
                fc.record({
                  answer: fc.string({ minLength: 10, maxLength: 200 }),
                }),
                { minLength: 0, maxLength: 5 }
              )
            ),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        fc.stringMatching(/^\s+$/), // Only whitespace
        (items, query) => {
          const filtered = filterQABySearch(items, query)
          expect(filtered.length).toBe(items.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should filter items where query matches question (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }), // Search term
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answers: fc.option(
              fc.array(
                fc.record({
                  answer: fc.string({ minLength: 10, maxLength: 200 }),
                }),
                { minLength: 0, maxLength: 3 }
              )
            ),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (searchTerm, items) => {
          // Add search term to some questions
          const itemsWithTerm = items.map((item, index) => ({
            ...item,
            question:
              index % 2 === 0
                ? `${item.question} ${searchTerm}`
                : item.question,
          }))

          const filtered = filterQABySearch(itemsWithTerm, searchTerm)

          // All filtered items should contain the search term in question or answers
          filtered.forEach((item) => {
            const questionMatches = item.question
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
            const answerMatches =
              item.answers?.some((a) =>
                a.answer.toLowerCase().includes(searchTerm.toLowerCase())
              ) || false

            expect(questionMatches || answerMatches).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should filter items where query matches answer (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }), // Search term
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answers: fc.array(
              fc.record({
                answer: fc.string({ minLength: 10, maxLength: 200 }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (searchTerm, items) => {
          // Add search term to some answers
          const itemsWithTerm = items.map((item, index) => ({
            ...item,
            answers:
              index % 2 === 0
                ? item.answers.map((a, i) =>
                    i === 0 ? { answer: `${a.answer} ${searchTerm}` } : a
                  )
                : item.answers,
          }))

          const filtered = filterQABySearch(itemsWithTerm, searchTerm)

          // All filtered items should contain the search term
          filtered.forEach((item) => {
            const questionMatches = item.question
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
            const answerMatches =
              item.answers?.some((a) =>
                a.answer.toLowerCase().includes(searchTerm.toLowerCase())
              ) || false

            expect(questionMatches || answerMatches).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should be case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }), // Search term
        fc.constantFrom('lower', 'UPPER', 'MiXeD'), // Case variant
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answers: fc.option(
              fc.array(
                fc.record({
                  answer: fc.string({ minLength: 10, maxLength: 200 }),
                }),
                { minLength: 0, maxLength: 3 }
              )
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (searchTerm, caseVariant, items) => {
          // Transform search term based on case variant
          let transformedTerm = searchTerm
          if (caseVariant === 'lower') {
            transformedTerm = searchTerm.toLowerCase()
          } else if (caseVariant === 'UPPER') {
            transformedTerm = searchTerm.toUpperCase()
          }

          // Add original search term to first item's question
          const itemsWithTerm = [
            { ...items[0], question: `${items[0].question} ${searchTerm}` },
            ...items.slice(1),
          ]

          const filtered = filterQABySearch(itemsWithTerm, transformedTerm)

          // Should find the item regardless of case
          expect(filtered.length).toBeGreaterThan(0)
          expect(
            filtered[0].question
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          ).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return empty array when no matches found', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.constant('What is the product made of?'),
            answers: fc.constant([
              { answer: 'The product is made of high-quality materials.' },
            ]),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          // Search for something that definitely doesn't exist
          const filtered = filterQABySearch(items, 'XYZABC123NOTFOUND')

          expect(filtered.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle items without answers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }),
        fc.array(
          fc.record({
            id: fc.uuid(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answers: fc.constant(undefined), // No answers
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (searchTerm, items) => {
          // Add search term to some questions
          const itemsWithTerm = items.map((item, index) => ({
            ...item,
            question:
              index === 0 ? `${item.question} ${searchTerm}` : item.question,
          }))

          const filtered = filterQABySearch(itemsWithTerm, searchTerm)

          // Should still filter based on question
          expect(filtered.length).toBeGreaterThan(0)
          filtered.forEach((item) => {
            expect(
              item.question.toLowerCase().includes(searchTerm.toLowerCase())
            ).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
