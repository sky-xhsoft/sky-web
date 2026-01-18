/**
 * 文件图标 Composable
 *
 * 根据文件扩展名或MIME类型返回图标配置
 */

import type { FileIconConfig } from '@/modules/cloud/types'
import {
  getIconByExtension,
  getIconByMimeType,
  getFolderIcon,
  DEFAULT_FILE_ICON,
} from '@/modules/cloud/constants/fileIcons'

/**
 * 获取文件图标配置
 *
 * @param fileExt 文件扩展名（带点，如 '.pdf'）
 * @param mimeType MIME类型（如 'application/pdf'）
 * @returns 图标配置
 */
export function getFileIconConfig(
  fileExt?: string,
  mimeType?: string
): FileIconConfig {
  // 优先使用扩展名匹配
  if (fileExt) {
    const config = getIconByExtension(fileExt)
    if (config !== DEFAULT_FILE_ICON) {
      return config
    }
  }

  // 降级到MIME类型匹配
  if (mimeType) {
    return getIconByMimeType(mimeType)
  }

  // 默认图标
  return DEFAULT_FILE_ICON
}

/**
 * 获取文件夹图标配置
 */
export function getFolderIconConfig(): FileIconConfig {
  return getFolderIcon()
}

/**
 * 使用文件图标
 */
export function useFileIcon() {
  return {
    getFileIconConfig,
    getFolderIconConfig,
  }
}

export default useFileIcon
