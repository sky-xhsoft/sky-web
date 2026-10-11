import api from './http'

/** 模板与规则的同步状态 */
export type TemplateSyncStatus = 'pending' | 'synced' | 'failed' | 'drift'
export type TemplateKind = 'callback' | 'record'

interface TemplateSync {
  syncStatus: TemplateSyncStatus
  syncError?: string
  syncTime?: string | null
}

export interface TemplateRuleRef {
  domainName: string
  appName: string
  streamName: string
}

export interface CallbackTemplate extends TemplateSync {
  id: number
  name: string
  description?: string
  streamBeginUrl: string
  streamEndUrl: string
  recordUrl: string
  recordStatusUrl: string
  recordExceptionUrl: string
  recordExceptionLevels: string // 逗号分隔：error,alarm
  pushExceptionUrl: string
  callbackKey: string
  cloudTemplateId: number
  source: 'local' | 'import' | 'standard'
  rules?: TemplateRuleRef[]
}

export interface RecordTemplate extends TemplateSync {
  id: number
  name: string
  description?: string
  cosStore: 'Y' | 'N'
  cosBucket: string
  cosRegion: string
  cosPath: string
  recordInterval: number
  removeWatermark: 'Y' | 'N'
  formats: string
  cloudTemplateId: number
  source: 'local' | 'import' | 'standard'
  rules?: TemplateRuleRef[]
}

export interface TemplateList<T> {
  items: T[] | null
  cloudError?: string
}

export interface TemplateDefaults {
  callbackBase: string
  streamBeginUrl: string
  streamEndUrl: string
  recordUrl: string
  recordStatusUrl: string
  recordExceptionUrl: string
  pushExceptionUrl: string
  highlightUrl: string
  cosBucket: string
  cosRegion: string
  cosPath: string
  recordInterval: number
  tencentConfigured: boolean
}

/** 公司腾讯云账号下的 COS 存储桶 */
export interface CosBucketOption {
  bucket: string // 不含 -appid
  fullName: string
  region: string
  creationDate: string
  company: boolean // 公司配置中的存储桶
}

export interface DomainRuleView extends TemplateSync {
  appName: string
  streamName: string
  cloudTemplateId: number
  managed: boolean
  callback?: CallbackTemplate
  record?: RecordTemplate
}

export interface TemplateIssue {
  level: 'error' | 'warning' | 'info'
  message: string
}

export interface DomainTemplateOverview {
  domainName: string
  callbackBase: string
  callbackRules: DomainRuleView[] | null
  recordRules: DomainRuleView[] | null
  issues: TemplateIssue[]
  highlight: { count7d: number; lastTime?: string; callbackUrl: string }
}

export interface StandardPlan {
  domainName: string
  callbackBase: string
  callback: { exists: boolean; templateName: string; cloudTemplateId: number; missing: string[] | null; standardName: string }
  record: {
    exists: boolean
    templateName: string
    cloudTemplateId: number
    currentInterval: number
    storesCompanyCos: boolean
    replaceDefault: boolean
    standardName: string
    cosBucket: string
    cosRegion: string
    cosPath: string
    recordInterval: number
    error?: string
  }
}

export interface StandardStepResult {
  step: string
  ok: boolean
  skipped?: boolean
  message: string
}

const unwrap = <T>(res: any): T => res.data?.data as T

export const getTemplateDefaults = async () => unwrap<TemplateDefaults>(await api.get('/live/templates/defaults'))

export const listCosBuckets = async () => unwrap<CosBucketOption[]>(await api.get('/live/templates/cos-buckets')) || []

/** 在公司腾讯云账号下新建存储桶（公开读写 + CORS 全部允许）；bucket 可不带 -APPID */
export const createCosBucket = async (data: { bucket: string; region: string }) =>
  unwrap<CosBucketOption>(await api.post('/live/templates/cos-buckets', data))

export const listCallbackTemplates = async () =>
  unwrap<TemplateList<CallbackTemplate>>(await api.get('/live/templates', { params: { kind: 'callback' } }))

export const listRecordTemplates = async () =>
  unwrap<TemplateList<RecordTemplate>>(await api.get('/live/templates', { params: { kind: 'record' } }))

/** 保存回调模板（保存即同步到腾讯云；同步结果见返回的 syncStatus / syncError） */
export const saveCallbackTemplate = async (data: Partial<CallbackTemplate>, id?: number) =>
  unwrap<CallbackTemplate>(id ? await api.put(`/live/templates/callback/${id}`, data) : await api.post('/live/templates/callback', data))

export const saveRecordTemplate = async (data: Partial<RecordTemplate>, id?: number) =>
  unwrap<RecordTemplate>(id ? await api.put(`/live/templates/record/${id}`, data) : await api.post('/live/templates/record', data))

export const deleteTemplate = (kind: TemplateKind, id: number) => api.delete(`/live/templates/${kind}/${id}`)

/** 以本地为准同步到腾讯云（重新同步 / 以本地覆盖云端） */
export const syncTemplate = (kind: TemplateKind, id: number) => api.post(`/live/templates/${kind}/${id}/sync`)

/** 用腾讯云上的配置更新本地 */
export const pullTemplate = (kind: TemplateKind, id: number) => api.post(`/live/templates/${kind}/${id}/pull`)

export const importTemplates = async () =>
  unwrap<{ callbackTemplates: number; recordTemplates: number; rules: number }>(await api.post('/live/templates/import'))

export const getDomainTemplates = async (domain: string) =>
  unwrap<DomainTemplateOverview>(await api.get(`/live/domains/${encodeURIComponent(domain)}/templates`))

export const bindTemplate = (domain: string, data: { kind: TemplateKind; templateId: number; appName?: string; streamName?: string; domainWide?: boolean }) =>
  api.post(`/live/domains/${encodeURIComponent(domain)}/templates/bind`, data)

export const unbindTemplate = (domain: string, kind: TemplateKind, appName: string, streamName = '') =>
  api.delete(`/live/domains/${encodeURIComponent(domain)}/templates/${kind}`, { params: { appName, streamName } })

export const getStandardPlan = async (domain: string) =>
  unwrap<StandardPlan>(await api.get(`/live/domains/${encodeURIComponent(domain)}/templates/standard`))

export const applyStandard = async (domain: string, data: { callbackMode: 'complete' | 'replace'; replaceRecord: boolean }) =>
  unwrap<{ steps: StandardStepResult[] }>(await api.post(`/live/domains/${encodeURIComponent(domain)}/templates/standard`, data))

/** 同步状态的显示文案与标签颜色 */
export const SYNC_STATUS: Record<TemplateSyncStatus, { label: string; type: 'success' | 'warning' | 'error' | 'neutral' }> = {
  synced: { label: '已同步', type: 'success' },
  pending: { label: '未同步', type: 'neutral' },
  failed: { label: '同步失败', type: 'error' },
  drift: { label: '云端不一致', type: 'warning' },
}

/** 回调模板已配置的回调类型 */
export const callbackKinds = (t: Partial<CallbackTemplate>) =>
  [
    ['开播', t.streamBeginUrl],
    ['断流', t.streamEndUrl],
    ['录制文件', t.recordUrl],
    ['录制状态', t.recordStatusUrl],
    ['录制异常', t.recordExceptionUrl],
    ['推流异常', t.pushExceptionUrl],
  ]
    .filter(([, url]) => !!url)
    .map(([label]) => label as string)
