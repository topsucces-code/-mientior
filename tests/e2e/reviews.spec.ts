import { test, expect } from '@playwright/test'

test.describe('Product Reviews', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers un produit de test
    await page.goto('/products/test-product-slug')
  })

  test('should display reviews tab', async ({ page }) => {
    // Cliquer sur l'onglet Avis
    await page.click('button:has-text("Avis")')

    // Vérifier que les avis sont affichés
    await expect(page.locator('[data-testid="reviews-list"]')).toBeVisible()
  })

  test('should submit a review', async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Retourner au produit
    await page.goto('/products/test-product-slug')
    await page.click('button:has-text("Avis")')

    // Ouvrir le modal d'écriture
    await page.click('button:has-text("Écrire un avis")')

    // Remplir le formulaire
    await page.click('button:has-text("⭐"):nth-of-type(5)') // 5 étoiles
    await page.fill('[id="review-title"]', 'Excellent produit')
    await page.fill('[id="review-comment"]', 'Je recommande vivement ce produit. Qualité exceptionnelle.')

    // Soumettre
    await page.click('button:has-text("Publier mon avis")')

    // Vérifier le message de succès
    await expect(page.locator('text=Avis soumis')).toBeVisible()
  })

  test('should filter reviews by rating', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    // Cliquer sur le filtre 5 étoiles
    await page.click('[data-testid="filter-rating-5"]')

    // Vérifier que seuls les avis 5 étoiles sont affichés
    const reviews = page.locator('[data-testid="review-item"]')
    const count = await reviews.count()

    for (let i = 0; i < count; i++) {
      const stars = await reviews.nth(i).locator('[data-testid="review-rating"]').textContent()
      expect(stars).toContain('5')
    }
  })

  test('should vote helpful on a review', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    // Trouver le premier avis
    const firstReview = page.locator('[data-testid="review-item"]').first()
    const helpfulButton = firstReview.locator('button:has-text("Utile")')

    // Récupérer le compteur initial
    const initialCount = await helpfulButton.textContent()

    // Cliquer sur "Utile"
    await helpfulButton.click()

    // Vérifier que le compteur a augmenté
    await expect(helpfulButton).not.toHaveText(initialCount!)
  })

  test('should filter reviews with photos', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    // Cliquer sur le filtre "Avec photos"
    await page.click('[data-testid="filter-photos"]')

    // Attendre que le filtre soit appliqué
    await page.waitForTimeout(300)

    const reviews = page.locator('[data-testid="review-item"]')
    const count = await reviews.count()

    if (count > 0) {
      // Vérifier que chaque avis affiché contient une image
      for (let i = 0; i < count; i++) {
        const reviewImages = reviews.nth(i).locator('img')
        const imageCount = await reviewImages.count()
        expect(imageCount).toBeGreaterThan(0)
      }
    } else {
      // Si aucun avis avec photo, vérifier le message "aucun résultat"
      await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible()
    }
  })

  test('should filter verified purchase reviews', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    // Cliquer sur le filtre "Achat vérifié"
    await page.click('[data-testid="filter-verified"]')

    // Attendre que le filtre soit appliqué
    await page.waitForTimeout(300)

    const reviews = page.locator('[data-testid="review-item"]')
    const count = await reviews.count()

    if (count > 0) {
      // Vérifier que chaque avis affiché a le badge "Achat vérifié"
      for (let i = 0; i < count; i++) {
        const verifiedBadge = reviews.nth(i).locator('text=Achat vérifié')
        await expect(verifiedBadge).toBeVisible()
      }
    } else {
      // Si aucun avis vérifié, vérifier le message "aucun résultat"
      await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible()
    }
  })

  test('should show no results message for impossible filter combination', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    // Appliquer plusieurs filtres restrictifs simultanément
    await page.click('[data-testid="filter-rating-5"]')
    await page.click('[data-testid="filter-photos"]')
    await page.click('[data-testid="filter-verified"]')

    // Attendre que les filtres soient appliqués
    await page.waitForTimeout(300)

    const reviews = page.locator('[data-testid="review-item"]')
    const count = await reviews.count()

    if (count === 0) {
      // Vérifier que le message "aucun résultat" est affiché
      await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible()
      await expect(page.locator('text=Aucun avis ne correspond')).toBeVisible()

      // Vérifier que le bouton de réinitialisation est présent
      await expect(page.locator('button:has-text("Réinitialiser les filtres")')).toBeVisible()
    }
  })

  test('should reset filters when clicking reset button', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    // Appliquer un filtre
    await page.click('[data-testid="filter-verified"]')
    await page.waitForTimeout(300)

    const reviewsAfterFilter = page.locator('[data-testid="review-item"]')
    const countAfterFilter = await reviewsAfterFilter.count()

    // Cliquer sur "Tous" pour réinitialiser
    await page.click('[data-testid="filter-all"]')
    await page.waitForTimeout(300)

    const reviewsAfterReset = page.locator('[data-testid="review-item"]')
    const countAfterReset = await reviewsAfterReset.count()

    // Le nombre d'avis après réinitialisation devrait être >= au nombre filtré
    expect(countAfterReset).toBeGreaterThanOrEqual(countAfterFilter)
  })

  test('should load more reviews with pagination', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    // Vérifier si le bouton "Voir plus" est présent (indique qu'il y a plus d'avis)
    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]')
    const hasLoadMore = await loadMoreButton.isVisible().catch(() => false)

    if (hasLoadMore) {
      // Compter les avis initiaux
      const initialReviews = page.locator('[data-testid="review-item"]')
      const initialCount = await initialReviews.count()

      // Intercepter la requête de pagination
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/reviews/products/') && response.url().includes('page=2')
      )

      // Cliquer sur "Voir plus d'avis"
      await loadMoreButton.click()

      // Attendre la réponse de l'API
      await responsePromise

      // Attendre que les nouveaux avis soient chargés
      await page.waitForTimeout(500)

      // Vérifier que le nombre d'avis a augmenté
      const newReviews = page.locator('[data-testid="review-item"]')
      const newCount = await newReviews.count()

      expect(newCount).toBeGreaterThan(initialCount)

      // Vérifier que le compteur affiché est mis à jour
      const countText = page.locator('text=/\\d+ sur \\d+ avis affichés/')
      await expect(countText).toBeVisible()
    }
  })

  test('should hide load more button when all reviews are loaded', async ({ page }) => {
    await page.click('button:has-text("Avis")')

    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]')
    let hasLoadMore = await loadMoreButton.isVisible().catch(() => false)

    // Cliquer sur "Voir plus" jusqu'à ce qu'il disparaisse
    let iterations = 0
    const maxIterations = 10 // Limite de sécurité

    while (hasLoadMore && iterations < maxIterations) {
      await loadMoreButton.click()
      await page.waitForTimeout(1000)
      hasLoadMore = await loadMoreButton.isVisible().catch(() => false)
      iterations++
    }

    // Si on a cliqué au moins une fois, le bouton devrait avoir disparu ou on a atteint la limite
    if (iterations > 0 && iterations < maxIterations) {
      await expect(loadMoreButton).not.toBeVisible()
    }
  })
})
