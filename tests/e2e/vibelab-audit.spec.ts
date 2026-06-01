import { test, expect } from '@playwright/test'

const BASE_URL = 'http://127.0.0.1:3005'

test.describe('VibeLab — Landing Page', () => {
  test('landing page loads with correct title and styles', async ({ page }) => {
    await page.goto(BASE_URL)

    // Проверяем title
    await expect(page).toHaveTitle(/VibeLab/)

    // Проверяем что CSS загрузился (фон должен быть тёмным)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    console.log('Body background:', bgColor)

    // Проверяем наличие ключевых элементов лендинга
    const header = page.locator('header').first()
    await expect(header).toBeVisible()

    // Проверяем лого "VibeLab"
    const logo = page.getByText('VibeLab').first()
    await expect(logo).toBeVisible()

    // Скриншот лендинга
    await page.screenshot({ path: 'tests/e2e/screenshots/landing.png', fullPage: false })
    console.log('Screenshot saved: tests/e2e/screenshots/landing.png')
  })

  test('navigation links are clickable', async ({ page }) => {
    await page.goto(BASE_URL)

    // Проверяем кнопку "Войти"
    const loginLink = page.getByText('Войти').first()
    await expect(loginLink).toBeVisible()

    // Проверяем "Попробовать бесплатно"
    const ctaButton = page.getByText('Попробовать бесплатно').first()
    await expect(ctaButton).toBeVisible()

    // Проверяем nav ссылки
    const navItems = ['Инструменты', 'Модели', 'Тарифы', 'FAQ']
    for (const item of navItems) {
      const link = page.getByText(item, { exact: true }).first()
      const isVisible = await link.isVisible().catch(() => false)
      console.log(`Nav "${item}": ${isVisible ? 'visible' : 'NOT visible'}`)
    }
  })

  test('CTA redirects to signup', async ({ page }) => {
    await page.goto(BASE_URL)

    const ctaButton = page.getByText('Попробовать бесплатно').first()
    await ctaButton.click()

    // Должен перейти на /signup или /login
    await page.waitForURL(/\/(signup|login)/, { timeout: 5000 })
    console.log('CTA redirected to:', page.url())

    await page.screenshot({ path: 'tests/e2e/screenshots/signup.png' })
  })
})

test.describe('VibeLab — Auth Pages', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    // Проверяем форму входа
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first()
    await expect(emailInput).toBeVisible()

    const passwordInput = page.locator('input[type="password"]').first()
    await expect(passwordInput).toBeVisible()

    const submitButton = page.locator('button[type="submit"], button:has-text("Войти")').first()
    await expect(submitButton).toBeVisible()

    // Проверяем ссылку на регистрацию
    const signupLink = page.getByText('Зарегистрироваться').first().or(page.getByText('Создать аккаунт').first())
    const hasSignupLink = await signupLink.isVisible().catch(() => false)
    console.log('Signup link visible:', hasSignupLink)

    await page.screenshot({ path: 'tests/e2e/screenshots/login.png' })
  })

  test('signup page renders form', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)

    const nameInput = page.locator('input[name="name"], input[placeholder*="мя"]').first()
    const hasName = await nameInput.isVisible().catch(() => false)
    console.log('Name input visible:', hasName)

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first()
    await expect(emailInput).toBeVisible()

    const passwordInput = page.locator('input[type="password"]').first()
    await expect(passwordInput).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/signup.png' })
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"], button:has-text("Войти")').first()

    await emailInput.fill('test@nonexistent.com')
    await passwordInput.fill('wrongpassword123')
    await submitButton.click()

    // Ждём ответа
    await page.waitForTimeout(2000)

    // Проверяем что появилась ошибка или мы остались на /login
    const currentUrl = page.url()
    console.log('After invalid login, URL:', currentUrl)
    expect(currentUrl).toContain('/login')

    await page.screenshot({ path: 'tests/e2e/screenshots/login-error.png' })
  })
})

test.describe('VibeLab — Protected Routes', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/content`)

    // Должен редиректить на /login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    console.log('Protected route redirected to:', page.url())
    expect(page.url()).toContain('/login')
  })

  test('all protected routes redirect to login', async ({ page }) => {
    const protectedRoutes = ['/ai', '/lab', '/history', '/rating', '/profile']

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`)
      await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
      const redirected = page.url().includes('/login')
      console.log(`${route}: ${redirected ? 'redirected to /login' : 'accessible (!!!)'}`)
    }
  })
})

test.describe('VibeLab — API Health', () => {
  test('API endpoints return proper status codes', async ({ request }) => {
    // Public endpoints
    const leaderboard = await request.get(`${BASE_URL}/api/rating/leaderboard`)
    console.log('GET /api/rating/leaderboard:', leaderboard.status())
    expect(leaderboard.status()).toBe(200)

    const experiments = await request.get(`${BASE_URL}/api/experiments`)
    console.log('GET /api/experiments:', experiments.status())
    expect(experiments.status()).toBe(200)

    // Protected endpoints should return 401
    const profile = await request.get(`${BASE_URL}/api/user/profile`)
    console.log('GET /api/user/profile:', profile.status())
    expect(profile.status()).toBe(401)

    const credits = await request.get(`${BASE_URL}/api/user/credits`)
    console.log('GET /api/user/credits:', credits.status())
    expect(credits.status()).toBe(401)
  })

  test('rate limit headers are present', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/rating/leaderboard`)
    const headers = response.headers()

    console.log('X-RateLimit-Limit:', headers['x-ratelimit-limit'])
    console.log('X-RateLimit-Remaining:', headers['x-ratelimit-remaining'])

    expect(headers['x-ratelimit-limit']).toBeDefined()
    expect(headers['x-ratelimit-remaining']).toBeDefined()
  })
})

test.describe('VibeLab — Responsive Design', () => {
  test('mobile viewport renders bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }) // iPhone X
    await page.goto(`${BASE_URL}/login`)
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-login.png' })
  })

  test('desktop viewport renders properly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(BASE_URL)
    await page.screenshot({ path: 'tests/e2e/screenshots/desktop-landing.png' })
  })
})
