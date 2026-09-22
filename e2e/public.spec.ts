import { test, expect } from '@playwright/test'
import { PUBLIC_URLS } from './helpers/pages'

/**
 * 未登录公开页 E2E
 * 无需登录即可访问的路由:欢迎页/登录页/企业注册/文件分享/404。
 * 断言围绕「页面可打开、有内容、不被强制跳登录」。
 */

for (const { url, name } of PUBLIC_URLS) {
  test(`公开页可访问 ${name} (${url})`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(url)

    if (url === '/login') {
      // 登录页本就在 /login，独立断言
      await expect(page.locator('.login-page')).toBeVisible({ timeout: 8000 })
      expect(new URL(page.url()).pathname).toBe('/login')
    } else {
      // 其余公开页:不应被强制跳转到登录页
      await expect(page.locator('body')).toBeVisible({ timeout: 8000 })
      expect(new URL(page.url()).pathname, `${name} 不应跳回登录页`).not.toBe('/login')

      if (url === '/') {
        // 欢迎页：有内容 + 未登录时不应渲染登录后布局
        const text = await page.locator('body').innerText()
        expect(text.trim().length).toBeGreaterThan(0)
        await expect(page.locator('.app-shell')).toHaveCount(0)
      } else if (url === '/company-register') {
        // 企业注册：有内容即可（具体 root class 由组件决定）
        const text = await page.locator('body').innerText()
        expect(text.trim().length).toBeGreaterThan(0)
      } else if (url.startsWith('/share/')) {
        // 分享页(空态/加载中)：body 有内容即可
        await expect(page.locator('body')).toBeVisible()
      } else {
        // 404
        await expect(page.locator('text=404')).toBeVisible({ timeout: 8000 })
      }
    }

    expect(errors).toEqual([])
  })
}