/**
 * 云盘 API 接口
 *
 * 优化版本 - 使用统一的类型定义，修复已知bug
 */

import api from '@/api/http'
import { API_BASE_URL } from '@/config'
import { getAccessToken } from '@/utils/token'
import type {
  Folder,
  FolderCreateParams,
  FolderRenameParams,
  FileItem,
  FileUploadParams,
  FileRenameParams,
  FileMoveParams,
  FileSearchParams,
  QuotaInfo,
  ShareInfo,
  ShareCreateParams,
  ShareListItem,
  ApiResponse,
  // 断点续传相关类型
  CheckHashRequest,
  CheckHashResponse,
  InitUploadRequest,
  InitUploadResponse,
  GetUploadedChunksResponse,
  CompleteUploadResponse,
} from '@/modules/cloud/types'

// ==================== 文件夹操作 ====================

/**
 * 获取指定父文件夹下的文件夹列表
 */
export async function fetchFolders(parentId?: number): Promise<Folder[]> {
  const params = parentId !== undefined ? { parentId } : {}
  const { data } = await api.get<ApiResponse<any[]>>('/cloud/folders', { params })
  const result = data?.data || []

  if (!Array.isArray(result)) {
    return []
  }

  // 转换字段名，将后端的小写字段转换为前端期望的格式
  const convertFolder = (folder: any): Folder => ({
    ID: folder.ID || folder.id || 0,
    id: folder.id || folder.ID || 0,
    name: folder.name || '',
    parentId: folder.parentId ?? null,
    ownerId: folder.ownerId || folder.ownerID || 0,
    path: folder.path || '',
    isPublic: folder.isPublic || 'N',
    description: folder.description || '',
    fileCount: folder.fileCount || 0,
    totalSize: folder.totalSize || 0,
    sysCompanyId: folder.sysCompanyId || 0,
    createBy: folder.createBy || '',
    createTime: folder.createTime || '',
    updateBy: folder.updateBy || '',
    updateTime: folder.updateTime || '',
    isActive: folder.isActive || 'Y',
    shareCode: folder.shareCode || null,
    shareExpire: folder.shareExpire || null,
    Children: folder.Children ? folder.Children.map(convertFolder) : undefined
  })

  return result.map(convertFolder)
}

/**
 * 获取完整文件夹树结构
 */
export async function fetchFolderTree(): Promise<Folder[]> {
  const { data } = await api.get<ApiResponse<any[]>>('/cloud/folders/tree')
  const result = data?.data || []
  
  if (!Array.isArray(result)) {
    return []
  }

  // 递归转换字段名，将后端的小写字段转换为前端期望的格式
  const convertFolder = (folder: any): Folder => ({
    ID: folder.ID || folder.id || 0,
    id: folder.id || folder.ID || 0,
    name: folder.name || '',
    parentId: folder.parentId ?? null,
    ownerId: folder.ownerId || folder.ownerID || 0,
    path: folder.path || '',
    isPublic: folder.isPublic || 'N',
    description: folder.description || '',
    fileCount: folder.fileCount || 0,
    totalSize: folder.totalSize || 0,
    sysCompanyId: folder.sysCompanyId || 0,
    createBy: folder.createBy || '',
    createTime: folder.createTime || '',
    updateBy: folder.updateBy || '',
    updateTime: folder.updateTime || '',
    isActive: folder.isActive || 'Y',
    shareCode: folder.shareCode || null,
    shareExpire: folder.shareExpire || null,
    Children: folder.Children ? folder.Children.map(convertFolder) : undefined
  })

  return result.map(convertFolder)
}

/**
 * 创建文件夹
 */
export async function createFolder(params: FolderCreateParams): Promise<Folder> {
  const { data } = await api.post<ApiResponse<Folder>>('/cloud/folders', params)
  if (!data?.data) {
    throw new Error('创建文件夹失败')
  }
  return data.data
}

/**
 * 删除文件夹
 */
