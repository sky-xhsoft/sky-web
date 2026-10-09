/**
 * 配额相关类型定义
 */

/**
 * 配额信息
 */
export interface QuotaInfo {
  id?: number
  userId?: number
  totalQuota?: number        // 总配额（字节�?  usedSpace?: number         // 已使用空间（字节�?  fileCount?: number         // 文件数量
  folderCount?: number       // 文件夹数�?  maxFileSize?: number       // 单文件大小限制（字节�?  quotaType?: string         // 配额类型
  usedSpace?: number
  fileCount?: number
  maxFileSize?: number
  quotaType?: string
  ID?: number
  UserId?: number
  TotalQuota?: number
  UsedSpace?: number
  FileCount?: number
  FolderCount?: number
  MaxFileSize?: number
  QuotaType?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
  isActive?: string
  /** 公司存储空间（同公司用户共享，未配置时默认 100GB），云盘界面按此显示 */
  company?: CompanyStorage
}

/** 公司存储空间 */
export interface CompanyStorage {
  companyId: number
  totalQuota: number
  usedSpace: number
  fileCount: number
}

/**
 * 配额响应
 */
export interface QuotaResponse {
  code: number
  message: string
  data: QuotaInfo
}

/**
 * 格式化后的配额信息（用于UI展示�? */
export interface FormattedQuota {
  total: string       // �?"10.0 GB"
  used: string        // �?"3.5 GB"
  available: string   // �?"6.5 GB"
  percentage: number  // 35
  fileCount: number
  folderCount?: number
}
