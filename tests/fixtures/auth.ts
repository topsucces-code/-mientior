/**
 * Authentication fixtures for E2E tests
 */

import { Page } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  name: string
}

export const TEST_USERS = {
  customer: {
    email: 'customer@test.com',
    password: 'TestPassword123!',
    name: 'Test Customer',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@mientior.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: 'Admin User',
  },
}

/**
 * Register a new user
 */
export async function registerUser(page: Page, user: TestUser) {
  await page.goto('/register')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.fill('input[name="name"]', user.name)
  await page.click('button[type="submit"]')

  // Wait for redirect
  await page.waitForURL(/\/(login|$)/, { timeout: 10000 })
}

/**
 * Login with credentials
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 10000 })
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.fill('input[type="email"]', TEST_USERS.admin.email)
  await page.fill('input[type="password"]', TEST_USERS.admin.password)
  await page.click('button[type="submit"]')

  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin', { timeout: 10000 })
}

/**
 * Logout
 */
export async function logout(page: Page) {
  // Click logout button (location may vary)
  const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Logout"), a:has-text("Logout")')
  await logoutButton.click()

  // Wait for redirect to login or home
  await page.waitForURL(/\/(login|$)/, { timeout: 10000 })
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Mon compte")')
  const count = await userMenu.count()
  return count > 0
}
