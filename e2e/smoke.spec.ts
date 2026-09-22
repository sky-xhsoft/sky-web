import { test, expect } from '@playwright/test'

/**
 * 基础冒烟测试
 * 验证关键页面可正常打开
 */

test.describe('Smoke Tests', () => {
  test('登录页可访问', async ({ page }) => {
    await page.goto('/login')
    // 页面 title 为静态 "AI Live"，不随路由变化；改为断言登录表单渲染
    await expect(page.locator('.login-page')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.title')).toBeVisible()
  })

  test('欢迎页可访问', async ({ page }) => {
    await page.goto('/')
    // 欢迎页应该有某个识别元素
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('404 路由显示 NotFoundPage', async ({ page }) => {
    await page.goto('/non-existent-route')
    // NotFoundPage 显示 404
    await expect(page.locator('text=404')).toBeVisible({ timeout: 5000 })
  })

  test('企业注册页可访问', async ({ page }) => {
    await page.goto('/company-register')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Login Flow', () => {
  test('登录表单存在', async ({ page }) => {
    await page.goto('/login')
    // 通常登录页有用户名/密码输入框
    const usernameInput = page.locator('input').first()
    await expect(usernameInput).toBeVisible({ timeout: 5000 })
  })
})
