import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, refreshAccessToken as refreshApi, type LoginRequest, type LoginResponse, type UserInfo, type CompanyInfo, type CompanyConf } from '../api/auth'
import { clearAuth, getAccessToken, getRefreshToken, getStoredUser, saveAuth, setDeviceId, getDeviceId, getLoginType } from '../utils/token'
import { COMPANY_STORAGE_KEY, COMPANY_CONF_STORAGE_KEY } from '../config'

const fallbackDeviceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getStoredCompany = (): CompanyInfo | null => {
  const raw = localStorage.getItem(COMPANY_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CompanyInfo
  } catch (e) {
    return null
  }
}

const getStoredCompanyConf = (): CompanyConf | null => {
  const raw = localStorage.getItem(COMPANY_CONF_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CompanyConf
  } catch (e) {
    return null
  }
}

type AuthState = {
  token: string
  refreshToken: string
  user: UserInfo | null
  deviceId: string
  company: CompanyInfo | null
  companyConf: CompanyConf | null
  loginType: 'live' | 'cloud' | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const { user, deviceId } = getStoredUser()
    return {
      token: getAccessToken() || '',
      refreshToken: getRefreshToken() || '',
      user,
      deviceId: deviceId || getDeviceId() || fallbackDeviceId(),
      company: getStoredCompany(),
      companyConf: getStoredCompanyConf(),
      loginType: (getLoginType() as 'live' | 'cloud' | null) || null,
    }
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    async login(payload: Omit<LoginRequest, 'clientType' | 'deviceId'> & { deviceName?: string; loginType?: 'live' | 'cloud' }) {
      const ensuredDeviceId = this.deviceId || fallbackDeviceId()
      setDeviceId(ensuredDeviceId)

      // 根据登录类型设置客户端类型
      const clientType = payload.loginType === 'live' ? 'live-web' : 'cloud-web'

      const res = await loginApi({
        ...payload,
        clientType: clientType,
        deviceId: ensuredDeviceId,
      })

      this.applyLogin(res, ensuredDeviceId, payload.loginType)
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
        company: this.company,
        companyConf: this.companyConf,
        loginType: this.loginType,
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
      this.company = null
      this.companyConf = null
      // 不清除 loginType，这样用户退出登录后还能记住之前的登录模式
      clearAuth()
    },
    applyLogin(res: LoginResponse, deviceId: string, loginType: 'live' | 'cloud' | null = null) {
      this.token = res.token
      this.refreshToken = res.refreshToken
      this.user = res.user
      this.company = res.company || null
      this.companyConf = res.companyConf || null
      this.deviceId = deviceId
      this.loginType = loginType

      saveAuth({
        token: res.token,
        refreshToken: res.refreshToken,
        user: res.user,
        deviceId,
        company: res.company,
        companyConf: res.companyConf,
        loginType: loginType,
      })
    },
  },
})
