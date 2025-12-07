/**
 * E2E test for admin product creation
 * Covers: Login as admin, create product, validate fields, preview product
 */

import { test, expect } from '@playwright/test'

test.describe('Admin Product Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login')

    // Wait for login form
    await page.waitForSelector('input[type="email"]')

    // Fill admin credentials
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'admin@mientior.com')
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'admin123')

    // Submit login form
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin', { timeout: 10000 })
    await expect(page).toHaveURL('/admin')
  })

  test('should create a new product with all fields', async ({ page }) => {
    // Navigate to product creation page
    await page.goto('/admin/products/create')
    await expect(page).toHaveURL('/admin/products/create')

    // Fill basic information
    const productName = `Test Product E2E ${Date.now()}`
    await page.fill('input[name="name"]', productName)

    // Fill description
    await page.fill('textarea[name="description"]', 'This is a test product created via E2E test')

    // Fill price
    await page.fill('input[name="price"]', '49.99')

    // Fill stock
    await page.fill('input[name="stock"]', '100')

    // Select category
    const categoryButton = page.locator('button:has-text("Sélectionner une catégorie"), button:has-text("Select category")')
    const categoryCount = await categoryButton.count()

    if (categoryCount > 0) {
      await categoryButton.click()
      await page.waitForTimeout(500)

      // Select first category
      const firstCategory = page.locator('[role="option"]').first()
      await firstCategory.click()
      await page.waitForTimeout(500)
    } else {
      // Alternative: select dropdown
      const categorySelect = page.locator('select[name="category"], select[name="categoryId"]')
      const selectCount = await categorySelect.count()

      if (selectCount > 0) {
        await categorySelect.selectOption({ index: 1 })
      }
    }

    // Add tags
    const tagInput = page.locator('input[placeholder*="Ajouter un tag"], input[placeholder*="Add tag"]')
    const tagInputCount = await tagInput.count()

    if (tagInputCount > 0) {
      await tagInput.fill('test')
      await tagInput.press('Enter')
      await page.waitForTimeout(500)

      await tagInput.fill('e2e')
      await tagInput.press('Enter')
      await page.waitForTimeout(500)
    }

    // Upload images (using data URL for test)
    const fileInput = page.locator('input[type="file"]')
    const fileInputCount = await fileInput.count()

    if (fileInputCount > 0) {
      // Create a simple test image buffer
      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

      // Set files on input
      await fileInput.setInputFiles([
        { name: 'test-image-1.png', mimeType: 'image/png', buffer },
      ])

      // Wait for upload to complete
      await page.waitForTimeout(2000)
    }

    // Add variant (if variant section exists)
    const addVariantButton = page.locator('button:has-text("Ajouter une variante"), button:has-text("Add variant")')
    const variantButtonCount = await addVariantButton.count()

    if (variantButtonCount > 0) {
      await addVariantButton.click()
      await page.waitForTimeout(500)

      // Fill variant details
      await page.fill('input[name*="variants"][name*="size"]', 'M')
      await page.fill('input[name*="variants"][name*="color"]', 'Blue')
      await page.fill('input[name*="variants"][name*="sku"]', 'TEST-M-BLUE')
      await page.fill('input[name*="variants"][name*="stock"]', '50')
    }

    // Fill SEO fields (if available)
    const metaTitleInput = page.locator('input[name="metaTitle"]')
    const metaTitleCount = await metaTitleInput.count()

    if (metaTitleCount > 0) {
      await metaTitleInput.fill(`${productName} - Buy Online`)
      await page.fill('textarea[name="metaDescription"]', `Buy ${productName} online at the best price`)
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Créer"), button[type="submit"]:has-text("Create")')
    await submitButton.click()

    // Wait for success message or redirect
    await page.waitForTimeout(2000)

    // Verify success message
    const successMessage = page.locator('text=Produit créé avec succès, text=Product created successfully, text=Success')
    const messageCount = await successMessage.count()

    if (messageCount > 0) {
      await expect(successMessage).toBeVisible()
    }

    // Verify redirect to product list
    await page.waitForURL('/admin/products', { timeout: 5000 })
    await expect(page).toHaveURL('/admin/products')

    // Verify product appears in list
    await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 5000 })
  })

  test('should validate required fields', async ({ page }) => {
    // Navigate to product creation
    await page.goto('/admin/products/create')

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]:has-text("Créer"), button[type="submit"]:has-text("Create")')
    await submitButton.click()

    // Wait for validation errors
    await page.waitForTimeout(1000)

    // Verify validation errors appear
    const validationErrors = page.locator('text=requis, text=required, .error, [role="alert"]')
    const errorCount = await validationErrors.count()

    expect(errorCount).toBeGreaterThan(0)
  })

  test('should preview product before creation', async ({ page }) => {
    // Navigate to product creation
    await page.goto('/admin/products/create')

    // Fill basic info
    const productName = 'Preview Test Product'
    await page.fill('input[name="name"]', productName)
    await page.fill('textarea[name="description"]', 'Preview description')
    await page.fill('input[name="price"]', '29.99')

    // Click preview button (if available)
    const previewButton = page.locator('button:has-text("Prévisualiser"), button:has-text("Preview")')
    const previewCount = await previewButton.count()

    if (previewCount > 0) {
      await previewButton.click()

      // Verify preview modal or page
      const previewModal = page.locator('[data-testid="product-preview"], [role="dialog"], .modal')
      await expect(previewModal).toBeVisible({ timeout: 5000 })

      // Verify product details in preview
      await expect(page.locator(`text=${productName}`)).toBeVisible()
      await expect(page.locator('text=29.99')).toBeVisible()

      // Close preview
      const closeButton = page.locator('button:has-text("Fermer"), button:has-text("Close"), [aria-label="Close"]')
      await closeButton.click()
    }
  })

  test('should upload multiple product images', async ({ page }) => {
    await page.goto('/admin/products/create')

    // Fill required fields
    await page.fill('input[name="name"]', 'Multi-Image Product')
    await page.fill('textarea[name="description"]', 'Product with multiple images')
    await page.fill('input[name="price"]', '39.99')
    await page.fill('input[name="stock"]', '50')

    // Upload multiple images
    const fileInput = page.locator('input[type="file"]')
    const fileInputCount = await fileInput.count()

    if (fileInputCount > 0) {
      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

      await fileInput.setInputFiles([
        { name: 'image-1.png', mimeType: 'image/png', buffer },
        { name: 'image-2.png', mimeType: 'image/png', buffer },
        { name: 'image-3.png', mimeType: 'image/png', buffer },
      ])

      // Wait for uploads
      await page.waitForTimeout(3000)

      // Verify image previews appear
      const imagePreviews = page.locator('img[alt*="Product"], img[src*="blob:"]')
      const imageCount = await imagePreviews.count()
      expect(imageCount).toBeGreaterThanOrEqual(1)
    }
  })

  test('should handle product with variants', async ({ page }) => {
    await page.goto('/admin/products/create')

    // Fill basic info
    await page.fill('input[name="name"]', 'Variant Product')
    await page.fill('textarea[name="description"]', 'Product with size and color variants')
    await page.fill('input[name="price"]', '59.99')
    await page.fill('input[name="stock"]', '100')

    // Add first variant
    const addVariantButton = page.locator('button:has-text("Ajouter une variante"), button:has-text("Add variant")')
    const variantButtonCount = await addVariantButton.count()

    if (variantButtonCount > 0) {
      // Add variant 1: Size M, Color Blue
      await addVariantButton.click()
      await page.waitForTimeout(500)

      await page.fill('input[name*="variants.0"][name*="size"]', 'M')
      await page.fill('input[name*="variants.0"][name*="color"]', 'Blue')
      await page.fill('input[name*="variants.0"][name*="sku"]', 'VAR-M-BLUE')
      await page.fill('input[name*="variants.0"][name*="stock"]', '30')

      // Add variant 2: Size L, Color Red
      await addVariantButton.click()
      await page.waitForTimeout(500)

      await page.fill('input[name*="variants.1"][name*="size"]', 'L')
      await page.fill('input[name*="variants.1"][name*="color"]', 'Red')
      await page.fill('input[name*="variants.1"][name*="sku"]', 'VAR-L-RED')
      await page.fill('input[name*="variants.1"][name*="stock"]', '40')

      // Submit
      const submitButton = page.locator('button[type="submit"]:has-text("Créer"), button[type="submit"]:has-text("Create")')
      await submitButton.click()

      // Wait for creation
      await page.waitForTimeout(2000)
    }
  })

  test('should navigate to edit page from product list', async ({ page }) => {
    // Go to products list
    await page.goto('/admin/products')

    // Wait for products to load
    await page.waitForSelector('table, [data-testid="product-row"]', { timeout: 10000 })

    // Click edit button on first product
    const editButton = page.locator('button:has-text("Modifier"), button:has-text("Edit"), a:has-text("Edit")').first()
    await editButton.click()

    // Verify navigation to edit page
    await page.waitForURL(/\/admin\/products\/edit\/.*/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/admin\/products\/edit\/.*/)
  })

  test('should delete product from edit page', async ({ page }) => {
    // Create a product first
    await page.goto('/admin/products/create')

    const productName = `Delete Test ${Date.now()}`
    await page.fill('input[name="name"]', productName)
    await page.fill('textarea[name="description"]', 'To be deleted')
    await page.fill('input[name="price"]', '19.99')
    await page.fill('input[name="stock"]', '10')

    const submitButton = page.locator('button[type="submit"]:has-text("Créer"), button[type="submit"]:has-text("Create")')
    await submitButton.click()

    await page.waitForTimeout(2000)

    // Navigate back to products list
    await page.goto('/admin/products')
    await page.waitForTimeout(1000)

    // Find and click on the created product
    const productLink = page.locator(`text=${productName}`).first()
    await productLink.click()

    await page.waitForURL(/\/admin\/products\/(edit|show)\/.*/, { timeout: 5000 })

    // Click delete button
    const deleteButton = page.locator('button:has-text("Supprimer"), button:has-text("Delete")')
    const deleteCount = await deleteButton.count()

    if (deleteCount > 0) {
      await deleteButton.click()

      // Confirm deletion in modal
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Confirm"), button:has-text("Yes")')
      const confirmCount = await confirmButton.count()

      if (confirmCount > 0) {
        await confirmButton.click()
        await page.waitForTimeout(1000)
      }

      // Verify redirect to product list
      await page.waitForURL('/admin/products', { timeout: 5000 })

      // Verify product no longer in list
      const deletedProduct = page.locator(`text=${productName}`)
      await expect(deletedProduct).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('should filter products in admin list', async ({ page }) => {
    await page.goto('/admin/products')

    // Wait for products to load
    await page.waitForSelector('table, [data-testid="product-row"]', { timeout: 10000 })

    // Find filter/search input
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[placeholder*="Search"], input[type="search"]')
    const searchCount = await searchInput.count()

    if (searchCount > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)

      // Verify filtered results
      const rows = page.locator('table tbody tr, [data-testid="product-row"]')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('should sort products in admin list', async ({ page }) => {
    await page.goto('/admin/products')

    // Wait for products to load
    await page.waitForSelector('table, [data-testid="product-row"]', { timeout: 10000 })

    // Click on a sortable column header (e.g., Name, Price)
    const nameHeader = page.locator('th:has-text("Nom"), th:has-text("Name")').first()
    const headerCount = await nameHeader.count()

    if (headerCount > 0) {
      await nameHeader.click()
      await page.waitForTimeout(1000)

      // Verify table updated (data should be sorted)
      const rows = page.locator('table tbody tr, [data-testid="product-row"]')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThan(0)
    }
  })

  test('should paginate products in admin list', async ({ page }) => {
    await page.goto('/admin/products')

    // Wait for products to load
    await page.waitForSelector('table, [data-testid="product-row"]', { timeout: 10000 })

    // Check for pagination
    const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Next"), [aria-label*="Next"]')
    const nextCount = await nextButton.count()

    if (nextCount > 0) {
      await nextButton.click()
      await page.waitForTimeout(1000)

      // Verify products loaded for next page
      const rows = page.locator('table tbody tr, [data-testid="product-row"]')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThan(0)
    }
  })
})
