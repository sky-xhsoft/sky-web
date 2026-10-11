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

// ==================== 计费二期：费用、账单、流水、套餐与资源包 ====================
// 金额为「厘」（0.001 元）整数；单价为 0.0001 元整数

export type TxnType = 'recharge' | 'gift' | 'usage' | 'usage_adjust' | 'plan_fee' | 'pack_fee' | 'adjust'

export interface BillAccount {
  companyId: number
  balance: number
  giftBalance: number
  creditLimit: number
}

export interface BillSettings {
  chargeMode: 'trial' | 'charge'
  chargeFrom: string
  reviewThreshold: number
  statementClosed: string
}

export interface Subscription {
  id: number
  planId: number
  planName: string
  startDate: string
  endDate: string
  quotaMinutes: number
  quotaFluxGb: number
  quotaStorageGb: number
  usedMinutes: number
  usedFluxGb: number
  fee: number
  autoRenew: boolean
  status: 'active' | 'ended'
}

export interface ResourcePack {
  id: number
  packDefId: number
  name: string
  meter: MeterKey
  total: number
  remaining: number
  validFrom: string
  validTo: string
  source: 'purchase' | 'grant'
  price: number
}

export interface AccountOverview {
  account: BillAccount
  status: 'normal' | 'arrears'
  settings: BillSettings
  month: string
  ratedDay: string
  usageCost: number
  meterCosts: { meter: MeterKey; amount: number }[]
  feeCost: number
  estimate: number
  subscription: Subscription | null
  packs: ResourcePack[]
}

export interface BillCharge {
  id: number
  usageDate: string
  meter: MeterKey
  usage: number
  planOffset: number
  packOffset: number
  billable: number
  unitPrice: number
  amount: number
  charged: number
  mode: 'trial' | 'charge'
}

export interface BillTransaction {
  id: number
  period: string
  type: TxnType
  meter: string
  amount: number
  giftAmount: number
  balanceAfter: number
  refType: string
  refId: number
  usageDate: string
  voucher: string
  remark: string
  operator: string
  createTime: string
}

export interface BillStatement {
  id: number
  companyId: number
  month: string
  opening: number
  usageDuration: number
  usageFlux: number
  usageStorage: number
  usageAdjust: number
  planFee: number
  packFee: number
  recharge: number
  gift: number
  adjust: number
  closing: number
  createTime: string
}

export interface StatementMeter {
  meter: MeterKey
  usage: number
  planOffset: number
  packOffset: number
  billable: number
  amount: number
  trialDays: number
}

export interface StatementView extends BillStatement {
  detail: { meters: StatementMeter[]; subscriptions: Subscription[]; rooms: RoomUsage[] }
}

export interface BillPlan {
  id: number
  name: string
  monthlyFee: number
  quotaMinutes: number
  quotaFluxGb: number
  quotaStorageGb: number
  status: 'on' | 'off'
  sortNo: number
  description: string
  updateBy?: string
  updateTime?: string
}

export interface BillPackDef {
  id: number
  name: string
  meter: MeterKey
  quantity: number
  validMonths: number
  price: number
  status: 'on' | 'off'
  sortNo: number
  description: string
  updateBy?: string
  updateTime?: string
}

export interface BillPrice {
  id: number
  companyId: number
  meter: MeterKey
  unitPrice: number
  effectiveDate: string
  remark: string
  createBy: string
  createTime: string
}

export interface AccountRow {
  companyId: number
  companyName: string
  balance: number
  giftBalance: number
  creditLimit: number
  status: 'normal' | 'arrears'
  planName: string
  planEndDate: string
  monthCost: number
  lastTxnTime: string
}

export interface AdjustRequest {
  id: number
  companyId: number
  type: 'gift' | 'adjust'
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requestBy: string
  reviewBy: string
  reviewTime: string | null
  reviewRemark: string
  createTime: string
}

type TxnQuery = { period?: string; type?: string; page: number; pageSize: number }

const get = async <T>(path: string, params?: any) => unwrap<T>(await api.get(path, { params }))
const post = async <T>(path: string, data?: any) => unwrap<T>(await api.post(path, data))
const put = async <T>(path: string, data?: any) => unwrap<T>(await api.put(path, data))