export async function deleteFolder(id: number): Promise<void> {
  console.log('[DEBUG] cloud.api.deleteFolder called', { id, url: `/cloud/folders/${id}` })
  await api.delete(`/cloud/folders/${id}`)
}

/**
 * 重命名文件夹
 */
export async function renameFolder(id: number, params: FolderRenameParams): Promise<void> {
  await api.put(`/cloud/folders/${id}/rename`, params)
}

// ==================== 文件操作 ====================

/**
 * 获取指定文件夹下的文件列表
 */
export async function fetchFiles(folderId = 0): Promise<FileItem[]> {
  const { data } = await api.get<ApiResponse<FileItem[]>>('/cloud/files', {
    params: { folderId },
  })

  // 后端返回的数据可能在 data.data 或 data.data.data 中（分页结构）
  let list = data?.data || []

  // 处理分页响应：{ data: { data: [...], total: 10 } }
  if (!Array.isArray(list) && list && typeof list === 'object' && 'data' in list) {
    list = (list as any).data || []
  }

  // 确保 list 是数组
  if (!Array.isArray(list)) {
    console.warn('fetchFiles: 返回的数据不是数组', list)
    return []
  }

  // 确保字段使用 PascalCase（与后端API文档一致）
  return list.map((item) => ({
    ID: item.ID || item.id,
    FileName: item.FileName || item.fileName || item.name || '',
    FileSize: item.FileSize || item.fileSize || 0,
    FileType: item.FileType || item.fileType || '',
    FileExt: item.FileExt || item.fileExt || '',
    FolderID: item.FolderID ?? item.folderId ?? 0,
    UserID: item.UserID ?? item.ownerId ?? item.userId ?? 0,
    CreateTime: item.CreateTime || item.createTime,
    StoragePath: item.StoragePath || item.storagePath,
  }))
}

/**
 * 搜索文件（前端扩展功能）
 *
 * 注意：后端如果支持搜索接口 GET /cloud/files/search，可以使用此函数
 */
export async function searchFiles(params: FileSearchParams): Promise<FileItem[]> {
  const { data } = await api.get<ApiResponse<FileItem[]>>('/cloud/files/search', {
    params,
  })
  const result = data?.data || []
  return Array.isArray(result) ? result : []
}

/**
 * 上传文件
 */
export async function uploadFile(
  file: File,
  folderId = 0,
  onProgress?: (percent: number, loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<FileItem> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderId', String(folderId))

  const { data } = await api.post<ApiResponse<FileItem>>('/cloud/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // 大文件上传不限制超时
    signal,
    onUploadProgress: (event) => {
      if (!onProgress) return

      const total = event.total || file.size || 0
      const loaded = event.loaded || 0

      if (total > 0) {
        const percent = Math.min(100, Math.max(0, (loaded / total) * 100))
        onProgress(percent, loaded, total)
      }
    },
  })

  if (!data?.data) {
    throw new Error('上传失败')
  }

  return data.data
}

/**
 * 下载文件（带认证）
 *
 * 采用三级降级策略：
 * 1. 直链下载（token作为query参数）
 * 2. Fetch API + Authorization头
 * 3. 降级到axios blob下载
 */
export async function downloadFile(id: number, filename?: string): Promise<void> {
  const path = `/cloud/files/${id}/download`
  const token = getAccessToken()
  const baseUrl = (API_BASE_URL || '').replace(/\/$/, '')

  // 触发浏览器下载
  const triggerDownload = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `file-${id}`
    link.rel = 'noopener'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 策略1: 尝试直链下载
  if (token) {
    const directUrl = `${baseUrl}${path}?token=${encodeURIComponent(token)}`
    try {
      const headResp = await fetch(directUrl, { method: 'HEAD', credentials: 'include' })
      if (headResp.ok) {
        triggerDownload(directUrl)
        return
      }
    } catch {
      // 继续下一个策略
    }
  }

  // 策略2: Fetch API + Authorization头
  try {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const url = `${baseUrl}${path}`
    const resp = await fetch(url, { method: 'GET', headers, credentials: 'include' })

    if (!resp.ok) {
      throw new Error(`下载失败，状态码 ${resp.status}`)
    }

    const blob = await resp.blob()
    if (!blob || blob.size === 0) {
      throw new Error('下载内容为空')
    }

    const blobUrl = window.URL.createObjectURL(blob)
    triggerDownload(blobUrl)
    window.URL.revokeObjectURL(blobUrl)
    return
  } catch (e) {
    // 继续下一个策略
    console.warn('Fetch下载失败，尝试axios:', e)
  }

  // 策略3: 降级到axios
  try {
    const response = await api.get(path, { responseType: 'blob', timeout: 0 })
    const blob = response.data as Blob

    if (!blob || blob.size === 0) {
      throw new Error('下载失败，内容为空')
    }

    const blobUrl = window.URL.createObjectURL(blob)
    triggerDownload(blobUrl)
    window.URL.revokeObjectURL(blobUrl)
  } catch (e: any) {
    throw new Error(e?.message || '下载失败，请稍后重试')
  }
}

