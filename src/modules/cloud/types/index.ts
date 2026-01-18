/**
 * 云盘模块类型定义汇总
 *
 * 导出所有类型定义，便于统一导入
 */

// 文件相关类型
export type {
  FileItem,
  FileListResponse,
  FileUploadParams,
  FileRenameParams,
  FileMoveParams,
  FileSearchParams,
  FileSortBy,
  SortOrder,
  FileOperationResult,
} from './file'

// 文件夹相关类型
export type {
  Folder,
  FolderListResponse,
  FolderTreeResponse,
  FolderCreateParams,
  FolderRenameParams,
  FolderOperationResult,
  BreadcrumbItem,
} from './folder'

// 配额相关类型
export type {
  QuotaInfo,
  QuotaResponse,
  FormattedQuota,
} from './quota'

// 分享相关类型
export type {
  ShareInfo,
  ShareCreateParams,
  ShareCreateResponse,
  ShareListItem,
  SharePublicInfo,
  SharePublicInfoResponse,
  ShareAccessParams,
  ShareAccessResponse,
  ShareListResponse,
} from './share'

// 上传相关类型
export type {
  UploadStatus,
  UploadTask,
  ChunkInfo,
  UploadProgress,
  ResumableUploadOptions,
  CheckHashRequest,
  CheckHashResponse,
  InitUploadRequest,
  InitUploadResponse,
  GetUploadedChunksResponse,
  CompleteUploadResponse,
  UploadResult,
} from './upload'
// CloudItem 相关类型（新统一类型）export type {  CloudItem,  CloudItemListResponse,  CreateItemParams,  RenameItemParams,  MoveItemParams,  BatchDeleteItemsParams,  BatchMoveItemsParams,  BatchOperationResponse,} from './cloudItem'export { CloudItemUtils } from './cloudItem'

// 通用类型
/**
 * 统一API响应格式
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * 排序参数
 */
export interface SortParams {
  sortBy: 'name' | 'size' | 'date'
  sortOrder: 'asc' | 'desc'
}

/**
 * 网格项类型（用于统一展示文件和文件夹）
 */
export type GridItem =
  | {
      type: 'folder'
      id: number
      name: string
      meta: string
      icon: string
      color: string
      bg: string
      folder: Folder
    }
  | {
      type: 'file'
      id: number
      name: string
      meta: string
      icon: string
      color: string
      bg: string
      file: FileItem
    }

/**
 * 文件图标配置
 */
export interface FileIconConfig {
  icon: string
  color: string
  bg: string
}

/**
 * 加载状态
 */
export interface LoadingState {
  tree: boolean       // 文件夹树加载中
  files: boolean      // 文件列表加载中
  upload: boolean     // 上传中
  quota: boolean      // 配额加载中
  shares: boolean     // 分享列表加载中
}
