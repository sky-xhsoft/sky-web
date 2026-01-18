/**
 * 云盘 Composables 统一导出
 *
 * 包含所有业务逻辑的组合式函数
 */

// 导航相关
export { useCloudNavigation, default as CloudNavigation } from './useCloudNavigation'

// 文件夹操作
export { useCloudFolder, default as CloudFolder } from './useCloudFolder'

// 文件操作
export { useCloudFile, default as CloudFile } from './useCloudFile'

// 上传功能
export { useCloudUpload, default as CloudUpload } from './useCloudUpload'

// 文件预览
export {
  useCloudPreview,
  default as CloudPreview,
  type FileCategory,
  type PreviewConfig,
} from './useCloudPreview'

// 分享管理
export { useCloudShare, default as CloudShare } from './useCloudShare'

// 搜索功能
export { useCloudSearch, default as CloudSearch } from './useCloudSearch'

// 排序功能
export { useCloudSort, default as CloudSort, type SortOption } from './useCloudSort'

// 选择和批量操作
export { useCloudSelection, default as CloudSelection } from './useCloudSelection'

// 文件图标
export { useFileIcon, getFileIconConfig, getFolderIconConfig } from './useFileIcon'

// 拖拽上传
export { useDragUpload, default as DragUpload, type DragUploadOptions } from './useDragUpload'

// 综合功能（整合所有composables）
export { useCloud, default as Cloud } from './useCloud'