/**
 * 获取文件Blob（用于预览）
 */
export async function fetchFileBlob(id: number): Promise<Blob> {
  const response = await api.get(`/cloud/files/${id}/download`, {
    responseType: 'blob',
  })
  return response.data as Blob
}

/**
 * 删除文件
 */
export async function deleteFile(id: number): Promise<void> {
  await api.delete(`/cloud/files/${id}`)
}

/**
 * 移动文件
 */
export async function moveFile(id: number, params: FileMoveParams): Promise<void> {
  await api.put(`/cloud/files/${id}/move`, params)
}

/**
 * 重命名文件
 */
export async function renameFile(id: number, params: FileRenameParams): Promise<void> {
  await api.put(`/cloud/files/${id}/rename`, params)
}

// ==================== 分享管理 ====================

/**
 * 创建文件分享
 */
export async function createFileShare(params: ShareCreateParams): Promise<ShareInfo> {
  const { data } = await api.post<ApiResponse<ShareInfo>>('/cloud/shares', {
    resourceType: 'file',
    resourceId: params.resourceId || params.fileId,
    shareType: params.shareType || 'password', // 默认密码分享
    password: params.password,
    expireDays: params.expireDays || 0,
    maxDownloads: params.maxDownloads || 0,
  })

  if (!data?.data) {
    throw new Error('创建分享失败')
  }

  return data.data
}

/**
 * 创建文件夹分享
 *
 * 注意：根据API文档，后端分享接口统一使用 resourceType 和 resourceId 参数
 */
export async function createFolderShare(params: ShareCreateParams): Promise<ShareInfo> {
  const { data } = await api.post<ApiResponse<ShareInfo>>('/cloud/shares', {
    resourceType: 'folder',
    resourceId: params.resourceId,
    shareType: params.shareType || 'password', // 默认密码分享
    password: params.password,
    expireDays: params.expireDays || 0,
    maxDownloads: params.maxDownloads || 0,
  })

  if (!data?.data) {
    throw new Error('创建文件夹分享失败')
  }

  return data.data
}

/**
 * 获取我的分享列表（前端扩展功能）
 *
 * 注意：此功能需要后端新增接口 GET /cloud/shares
 */
export async function getMyShares(): Promise<ShareListItem[]> {
  try {
    const { data } = await api.get<ApiResponse<ShareListItem[]>>('/cloud/shares')
    const result = data?.data || []
    return Array.isArray(result) ? result : []
  } catch (e) {
    console.warn('获取分享列表失败，可能后端未实现此接口:', e)
    return []
  }
}

/**
 * 删除分享
 */
export async function deleteShare(shareId: number): Promise<void> {
  await api.delete(`/cloud/shares/${shareId}`)
}

/**
 * 更新分享（修改密码或过期时间）
 *
 * 注意：此功能需要后端新增接口 PUT /cloud/shares/:id
 */
export async function updateShare(
  shareId: number,
  params: Partial<ShareCreateParams>
): Promise<ShareInfo> {
  const { data } = await api.put<ApiResponse<ShareInfo>>(`/cloud/shares/${shareId}`, params)

  if (!data?.data) {
    throw new Error('更新分享失败')
  }

  return data.data
}

