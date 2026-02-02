import api from './http'

// 域名信息接口（匹配后端返回的字段名）
export interface DomainInfo {
  Name: string          // 后端返回大写字段名
  Type: number          // 0-推流域名，1-播放域名
  Status: number        // 状态
  CreateTime: string    // 创建时间
  UpdateTime?: string   // 更新时间
  // 添加小写别名以兼容前端使用
  name?: string
  type?: number
  status?: number
  createTime?: string
  cname?: string        // CNAME 地址
  region?: string       // 区域
}

// 添加域名请求
export interface AddDomainRequest {
  domainName: string
  domainType: number
}

// 添加域名
export const addDomain = (data: AddDomainRequest) => {
  return api.post('/live/domains', data)
}

// 查询域名列表
export const listDomains = (domainType?: number) => {
  return api.get('/live/domains', {
    params: domainType !== undefined ? { domainType } : {}
  })
}

// 查询域名信息
export const getDomain = (domainName: string) => {
  return api.get(`/live/domains/${domainName}`)
}

// 删除域名
export const deleteDomain = (domainName: string) => {
  return api.delete(`/live/domains/${domainName}`)
}

// 启用域名
export const enableDomain = (domainName: string) => {
  return api.post(`/live/domains/${domainName}/enable`)
}

// 禁用域名
export const forbidDomain = (domainName: string) => {
  return api.post(`/live/domains/${domainName}/forbid`)
}

// 验证域名归属（查询CNAME状态）
export const verifyDomainOwner = (domainName: string, verifyType: string = 'dnsCheck') => {
  return api.get('/live/domains/verify', {
    params: { domainName, verifyType }
  })
}

// ==================== 直播流管理 ====================

// 查询在线流列表
export const getOnlineStreams = (params: {
  domainName?: string
  appName?: string
  streamName?: string
  pageNum?: number
  pageSize?: number
}) => {
  return api.get('/live/streams/online', { params })
}

// 查询历史流列表
export const getHistoryStreams = (params: {
  domainName?: string
  appName?: string
  streamName?: string
  startTime?: string
  endTime?: string
  pageNum?: number
  pageSize?: number
}) => {
  return api.get('/live/streams/history', { params })
}

// 查询推断流事件
export const getStreamEvents = (params: {
  startTime: string
  endTime: string
  domainName?: string
  appName?: string
  streamName?: string
  isFilter?: number
  pageNum?: number
  pageSize?: number
}) => {
  return api.get('/live/streams/events', { params })
}

// 断开直播推流
export const dropStream = (data: {
  streamName: string
  domainName: string
  appName: string
}) => {
  return api.post('/live/streams/drop', data)
}

// 恢复直播推流
export const resumeStream = (data: {
  streamName: string
  domainName: string
  appName: string
}) => {
  return api.post('/live/streams/resume', data)
}

// ==================== 拉流转推管理 ====================

// 拉流任务信息
export interface PullStreamTaskInfo {
  taskId: string
  sourceType: string
  sourceUrls: string[]
  domainName: string
  appName: string
  streamName: string
  startTime: string
  endTime: string
  status: string
  createTime: string
  updateTime?: string
  operator?: string
  comment?: string
}

// 创建拉流任务请求
export interface CreatePullStreamTaskRequest {
  sourceType: string
  sourceUrls: string[]
  domainName: string
  appName: string
  streamName: string
  startTime: string
  endTime: string
  operator: string
  comment?: string
  region?: string
}

// 更新拉流任务请求
export interface UpdatePullStreamTaskRequest {
  sourceType?: string
  sourceUrls?: string[]
  startTime?: string
  endTime?: string
  operator: string
  comment?: string
  status?: string
}

// 拉流任务状态
export interface PullStreamTaskStatus {
  taskId: string
  runStatus: string // 实际运行状态：active-活跃，inactive-不活跃
  fileUrl?: string
  loopedTimes?: number
  offsetTime?: number // 播放偏移（秒）
  reportTime?: string // 最新心跳上报时间
}

// 创建拉流任务
export const createPullStreamTask = (data: CreatePullStreamTaskRequest) => {
  return api.post('/live/pull-stream/tasks', data).then(res => res.data.data)
}

// 查询拉流任务列表
export const getPullStreamTasks = (taskId?: string) => {
  return api.get('/live/pull-stream/tasks', {
    params: taskId ? { taskId } : {}
  }).then(res => res.data.data)
}

// 更新拉流任务
export const updatePullStreamTask = (taskId: string, data: UpdatePullStreamTaskRequest) => {
  return api.put(`/live/pull-stream/tasks/${taskId}`, data).then(res => res.data.data)
}

// 删除拉流任务
export const deletePullStreamTask = (taskId: string, operator: string) => {
  return api.delete(`/live/pull-stream/tasks/${taskId}`, {
    params: { operator }
  }).then(res => res.data.data)
}

// 查询拉流任务状态
export const getPullStreamTaskStatus = (taskId: string) => {
  return api.get(`/live/pull-stream/tasks/${taskId}/status`).then(res => res.data.data)
}

// 重启拉流任务
export const restartPullStreamTask = (taskId: string, operator: string) => {
  return api.post(`/live/pull-stream/tasks/${taskId}/restart`, null, {
    params: { operator }
  }).then(res => res.data.data)
}

// ==================== 直播回调事件管理 ====================

// 查询回调事件列表
export const queryCallbackEvents = (params: {
  eventType?: string
  streamId?: string
  domainName?: string
  appName?: string
  streamName?: string
  startTime?: string
  endTime?: string
  pageNum?: number
  pageSize?: number
}) => {
  return api.get('/live/callback/events', { params })
}
