import axios from 'axios'
import { API_BASE_URL } from '../config'
import { getAccessToken } from '../utils/token'

export type LoginRequest = {
  username: string
  password: string
  companyId: number
  clientType: string
  deviceId: string
  deviceName?: string
}

export type UserInfo = {
  id: number
  username: string
  trueName: string
  isAdmin: string
  companyId: number
}

export type LoginResponse = {
  token: string
  refreshToken: string
  expiresIn: number
  user: UserInfo
}

export type RefreshTokenResponse = {
  token: string
  expiresIn: number
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T
  timestamp?: string
}

const authClient = axios.create({ baseURL: API_BASE_URL })

export async function login(payload: LoginRequest) {
  const { data } = await authClient.post<ApiResponse<LoginResponse>>('/auth/login', payload)
  return data.data
}

export async function refreshAccessToken(refreshToken: string) {
  const { data } = await authClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', { refreshToken })
  return data.data
}

export async function logout(deviceId: string) {
  const token = getAccessToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  await authClient.post('/auth/logout', { deviceId }, { headers })
}