/**
 * 获取分享访问记录
 *
 * 注意：此功能需要后端新增接口 GET /cloud/shares/:id/access-records
 */
export async function getShareAccessRecords(shareId: number): Promise<any[]> {
  try {
    const { data } = await api.get<ApiResponse<any[]>>(`/cloud/shares/${shareId}/access-records`)
    const result = data?.data || []
    return Array.isArray(result) ? result : []
  } catch (e) {
    console.warn('获取分享访问记录失败，可能后端未实现此接口:', e)
    return []
  }
}

// ==================== 批量操作 ====================

/**
 * 批量删除请求参数
 */
export interface BatchDeleteRequest {
  fileIds: number[]
  folderIds: number[]
}

/**
 * 批量删除响应
 */
export interface BatchDeleteResponse {
  successCount: number
  failedCount: number
  failedItems: string[]
}

/**
 * 批量删除文件和文件夹
 */
export async function batchDelete(params: BatchDeleteRequest): Promise<BatchDeleteResponse> {
  const { data } = await api.post<ApiResponse<BatchDeleteResponse>>('/cloud/batch/delete', {
    fileIds: params.fileIds,
    folderIds: params.folderIds,
  })

  if (!data?.data) {
    throw new Error('批量删除失败')
  }

  return data.data
}

/**
 * 批量移动请求参数
 */
export interface BatchMoveRequest {
  fileIds: number[]
  targetFolderId: number
}

/**
 * 批量移动响应
 */
export interface BatchMoveResponse {
  successCount: number
  failedCount: number
  failedItems: string[]
}

/**
 * 批量移动文件
 */
export async function batchMove(params: BatchMoveRequest): Promise<BatchMoveResponse> {
  const { data } = await api.post<ApiResponse<BatchMoveResponse>>('/cloud/batch/move', {
    fileIds: params.fileIds,
    targetFolderId: params.targetFolderId,
  })

  if (!data?.data) {
    throw new Error('批量移动失败')
  }

  return data.data
}

// ==================== 配额管理 ====================

/**
 * 获取用户配额信息
 */
export async function getQuota(): Promise<QuotaInfo> {
  const { data } = await api.get<ApiResponse<QuotaInfo>>('/cloud/quota')
  return data?.data || {}
}

// ==================== 分片上传和断点续传 API ====================

/**
 * 初始化分片上传
 * 对应后端: POST /api/v1/cloud/files/multipart/init
 */
export async function initMultipartUpload(params: {
  fileName: string
  fileSize: number
  fileMd5: string
  fileType?: string
  chunkSize?: number
  folderId?: number
  storageType?: string
}): Promise<{
  sessionId: number
  fileId: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  uploadedChunks: number[]
  status: string
  expireTime: string
}> {
  const { data } = await api.post<ApiResponse<any>>('/cloud/files/multipart/init', {
    fileName: params.fileName,
    fileSize: params.fileSize,
    fileMd5: params.fileMd5,
    fileType: params.fileType || 'application/octet-stream',
    chunkSize: params.chunkSize || 5242880, // 默认5MB
    folderId: params.folderId,
    storageType: params.storageType || 'local',
  })

  return data.data
}

/**
 * 上传分片
 * 对应后端: POST /api/v1/cloud/files/multipart/upload
 */
