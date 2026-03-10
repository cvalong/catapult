import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('__APP_NAME__ — The fastest way to launch your next idea')
  })

  test.describe('Nav', () => {
    test('logo links to /', async ({ page }) => {
      const logo = page.getByRole('navigation').getByRole('link', { name: '__APP_NAME__' })
      await expect(logo).toHaveAttribute('href', '/')
    })

    test('Features link goes to #features', async ({ page }) => {
      const link = page.getByRole('navigation').getByRole('link', { name: 'Features' })
      await expect(link).toHaveAttribute('href', '#features')
    })

    test('Pricing link goes to #pricing', async ({ page }) => {
      const link = page.getByRole('navigation').getByRole('link', { name: 'Pricing' })
      await expect(link).toHaveAttribute('href', '#pricing')
    })

    test('Sign in link goes to /sign-in', async ({ page }) => {
      const link = page.getByRole('navigation').getByRole('link', { name: 'Sign in' })
      await expect(link).toHaveAttribute('href', /\/sign-in/)
    })

    test('Get started link goes to /sign-up', async ({ page }) => {
      const link = page.getByRole('navigation').getByRole('link', { name: 'Get started' })
      await expect(link).toHaveAttribute('href', /\/sign-up/)
    })
  })

  test.describe('Hero', () => {
    test('renders h1', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toContainText('The fastest way to')
    })

    test('"Get started free" links to /sign-up', async ({ page }) => {
      const link = page.getByRole('link', { name: 'Get started free' }).first()
      await expect(link).toHaveAttribute('href', /\/sign-up/)
    })

    test('"See how it works" links to #features', async ({ page }) => {
      const link = page.getByRole('link', { name: 'See how it works' })
      await expect(link).toHaveAttribute('href', '#features')
    })
  })

  test.describe('Features section', () => {
    test('section#features exists', async ({ page }) => {
      await expect(page.locator('section#features')).toBeVisible()
    })

    test('has "Everything you need" heading', async ({ page }) => {
      const section = page.locator('section#features')
      await expect(section.getByRole('heading', { name: 'Everything you need' })).toBeVisible()
    })

    test('has 3 feature cards each with h3 and p', async ({ page }) => {
      const cards = page.locator('section#features .rounded-xl')
      await expect(cards).toHaveCount(3)
      for (let i = 0; i < 3; i++) {
        const card = cards.nth(i)
        await expect(card.locator('h3')).toBeVisible()
        await expect(card.locator('p')).toBeVisible()
      }
    })
  })

  test.describe('Pricing section', () => {
    test('section#pricing exists', async ({ page }) => {
      await expect(page.locator('section#pricing')).toBeVisible()
    })

    test('has "Simple pricing" heading', async ({ page }) => {
      const section = page.locator('section#pricing')
      await expect(section.getByRole('heading', { name: 'Simple pricing' })).toBeVisible()
    })

    test('has 2 pricing tier cards', async ({ page }) => {
      const cards = page.locator('section#pricing .rounded-xl')
      await expect(cards).toHaveCount(2)
    })

    test('Free CTA links to /sign-up', async ({ page }) => {
      const link = page.getByRole('link', { name: 'Get started free' }).last()
      await expect(link).toHaveAttribute('href', /\/sign-up/)
    })

    test('Pro CTA links to /sign-up?plan=pro', async ({ page }) => {
      const link = page.getByRole('link', { name: 'Start free trial' })
      await expect(link).toHaveAttribute('href', /\/sign-up\?plan=pro/)
    })
  })

  test('footer shows current year and app name', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toContainText(String(new Date().getFullYear()))
    await expect(footer).toContainText('__APP_NAME__')
  })
})
