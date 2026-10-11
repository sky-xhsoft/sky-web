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
  arkApiKey?: string
  arkModel?: string
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