export async function uploadMultipartChunk(
  sessionId: number,
  chunkIndex: number,
  chunkMd5: string,
  chunkData: Blob,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData()
  formData.append('sessionId', String(sessionId))
  formData.append('chunkIndex', String(chunkIndex))
  formData.append('chunkMd5', chunkMd5)
  formData.append('chunkData', chunkData)

  await api.post('/cloud/files/multipart/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  })
}

/**
 * 查询上传状态
 * 对应后端: GET /api/v1/cloud/files/multipart/status?sessionId=xxx
 */
export async function getMultipartUploadStatus(sessionId: number): Promise<{
  sessionId: number
  fileId: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadedChunks: number[]
  status: string
  progress: number
  expireTime: string
}> {
  const { data } = await api.get<ApiResponse<any>>(
    `/cloud/files/multipart/status?sessionId=${sessionId}`
  )
  return data.data
}

/**
 * 完成分片上传
 * 对应后端: POST /api/v1/cloud/files/multipart/complete
 */
export async function completeMultipartUpload(sessionId: number): Promise<FileItem> {
  const { data } = await api.post<ApiResponse<any>>('/cloud/files/multipart/complete', {
    sessionId,
  })

  // 后端现在返回 CloudItem 格式，需要转换为 FileItem
  const item = data.data
  return {
    ID: item.id || item.ID || 0,
    FileName: item.name || item.FileName || '',
    FileSize: item.fileSize || item.FileSize || 0,
    FileType: item.fileType || item.FileType || '',
    FileExt: item.fileExt || item.FileExt || '',
    FolderID: item.parentId ?? item.FolderID ?? 0,
    UserID: item.ownerId || item.UserID || 0,
    CreateTime: item.createTime || item.CreateTime || '',
    StoragePath: item.storagePath || item.StoragePath || '',
  }
}

/**
 * 取消上传
 * 对应后端: DELETE /api/v1/cloud/files/multipart/:sessionId
 */
export async function abortMultipartUpload(sessionId: number): Promise<void> {
  await api.delete(`/cloud/files/multipart/${sessionId}`)
}

/**
 * 恢复上传（断点续传）
 * 对应后端: POST /api/v1/cloud/files/multipart/resume
 */
export async function resumeMultipartUpload(fileMd5: string): Promise<{
  sessionId: number
  fileId: string
  uploadedChunks: number[]
  status: string
}> {
  const { data } = await api.post<ApiResponse<any>>('/cloud/files/multipart/resume', {
    fileMd5,
  })
  return data.data
}

// ==================== 兼容旧接口（保持向后兼容）====================

/**
 * @deprecated 使用 initMultipartUpload 替代
 */
export async function checkFileHash(params: CheckHashRequest): Promise<CheckHashResponse> {
  try {
    // 新后端通过 init 接口检查秒传
    const result = await initMultipartUpload({
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileMd5: params.hash,
    })

    // 如果返回的 uploadedChunks 已经全部完成，说明文件已存在（秒传）
    if (result.uploadedChunks.length === result.totalChunks) {
      return {
        code: 200,
        message: 'success',
        data: {
          exists: true,
          fileId: result.fileId,
        },
      }
    }

    return {
      code: 200,
      message: 'success',
      data: { exists: false },
    }
  } catch (e) {
    return {
      code: 200,
      message: 'not implemented',
      data: { exists: false },
    }
  }
}

/**
 * @deprecated 使用 initMultipartUpload 替代
 */
export async function initResumableUpload(
  params: InitUploadRequest
): Promise<InitUploadResponse> {
  const result = await initMultipartUpload({
    fileName: params.fileName,
    fileSize: params.fileSize,
    fileMd5: params.fileHash,
    chunkSize: params.chunkSize,
    folderId: params.folderId,
  })

  return {
    code: 200,
    message: 'success',
    data: {
      uploadId: String(result.sessionId),
      uploadedChunks: result.uploadedChunks,
    },
  }
}

/**
 * @deprecated 使用 getMultipartUploadStatus 替代
 */
export async function getUploadedChunks(uploadId: string): Promise<GetUploadedChunksResponse> {
  const sessionId = Number(uploadId)
  const result = await getMultipartUploadStatus(sessionId)

  return {
    code: 200,
    message: 'success',
    data: {
      uploadedChunks: result.uploadedChunks,
    },
  }
}

/**
 * @deprecated 使用 uploadMultipartChunk 替代
 */
export async function uploadChunk(
  uploadId: string,
  chunkIndex: number,
  chunk: Blob,
  signal?: AbortSignal
): Promise<void> {
  const sessionId = Number(uploadId)

  // 计算分片MD5
  const chunkMd5 = await calculateChunkMD5(chunk)

  await uploadMultipartChunk(sessionId, chunkIndex, chunkMd5, chunk, signal)
}

/**
 * @deprecated 使用 completeMultipartUpload 替代
 */
export async function completeResumableUpload(uploadId: string): Promise<CompleteUploadResponse> {
  const sessionId = Number(uploadId)
  const file = await completeMultipartUpload(sessionId)

  return {
    code: 200,
    message: 'success',
    data: {
      fileId: String(file.ID),
      fileName: file.FileName,
      fileSize: file.FileSize,
    },
  }
}

/**
 * 计算分片MD5（辅助函数）
 */
async function calculateChunkMD5(chunk: Blob): Promise<string> {
  const SparkMD5 = (await import('spark-md5')).default
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const spark = new SparkMD5.ArrayBuffer()
      spark.append(e.target?.result as ArrayBuffer)
      resolve(spark.end())
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(chunk)
  })
}

