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

// 查询域名鉴权配置（keyType: push-推流, play-播放）
export const getDomainAuthKey = (domainName: string, keyType: string = 'push') => {
  return api.get(`/live/domains/${domainName}/auth`, {
    params: { keyType }
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
export interface StreamHistoryInfo {
  domainName?: string
  appName?: string
  streamName: string
  streamStartTime?: string
  streamEndTime?: string
  stopReason?: string
  duration?: number
  resolution?: string
}
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
  pushArgs?: string
  taskName?: string // 前端字段（同 comment）
  platform?: string // 前端字段（同 sourceType）
  runningStatus?: 'active' | 'inactive' // 前端字段：实际推流运行状态（轮询获得）
}

// 创建拉流任务请求
export interface CreatePullStreamTaskRequest {
  sourceType?: string
  platform?: string // 前端字段（映射到 sourceType）
  sourceUrls: string[]
  domainName?: string
  appName?: string
  streamName?: string
  toUrl?: string // 完整目标 URL 地址
  startTime: string
  endTime: string
  operator: string
  comment?: string
  taskName?: string // 前端字段（映射到 comment）
  region?: string
  pushArgs?: string
}

// 更新拉流任务请求
export interface UpdatePullStreamTaskRequest {
  sourceUrls?: string[]
  toUrl?: string // 完整目标 URL 地址
  startTime?: string
  endTime?: string
  operator: string
  comment?: string
  taskName?: string // 前端字段（映射到 comment）
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

// 拉流转推任务流信息
export interface TurnPushInfo {
  videoFps: number
  audioFps: number
  videoRate: number
  audioRate: number
  streamFlag: string
  time: string
}

// 查询拉流转推任务流数据请求
export interface DescribePullTransformPushInfoListRequest {
  startTime: string // UTC开始时间，格式：yyyy-mm-ddTHH:MM:SSZ
  endTime: string // UTC结束时间，格式：yyyy-mm-ddTHH:MM:SSZ
  taskId: string // 拉流转推任务ID
}

// 查询拉流转推任务流数据响应
export interface DescribePullTransformPushInfoListResponse {
  dataInfoList: TurnPushInfo[]
  requestId?: string
}

// 创建拉流任务
export const createPullStreamTask = (data: CreatePullStreamTaskRequest) => {
  return api.post('/live/pull-stream/tasks', data).then(res => res.data.data)
}

// 查询拉流任务列表
export const getPullStreamTasks = (taskId?: string) => {
  return api.get('/live/pull-stream/tasks', {
    params: taskId ? { taskId } : {}
  }).then(res => res.data.data.TaskInfos || [])
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

// 查询拉流转推任务流数据
export const describePullTransformPushInfoList = (data: DescribePullTransformPushInfoListRequest) => {
  return api.post('/live/pull-stream/tasks/transform-push-info', data).then(res => res.data.data)
}

// ==================== 推流地址生成 ====================

// 生成推流地址请求
export interface GeneratePushURLRequest {
  domainName: string
  appName: string
  streamName: string
  streamKey: string
  expireTime: number // 过期时间戳（秒）
}

// 生成推流地址响应
export interface GeneratePushURLResponse {
  pushUrl: string
  pushUrlSrt: string
  pushUrlWebRtc: string
}

// 生成推流地址
export const generatePushURL = (data: GeneratePushURLRequest) => {
  return api.post('/live/push-url/generate', data)
}

// 根据直播间ID获取推流地址（由后端取当前公司推流域名、鉴权主KEY、直播间开始时间）
export const generatePushURLByRoom = (roomId: number | string) => {
  return api.post('/live/push-url/by-room', { roomId })
}

// ==================== 拉流地址生成 ====================

// 生成拉流地址请求
export interface GeneratePlayURLRequest {
  playDomain: string
  appName: string
  streamName: string
  playKey: string
  expireTime: number // 过期时间戳（秒）
}

// 生成拉流地址响应
export interface GeneratePlayURLResponse {
  rtmp: string
  flv: string
  hls: string
}

// 生成拉流地址
export const generatePlayURL = (data: GeneratePlayURLRequest) => {
  return api.post('/live/play-url/generate', data)
}

// 根据直播间ID获取播放地址（由后端取当前公司播放域名、鉴权主KEY、直播间开始时间）
export const generatePullURLByRoom = (roomId: number | string) => {
  return api.post('/live/pull-url/by-room', { roomId })
}

// ==================== 直播间管理 ====================

// 直播间详情
export interface LiveRoomDetail {
  id: number
  roomName: string
  roomType: string
  broadcastFormat: string
  roomStage: string
  displayMode: string
  startTime: string
  endTime: string
  coverImage: string
  viewingMethod: string
  viewingPassword: string
  viewingPrice: number
  playbackMethod: string
  playbackValidity: string
  streamName: string
  pushUrl: string
  playUrl: string
  status: string
  viewerCount: number
  peakViewerCount: number
  duration: number
  description: string
  props: string
}

// 获取直播间详情
export const getLiveRoomDetail = (id: number) => {
  return api.get(`/live/rooms/${id}`)
}

// 删除直播间
export const deleteLiveRoom = (id: number) => {
  return api.delete(`/live/rooms/${id}`)
}

// ==================== 直播回调事件管理 ====================

// 查询回调事件列表
export const queryCallbackEvents = (params: {
  id?: number | string
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

// 删除回调事件
export const deleteCallbackEvent = (id: number) => {
  return api.delete(`/live/callback/events/${id}`)
}

// 批量删除回调事件
export const batchDeleteCallbackEvents = (ids: number[]) => {
  return api.delete(`/live/callback/events/batch`, { data: ids })
}

// ==================== 直播流实时指标 ====================

export interface StreamMetrics {
  /** 为 false 表示后端尚未接入实时统计，此时其余字段无值 */
  supported?: boolean
  streamName: string
  domainName: string
  appName: string
  onlineUsers: number
  bitrate: number
  fps: number
  bandwidth: number
  timestamp: string
}

export const getStreamMetrics = (streamName: string, params?: { domainName?: string; appName?: string }) => {
  return api.get(`/live/streams/${streamName}/metrics`, { params }).then(res => res.data.data as StreamMetrics)
}

// ==================== 直播切片/录制 ====================

export interface LiveClip {
  id: number
  sysCompanyId: number
  roomId?: number
  streamId: string
  clipName: string
  clipUrl: string
  startTime: number
  endTime: number
  duration: number
  thumbnail: string
  fileSize: number
  status: string
  description: string
  createTime: string
}

export interface LiveRecording {
  id: number
  sysCompanyId: number
  roomId?: number
  /** 直播间名称（列表接口按 roomId 填充） */
  roomName?: string
  streamId: string
  recordUrl: string
  recordType: string
  fileSize: number
  duration: number
  startTime: number
  endTime: number
  status: string
  description: string
  createTime: string
}

export interface ListClipsParams {
  roomId?: string
  status?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface ListRecordingsParams extends ListClipsParams {}

export const listClips = (params?: ListClipsParams) => {
  return api.get('/live/clips', { params }).then(res => res.data.data as { list: LiveClip[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } })
}

export const listRecordings = (params?: ListRecordingsParams) => {
  return api.get('/live/recordings', { params }).then(res => res.data.data as { list: LiveRecording[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } })
}
