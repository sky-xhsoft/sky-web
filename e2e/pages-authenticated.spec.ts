import { test, expect } from '@playwright/test'
import { login, injectAuth } from './helpers/auth'
import { getNavLeaves } from './helpers/pages'

/**
 * 登录后全页面遍历 E2E（核心）
 * 产品页面内容由 navigationStore + loadComponent 驱动（非 vue-router 组件），因此必须经 UI 真实导航。
 * live 与 cloud 是两种登录类型 → 各自加载不同菜单，分别遍历。
 * 两个遍历都较重(真实点击 + 逐叶轮询渲染)，设 serial 串行避免互相抢 CPU 造成动画超时；动画 flake 用 retry 兜底。
 */

async function setup(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  type: 'live' | 'cloud',
  pageErrors: string[],
) {
  const session = await login(request, type)
  await injectAuth(page, session)
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  await page.goto('/')
  await expect(page.locator('.app-shell')).toBeVisible({ timeout: 12000 })
}

async function assertRendered(page: import('@playwright/test').Page, url: string) {
  await expect
    .poll(async () => {
      const html = await page.locator('.app-content').innerHTML().catch(() => '')
      // 渲染成功:非 loadComponent 失败的空白占位 empty-page,且有实际内容
      return html.trim().length > 0 && !html.includes('empty-page')
    }, { message: `页面内容应渲染(${url})`, timeout: 15000 })
    .toBe(true)
}

async function navigateAttempt(
  page: import('@playwright/test').Page,
  leaf: { url: string; path: string[] },
  targetRoot: string,
) {
  await page.locator('.root-menu-flat .arco-menu-item', { hasText: targetRoot }).first().click()
  await expect(page.locator('.side-nav')).toBeVisible()

  const leafItem = page.locator('.side-nav .arco-menu-item', { hasText: leaf.path[leaf.path.length - 1] }).last()

  if (leaf.path.length >= 3) {
    const group = page.locator('.side-nav .arco-menu-title', { hasText: leaf.path[1] }).first()
    await group.click()
    try {
      await leafItem.waitFor({ state: 'visible', timeout: 12000 })
    } catch {
      // 若该分组默认已展开,首次点击把它收起 → 再点一次展开
      await group.click()
      await leafItem.waitFor({ state: 'visible', timeout: 15000 })
    }
  }

  await leafItem.click()
}

async function navigateTo(
  page: import('@playwright/test').Page,
  leaf: { url: string; path: string[] },
  targetRoot: string,
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await navigateAttempt(page, leaf, targetRoot)
      return
    } catch (e) {
      if (attempt === 1) throw e
      await page.waitForTimeout(400)
    }
  }
}

test.describe('登录后功能页遍历', () => {
  test.describe.configure({ mode: 'serial', retries: 1 })

  for (const type of ['live', 'cloud'] as const) {
    test(`登录状态(${type}) 所有功能页可导航并渲染`, { timeout: 120_000 }, async ({ page, request }) => {
      const pageErrors: string[] = []
      await setup(page, request, type, pageErrors)

      const leaves = await getNavLeaves(request, type)
      expect(leaves.length).toBeGreaterThan(0)
      console.log(`[E2E:${type}] 侧栏功能页叶子 ${leaves.length} 个: `, leaves.map((l) => l.url).join(', '))

      for (const leaf of leaves) {
        await test.step(`导航 ${leaf.url}`, async () => {
          const before = pageErrors.length
          console.log(`[nav ${type}] ${leaf.url}  path=${leaf.path.join('/')}`)
          await navigateTo(page, leaf, leaf.path[0])
          await assertRendered(page, leaf.url)
          expect(pageErrors.slice(before), `导航 ${leaf.url} 出现页面错误`).toEqual([])
        })
      }
    })
  }
})

test('个人中心可从 header 进入并渲染', { timeout: 60_000 }, async ({ page, request }) => {
  const pageErrors: string[] = []
  await setup(page, request, 'live', pageErrors)

  await page.locator('.app-header').getByText('个人中心').click()
  await assertRendered(page, '/user/profile')
  expect(pageErrors).toEqual([])
})