// ==================== 导出所有API ====================

export default {
  // 文件夹
  fetchFolders,
  fetchFolderContent,
  fetchFolderTree,
  createFolder,
  deleteFolder,
  renameFolder,

  // 文件
  fetchFiles,
  searchFiles,
  uploadFile,
  downloadFile,
  fetchFileBlob,
  deleteFile,
  moveFile,
  renameFile,

  // 批量操作
  batchDelete,
  batchMove,

  // 分享
  createFileShare,
  createFolderShare,
  getMyShares,
  deleteShare,
  updateShare,
  getShareAccessRecords,

  // 配额
  getQuota,

  // 分片上传和断点续传（新接口）
  initMultipartUpload,
  uploadMultipartChunk,
  getMultipartUploadStatus,
  completeMultipartUpload,
  abortMultipartUpload,
  resumeMultipartUpload,

  // 断点续传（兼容旧接口）
  checkFileHash,
  initResumableUpload,
  getUploadedChunks,
  uploadChunk,
  completeResumableUpload,
}

/**
 * 获取文件夹内容（子文件夹+文件）
 * 一次性获取指定文件夹的子文件夹和文件列表
 */
export async function fetchFolderContent(folderId?: number): Promise<{ folders: Folder[]; files: FileItem[] }> {
  const params = folderId !== undefined && folderId !== 0 ? { folderId } : {}
  const { data } = await api.get<ApiResponse<{ folders: any[]; files: any[] }>>('/cloud/folders/content', { params })

  const result = data?.data || { folders: [], files: [] }

  // 转换文件夹字段
  const convertFolder = (folder: any): Folder => ({
    ID: folder.ID || folder.id || 0,
    id: folder.id || folder.ID || 0,
    name: folder.name || '',
    parentId: folder.parentId ?? null,
    ownerId: folder.ownerId || folder.ownerID || 0,
    path: folder.path || '',
    isPublic: folder.isPublic || 'N',
    description: folder.description || '',
    fileCount: folder.fileCount || 0,
    totalSize: folder.totalSize || 0,
    sysCompanyId: folder.sysCompanyId || 0,
    createBy: folder.createBy || '',
    createTime: folder.createTime || '',
    updateBy: folder.updateBy || '',
    updateTime: folder.updateTime || '',
    isActive: folder.isActive || 'Y',
    shareCode: folder.shareCode || null,
    shareExpire: folder.shareExpire || null,
    Children: folder.Children ? folder.Children.map(convertFolder) : undefined
  })

  // 转换文件字段
  const convertFile = (file: any): FileItem => ({
    ID: file.ID || file.id,
    FileName: file.FileName || file.fileName || file.name || '',
    FileSize: file.FileSize || file.fileSize || 0,
    FileType: file.FileType || file.fileType || '',
    FileExt: file.FileExt || file.fileExt || '',
    FolderID: file.FolderID ?? file.folderId ?? 0,
    UserID: file.UserID ?? file.ownerId ?? file.userId ?? 0,
    CreateTime: file.CreateTime || file.createTime,
    StoragePath: file.StoragePath || file.storagePath,
  })

  return {
    folders: Array.isArray(result.folders) ? result.folders.map(convertFolder) : [],
    files: Array.isArray(result.files) ? result.files.map(convertFile) : []
  }
}

