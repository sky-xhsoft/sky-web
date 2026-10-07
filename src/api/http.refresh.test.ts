import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'

vi.mock('./auth', () => ({
  refreshAccessToken: vi.fn().mockResolvedValue({ token: 'new-access-token' }),
}))

import api from './http'
import { refreshAccessToken } from './auth'

// 第一次请求返回 401，带新令牌重试时返回 200
const expiredThenOk: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const auth = String(config.headers?.Authorization || '')
  if (auth !== 'Bearer new-access-token') {
    throw new AxiosError('Unauthorized', '401', config, null, {
      status: 401, statusText: 'Unauthorized', headers: {}, config, data: { code: 401, message: 'token expired' },
    })
  }
  return { status: 200, statusText: 'OK', headers: {}, config, data: { code: 200, data: ['ok'] } }
}

describe('访问令牌过期后自动刷新', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    localStorage.setItem('sky-web:token', 'expired-access-token')
    localStorage.setItem('sky-web:refresh-token', 'refresh-token')
    localStorage.setItem('sky-web:login-type', 'cloud')
    localStorage.setItem('sky-web:company', JSON.stringify({ id: 1, name: '测试公司' }))
    localStorage.setItem('sky-web:company-conf', JSON.stringify({ storageType: 'cos' }))
  })

  it('刷新后重试成功，并保留登录类型与公司信息', async () => {
    const res = await api.get('/menus/user/tree', { params: { type: 'cloud' }, adapter: expiredThenOk })

    expect(res.data.data).toEqual(['ok'])
    expect(refreshAccessToken).toHaveBeenCalledWith('refresh-token')
    expect(localStorage.getItem('sky-web:token')).toBe('new-access-token')
    // 原先刷新时整份重写登录信息，这三项会被清空，刷新页面后菜单不再按子系统过滤
    expect(localStorage.getItem('sky-web:login-type')).toBe('cloud')
    expect(JSON.parse(localStorage.getItem('sky-web:company') || 'null')).toEqual({ id: 1, name: '测试公司' })
    expect(JSON.parse(localStorage.getItem('sky-web:company-conf') || 'null')).toEqual({ storageType: 'cos' })
  })
})
