/**
 * 云盘文件夹/文件字段转换工具 — 统一的字段名适配
 */
import type { Folder, FileItem } from '../types'

export function normalizeFolder(folder: any): Folder {
  return {
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
    Children: folder.Children ? folder.Children.map(normalizeFolder) : undefined,
  }
}

export function normalizeFile(file: any): FileItem {
  return {
    ID: file.ID || file.id,
    FileName: file.FileName || file.fileName || file.name || '',
    FileSize: file.FileSize || file.fileSize || 0,
    FileType: file.FileType || file.fileType || '',
    FileExt: file.FileExt || file.fileExt || '',
    FolderID: file.FolderID ?? file.folderId ?? 0,
    UserID: file.UserID ?? file.ownerId ?? file.userId ?? 0,
    CreateTime: file.CreateTime || file.createTime,
    StoragePath: file.StoragePath || file.storagePath,
  }
}
