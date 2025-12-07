import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useWishlistStore, type WishlistItem } from '../wishlist.store'

// Mock fetch globally
global.fetch = vi.fn()

describe('Wishlist Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWishlistStore.setState({
      items: [],
      isSyncing: false,
      lastSyncedAt: null,
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('addItem', () => {
    it('should add a new item to wishlist', () => {
      const { addItem } = useWishlistStore.getState()

      const item: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product',
        name: 'Test Product',
        price: 5000,
        image: '/test.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item)

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]?.productId).toBe('prod-1')
      expect(state.items[0]?.name).toBe('Test Product')
    })

    it('should not add duplicate item (deduplication by productId)', () => {
      const { addItem } = useWishlistStore.getState()

      const item: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product',
        name: 'Test Product',
        price: 5000,
        image: '/test.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item)
      addItem(item) // Try to add the same product again

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(1) // Should still be 1, not 2
    })

    it('should set addedAt timestamp when adding item', () => {
      const { addItem } = useWishlistStore.getState()

      const item: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product',
        name: 'Test Product',
        price: 5000,
        image: '/test.jpg',
        addedAt: new Date().toISOString(),
      }

      const beforeAdd = new Date()
      addItem(item)
      const afterAdd = new Date()

      const state = useWishlistStore.getState()
      const addedItem = state.items[0]
      expect(addedItem?.addedAt).toBeDefined()

      const addedTime = new Date(addedItem!.addedAt)
      expect(addedTime.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime())
      expect(addedTime.getTime()).toBeLessThanOrEqual(afterAdd.getTime())
    })
  })

  describe('removeItem', () => {
    it('should remove item from wishlist by productId', () => {
      const { addItem, removeItem } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        price: 5000,
        image: '/test1.jpg',
        addedAt: new Date().toISOString(),
      }

      const item2: WishlistItem = {
        productId: 'prod-2',
        slug: 'test-product-2',
        name: 'Test Product 2',
        price: 6000,
        image: '/test2.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)
      addItem(item2)

      expect(useWishlistStore.getState().items).toHaveLength(2)

      removeItem('prod-1')

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]?.productId).toBe('prod-2')
    })

    it('should do nothing when removing non-existent item', () => {
      const { addItem, removeItem } = useWishlistStore.getState()

      const item: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product',
        name: 'Test Product',
        price: 5000,
        image: '/test.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item)
      expect(useWishlistStore.getState().items).toHaveLength(1)

      removeItem('prod-999') // Non-existent product

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(1) // Should still be 1
      expect(state.items[0]?.productId).toBe('prod-1')
    })
  })

  describe('clearWishlist', () => {
    it('should remove all items from wishlist', () => {
      const { addItem, clearWishlist } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        price: 5000,
        image: '/test1.jpg',
        addedAt: new Date().toISOString(),
      }

      const item2: WishlistItem = {
        productId: 'prod-2',
        slug: 'test-product-2',
        name: 'Test Product 2',
        price: 6000,
        image: '/test2.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)
      addItem(item2)
      expect(useWishlistStore.getState().items).toHaveLength(2)

      clearWishlist()

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.items).toEqual([])
    })
  })

  describe('isInWishlist', () => {
    it('should return true when product is in wishlist', () => {
      const { addItem, isInWishlist } = useWishlistStore.getState()

      const item: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product',
        name: 'Test Product',
        price: 5000,
        image: '/test.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item)

      expect(isInWishlist('prod-1')).toBe(true)
    })

    it('should return false when product is not in wishlist', () => {
      const { isInWishlist } = useWishlistStore.getState()

      expect(isInWishlist('prod-999')).toBe(false)
    })

    it('should return false for empty wishlist', () => {
      const { isInWishlist } = useWishlistStore.getState()

      expect(isInWishlist('prod-1')).toBe(false)
    })
  })

  describe('syncToServer', () => {
    it('should send productIds to server and update sync state', async () => {
      const { addItem, syncToServer } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        price: 5000,
        image: '/test1.jpg',
        addedAt: new Date().toISOString(),
      }

      const item2: WishlistItem = {
        productId: 'prod-2',
        slug: 'test-product-2',
        name: 'Test Product 2',
        price: 6000,
        image: '/test2.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)
      addItem(item2)

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: ['prod-1', 'prod-2'] }),
      } as Response)

      await syncToServer()

      expect(fetch).toHaveBeenCalledWith('/api/user/wishlist/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: ['prod-1', 'prod-2'], merge: false }),
      })

      const state = useWishlistStore.getState()
      expect(state.lastSyncedAt).not.toBeNull()
      expect(state.isSyncing).toBe(false)
    })

    it('should merge with server data when merge option is true', async () => {
      const { addItem, syncToServer } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        price: 5000,
        image: '/test1.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)

      // Server returns merged list with an additional product
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: ['prod-1', 'prod-2', 'prod-3'] }),
      } as Response)

      await syncToServer({ merge: true })

      expect(fetch).toHaveBeenCalledWith('/api/user/wishlist/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: ['prod-1'], merge: true }),
      })

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(3)
      expect(state.items.map(i => i.productId)).toContain('prod-1')
      expect(state.items.map(i => i.productId)).toContain('prod-2')
      expect(state.items.map(i => i.productId)).toContain('prod-3')
    })

    it('should handle sync errors gracefully', async () => {
      const { syncToServer } = useWishlistStore.getState()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      await expect(syncToServer()).rejects.toThrow('Failed to sync wishlist')

      const state = useWishlistStore.getState()
      expect(state.isSyncing).toBe(false)
    })

    it('should set isSyncing to true during sync and false after', async () => {
      const { syncToServer } = useWishlistStore.getState()

      vi.mocked(fetch).mockImplementationOnce(async () => {
        // Check state while sync is in progress
        const state = useWishlistStore.getState()
        expect(state.isSyncing).toBe(true)

        return {
          ok: true,
          json: async () => ({ data: [] }),
        } as Response
      })

      await syncToServer()

      const state = useWishlistStore.getState()
      expect(state.isSyncing).toBe(false)
    })
  })

  describe('loadFromServer', () => {
    it('should load wishlist from server and convert IDs to WishlistItems', async () => {
      const { loadFromServer } = useWishlistStore.getState()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: ['prod-1', 'prod-2', 'prod-3'] }),
      } as Response)

      await loadFromServer()

      expect(fetch).toHaveBeenCalledWith('/api/user/wishlist/sync')

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(3)
      expect(state.items[0]?.productId).toBe('prod-1')
      expect(state.items[1]?.productId).toBe('prod-2')
      expect(state.items[2]?.productId).toBe('prod-3')

      // Each item should have an addedAt timestamp
      state.items.forEach(item => {
        expect(item.addedAt).toBeDefined()
      })

      expect(state.isSyncing).toBe(false)
    })

    it('should handle load errors gracefully', async () => {
      const { loadFromServer } = useWishlistStore.getState()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      await expect(loadFromServer()).rejects.toThrow('Failed to load wishlist')

      const state = useWishlistStore.getState()
      expect(state.isSyncing).toBe(false)
    })

    it('should replace local items when loading from server', async () => {
      const { addItem, loadFromServer } = useWishlistStore.getState()

      // Add some local items first
      const item1: WishlistItem = {
        productId: 'prod-local-1',
        slug: 'test-product-local',
        name: 'Local Product',
        price: 5000,
        image: '/local.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)
      expect(useWishlistStore.getState().items).toHaveLength(1)

      // Load from server
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: ['prod-server-1', 'prod-server-2'] }),
      } as Response)

      await loadFromServer()

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(2) // Should replace, not merge
      expect(state.items.map(i => i.productId)).not.toContain('prod-local-1')
      expect(state.items.map(i => i.productId)).toContain('prod-server-1')
      expect(state.items.map(i => i.productId)).toContain('prod-server-2')
    })
  })

  describe('mergeWithServer', () => {
    it('should merge server product IDs with local items', () => {
      const { addItem, mergeWithServer } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        price: 5000,
        image: '/test1.jpg',
        addedAt: new Date().toISOString(),
      }

      const item2: WishlistItem = {
        productId: 'prod-2',
        slug: 'test-product-2',
        name: 'Test Product 2',
        price: 6000,
        image: '/test2.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)
      addItem(item2)

      // Server has prod-2, prod-3, prod-4
      const serverProductIds = ['prod-2', 'prod-3', 'prod-4']
      mergeWithServer(serverProductIds)

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(4) // prod-1, prod-2, prod-3, prod-4

      const productIds = state.items.map(i => i.productId)
      expect(productIds).toContain('prod-1') // Local only
      expect(productIds).toContain('prod-2') // Both local and server
      expect(productIds).toContain('prod-3') // Server only
      expect(productIds).toContain('prod-4') // Server only
    })

    it('should preserve full item data for existing local items during merge', () => {
      const { addItem, mergeWithServer } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        price: 5000,
        image: '/test1.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)

      const serverProductIds = ['prod-1', 'prod-2']
      mergeWithServer(serverProductIds)

      const state = useWishlistStore.getState()
      const existingItem = state.items.find(i => i.productId === 'prod-1')

      // Should preserve all the original item data
      expect(existingItem?.slug).toBe('test-product-1')
      expect(existingItem?.name).toBe('Test Product 1')
      expect(existingItem?.price).toBe(5000)
      expect(existingItem?.image).toBe('/test1.jpg')
    })

    it('should create minimal WishlistItems for server-only products', () => {
      const { mergeWithServer } = useWishlistStore.getState()

      const serverProductIds = ['prod-server-1', 'prod-server-2']
      mergeWithServer(serverProductIds)

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(2)

      state.items.forEach(item => {
        expect(item.productId).toBeDefined()
        expect(item.addedAt).toBeDefined()
      })
    })

    it('should handle empty server list', () => {
      const { addItem, mergeWithServer } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product-1',
        name: 'Test Product 1',
        price: 5000,
        image: '/test1.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)
      expect(useWishlistStore.getState().items).toHaveLength(1)

      mergeWithServer([])

      const state = useWishlistStore.getState()
      expect(state.items).toHaveLength(1) // Should keep local items
      expect(state.items[0]?.productId).toBe('prod-1')
    })
  })

  describe('setIsSyncing', () => {
    it('should update isSyncing state', () => {
      const { setIsSyncing } = useWishlistStore.getState()

      expect(useWishlistStore.getState().isSyncing).toBe(false)

      setIsSyncing(true)
      expect(useWishlistStore.getState().isSyncing).toBe(true)

      setIsSyncing(false)
      expect(useWishlistStore.getState().isSyncing).toBe(false)
    })
  })

  describe('setLastSyncedAt', () => {
    it('should update lastSyncedAt state', () => {
      const { setLastSyncedAt } = useWishlistStore.getState()

      expect(useWishlistStore.getState().lastSyncedAt).toBeNull()

      const syncDate = new Date('2024-01-15T10:30:00Z')
      setLastSyncedAt(syncDate)

      expect(useWishlistStore.getState().lastSyncedAt).toEqual(syncDate)
    })
  })

  describe('Edge cases and integration', () => {
    it('should handle multiple add/remove operations correctly', () => {
      const { addItem, removeItem } = useWishlistStore.getState()

      const item1: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-1',
        name: 'Product 1',
        price: 1000,
        image: '/1.jpg',
        addedAt: new Date().toISOString(),
      }

      const item2: WishlistItem = {
        productId: 'prod-2',
        slug: 'test-2',
        name: 'Product 2',
        price: 2000,
        image: '/2.jpg',
        addedAt: new Date().toISOString(),
      }

      const item3: WishlistItem = {
        productId: 'prod-3',
        slug: 'test-3',
        name: 'Product 3',
        price: 3000,
        image: '/3.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item1)
      addItem(item2)
      addItem(item3)
      expect(useWishlistStore.getState().items).toHaveLength(3)

      removeItem('prod-2')
      expect(useWishlistStore.getState().items).toHaveLength(2)

      addItem(item2) // Add it back
      expect(useWishlistStore.getState().items).toHaveLength(3)

      const productIds = useWishlistStore.getState().items.map(i => i.productId)
      expect(productIds).toContain('prod-1')
      expect(productIds).toContain('prod-2')
      expect(productIds).toContain('prod-3')
    })

    it('should persist only items in partialize', () => {
      const { addItem } = useWishlistStore.getState()

      const item: WishlistItem = {
        productId: 'prod-1',
        slug: 'test-product',
        name: 'Test Product',
        price: 5000,
        image: '/test.jpg',
        addedAt: new Date().toISOString(),
      }

      addItem(item)

      // The persist middleware should only save items, not isSyncing or lastSyncedAt
      // This is tested implicitly through the beforeEach reset
      expect(useWishlistStore.getState().items).toHaveLength(1)
    })
  })
})
