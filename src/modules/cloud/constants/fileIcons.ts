/**
 * 文件图标映射配置
 *
 * 根据文件类型返回对应的emoji图标和颜色
 */

import type { FileIconConfig } from '../types'

/**
 * 文件扩展名到图标的映射
 */
export const FILE_ICON_MAP: Record<string, FileIconConfig> = {
  // 图片文件
  '.jpg': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  '.jpeg': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  '.png': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  '.gif': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  '.bmp': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  '.svg': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  '.webp': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  '.ico': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },

  // 视频文件
  '.mp4': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  '.avi': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  '.mov': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  '.wmv': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  '.flv': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  '.mkv': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  '.webm': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },

  // 音频文件
  '.mp3': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },
  '.wav': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },
  '.flac': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },
  '.aac': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },
  '.ogg': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },
  '.m4a': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },

  // 文档文件
  '.pdf': { icon: '📕', color: '#ef4444', bg: '#fff1f0' },
  '.doc': { icon: '📄', color: '#2563eb', bg: '#e8f1ff' },
  '.docx': { icon: '📄', color: '#2563eb', bg: '#e8f1ff' },
  '.txt': { icon: '📝', color: '#6b7280', bg: '#f9fafb' },
  '.rtf': { icon: '📝', color: '#6b7280', bg: '#f9fafb' },
  '.md': { icon: '📝', color: '#6b7280', bg: '#f9fafb' },

  // 表格文件
  '.xls': { icon: '📊', color: '#16a34a', bg: '#e8f8ef' },
  '.xlsx': { icon: '📊', color: '#16a34a', bg: '#e8f8ef' },
  '.csv': { icon: '📊', color: '#16a34a', bg: '#e8f8ef' },

  // 演示文稿
  '.ppt': { icon: '📽', color: '#dc2626', bg: '#fff1f0' },
  '.pptx': { icon: '📽', color: '#dc2626', bg: '#fff1f0' },

  // 压缩文件
  '.zip': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },
  '.rar': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },
  '.7z': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },
  '.tar': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },
  '.gz': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },

  // 代码文件
  '.js': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  '.ts': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  '.jsx': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  '.tsx': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  '.vue': { icon: '⌨', color: '#10b981', bg: '#f0fdf4' },
  '.html': { icon: '⌨', color: '#f97316', bg: '#fff7ed' },
  '.css': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  '.scss': { icon: '⌨', color: '#ec4899', bg: '#fdf2f8' },
  '.py': { icon: '⌨', color: '#3b82f6', bg: '#eff6ff' },
  '.java': { icon: '⌨', color: '#dc2626', bg: '#fff1f0' },
  '.go': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  '.php': { icon: '⌨', color: '#8b5cf6', bg: '#f5f3ff' },
  '.c': { icon: '⌨', color: '#6b7280', bg: '#f9fafb' },
  '.cpp': { icon: '⌨', color: '#6b7280', bg: '#f9fafb' },
  '.h': { icon: '⌨', color: '#6b7280', bg: '#f9fafb' },
  '.sql': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  '.json': { icon: '⌨', color: '#10b981', bg: '#f0fdf4' },
  '.xml': { icon: '⌨', color: '#f97316', bg: '#fff7ed' },
  '.yaml': { icon: '⌨', color: '#8b5cf6', bg: '#f5f3ff' },
  '.yml': { icon: '⌨', color: '#8b5cf6', bg: '#f5f3ff' },

  // 可执行文件
  '.exe': { icon: '⚙', color: '#6b7280', bg: '#f9fafb' },
  '.app': { icon: '⚙', color: '#6b7280', bg: '#f9fafb' },
  '.dmg': { icon: '⚙', color: '#6b7280', bg: '#f9fafb' },
  '.deb': { icon: '⚙', color: '#6b7280', bg: '#f9fafb' },
  '.rpm': { icon: '⚙', color: '#6b7280', bg: '#f9fafb' },

  // 数据库文件
  '.db': { icon: '🗄', color: '#3b82f6', bg: '#eff6ff' },
  '.sqlite': { icon: '🗄', color: '#3b82f6', bg: '#eff6ff' },
  '.mdb': { icon: '🗄', color: '#3b82f6', bg: '#eff6ff' },

  // 字体文件
  '.ttf': { icon: '🔤', color: '#6b7280', bg: '#f9fafb' },
  '.otf': { icon: '🔤', color: '#6b7280', bg: '#f9fafb' },
  '.woff': { icon: '🔤', color: '#6b7280', bg: '#f9fafb' },
  '.woff2': { icon: '🔤', color: '#6b7280', bg: '#f9fafb' },

  // 其他常见文件
  '.log': { icon: '📋', color: '#6b7280', bg: '#f9fafb' },
  '.ini': { icon: '⚙', color: '#6b7280', bg: '#f9fafb' },
  '.conf': { icon: '⚙', color: '#6b7280', bg: '#f9fafb' },
  '.iso': { icon: '💿', color: '#8b5cf6', bg: '#f5f3ff' },
}

