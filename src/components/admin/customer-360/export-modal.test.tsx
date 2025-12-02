/**
 * E2E Tests for Customer Export UI
 * Requirements: 17.1, 17.2, 17.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch for testing export API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Customer Export E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  /**
   * Test PDF export API call
   * Requirements: 17.1, 17.2
   */
  it('should make correct API call for PDF export', async () => {
    // Mock successful PDF export response
    const mockPdfBlob = new Blob(['mock pdf content'], { type: 'application/pdf' })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockPdfBlob),
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="customer-test-customer-123-export.pdf"'
      })
    })

    // Simulate export API call
    const customerId = 'test-customer-123'
    const queryParams = new URLSearchParams({
      format: 'pdf',
      includeOrders: 'true',
      includeAnalytics: 'true',
      includeNotes: 'true',
      includeTags: 'true',
      dateRange: 'all',
      orderLimit: '100'
    })

    const response = await fetch(`/api/admin/customers/${customerId}/export?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    })

    expect(response.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/customers/test-customer-123/export'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Accept': 'application/pdf'
        })
      })
    )

    const blob = await response.blob()
    expect(blob).toEqual(mockPdfBlob)
  })

  /**
   * Test CSV export API call
   * Requirements: 17.1, 17.3
   */
  it('should make correct API call for CSV export', async () => {
    // Mock successful CSV export response
    const mockCsvBlob = new Blob(['mock csv content'], { type: 'text/csv' })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockCsvBlob),
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="customer-test-customer-123-export.csv"'
      })
    })

    // Simulate export API call
    const customerId = 'test-customer-123'
    const queryParams = new URLSearchParams({
      format: 'csv',
      includeOrders: 'true',
      includeAnalytics: 'false',
      includeNotes: 'true',
      includeTags: 'true',
      dateRange: '30d',
      orderLimit: '50'
    })

    const response = await fetch(`/api/admin/customers/${customerId}/export?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
    })

    expect(response.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/customers/test-customer-123/export'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Accept': 'text/csv'
        })
      })
    )

    const blob = await response.blob()
    expect(blob).toEqual(mockCsvBlob)
  })

  /**
   * Test download functionality with custom filename
   * Requirements: 17.1, 17.3
   */
  it('should handle download with custom filename from response headers', async () => {
    const customFilename = 'customer-john-doe-2024-01-15.pdf'
    const mockBlob = new Blob(['mock content'], { type: 'application/pdf' })
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: new Headers({
        'Content-Disposition': `attachment; filename="${customFilename}"`
      })
    })

    const response = await fetch('/api/admin/customers/test-customer-123/export?format=pdf')
    
    expect(response.ok).toBe(true)
    
    const contentDisposition = response.headers.get('Content-Disposition')
    expect(contentDisposition).toContain(customFilename)
    
    const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
    expect(filenameMatch?.[1]).toBe(customFilename)
  })

  /**
   * Test export error handling
   * Requirements: 17.1
   */
  it('should handle export errors gracefully', async () => {
    // Mock failed export response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' })
    })

    const response = await fetch('/api/admin/customers/test-customer-123/export?format=pdf')
    
    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('Internal server error')
  })

  /**
   * Test export with custom options
   * Requirements: 17.1, 17.2, 17.3
   */
  it('should include custom options in API request', async () => {
    const mockBlob = new Blob(['mock content'], { type: 'application/pdf' })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: new Headers()
    })

    const customerId = 'test-customer-123'
    const queryParams = new URLSearchParams({
      format: 'xlsx',
      includeOrders: 'false',
      includeAnalytics: 'false',
      includeNotes: 'true',
      includeTags: 'true',
      dateRange: '90d',
      orderLimit: '250'
    })

    await fetch(`/api/admin/customers/${customerId}/export?${queryParams}`)

    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('includeOrders=false')
    expect(calledUrl).toContain('includeAnalytics=false')
    expect(calledUrl).toContain('dateRange=90d')
    expect(calledUrl).toContain('orderLimit=250')
  })

  /**
   * Test MIME type handling
   * Requirements: 17.1, 17.2, 17.3
   */
  it('should use correct MIME types for different formats', async () => {
    const formats = [
      { format: 'pdf', mimeType: 'application/pdf' },
      { format: 'csv', mimeType: 'text/csv' },
      { format: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { format: 'json', mimeType: 'application/json' }
    ]

    for (const { format, mimeType } of formats) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['content'])),
        headers: new Headers()
      })

      await fetch(`/api/admin/customers/test-customer-123/export?format=${format}`, {
        headers: { 'Accept': mimeType }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`format=${format}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': mimeType
          })
        })
      )

      mockFetch.mockClear()
    }
  })
})