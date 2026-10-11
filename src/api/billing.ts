import api from './http'

// ==================== 计费一期：用量（只计量不扣费） ====================

export type MeterKey = 'live_duration' | 'play_flux' | 'storage'

export interface UsageSummary {
  month: string
  liveMinutes: number
  playGb: number
  storageAvgGb: number
  storageLatestGb: number
  storageLatestDay: string
  storageItems: Record<string, number>
  fluxLatestDay: string
  fluxDays: number
  liveRooms: number
  onlineRooms: number
}

export interface DailyUsage {
  date: string
  liveMinutes: number
  playGb: number
  storageGb: number
}

export interface RoomUsage {
  roomId: number
  roomName: string
  liveMinutes: number
  liveSeconds: number
  playGb: number
  sessions: number
  deleted: boolean
}

export interface LiveSession {
  id: number
  roomId: number
  streamName: string
  pushDomain: string
  startTime: string
  endTime: string | null
  lastSeenTime: string
  seconds: number
  endSource: '' | 'callback' | 'patrol' | 'cap'
  counted: boolean
}

export interface CompanyUsage {
  companyId: number
  companyName: string
  account: string
  liveMinutes: number
  playGb: number
  storageAvgGb: number
}

export interface FluxReconcile {
  id: number
  usageDate: string
  account: string
  playDomain: string
  monitorMb: number
  billingMb: number
  unattributedMb: number
  streamCount: number
  status: 'ok' | 'diff' | 'error'
  message: string
}

const unwrap = <T>(res: any) => res.data?.data as T

export const getUsageSummary = async (month: string) => unwrap<UsageSummary>(await api.get('/billing/usage/summary', { params: { month } }))
export const getUsageDaily = async (month: string) => unwrap<DailyUsage[]>(await api.get('/billing/usage/daily', { params: { month } }))
export const getUsageRooms = async (month: string) => unwrap<RoomUsage[]>(await api.get('/billing/usage/rooms', { params: { month } }))
export const getLiveSessions = async (params: { month: string; roomId?: number; page: number; pageSize: number }) =>
  unwrap<{ items: LiveSession[]; total: number }>(await api.get('/billing/usage/sessions', { params }))

/** 平台：全部公司用量与流量对账 */
export const getReconcile = async (month: string) =>
  unwrap<{ companies: CompanyUsage[]; flux: FluxReconcile[] }>(await api.get('/billing/admin/reconcile', { params: { month } }))
/** 平台：重新计量一段日期（最多 31 天） */
export const recomputeUsage = (data: { from: string; to: string; meters?: MeterKey[] }) =>
  api.post('/billing/admin/recompute', data, { timeout: 600000 })
