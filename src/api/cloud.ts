/**
 * 云盘 API 兼容层
 *
 * 为了保持向后兼容，此文件重新导出新的模块化API
 * 同时修复了已知的bug：
 * 1. moveFile 函数现在可以正确导入
 * 2. 文件夹分享API统一
 */

// 重新导出新的模块化API
export {
  // 文件夹操作
  fetchFolders,
  fetchFolderTree,
  createFolder,
  deleteFolder,
  renameFolder,

  // 文件操作
  fetchFiles,
  searchFiles,
  uploadFile,
  downloadFile,
  fetchFileBlob,
  deleteFile,
  moveFile,  // ✅ 修复：确保 moveFile 可以被正确导出和导入
  renameFile,

  // 分享管理
  createFileShare,
  createFolderShare,  // ✅ 修复：统一文件夹分享API
  getMyShares,
  deleteShare,
  updateShare,

  // 配额管理
  getQuota,

  // 断点续传
  checkFileHash,
  initResumableUpload,
  getUploadedChunks,
  uploadChunk,
  completeResumableUpload,

  // 默认导出
  cloudApi,
} from '@/modules/cloud/api'

// 重新导出类型定义
export type {
  Folder,
  FileItem,
  QuotaInfo,
  ShareInfo,
  ShareListItem,
  FileUploadParams,
  FileRenameParams,
  FileMoveParams,
  FileSearchParams,
  FolderCreateParams,
  FolderRenameParams,
  ShareCreateParams,
} from '@/modules/cloud/types'

// ==================== 向后兼容的别名 ====================

// 为了兼容现有代码，保留旧的函数名
import { downloadFile as downloadFileNew } from '@/modules/cloud/api'

/**
 * @deprecated 使用 downloadFile 替代
 */
export const downloadFileAuth = downloadFileNew

/**
 * @deprecated 使用 createFileShare 替代
 */
import { createFileShare } from '@/modules/cloud/api'
export const createShare = createFileShare

// 默认导出
import { cloudApi as cloudApiImport } from '@/modules/cloud/api'
export default cloudApiImport
