/**
 * CloudItem 类型定义
 * 统一的文件/文件夹类型（对应后端 cloud_item 表）
 */

/**
 * CloudItem 统一类型
 * 通过 itemType 区分文件和文件夹
 */
export interface CloudItem {
  // 基础字段
  ID: number
  itemType: 'file' | 'folder'
  name: string
  parentId: number | null
  path: string
  ownerId: number

  // 文件专用字段（文件夹时为 null/undefined）
  storageType?: string
  storagePath?: string
  fileSize?: number
  fileType?: string
  fileExt?: string
  md5?: string
  accessURL?: string
  thumbnail?: string
  downloadCount?: number
  tags?: string

  // 文件夹专用字段（文件时为 0）
  fileCount: number
  totalSize: number

  // 共用字段
  isPublic: 'Y' | 'N'
  shareCode?: string | null
  shareExpire?: string | null
  description?: string

  // 系统字段
  sysCompanyId?: number
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
  isActive: 'Y' | 'N'
}

/**
 * 列表响应
 */
export interface CloudItemListResponse {
  folders: CloudItem[]
  files: CloudItem[]
}

/**
 * 创建项目参数
 */
export interface CreateItemParams {
  itemType: 'file' | 'folder'
  name: string
  parentId?: number | null
}

/**
 * 重命名参数
 */
export interface RenameItemParams {
  newName: string
}

/**
 * 移动参数
 */
export interface MoveItemParams {
  targetParentId?: number | null
}

/**
 * 批量删除参数（统一格式）
 */
export interface BatchDeleteItemsParams {
  itemIds?: number[]      // 新格式（推荐）
  fileIds?: number[]      // 旧格式（向后兼容）
  folderIds?: number[]    // 旧格式（向后兼容）
}

/**
 * 批量移动参数（统一格式）
 */
export interface BatchMoveItemsParams {
  itemIds?: number[]      // 新格式（推荐）
  fileIds?: number[]      // 旧格式（向后兼容）
  targetParentId?: number | null
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponse {
  successCount: number
  failedCount: number
  failedItems: string[]
}

/**
 * CloudItem 辅助方法
 */
export const CloudItemUtils = {
  /**
   * 判断是否为文件
   */
  isFile(item: CloudItem): boolean {
    return item.itemType === 'file'
  },

  /**
   * 判断是否为文件夹
   */
  isFolder(item: CloudItem): boolean {
    return item.itemType === 'folder'
  },

  /**
   * 转换为 FileItem（向后兼容）
   */
  toFileItem(item: CloudItem) {
    if (!this.isFile(item)) {
      throw new Error('CloudItem is not a file')
    }
    return {
      ID: item.ID,
      FileName: item.name,
      FileSize: item.fileSize || 0,
      FileType: item.fileType || '',
      FileExt: item.fileExt || '',
      FolderID: item.parentId || 0,
      UserID: item.ownerId,
      CreateTime: item.createTime,
      StoragePath: item.storagePath,
    }
  },

  /**
   * 转换为 Folder（向后兼容）
   */
  toFolder(item: CloudItem) {
    if (!this.isFolder(item)) {
      throw new Error('CloudItem is not a folder')
    }
    return {
      ID: item.ID,
      id: item.ID,
      name: item.name,
      parentId: item.parentId,
      ownerId: item.ownerId,
      path: item.path,
      isPublic: item.isPublic,
      description: item.description || '',
      fileCount: item.fileCount,
      totalSize: item.totalSize,
      sysCompanyId: item.sysCompanyId || 0,
      createBy: item.createBy || '',
      createTime: item.createTime || '',
      updateBy: item.updateBy || '',
      updateTime: item.updateTime || '',
      isActive: item.isActive,
      shareCode: item.shareCode || null,
      shareExpire: item.shareExpire || null,
    }
  },

  /**
   * 从 FileItem 转换（向后兼容）
   */
  fromFileItem(file: any): CloudItem {
    return {
      ID: file.ID || file.id,
      itemType: 'file',
      name: file.FileName || file.fileName || file.name || '',
      parentId: file.FolderID ?? file.folderId ?? null,
      path: file.path || '',
      ownerId: file.UserID || file.ownerId || file.userId || 0,
      storageType: file.StorageType || file.storageType,
      storagePath: file.StoragePath || file.storagePath,
      fileSize: file.FileSize || file.fileSize || 0,
      fileType: file.FileType || file.fileType || '',
      fileExt: file.FileExt || file.fileExt || '',
      md5: file.MD5 || file.md5,
      accessURL: file.AccessURL || file.accessURL,
      thumbnail: file.Thumbnail || file.thumbnail,
      downloadCount: file.DownloadCount || file.downloadCount || 0,
      tags: file.Tags || file.tags,
      fileCount: 0,
      totalSize: 0,
      isPublic: file.IsPublic || file.isPublic || 'N',
      shareCode: file.ShareCode || file.shareCode || null,
      shareExpire: file.ShareExpire || file.shareExpire || null,
      description: file.Description || file.description,
      sysCompanyId: file.SysCompanyId || file.sysCompanyId,
      createBy: file.CreateBy || file.createBy,
      createTime: file.CreateTime || file.createTime,
      updateBy: file.UpdateBy || file.updateBy,
      updateTime: file.UpdateTime || file.updateTime,
      isActive: file.IsActive || file.isActive || 'Y',
    }
  },

  /**
   * 从 Folder 转换（向后兼容）
   */
  fromFolder(folder: any): CloudItem {
    return {
      ID: folder.ID || folder.id,
      itemType: 'folder',
      name: folder.name || '',
      parentId: folder.parentId ?? null,
      path: folder.path || '',
      ownerId: folder.ownerId || folder.ownerID || 0,
      fileCount: folder.fileCount || 0,
      totalSize: folder.totalSize || 0,
      isPublic: folder.isPublic || 'N',
      shareCode: folder.shareCode || null,
      shareExpire: folder.shareExpire || null,
      description: folder.description || '',
      sysCompanyId: folder.sysCompanyId || 0,
      createBy: folder.createBy || '',
      createTime: folder.createTime || '',
      updateBy: folder.updateBy || '',
      updateTime: folder.updateTime || '',
      isActive: folder.isActive || 'Y',
    }
  },
}
