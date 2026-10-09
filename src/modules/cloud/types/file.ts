/**
 * 文件相关类型定义
 *
 * 根据后端 API 文档，后端统一使用 PascalCase 命名
 */

/**
 * 文件信息（后端返回格式）
 */
export interface FileItem {
  ID: number
  FileName: string
  FileSize: number
  FileType: string
  FileExt?: string
  FolderID: number
  UserID: number
  StoragePath?: string
  CreateTime: string
  CreateBy?: string       // 创建人（上传者用户名）
  UpdateTime?: string
  id?: number
  fileName?: string
  name?: string
  fileSize?: number
  fileType?: string
  fileExt?: string
  folderId?: number
  FolderId?: number
  ownerId?: number
  userId?: number
  storagePath?: string
  createTime?: string
  updateTime?: string
  StorageType?: string
  AccessURL?: string
  accessUrl?: string
}

/**
 * 文件列表响应
 */
export interface FileListResponse {
  code: number
  message: string
  data: FileItem[]
}

/**
 * 文件上传参数
 */
export interface FileUploadParams {
  file: File
  folderId?: number  // 默认为0（根目录）
}

/**
 * 文件重命名参数
 */
export interface FileRenameParams {
  newName: string
}

/**
 * 文件移动参数
 */
export interface FileMoveParams {
  targetFolderId: number
}

/**
 * 文件搜索参数（前端扩展，后端暂未实现）
 */
export interface FileSearchParams {
  query?: string
  keyword?: string
  folderId?: number
  fileType?: string
}

/**
 * 文件排序类型
 */
export type FileSortBy = 'name' | 'size' | 'date'

/**
 * 排序方向
 */
export type SortOrder = 'asc' | 'desc'

/**
 * 文件操作结果
 */
export interface FileOperationResult {
  code: number
  message: string
  data: {
    message: string
  }
}
