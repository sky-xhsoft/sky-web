import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, refreshAccessToken as refreshApi, type LoginRequest, type LoginResponse, type UserInfo } from '../api/auth'
import { clearAuth, getAccessToken, getRefreshToken, getStoredUser, saveAuth, setDeviceId, getDeviceId } from '../utils/token'

const fallbackDeviceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type AuthState = {
  token: string
  refreshToken: string
  user: UserInfo | null
  deviceId: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const { user, deviceId } = getStoredUser()
    return {
      token: getAccessToken() || '',
      refreshToken: getRefreshToken() || '',
      user,
      deviceId: deviceId || getDeviceId() || fallbackDeviceId(),
    }
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    async login(payload: Omit<LoginRequest, 'clientType' | 'deviceId'> & { deviceName?: string }) {
      const ensuredDeviceId = this.deviceId || fallbackDeviceId()
      setDeviceId(ensuredDeviceId)
      const res = await loginApi({ ...payload, clientType: 'web', deviceId: ensuredDeviceId })
      this.applyLogin(res, ensuredDeviceId)
      return res
    },
    async refresh() {
      if (!this.refreshToken) return null
      const res = await refreshApi(this.refreshToken)
      this.token = res.token
      saveAuth({
        token: res.token,
        refreshToken: this.refreshToken,
        user: this.user,
        deviceId: this.deviceId,
      })
      return res.token
    },
    async logout() {
      if (this.deviceId) {
        try {
          await logoutApi(this.deviceId)
        } catch (e) {
          // ignore
        }
      }
      this.token = ''
      this.refreshToken = ''
      this.user = null
      clearAuth()
    },
    applyLogin(res: LoginResponse, deviceId: string) {
      this.token = res.token
      this.refreshToken = res.refreshToken
      this.user = res.user
      this.deviceId = deviceId
      saveAuth({ token: res.token, refreshToken: res.refreshToken, user: res.user, deviceId })
    },
  },
})

