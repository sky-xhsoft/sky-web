import axios from 'axios'
import { API_BASE_URL } from '../config'
import { clearAuth, getAccessToken, getDeviceId, getRefreshToken, getStoredUser, saveAuth } from '../utils/token'
import { refreshAccessToken } from './auth'

const TOKEN_INVALID_CODES = [20003, 401]
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

api.interceptors.response.use(
  (response) => {
    const payload = response?.data
    const code = payload?.code !== undefined ? Number(payload.code) : null
    if (code && TOKEN_INVALID_CODES.includes(code)) {
      redirectToLogin()
      return Promise.reject(new Error(payload?.message || '登录已过期，请重新登录'))
    }
    return response
  },
  async (error) => {
    const { response, config } = error
    const isUnauthorized = response?.status === 401
    const isRefreshRequest = config?.url?.includes('/auth/refresh')
    if (isUnauthorized && config && !(config as any).__isRetryRequest) {
      if (isRefreshRequest) {
        redirectToLogin()
        return Promise.reject(error)
      }

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        redirectToLogin()
        return Promise.reject(error)
      }

      if (!refreshing) {
        refreshing = refreshAccessToken(refreshToken)
          .then((data) => {
            if (!data) return null
            const { user, deviceId } = getStoredUser()
            const ensuredDeviceId = deviceId || getDeviceId() || ''
            saveAuth({
              token: data.token,
              refreshToken,
              user,
              deviceId: ensuredDeviceId,
            })
            return data.token
          })
          .catch(() => null)
          .finally(() => {
            refreshing = null
          })
      }

      const newToken = await refreshing
      if (newToken && config.headers) {
        ;(config as any).__isRetryRequest = true
        config.headers.Authorization = `Bearer ${newToken}`
        return api(config)
      }

      redirectToLogin()
      return Promise.reject(error)
    }

    const payload = response?.data
    const code = payload?.code !== undefined ? Number(payload.code) : null
    if (code && TOKEN_INVALID_CODES.includes(code)) {
      redirectToLogin()
    }

    return Promise.reject(error)
  }
)

export default api