// ==================== CloudItem 统一接口（新） ====================

/**
 * 获取云盘项目列表（文件+文件夹）
 * 对应后端: GET /api/v1/cloud/items?parentId=xxx
 */
export async function fetchItems(parentId?: number): Promise<{ folders: Folder[]; files: FileItem[] }> {
  const params = parentId !== undefined && parentId !== 0 ? { parentId } : {}
  const { data } = await api.get<ApiResponse<any>>('/cloud/items', { params })

  console.log('[DEBUG] fetchItems response:', { data, params })
  const result = data?.data || { folders: [], files: [] }
  console.log('[DEBUG] fetchItems result:', result)

  // 转换文件夹字段（CloudItem -> Folder）
  const convertFolder = (item: any): Folder => ({
    ID: item.id || 0,
    id: item.id || 0,
    name: item.name || '',
    parentId: item.parentId ?? null,
    ownerId: item.ownerId || 0,
    path: item.path || '',
    isPublic: item.isPublic || 'N',
    description: item.description || '',
    fileCount: item.fileCount || 0,
    totalSize: item.totalSize || 0,
    sysCompanyId: item.sysCompanyId || 0,
    createBy: item.createBy || '',
    createTime: item.createTime || '',
    updateBy: item.updateBy || '',
    updateTime: item.updateTime || '',
    isActive: item.isActive || 'Y',
    shareCode: item.shareCode || null,
    shareExpire: item.shareExpire || null,
  })

  // 转换文件字段（CloudItem -> FileItem）
  const convertFile = (item: any): FileItem => ({
    ID: item.id || 0,
    FileName: item.name || '',
    FileSize: item.fileSize || 0,
    FileType: item.fileType || '',
    FileExt: item.fileExt || '',
    FolderID: item.parentId ?? 0,
    UserID: item.ownerId || 0,
    CreateTime: item.createTime || '',
    StoragePath: item.storagePath || '',
    AccessURL: item.accessUrl || '',
  })

  const converted = {
    folders: Array.isArray(result.folders) ? result.folders.map(convertFolder) : [],
    files: Array.isArray(result.files) ? result.files.map(convertFile) : []
  }

  console.log('[DEBUG] fetchItems converted:', converted)
  return converted
}

/**
 * 创建云盘项目（文件夹）
 * 对应后端: POST /api/v1/cloud/items
 */
export async function createItem(params: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>('/cloud/items', params)

  if (!data?.data) {
    throw new Error('创建项目失败')
  }

  return data.data
}

/**
 * 删除云盘项目
 * 对应后端: DELETE /api/v1/cloud/items/:id
 */
export async function deleteItem(id: number): Promise<void> {
  await api.delete(`/cloud/items/${id}`)
}

/**
 * 重命名云盘项目
 * 对应后端: PUT /api/v1/cloud/items/:id/rename
 */
export async function renameItem(id: number, params: { newName: string }): Promise<void> {
  await api.put(`/cloud/items/${id}/rename`, params)
}

/**
 * 移动云盘项目
 * 对应后端: PUT /api/v1/cloud/items/:id/move
 */
export async function moveItem(id: number, params: { targetParentId?: number | null }): Promise<void> {
  await api.put(`/cloud/items/${id}/move`, params)
}

/**
 * 批量删除云盘项目
 * 对应后端: POST /api/v1/cloud/items/batch/delete
 */
export async function batchDeleteItems(params: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>('/cloud/items/batch/delete', params)

  if (!data?.data) {
    throw new Error('批量删除失败')
  }

  return data.data
}

/**
 * 批量移动云盘项目
 * 对应后端: POST /api/v1/cloud/items/batch/move
 */
export async function batchMoveItems(params: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>('/cloud/items/batch/move', params)

  if (!data?.data) {
    throw new Error('批量移动失败')
  }

  return data.data
}
