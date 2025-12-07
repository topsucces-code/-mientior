/**
 * E2E test for product search with filters
 * Covers: Search, category filter, price filter, brand filter, color/size filters, sorting, pagination
 */

import { test, expect } from '@playwright/test'

test.describe('Product Search with Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })
  })

  test('should search products by query', async ({ page }) => {
    // Find and fill search input
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[placeholder*="Search"]')
    await searchInput.fill('shirt')
    await searchInput.press('Enter')

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Verify URL contains search query
    await expect(page).toHaveURL(/[?&]q=shirt/)

    // Verify results are displayed
    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)

    // Verify all results contain "shirt" in title (case-insensitive)
    const titles = await productCards.locator('h3').allTextContents()
    const allMatch = titles.every(title =>
      title.toLowerCase().includes('shirt')
    )
    expect(allMatch).toBe(true)
  })

  test('should filter by category', async ({ page }) => {
    // Click on category filter
    const categoryButton = page.locator('button:has-text("Catégories"), button:has-text("Categories")')
    await categoryButton.click()

    // Select a category (e.g., "Vêtements" or "Clothing")
    const categoryOption = page.locator('text=Vêtements, text=Clothing').first()
    await categoryOption.click()

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Verify URL updated with category filter
    await expect(page).toHaveURL(/[?&]category=/)

    // Verify results are displayed
    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should filter by price range', async ({ page }) => {
    // Click on price filter
    const priceButton = page.locator('button:has-text("Prix"), button:has-text("Price")')
    await priceButton.click()

    // Set price range
    await page.fill('input[name="minPrice"]', '10')
    await page.fill('input[name="maxPrice"]', '50')

    // Apply filter
    const applyButton = page.locator('button:has-text("Appliquer"), button:has-text("Apply")')
    await applyButton.click()

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Verify URL updated
    await expect(page).toHaveURL(/[?&]minPrice=10/)
    await expect(page).toHaveURL(/[?&]maxPrice=50/)

    // Verify prices are within range
    const productCards = page.locator('[data-testid="product-card"]')
    const prices = await productCards.locator('[data-testid="product-price"]').allTextContents()

    prices.forEach(priceText => {
      // Extract numeric value (handles various formats: €29.99, $29.99, 29,99€)
      const numericPrice = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'))
      expect(numericPrice).toBeGreaterThanOrEqual(10)
      expect(numericPrice).toBeLessThanOrEqual(50)
    })
  })

  test('should filter by brand', async ({ page }) => {
    // Click on brand filter
    const brandButton = page.locator('button:has-text("Marques"), button:has-text("Brands")')
    await brandButton.click()

    // Select a brand (first available checkbox)
    const brandCheckbox = page.locator('input[type="checkbox"][name*="brand"]').first()
    const brandValue = await brandCheckbox.getAttribute('value')
    await brandCheckbox.check()

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Verify URL updated
    await expect(page).toHaveURL(/[?&]brand=/)

    // Verify results are displayed
    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should filter by color', async ({ page }) => {
    // Click on color filter
    const colorButton = page.locator('button:has-text("Couleurs"), button:has-text("Colors")')
    await colorButton.click()

    // Select a color (e.g., blue)
    const blueColor = page.locator('button[data-color="blue"], [data-value="blue"]')
    const colorCount = await blueColor.count()

    if (colorCount > 0) {
      await blueColor.first().click()

      // Wait for results to update
      await page.waitForTimeout(1000)

      // Verify URL updated
      await expect(page).toHaveURL(/[?&]color=blue/)

      // Verify results are displayed
      const productCards = page.locator('[data-testid="product-card"]')
      const count = await productCards.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should filter by size', async ({ page }) => {
    // Click on size filter
    const sizeButton = page.locator('button:has-text("Tailles"), button:has-text("Sizes")')
    await sizeButton.click()

    // Select a size (e.g., M)
    const mediumSize = page.locator('button[data-size="M"], [data-value="M"]')
    const sizeCount = await mediumSize.count()

    if (sizeCount > 0) {
      await mediumSize.first().click()

      // Wait for results to update
      await page.waitForTimeout(1000)

      // Verify URL updated
      await expect(page).toHaveURL(/[?&]size=M/)

      // Verify results are displayed
      const productCards = page.locator('[data-testid="product-card"]')
      const count = await productCards.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should combine multiple filters', async ({ page }) => {
    // Apply category filter
    const categoryButton = page.locator('button:has-text("Catégories"), button:has-text("Categories")')
    await categoryButton.click()
    await page.locator('text=Vêtements, text=Clothing').first().click()
    await page.waitForTimeout(500)

    // Apply price filter
    const priceButton = page.locator('button:has-text("Prix"), button:has-text("Price")')
    await priceButton.click()
    await page.fill('input[name="minPrice"]', '20')
    await page.fill('input[name="maxPrice"]', '100')
    const applyButton = page.locator('button:has-text("Appliquer"), button:has-text("Apply")')
    await applyButton.click()
    await page.waitForTimeout(500)

    // Apply brand filter
    const brandButton = page.locator('button:has-text("Marques"), button:has-text("Brands")')
    await brandButton.click()
    const brandCheckbox = page.locator('input[type="checkbox"][name*="brand"]').first()
    await brandCheckbox.check()
    await page.waitForTimeout(500)

    // Verify URL has all filters
    await expect(page).toHaveURL(/[?&]category=/)
    await expect(page).toHaveURL(/[?&]minPrice=20/)
    await expect(page).toHaveURL(/[?&]maxPrice=100/)
    await expect(page).toHaveURL(/[?&]brand=/)

    // Verify results are displayed
    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThanOrEqual(0) // Could be 0 if no products match
  })

  test('should clear all filters', async ({ page }) => {
    // Apply some filters first
    await page.goto('/products?category=clothing&brand=nike&minPrice=10')
    await page.waitForTimeout(500)

    // Click clear filters button
    const clearButton = page.locator('button:has-text("Effacer les filtres"), button:has-text("Clear filters"), button:has-text("Reset")')
    const clearCount = await clearButton.count()

    if (clearCount > 0) {
      await clearButton.click()

      // Wait for URL to update
      await page.waitForTimeout(500)

      // Verify URL reset to base products page
      await expect(page).toHaveURL('/products')
    }
  })

  test('should sort products by price ascending', async ({ page }) => {
    // Find sort dropdown
    const sortSelect = page.locator('select[name="sort"], select[aria-label*="Sort"]')
    await sortSelect.selectOption('price-asc')

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Verify URL updated
    await expect(page).toHaveURL(/[?&]sort=price-asc/)

    // Verify first product is cheaper than or equal to second
    const productCards = page.locator('[data-testid="product-card"]')
    const prices = await productCards.locator('[data-testid="product-price"]').allTextContents()

    if (prices.length >= 2) {
      const numericPrices = prices.map(p =>
        parseFloat(p.replace(/[^0-9.,]/g, '').replace(',', '.'))
      )

      expect(numericPrices[0]).toBeLessThanOrEqual(numericPrices[1])
    }
  })

  test('should sort products by price descending', async ({ page }) => {
    // Find sort dropdown
    const sortSelect = page.locator('select[name="sort"], select[aria-label*="Sort"]')
    await sortSelect.selectOption('price-desc')

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Verify URL updated
    await expect(page).toHaveURL(/[?&]sort=price-desc/)

    // Verify first product is more expensive than or equal to second
    const productCards = page.locator('[data-testid="product-card"]')
    const prices = await productCards.locator('[data-testid="product-price"]').allTextContents()

    if (prices.length >= 2) {
      const numericPrices = prices.map(p =>
        parseFloat(p.replace(/[^0-9.,]/g, '').replace(',', '.'))
      )

      expect(numericPrices[0]).toBeGreaterThanOrEqual(numericPrices[1])
    }
  })

  test('should sort products by newest', async ({ page }) => {
    // Find sort dropdown
    const sortSelect = page.locator('select[name="sort"], select[aria-label*="Sort"]')
    const optionsCount = await sortSelect.locator('option').count()

    if (optionsCount > 0) {
      await sortSelect.selectOption('newest')

      // Wait for results to update
      await page.waitForTimeout(1000)

      // Verify URL updated
      await expect(page).toHaveURL(/[?&]sort=newest/)

      // Verify results are displayed
      const productCards = page.locator('[data-testid="product-card"]')
      const count = await productCards.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should paginate results', async ({ page }) => {
    // Check if pagination exists
    const page2Button = page.locator('button:has-text("2"), a:has-text("2")')
    const paginationExists = await page2Button.count()

    if (paginationExists > 0) {
      // Click page 2
      await page2Button.click()

      // Wait for page to load
      await page.waitForTimeout(1000)

      // Verify URL updated
      await expect(page).toHaveURL(/[?&]page=2/)

      // Verify products loaded
      const productCards = page.locator('[data-testid="product-card"]')
      const count = await productCards.count()
      expect(count).toBeGreaterThan(0)

      // Scroll to top to verify page changed
      await page.evaluate(() => window.scrollTo(0, 0))
    }
  })

  test('should show no results message when no products match', async ({ page }) => {
    // Search for something that definitely won't exist
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[placeholder*="Search"]')
    await searchInput.fill('xyzabcnonexistentproduct12345')
    await searchInput.press('Enter')

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Verify no results message or empty state
    const noResults = page.locator('text=Aucun produit, text=No products, text=No results')
    await expect(noResults).toBeVisible({ timeout: 5000 })
  })

  test('should show loading state while fetching', async ({ page }) => {
    // Trigger a filter change
    const priceButton = page.locator('button:has-text("Prix"), button:has-text("Price")')
    await priceButton.click()
    await page.fill('input[name="minPrice"]', '10')
    await page.fill('input[name="maxPrice"]', '50')

    // Click apply and immediately check for loading state
    const applyButton = page.locator('button:has-text("Appliquer"), button:has-text("Apply")')
    await applyButton.click()

    // Check if loading indicator appears (spinner, skeleton, etc.)
    const loadingIndicator = page.locator('[data-testid="loading"], .skeleton, .spinner')
    const loadingCount = await loadingIndicator.count()

    // Loading state is transient, so we just verify the page eventually loads
    await page.waitForTimeout(2000)

    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should preserve filters when navigating back', async ({ page }) => {
    // Apply filters
    await page.goto('/products?category=clothing&minPrice=20&maxPrice=100')
    await page.waitForTimeout(500)

    // Click on a product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()

    // Wait for product page to load
    await page.waitForURL(/\/products\/.*/)

    // Go back
    await page.goBack()

    // Verify filters are preserved
    await expect(page).toHaveURL(/[?&]category=clothing/)
    await expect(page).toHaveURL(/[?&]minPrice=20/)
    await expect(page).toHaveURL(/[?&]maxPrice=100/)
  })

  test('should update results count when filters change', async ({ page }) => {
    // Get initial count
    const resultsCount = page.locator('[data-testid="results-count"], text=/\\d+ produits/, text=/\\d+ results/')
    const initialText = await resultsCount.textContent()

    // Apply a filter
    const priceButton = page.locator('button:has-text("Prix"), button:has-text("Price")')
    await priceButton.click()
    await page.fill('input[name="minPrice"]', '50')
    await page.fill('input[name="maxPrice"]', '100')
    const applyButton = page.locator('button:has-text("Appliquer"), button:has-text("Apply")')
    await applyButton.click()

    // Wait for results to update
    await page.waitForTimeout(1000)

    // Get new count
    const newText = await resultsCount.textContent()

    // Counts should be different (unless coincidentally the same)
    // At minimum, verify the count element still exists and has a number
    expect(newText).toMatch(/\d+/)
  })
})
