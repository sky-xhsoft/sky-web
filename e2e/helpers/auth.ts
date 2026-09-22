import type { APIRequestContext, Page } from '@playwright/test'

/**
 * E2E 登录态工具
 * 用真实账号（admin/admin123）走后端登录接口拿 token，再注入前端 localStorage，
 * 与 src/utils/token.ts 的 saveAuth() 键名完全一致，保证受保护页面 API 不 401。
 */

// 后端实际地址（前端 dev 走 Vite 代理到 9090；Playwright request 直连后端更稳）
export const BACKEND_API = process.env.E2E_BACKEND_API || 'http://localhost:9090/api/v1'

export const CREDENTIALS = {
  username: process.env.E2E_USERNAME || 'admin',
  password: process.env.E2E_PASSWORD || 'admin123',
  companyId: 1,
}

export type AuthSession = {
  token: string
  refreshToken: string
  deviceId: string
  user: { id: number; username: string; trueName: string; isAdmin: string; companyId: number } | null
  company: unknown | null
  companyConf: unknown | null
  loginType: 'live' | 'cloud' | null
}

/** 用 APIRequestContext 走真实后端登录，返回完整会话数据（token 真实有效）。 */
export async function login(request: APIRequestContext, loginType: 'live' | 'cloud' = 'live'): Promise<AuthSession> {
  const deviceId = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const res = await request.post(`${BACKEND_API}/auth/login`, {
    data: {
      username: CREDENTIALS.username,
      password: CREDENTIALS.password,
      companyId: CREDENTIALS.companyId,
      clientType: loginType === 'cloud' ? 'cloud-web' : 'live-web',
      deviceId,
    },
  })
  if (!res.ok()) {
    throw new Error(`E2E 登录失败 HTTP ${res.status()}: ${(await res.text()).slice(0, 300)}`)
  }
  const body = await res.json()
  const data = body?.data
  if (!data || !data.token) {
    throw new Error(`E2E 登录响应缺少 token（body.code=${body?.code}）`)
  }
  return {
    token: data.token,
    refreshToken: data.refreshToken || '',
    deviceId,
    user: data.user || null,
    company: data.company || null,
    companyConf: data.companyConf || null,
    loginType,
  }
}

/** 在页面加载前把登录态写入 window.localStorage。 */
export async function injectAuth(page: Page, session: AuthSession): Promise<void> {
  await page.addInitScript(
    ([token, refreshToken, user, deviceId, company, companyConf, loginType]) => {
      const s = window.localStorage
      s.setItem('language', 'zh-CN') // 固定中文，保证标题/文案与后端 zh displayName 对齐、断言稳定
      s.removeItem('sky_menu_ui_state') // 清掉侧栏折叠持久化，保证侧栏展开可导航
      s.setItem('sky-web:token', token)
      s.setItem('sky-web:refresh-token', refreshToken)
      s.setItem('sky-web:user', JSON.stringify({ user, deviceId }))
      s.setItem('sky-web:device-id', deviceId)
      if (company) s.setItem('sky-web:company', JSON.stringify(company))
      else s.removeItem('sky-web:company')
      if (companyConf) s.setItem('sky-web:company-conf', JSON.stringify(companyConf))
      else s.removeItem('sky-web:company-conf')
      s.setItem('sky-web:login-type', loginType || 'live')
    },
    [
      session.token,
      session.refreshToken,
      session.user,
      session.deviceId,
      session.company,
      session.companyConf,
      session.loginType,
    ] as const,
  )
}