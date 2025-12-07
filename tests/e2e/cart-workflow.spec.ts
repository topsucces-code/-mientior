import { test, expect, type Page } from '@playwright/test'

test.describe('Cart Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should add product to cart from PDP and verify cart badge', async ({ page }) => {
    // Navigate to a product page
    await page.goto('/products')

    // Click on the first product card
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)

    // Wait for product info to load
    await page.waitForSelector('button:has-text("AJOUTER AU PANIER")')

    // Check if variants are required
    const variantSelectors = page.locator('[data-testid="variant-selector"]')
    const hasVariants = (await variantSelectors.count()) > 0

    if (hasVariants) {
      // Select first available size
      const sizeButtons = page.locator('button[data-variant-type="size"]')
      if ((await sizeButtons.count()) > 0) {
        await sizeButtons.first().click()
      }

      // Select first available color
      const colorButtons = page.locator('button[data-variant-type="color"]')
      if ((await colorButtons.count()) > 0) {
        await colorButtons.first().click()
      }
    }

    // Click add to cart button
    await page.click('button:has-text("AJOUTER AU PANIER")')

    // Verify success toast appears
    await expect(page.locator('text=Ajouté au panier')).toBeVisible({ timeout: 5000 })

    // Verify cart badge shows "1"
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    await expect(cartBadge).toHaveText('1')
  })

  test('should add product to cart from PLP', async ({ page }) => {
    await page.goto('/products')

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]')

    // Get initial cart count
    const initialCartBadge = page.locator('[data-testid="cart-badge"]')
    const initialCount = await initialCartBadge.textContent().catch(() => '0')

    // Hover over first product card to reveal quick add button
    const firstProductCard = page.locator('[data-testid="product-card"]').first()
    await firstProductCard.hover()

    // Click the quick add to cart button (shopping cart icon)
    await firstProductCard.locator('button[aria-label*="Ajouter au panier"]').click()

    // Verify toast
    await expect(page.locator('text=Ajouté au panier')).toBeVisible({ timeout: 5000 })

    // Verify cart badge incremented
    const newCount = parseInt(initialCount || '0') + 1
    await expect(initialCartBadge).toHaveText(newCount.toString())
  })

  test('should show error when adding product without selecting required variant', async ({ page }) => {
    await page.goto('/products')

    // Find a product with variants
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)

    // Check if variants exist
    const variantSelectors = page.locator('[data-testid="variant-selector"]')
    const hasVariants = (await variantSelectors.count()) > 0

    if (!hasVariants) {
      test.skip()
      return
    }

    // Try to add without selecting variant
    await page.click('button:has-text("AJOUTER AU PANIER")')

    // Verify error toast
    await expect(
      page.locator('text=/Sélectionnez|Veuillez sélectionner/')
    ).toBeVisible({ timeout: 5000 })

    // Verify cart badge not incremented
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    await expect(cartBadge).not.toBeVisible()
  })

  test('should handle out of stock products correctly', async ({ page }) => {
    // This test assumes there's a way to identify out-of-stock products
    await page.goto('/products')

    // Look for out-of-stock badge
    const outOfStockProduct = page.locator('[data-testid="product-card"]:has-text("Épuisé")').first()

    if ((await outOfStockProduct.count()) === 0) {
      test.skip()
      return
    }

    await outOfStockProduct.click()
    await page.waitForURL(/\/products\/.*/)

    // Verify add to cart button is disabled
    const addToCartButton = page.locator('button:has-text("AJOUTER AU PANIER")')
    await expect(addToCartButton).toBeDisabled()
  })

  test('should update quantity and sync to cart', async ({ page }) => {
    // Add a product first
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)

    // Select quantity
    const quantityInput = page.locator('input[aria-label="Quantité"]')
    if ((await quantityInput.count()) > 0) {
      await quantityInput.fill('3')
      await page.waitForTimeout(500) // Wait for debounce
    }

    await page.click('button:has-text("AJOUTER AU PANIER")')
    await expect(page.locator('text=Ajouté au panier')).toBeVisible()

    // Open cart
    await page.click('[data-testid="cart-button"]')

    // Verify quantity in cart
    const cartQuantity = page.locator('[data-testid="cart-item-quantity"]').first()
    await expect(cartQuantity).toHaveText('3')
  })

  test('should save item for later and restore it', async ({ page }) => {
    // Add a product
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)
    await page.click('button:has-text("AJOUTER AU PANIER")')

    // Open cart
    await page.click('[data-testid="cart-button"]')

    // Click "Save for later"
    await page.click('button:has-text("Enregistrer pour plus tard")')

    // Verify item moved to "Saved for Later" section
    const savedSection = page.locator('[data-testid="saved-for-later-section"]')
    await expect(savedSection).toBeVisible()

    // Verify main cart is empty
    const cartEmpty = page.locator('text=/Votre panier est vide/')
    await expect(cartEmpty).toBeVisible()

    // Click "Move to cart"
    await page.locator('[data-testid="saved-for-later-section"]')
      .locator('button:has-text("Déplacer vers le panier")')
      .click()

    // Verify item back in cart
    await expect(cartEmpty).not.toBeVisible()
  })

  test('should apply coupon code and show discount', async ({ page }) => {
    // Add a product
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)
    await page.click('button:has-text("AJOUTER AU PANIER")')

    // Open cart
    await page.click('[data-testid="cart-button"]')

    // Find coupon input
    const couponInput = page.locator('input[placeholder*="Code promo"]')
    if ((await couponInput.count()) > 0) {
      await couponInput.fill('SAVE10')
      await page.click('button:has-text("Appliquer")')

      // Wait for success message
      await expect(page.locator('text=/Code promo appliqué|Coupon appliqué/')).toBeVisible({
        timeout: 5000,
      })

      // Verify discount line appears
      const discountLine = page.locator('text=/Remise|Discount/')
      await expect(discountLine).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should persist cart items after page refresh', async ({ page }) => {
    // Add a product
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)
    await page.click('button:has-text("AJOUTER AU PANIER")')

    // Wait for toast
    await expect(page.locator('text=Ajouté au panier')).toBeVisible()

    // Get cart badge count
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    const count = await cartBadge.textContent()

    // Refresh page
    await page.reload()

    // Verify cart badge still shows same count
    await expect(cartBadge).toHaveText(count || '1')

    // Open cart and verify item is there
    await page.click('[data-testid="cart-button"]')
    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(parseInt(count || '1'))
  })

  test('should show free shipping progress', async ({ page }) => {
    // Add a product
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)
    await page.click('button:has-text("AJOUTER AU PANIER")')

    // Open cart
    await page.click('[data-testid="cart-button"]')

    // Check for free shipping progress bar
    const progressBar = page.locator('[data-testid="free-shipping-progress"]')
    if ((await progressBar.count()) > 0) {
      await expect(progressBar).toBeVisible()

      // Verify progress text
      const progressText = page.locator('text=/Plus que|Livraison gratuite débloquée/')
      await expect(progressText).toBeVisible()
    }
  })
})

test.describe('Cart Workflow - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect
    await page.waitForURL('/')
  })

  test('should sync cart after login', async ({ page }) => {
    // Add items while not logged in (in a different session)
    // Then login and verify cart merges

    // This test requires more complex setup with multiple sessions
    // Skipping for now - implement based on auth setup
    test.skip()
  })

  test('should save cart to server after adding item', async ({ page }) => {
    await page.goto('/products')
    await page.locator('[data-testid="product-card"]').first().click()
    await page.waitForURL(/\/products\/.*/)
    await page.click('button:has-text("AJOUTER AU PANIER")')

    // Wait for sync (indicated by no pending state)
    await page.waitForTimeout(2000)

    // Logout and login again
    await page.goto('/logout')
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Verify cart still has items
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    await expect(cartBadge).toBeVisible()
  })
})