/** 浏览器保存文件 */
const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ---------- 本公司 ----------
export const getAccountOverview = () => get<AccountOverview>('/billing/account')
export const getCharges = (month: string) => get<BillCharge[]>('/billing/charges', { month })
export const getTransactions = (params: TxnQuery) => get<{ items: BillTransaction[]; total: number }>('/billing/transactions', params)
export const getStatements = () => get<BillStatement[]>('/billing/statements')
export const getStatement = (month: string) => get<StatementView>(`/billing/statements/${month}`)
/** 导出月账单（Excel）；传 companyId 时为平台导出该公司的账单 */
export const exportStatement = async (month: string, companyId?: number) => {
  const path = companyId ? `/billing/admin/accounts/${companyId}/statements/${month}/export` : `/billing/statements/${month}/export`
  const res = await api.get(path, { responseType: 'blob' })
  saveBlob(res.data as Blob, `账单-${month}${companyId ? `-公司${companyId}` : ''}.xlsx`)
}
export const getProducts = () => get<{ plans: BillPlan[]; packs: BillPackDef[] }>('/billing/products')
export const subscribePlan = (id: number) => post<Subscription>('/billing/subscribe', { id })
export const setAutoRenew = (autoRenew: boolean) => post('/billing/auto-renew', { autoRenew })
export const buyPack = (id: number) => post<ResourcePack>('/billing/packs/buy', { id })

// ---------- 平台 ----------
export const getBillSettings = () => get<{ settings: BillSettings; pendingCount: number }>('/billing/admin/settings')
export const updateBillSettings = (s: Pick<BillSettings, 'chargeMode' | 'chargeFrom' | 'reviewThreshold'>) => put<BillSettings>('/billing/admin/settings', s)
export const listPrices = () => get<BillPrice[]>('/billing/admin/prices')
export const createPrice = (p: Pick<BillPrice, 'companyId' | 'meter' | 'unitPrice' | 'effectiveDate' | 'remark'>) => post<BillPrice>('/billing/admin/prices', p)
export const deletePrice = async (id: number) => unwrap(await api.delete(`/billing/admin/prices/${id}`))
export const listAllPlans = () => get<BillPlan[]>('/billing/admin/plans')
export const savePlan = (p: Partial<BillPlan>) => (p.id ? put<BillPlan>(`/billing/admin/plans/${p.id}`, p) : post<BillPlan>('/billing/admin/plans', p))
export const listAllPackDefs = () => get<BillPackDef[]>('/billing/admin/pack-defs')
export const savePackDef = (p: Partial<BillPackDef>) => (p.id ? put<BillPackDef>(`/billing/admin/pack-defs/${p.id}`, p) : post<BillPackDef>('/billing/admin/pack-defs', p))
export const listAccounts = () => get<AccountRow[]>('/billing/admin/accounts')
export const getCompanyOverview = (companyId: number) => get<AccountOverview>(`/billing/admin/accounts/${companyId}`)
export const getCompanyTransactions = (companyId: number, params: TxnQuery) =>
  get<{ items: BillTransaction[]; total: number }>(`/billing/admin/accounts/${companyId}/transactions`, params)
export const rechargeAccount = (companyId: number, data: { amount: number; voucher: string; reason: string }) => post(`/billing/admin/accounts/${companyId}/recharge`, data)
/** 赠送 / 调账；超过复核金额时返回 pending（待复核申请） */
export const giftOrAdjust = (companyId: number, kind: 'gift' | 'adjust', data: { amount: number; reason: string }) =>
  post<{ pending?: AdjustRequest; transaction?: BillTransaction }>(`/billing/admin/accounts/${companyId}/${kind}`, data)
export const setCreditLimit = (companyId: number, amount: number) => put(`/billing/admin/accounts/${companyId}/credit`, { amount })
export const adminSubscribe = (companyId: number, id: number, free: boolean) => post<Subscription>(`/billing/admin/accounts/${companyId}/subscribe`, { id, free })
export const grantPack = (companyId: number, id: number) => post<ResourcePack>(`/billing/admin/accounts/${companyId}/packs`, { id })
export const listRequests = (status?: string) => get<AdjustRequest[]>('/billing/admin/requests', { status })
export const reviewRequest = (id: number, approve: boolean, remark: string) => post<AdjustRequest>(`/billing/admin/requests/${id}/review`, { approve, remark })
export const generateStatements = (month: string) => post('/billing/admin/statements', { month })
/** 重新计价（不重新计量）：调整单价、套餐后使用 */
export const rerateRange = async (from: string, to: string) => unwrap(await api.post('/billing/admin/rerate', { from, to }, { timeout: 600000 }))
