import { test, expect } from '@playwright/test'
import { CREDENTIALS, login, injectAuth } from './helpers/auth'

/**
 * 真实 UI 登录流程 E2E
 * 覆盖:未登录访问受保护页重定向、正确凭据登录成功、错误凭据拒绝、已登录访问 /login 重定向。
 */

test.describe('登录流程', () => {
  test('未登录访问受保护页 → 重定向到 /login', async ({ page }) => {
    await page.goto('/live/domains')
    await expect(page.locator('.login-page')).toBeVisible({ timeout: 8000 })
    expect(new URL(page.url()).pathname).toBe('/login')
    // redirect 参数保留目标
    expect(new URL(page.url()).searchParams.get('redirect')).toContain('live/domains')
  })

  test('正确凭据登录 → 跳到默认目标并渲染布局', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('.login-card')).toBeVisible({ timeout: 8000 })

    const username = page.locator('.login-card input').first()
    const password = page.locator('.login-card input[type="password"]')
    await username.fill(CREDENTIALS.username)
    await password.fill(CREDENTIALS.password)

    await page.locator('.login-card button[type="submit"]').click()

    // 登录成功应进入布局(默认目标 /LiveGuide)
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 10000 })
    expect(new URL(page.url()).pathname).toBe('/LiveGuide')
  })

  test('错误密码 → 停留在登录页并提示错误', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('.login-card')).toBeVisible({ timeout: 8000 })

    const username = page.locator('.login-card input').first()
    const password = page.locator('.login-card input[type="password"]')
    await username.fill(CREDENTIALS.username)
    await password.fill('wrong-password')

    await page.locator('.login-card button[type="submit"]').click()

    // 应仍在登录页,不进入布局
    await page.waitForTimeout(800)
    await expect(page.locator('.login-page')).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/login')
  })

  test('已登录访问 /login → 自动重定向到默认目标', async ({ page }) => {
    const auth = await login((page.request as any) as Parameters<typeof login>[0], 'live')
    await injectAuth(page, auth)

    await page.goto('/login')
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 10000 })
    expect(new URL(page.url()).pathname).toBe('/LiveGuide')
  })
})