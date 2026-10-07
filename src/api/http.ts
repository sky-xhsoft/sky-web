import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { API_BASE_URL } from '../config'
import { clearAuth, getAccessToken, getRefreshToken, updateAccessToken } from '../utils/token'
import { refreshAccessToken } from './auth'
import { ApiError, type ApiResponse } from './types'

const TOKEN_INVALID_CODES = [20003, 401] as const

/** 扩展的请求配置，支持重试标记 */
interface RetryableRequestConfig extends AxiosRequestConfig {
  __isRetryRequest?: boolean
}

let redirectingToLogin = false

const redirectToLogin = () => {
  if (redirectingToLogin) return
  redirectingToLogin = true
  clearAuth()

  if (typeof window !== 'undefined' && window.location) {
    const { pathname, search, hash } = window.location
    const current = `${pathname}${search}${hash}`
    const target =
      current && !pathname.startsWith('/login')
        ? `/login?redirect=${encodeURIComponent(current)}`
        : '/login'
    window.location.replace(target)
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function getNewToken(): Promise<string | null> {
  if (refreshing) return refreshing

  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshing = refreshAccessToken(refreshToken)
    .then((data) => {
      if (!data) return null
      // 只更新访问令牌，保留登录类型、公司信息等（原先整份重写会把它们清空）
      updateAccessToken(data.token)
      return data.token
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const payload = response?.data
    const code = payload?.code !== undefined ? Number(payload.code) : null
    if (code && (TOKEN_INVALID_CODES as readonly number[]).includes(code)) {
      redirectToLogin()
      return Promise.reject(new Error(payload?.message || '登录已过期，请重新登录'))
    }
    return response
  },
  async (error: AxiosError<ApiResponse>) => {
    const response = error.response
    const config = error.config as RetryableRequestConfig | undefined
    const isUnauthorized = response?.status === 401
    const isRefreshRequest = config?.url?.includes('/auth/refresh')
    if (isUnauthorized && config && !config.__isRetryRequest) {
      if (isRefreshRequest) {
        redirectToLogin()
        return Promise.reject(error)
      }

      const newToken = await getNewToken()
      if (newToken && config.headers) {
        config.__isRetryRequest = true
        config.headers.Authorization = `Bearer ${newToken}`
        return api(config)
      }

      redirectToLogin()
      return Promise.reject(error)
    }

    const payload = response?.data
    const code = payload?.code !== undefined ? Number(payload.code) : null
    if (code && (TOKEN_INVALID_CODES as readonly number[]).includes(code)) {
      redirectToLogin()
    }

    // 提取后端返回的详细错误信息
    const errorMessage = payload?.message || error.message || '请求失败'
    const enhancedError = new ApiError(errorMessage, {
      response,
      code,
      data: payload,
    })

    // 记录错误日志
    console.error('API请求失败:', {
      url: config?.url,
      method: config?.method,
      code,
      message: errorMessage,
      data: payload,
      timestamp: new Date().toISOString(),
    })

    return Promise.reject(enhancedError)
  }
)

export default api
