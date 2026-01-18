/**
 * 文件夹相关类型定义
 *
 * 匹配后端返回的字段名（camelCase from JSON tags）
 */

/**
 * 文件夹信息
 */
export interface Folder {
  // BaseModel fields
  ID: number                  // 注意：Go的json标签是 "id"，但响应时用大写ID
  id: number                  // 后端json:"id"
  sysCompanyId: number        // 后端json:"sysCompanyId"
  createBy?: string           // 后端json:"createBy"
  createTime?: string         // 后端json:"createTime"
  updateBy?: string           // 后端json:"updateBy"
  updateTime?: string         // 后端json:"updateTime"
  isActive?: string           // 后端json:"isActive"

  // CloudFolder fields
  name: string                // 后端json:"name"
  parentId: number | null     // 后端json:"parentId"
  path: string                // 后端json:"path"
  ownerId: number             // 后端json:"ownerId"
  isPublic: string            // 后端json:"isPublic"
  shareCode?: string | null   // 后端json:"shareCode"
  shareExpire?: string | null // 后端json:"shareExpire"
  description?: string        // 后端json:"description"
  fileCount?: number          // 后端json:"fileCount"
  totalSize?: number          // 后端json:"totalSize"

  // 树形结构
  Children?: Folder[]         // 递归子节点
}

/**
 * 文件夹列表响应
 */
export interface FolderListResponse {
  code: number
  message: string
  data: Folder[]
}

/**
 * 文件夹树响应
 */
export interface FolderTreeResponse {
  code: number
  message: string
  data: Folder[]
}

/**
 * 文件夹创建参数
 */
export interface FolderCreateParams {
  parentId: number
  folderName: string
}

/**
 * 文件夹重命名参数
 */
export interface FolderRenameParams {
  newName: string
}

/**
 * 文件夹操作结果
 */
export interface FolderOperationResult {
  code: number
  message: string
  data: {
    message: string
  }
}

/**
 * 面包屑导航项
 */
export interface BreadcrumbItem {
  id: number
  name: string
  path: string
}
