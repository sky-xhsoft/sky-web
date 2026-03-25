import { DEVICE_ID_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY, USER_STORAGE_KEY, COMPANY_STORAGE_KEY, COMPANY_CONF_STORAGE_KEY } from '../config'
import type { CompanyInfo, CompanyConf } from '../api/auth'

type StoredUser = {
  id: number
  username: string
  trueName: string
  isAdmin: string
  companyId: number
}

type StoredAuth = {
  token: string
  refreshToken: string
  user: StoredUser | null
  deviceId: string
  company: CompanyInfo | null
  companyConf: CompanyConf | null
}

const storage = window.localStorage

export function getDeviceId(): string | null {
  return storage.getItem(DEVICE_ID_STORAGE_KEY)
}

export function setDeviceId(id: string) {
  storage.setItem(DEVICE_ID_STORAGE_KEY, id)
}

export function saveAuth(payload: StoredAuth) {
  storage.setItem(TOKEN_STORAGE_KEY, payload.token)
  storage.setItem(REFRESH_TOKEN_STORAGE_KEY, payload.refreshToken)
  storage.setItem(USER_STORAGE_KEY, JSON.stringify({ user: payload.user, deviceId: payload.deviceId }))
  if (payload.company) {
    storage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(payload.company))
  } else {
    storage.removeItem(COMPANY_STORAGE_KEY)
  }
  if (payload.companyConf) {
    storage.setItem(COMPANY_CONF_STORAGE_KEY, JSON.stringify(payload.companyConf))
  } else {
    storage.removeItem(COMPANY_CONF_STORAGE_KEY)
  }
  setDeviceId(payload.deviceId)
}

export function clearAuth() {
  storage.removeItem(TOKEN_STORAGE_KEY)
  storage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  storage.removeItem(USER_STORAGE_KEY)
  storage.removeItem(DEVICE_ID_STORAGE_KEY)
  storage.removeItem(COMPANY_STORAGE_KEY)
  storage.removeItem(COMPANY_CONF_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  return storage.getItem(TOKEN_STORAGE_KEY)
}

export function getRefreshToken(): string | null {
  return storage.getItem(REFRESH_TOKEN_STORAGE_KEY)
}

export function getStoredUser(): { user: StoredUser | null; deviceId: string | null } {
  const raw = storage.getItem(USER_STORAGE_KEY)
  if (!raw) return { user: null, deviceId: getDeviceId() }
  try {
    const parsed = JSON.parse(raw) as { user: StoredUser | null; deviceId?: string }
    return { user: parsed.user ?? null, deviceId: parsed.deviceId ?? getDeviceId() }
  } catch (e) {
    return { user: null, deviceId: getDeviceId() }
  }
}

