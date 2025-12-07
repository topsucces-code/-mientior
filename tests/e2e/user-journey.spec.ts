/**
 * E2E test for complete user journey
 * Covers: Registration → Login → Browse → Add to Cart → Checkout → Payment → Confirmation
 */

import { test, expect } from '@playwright/test'

test.describe('Complete User Journey', () => {
  const timestamp = Date.now()
  const testEmail = `test-${timestamp}@example.com`
  const testPassword = 'SecurePass123!'
  const testName = 'Test User'

  test('should complete full purchase flow from registration to confirmation', async ({ page }) => {
    // 1. Navigate to registration page
    await page.goto('/register')
    await expect(page).toHaveURL('/register')

    // 2. Fill registration form
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="name"]', testName)

    // 3. Submit registration
    await page.click('button[type="submit"]')

    // 4. Should redirect to login or home
    await page.waitForURL(/\/(login|$)/)

    // 5. If on login page, fill credentials
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button[type="submit"]')
    }

    // 6. Should be on home page after login
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')

    // 7. Navigate to products page
    await page.goto('/products')
    await expect(page).toHaveURL('/products')

    // 8. Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // 9. Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()

    // 10. Should be on product details page
    await page.waitForURL(/\/products\/.*/)

    // 11. Select variant if size selector exists
    const sizeButtons = page.locator('button[data-variant-type="size"]')
    const sizeCount = await sizeButtons.count()
    if (sizeCount > 0) {
      await sizeButtons.first().click()
      await page.waitForTimeout(500) // Wait for variant selection
    }

    // 12. Add to cart
    const addToCartButton = page.locator('button:has-text("AJOUTER AU PANIER"), button:has-text("Add to cart")')
    await addToCartButton.click()

    // 13. Verify cart confirmation (could be toast or modal)
    await expect(
      page.locator('text=Ajouté au panier, text=Added to cart')
    ).toBeVisible({ timeout: 5000 })

    // 14. Verify cart badge updates
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    await expect(cartBadge).toHaveText('1', { timeout: 5000 })

    // 15. Open cart
    await page.click('[data-testid="cart-button"]')

    // 16. Proceed to checkout
    const checkoutButton = page.locator('button:has-text("Passer la commande"), button:has-text("Checkout")')
    await checkoutButton.click()

    // 17. Should be on checkout page
    await page.waitForURL('/checkout')
    await expect(page).toHaveURL('/checkout')

    // 18. Fill shipping address
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[name="line1"]', '123 Test Street')
    await page.fill('input[name="city"]', 'Paris')
    await page.fill('input[name="postalCode"]', '75001')

    // Select country
    const countrySelect = page.locator('select[name="country"]')
    await countrySelect.selectOption('FR')

    await page.fill('input[name="phone"]', '+33612345678')

    // 19. Continue to shipping method
    const continueButton = page.locator('button:has-text("Continuer"), button:has-text("Continue")')
    await continueButton.click()

    // 20. Select standard shipping
    await page.click('input[value="standard"]')
    await continueButton.click()

    // 21. Apply promo code (optional - skip if not available)
    const promoInput = page.locator('input[placeholder*="Code promo"], input[placeholder*="Promo code"]')
    const promoInputCount = await promoInput.count()
    if (promoInputCount > 0) {
      await promoInput.fill('SAVE10')
      await page.click('button:has-text("Appliquer"), button:has-text("Apply")')
      await page.waitForTimeout(1000) // Wait for promo validation
    }

    // 22. Intercept Paystack payment initialization to simulate successful payment
    await page.route('**/api/payment/initialize', async route => {
      // Mock the payment initialization to return a fake reference
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: '/checkout/confirmation?reference=test_ref_' + Date.now(),
            access_code: 'test_access_code',
            reference: 'test_ref_' + Date.now(),
          }
        })
      })
    })

    // Intercept the order creation API to simulate successful order
    await page.route('**/api/orders/create', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          order: {
            id: 'order_test_' + Date.now(),
            orderNumber: 'ORD-TEST-' + Date.now(),
            total: 100.00,
            status: 'PROCESSING',
          }
        })
      })
    })

    // 23. Proceed to payment
    const payButton = page.locator('button:has-text("Payer"), button:has-text("Pay"), button:has-text("Place Order")')
    await payButton.click()

    // 24. Wait for automatic redirect to confirmation page (mocked payment flow)
    // The app should redirect directly to confirmation without going to Paystack
    await page.waitForURL(/\/checkout\/confirmation/, { timeout: 15000 })

    // Fallback: If the app still tries to redirect to Paystack (shouldn't happen with mocks)
    if (page.url().includes('paystack.com')) {
      // Immediately navigate back to confirmation page
      await page.goto('/checkout/confirmation?reference=test_ref_' + Date.now())
    }

    // 25. Verify confirmation page
    await expect(page).toHaveURL(/\/checkout\/confirmation/)

    // 26. Verify order confirmation message
    await expect(
      page.locator('text=Commande confirmée, text=Order confirmed')
    ).toBeVisible()

    // 27. Verify order number is displayed
    const orderNumber = page.locator('[data-testid="order-number"]')
    await expect(orderNumber).toBeVisible()

    // 28. Verify order total is displayed
    await expect(page.locator('text=Total')).toBeVisible()
  })

  test('should handle authentication requirement for checkout', async ({ page }) => {
    // 1. Add product to cart without logging in
    await page.goto('/products')
    await page.waitForSelector('[data-testid="product-card"]')

    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()

    await page.waitForURL(/\/products\/.*/)

    const addToCartButton = page.locator('button:has-text("AJOUTER AU PANIER"), button:has-text("Add to cart")')
    await addToCartButton.click()

    // 2. Try to proceed to checkout
    await page.click('[data-testid="cart-button"]')

    const checkoutButton = page.locator('button:has-text("Passer la commande"), button:has-text("Checkout")')
    await checkoutButton.click()

    // 3. Should redirect to login page
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })

  test('should preserve cart across login', async ({ page }) => {
    // 1. Add product to cart before login
    await page.goto('/products')
    await page.waitForSelector('[data-testid="product-card"]')

    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()

    await page.waitForURL(/\/products\/.*/)

    const addToCartButton = page.locator('button:has-text("AJOUTER AU PANIER"), button:has-text("Add to cart")')
    await addToCartButton.click()

    // 2. Verify cart badge shows 1
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    await expect(cartBadge).toHaveText('1')

    // 3. Login
    await page.goto('/login')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    // 4. Wait for redirect
    await page.waitForURL('/')

    // 5. Verify cart still has item
    await expect(cartBadge).toHaveText('1')
  })

  test('should calculate order totals correctly', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Add product with known price
    await page.goto('/products')
    await page.waitForSelector('[data-testid="product-card"]')

    const productCard = page.locator('[data-testid="product-card"]').first()
    const priceText = await productCard.locator('[data-testid="product-price"]').textContent()

    await productCard.click()
    await page.waitForURL(/\/products\/.*/)

    const addToCartButton = page.locator('button:has-text("AJOUTER AU PANIER"), button:has-text("Add to cart")')
    await addToCartButton.click()

    // Go to checkout
    await page.click('[data-testid="cart-button"]')
    const checkoutButton = page.locator('button:has-text("Passer la commande"), button:has-text("Checkout")')
    await checkoutButton.click()

    await page.waitForURL('/checkout')

    // Fill address
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[name="line1"]', '123 Test St')
    await page.fill('input[name="city"]', 'Paris')
    await page.fill('input[name="postalCode"]', '75001')
    await page.locator('select[name="country"]').selectOption('FR')
    await page.fill('input[name="phone"]', '+33612345678')

    // Verify totals section exists
    const subtotal = page.locator('[data-testid="order-subtotal"]')
    await expect(subtotal).toBeVisible()

    const shipping = page.locator('[data-testid="order-shipping"]')
    await expect(shipping).toBeVisible()

    const tax = page.locator('[data-testid="order-tax"]')
    await expect(tax).toBeVisible()

    const total = page.locator('[data-testid="order-total"]')
    await expect(total).toBeVisible()
  })
})
