/**
 * 云盘综合功能 Composable
 *
 * 整合所有云盘相关的composable，提供统一的访问入口
 */

import { useCloudNavigation } from './useCloudNavigation'
import { useCloudFolder } from './useCloudFolder'
import { useCloudFile } from './useCloudFile'
import { useCloudUpload } from './useCloudUpload'
import { useCloudPreview } from './useCloudPreview'
import { useCloudShare } from './useCloudShare'
import { useCloudSearch } from './useCloudSearch'
import { useCloudSort } from './useCloudSort'
import { useCloudSelection } from './useCloudSelection'

/**
 * 使用所有云盘功能（便捷方法）
 *
 * @example
 * ```ts
 * const cloud = useCloud()
 * await cloud.navigation.navigateTo(folderId)
 * await cloud.file.download(file)
 * cloud.search.searchQuery.value = 'test'
 * ```
 */
export function useCloud() {
  return {
    navigation: useCloudNavigation(),
    folder: useCloudFolder(),
    file: useCloudFile(),
    upload: useCloudUpload(),
    preview: useCloudPreview(),
    share: useCloudShare(),
    search: useCloudSearch(),
    sort: useCloudSort(),
    selection: useCloudSelection(),
  }
}

export default useCloud