/**
 * MIME类型到图标的映射
 */
export const MIME_TYPE_ICON_MAP: Record<string, FileIconConfig> = {
  // 图片类型
  'image/jpeg': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  'image/png': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  'image/gif': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  'image/bmp': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  'image/svg+xml': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },
  'image/webp': { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' },

  // 视频类型
  'video/mp4': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  'video/avi': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  'video/quicktime': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },
  'video/x-msvideo': { icon: '🎞', color: '#f97316', bg: '#fff7ed' },

  // 音频类型
  'audio/mpeg': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },
  'audio/wav': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },
  'audio/flac': { icon: '🎧', color: '#10b981', bg: '#f0fdf4' },

  // 文档类型
  'application/pdf': { icon: '📕', color: '#ef4444', bg: '#fff1f0' },
  'application/msword': { icon: '📄', color: '#2563eb', bg: '#e8f1ff' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    icon: '📄',
    color: '#2563eb',
    bg: '#e8f1ff',
  },
  'text/plain': { icon: '📝', color: '#6b7280', bg: '#f9fafb' },
  'text/markdown': { icon: '📝', color: '#6b7280', bg: '#f9fafb' },

  // 表格类型
  'application/vnd.ms-excel': { icon: '📊', color: '#16a34a', bg: '#e8f8ef' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    icon: '📊',
    color: '#16a34a',
    bg: '#e8f8ef',
  },
  'text/csv': { icon: '📊', color: '#16a34a', bg: '#e8f8ef' },

  // 演示文稿
  'application/vnd.ms-powerpoint': { icon: '📽', color: '#dc2626', bg: '#fff1f0' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    icon: '📽',
    color: '#dc2626',
    bg: '#fff1f0',
  },

  // 压缩文件
  'application/zip': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },
  'application/x-rar-compressed': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },
  'application/x-7z-compressed': { icon: '🗜', color: '#8b5cf6', bg: '#f5f3ff' },

  // 代码文件
  'application/javascript': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
  'application/json': { icon: '⌨', color: '#10b981', bg: '#f0fdf4' },
  'application/xml': { icon: '⌨', color: '#f97316', bg: '#fff7ed' },
  'text/html': { icon: '⌨', color: '#f97316', bg: '#fff7ed' },
  'text/css': { icon: '⌨', color: '#0ea5e9', bg: '#e0f2fe' },
}

/**
 * 默认文件图标
 */
export const DEFAULT_FILE_ICON: FileIconConfig = {
  icon: '📄',
  color: '#6b7280',
  bg: '#f9fafb',
}

/**
 * 文件夹图标
 */
export const FOLDER_ICON: FileIconConfig = {
  icon: '📁',
  color: '#f59e0b',
  bg: '#fef3c7',
}

/**
 * 根据文件扩展名获取图标配置
 *
 * @param fileExt 文件扩展名（带点，如 '.pdf'）
 * @returns 图标配置
 */
export function getIconByExtension(fileExt: string | undefined): FileIconConfig {
  if (!fileExt) return DEFAULT_FILE_ICON

  const ext = fileExt.toLowerCase()
  return FILE_ICON_MAP[ext] || DEFAULT_FILE_ICON
}

/**
 * 根据MIME类型获取图标配置
 *
 * @param mimeType MIME类型（如 'application/pdf'）
 * @returns 图标配置
 */
export function getIconByMimeType(mimeType: string | undefined): FileIconConfig {
  if (!mimeType) return DEFAULT_FILE_ICON

  // 精确匹配
  if (MIME_TYPE_ICON_MAP[mimeType]) {
    return MIME_TYPE_ICON_MAP[mimeType]
  }

  // 通配符匹配（如 image/* 匹配所有图片）
  const mainType = mimeType.split('/')[0]
  if (mainType === 'image') {
    return { icon: '🖼', color: '#1e88e5', bg: '#e3f2fd' }
  }
  if (mainType === 'video') {
    return { icon: '🎞', color: '#f97316', bg: '#fff7ed' }
  }
  if (mainType === 'audio') {
    return { icon: '🎧', color: '#10b981', bg: '#f0fdf4' }
  }
  if (mainType === 'text') {
    return { icon: '📝', color: '#6b7280', bg: '#f9fafb' }
  }

  return DEFAULT_FILE_ICON
}

/**
 * 获取文件夹图标配置
 *
 * @returns 文件夹图标配置
 */
export function getFolderIcon(): FileIconConfig {
  return FOLDER_ICON
}
