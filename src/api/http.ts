import axios from 'axios'
import { API_BASE_URL } from '../config'
import { clearAuth, getAccessToken, getDeviceId, getRefreshToken, getStoredUser, saveAuth } from '../utils/token'
import { refreshAccessToken } from './auth'

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
  (response) => response,
  async (error) => {
    const { response, config } = error
    if (response?.status === 401 && config && !(config as any).__isRetryRequest) {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearAuth()
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
    }

    return Promise.reject(error)
  }
)

export default api

