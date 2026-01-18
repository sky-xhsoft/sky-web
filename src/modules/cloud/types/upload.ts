/**
 * 上传相关类型定义
 *
 * 包含普通上传和断点续传的类型定义
 */

/**
 * 上传任务状态
 */
export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled' | 'failed'

/**
 * 上传任务
 */
export interface UploadTask {
  id: string                    // 任务ID
  file: File                    // 文件对象
  folderId: number              // 目标文件夹ID
  status: UploadStatus          // 上传状态
  progress: number              // 上传进度（0-100）
  uploadedSize: number          // 已上传大小（字节）
  totalSize: number             // 文件总大小（字节）
  speed: number                 // 上传速度（字节/秒）
  remainingTime: number         // 剩余时间（秒）
  chunks?: ChunkInfo[]          // 分片信息（断点续传使用）
  error?: string                // 错误信息
  controller?: AbortController  // 取消控制器
  startTime?: number            // 开始时间戳
  lastUpdateTime?: number       // 最后更新时间戳
}

/**
 * 分片信息
 */
export interface ChunkInfo {
  index: number         // 分片索引
  start: number         // 起始位置
  end: number           // 结束位置
  size: number          // 分片大小
  uploaded: boolean     // 是否已上传
  hash?: string         // 分片hash（可选）
  retryCount?: number   // 重试次数
}

/**
 * 上传进度信息
 */
export interface UploadProgress {
  percent: number       // 百分比（0-100）
  loaded: number        // 已上传大小
  total: number         // 总大小
  speed: number         // 速度（字节/秒）
  remainingTime: number // 剩余时间（秒）
}

/**
 * 断点续传配置选项
 */
export interface ResumableUploadOptions {
  chunkSize?: number              // 分片大小（默认5MB）
  maxRetries?: number             // 最大重试次数（默认3次）
  onProgress?: (progress: UploadProgress) => void    // 进度回调
  onChunkComplete?: (chunkIndex: number) => void     // 分片完成回调
  signal?: AbortSignal            // 取消信号
}

/**
 * 断点续传 - 文件hash检查请求
 */
export interface CheckHashRequest {
  hash: string
  folderId: number
}

/**
 * 断点续传 - 文件hash检查响应
 */
export interface CheckHashResponse {
  code: number
  message: string
  data: {
    exists: boolean       // 文件是否已存在
    file?: {              // 如果存在，返回文件信息
      ID: number
      FileName: string
      FileSize: number
      FileType: string
      CreateTime: string
    }
  }
}

/**
 * 断点续传 - 初始化上传请求
 */
export interface InitUploadRequest {
  fileName: string
  fileSize: number
  fileHash: string
  folderId: number
  totalChunks: number
}

/**
 * 断点续传 - 初始化上传响应
 */
export interface InitUploadResponse {
  code: number
  message: string
  data: {
    uploadId: string      // 上传任务ID
  }
}

/**
 * 断点续传 - 获取已上传分片响应
 */
export interface GetUploadedChunksResponse {
  code: number
  message: string
  data: {
    uploadedChunks: number[]  // 已上传的分片索引数组
  }
}

/**
 * 断点续传 - 完成上传响应
 */
export interface CompleteUploadResponse {
  code: number
  message: string
  data: {
    ID: number
    FileName: string
    FileSize: number
    FileType: string
    FolderID: number
    UserID: number
    CreateTime: string
  }
}

/**
 * 上传结果（用于批量上传）
 */
export interface UploadResult {
  success: boolean      // 是否成功
  file: File            // 文件对象
  result?: any          // 成功时的结果
  error?: any           // 失败时的错误信息
}
