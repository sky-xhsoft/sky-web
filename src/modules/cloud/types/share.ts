/**
 * 分享相关类型定义
 *
 * 根据后端 API 文档，后端统一使用 PascalCase 命名
 */

/**
 * 分享信息
 */
export interface ShareInfo {
  ID: number
  FileID: number
  ShareCode: string
  Password?: string
  ExpireTime?: string
  UserID: number
  CreateTime: string
}

/**
 * 分享创建参数
 */
export interface ShareCreateParams {
  fileId: number
  expireDays?: number    // 过期天数，0表示永久
  password?: string      // 访问密码（可选）
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
 * 分享列表项（扩展了资源名称和链接）
 */
export interface ShareListItem extends ShareInfo {
  FileName: string       // 文件名
  ShareLink: string      // 完整分享链接
  AccessCount?: number   // 访问次数（后端可能扩展）
  IsActive?: boolean     // 是否激活
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
