import api from './http'
import type { ApiResponse } from './types'
import type { CompanyConf } from './auth'

export type UpdateCompanyConfigRequest = {
  // 通用密钥
  secretId?: string
  secretKey?: string
  region?: string

  // 存储配置
  storageType?: string
  localBasePath?: string
  localBaseUrl?: string

  // 阿里云 OSS
  aliyunOssEndpoint?: string
  aliyunOssAccessKeyId?: string
  aliyunOssAccessKeySecret?: string
  aliyunOssBucketName?: string
  aliyunOssCdnDomain?: string

  // 腾讯云 COS
  tencentCosBucketUrl?: string
  tencentCosSecretId?: string
  tencentCosSecretKey?: string
  tencentCosBucketName?: string
  tencentCosRegion?: string
  tencentCosCdnDomain?: string

  // 腾讯云直播 / 云 API
  tencentCloudSecretId?: string
  tencentCloudSecretKey?: string
  tencentCloudRegion?: string
  tencentCloudCallbackKey?: string

  // 火山引擎
  volcengineAccessKeyId?: string
  volcengineAccessKeySecret?: string
  volcengineRegion?: string
  volcengineService?: string

  // 本地化 / 限制
  defaultLanguage?: string
  timezone?: string
  currency?: string
  maxStorageSize?: number
  maxFileSize?: number
  maxFiles?: number
}

export async function getCompanyConfig(): Promise<CompanyConf | null> {
  const { data } = await api.get<ApiResponse<CompanyConf>>('/company/config')
  return data.data ?? null
}

export async function updateCompanyConfig(payload: UpdateCompanyConfigRequest): Promise<CompanyConf> {
  const { data } = await api.put<ApiResponse<CompanyConf>>('/company/config', payload)
  return data.data
}

/** 云盘存储密钥对应腾讯云账号下的存储桶 */
export interface StorageBucket {
  bucket: string // 完整名称（含 -APPID）
  region: string
  url: string // Bucket 地址
  current: boolean // 当前配置的存储桶
  creationDate?: string
}

/** 列出存储桶：用已保存的云盘存储密钥（单独设置的 COS 密钥，否则直播密钥） */
export async function listStorageBuckets(): Promise<StorageBucket[]> {
  const { data } = await api.get<ApiResponse<StorageBucket[]>>('/company/config/cos-buckets')
  return data.data || []
}

/** 新建存储桶（公开读写 + CORS 全部允许），bucket 可不带 -APPID；不修改公司配置 */
export async function createStorageBucket(payload: { bucket: string; region: string }): Promise<StorageBucket> {
  const { data } = await api.post<ApiResponse<StorageBucket>>('/company/config/cos-buckets', payload)
  return data.data
}
