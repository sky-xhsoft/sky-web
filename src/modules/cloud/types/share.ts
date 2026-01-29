/**
 * 分享相关类型定义
 *
 * 根据后端 API 文档，后端统一使用 PascalCase 命名
 */

/**
 * 云盘分享实体（对应后端 CloudShare）
 * 注意：后端返回小驼峰命名
 */
export interface CloudShare {
  id: number
  resourceType: string    // 'file' 或 'folder'
  resourceId: number      // 资源ID
  shareCode: string       // 分享码
  shareType: string       // 分享类型: 'public', 'password', 'private'
  password?: string       // 访问密码
  expireTime?: string     // 过期时间
  maxDownloads: number    // 最大下载次数
  downloadCount: number   // 已下载次数
  status: string          // 状态: 'active', 'expired', 'cancelled'
  userId: number          // 创建者ID
  createTime: string      // 创建时间
}

/**
 * 分享信息（完整信息，包含资源详情）
 */
export interface ShareInfo {
  share: CloudShare                    // 分享记录
  resourceType: string                 // 资源类型
  file?: {                             // 文件信息（当resourceType='file'时）
    id: number
    name: string
    fileSize: number
    fileType: string
    fileExt: string
    createTime: string
  }
  folder?: {                           // 文件夹信息（当resourceType='folder'时）
    id: number
    name: string
    fileCount: number
    totalSize: number
    createTime: string
  }
  sharer: string                       // 分享者名称
}

/**
 * 分享创建参数
 */
export interface ShareCreateParams {
  resourceType?: string  // 资源类型: 'file' 或 'folder'
  resourceId?: number    // 资源ID（文件ID或文件夹ID）
  fileId?: number        // 文件ID（兼容旧版本）
  shareType: string      // 分享类型: 'public', 'password', 'private'
  password?: string      // 访问密码（当shareType='password'时需要）
  expireDays?: number    // 过期天数，0表示永久
  maxDownloads?: number  // 最大下载次数，0表示无限制
}

/**
 * 分享创建响应
 */
export interface ShareCreateResponse {
  code: number
  message: string
  data: ShareInfo
}

/**
 * 分享列表项（后端返回的扩展分享信息）
 * 注意：后端使用小驼峰命名
 */
export interface ShareListItem {
  // CloudShare 字段（嵌入）- 小驼峰命名
  id: number
  sysCompanyId?: number
  createBy?: string
  createTime: string
  updateBy?: string
  updateTime?: string
  isActive?: string
  shareCode: string       // 分享码
  resourceType: string    // 资源类型: 'file' 或 'folder'
  resourceId: number      // 资源ID
  sharerId: number        // 分享者ID
  shareType: string       // 分享类型: 'public', 'password', 'private'
  password?: string       // 访问密码
  expireTime?: string     // 过期时间
  maxDownloads: number    // 最大下载次数
  downloadCount: number   // 已下载次数
  viewCount: number       // 查看次数
  status: string          // 状态: 'active', 'expired', 'cancelled'

  // 扩展字段 - 小驼峰命名
  fileName: string        // 文件/文件夹名称
  shareLink: string       // 完整分享链接
}

/**
 * 分享信息响应（不需要认证）
 */
export interface SharePublicInfo {
  FileName: string
  FileSize: number
  FileType: string
  HasPassword: boolean
  ExpireTime?: string
}

/**
 * 分享信息响应包装
 */
export interface SharePublicInfoResponse {
  code: number
  message: string
  data: SharePublicInfo
}

/**
 * 访问分享参数
 */
export interface ShareAccessParams {
  password?: string
}

/**
 * 访问分享响应
 */
export interface ShareAccessResponse {
  code: number
  message: string
  data: {
    ID: number
    FileName: string
    FileSize: number
    FileType: string
    StoragePath: string
    CreateTime: string
  }
}

/**
 * 分享列表响应（前端扩展，后端可能需要新增接口）
 */
export interface ShareListResponse {
  code: number
  message: string
  data: ShareListItem[]
}
