/**
 * 云盘文件预览 Composable
 *
 * 封装文件预览逻辑，支持图片、视频、音频、文档等
 */

import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { fetchFileBlob } from '@/modules/cloud/api'
import type { FileItem } from '@/modules/cloud/types'

/**
 * 文件类型分类
 */
export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'text' | 'code' | 'archive' | 'unknown'

/**
 * 预览配置
 */
export interface PreviewConfig {
  file: FileItem
  category: FileCategory
  url?: string
  canPreview: boolean
  needFetch: boolean
}

/**
 * 云盘文件预览功能
 */
export function useCloudPreview() {
  // 当前预览的文件
  const currentPreview = ref<PreviewConfig | null>(null)
  const previewVisible = ref(false)
  const previewLoading = ref(false)

  /**
   * 判断文件类型类别
   * @param file 文件对象
   */
  function getFileCategory(file: FileItem): FileCategory {
    const ext = file.FileExt?.toLowerCase() || ''
    const mimeType = file.FileType?.toLowerCase() || ''

    // 图片
    if (
      ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext) ||
      mimeType.startsWith('image/')
    ) {
      return 'image'
    }

    // 视频
    if (
      ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext) ||
      mimeType.startsWith('video/')
    ) {
      return 'video'
    }

    // 音频
    if (
      ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'].includes(ext) ||
      mimeType.startsWith('audio/')
    ) {
      return 'audio'
    }

    // 文档
    if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext) ||
        mimeType === 'application/pdf' ||
        mimeType.includes('application/msword') ||
        mimeType.includes('application/vnd.openxmlformats-officedocument') ||
        mimeType.includes('application/vnd.ms-excel') ||
        mimeType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
        mimeType.includes('application/vnd.ms-powerpoint') ||
        mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml')) {
      return 'document'
    }

    // 文本
    if (
      ['.txt', '.md', '.log', '.json', '.xml', '.csv', '.yaml', '.yml'].includes(ext) ||
      mimeType.startsWith('text/')
    ) {
      return 'text'
    }

    // 代码
    if (
      ['.js', '.ts', '.jsx', '.tsx', '.vue', '.html', '.css', '.scss', '.less', '.py', '.java', '.go', '.rs'].includes(
        ext
      )
    ) {
      return 'code'
    }

    // 压缩包
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
      return 'archive'
    }

    return 'unknown'
  }

  /**
   * 检查文件是否可以预览
   * @param file 文件对象
   */
  function canPreview(file: FileItem): boolean {
    const category = getFileCategory(file)
    return ['image', 'video', 'audio', 'document', 'text', 'code'].includes(category)
  }

  /**
   * 检查文件是否需要先获取Blob（而不是直接使用下载链接）
   * @param file 文件对象
   */
  function needFetchBlob(file: FileItem): boolean {
    const category = getFileCategory(file)
    // 图片、视频、音频可以直接使用下载链接
    // 文本、代码需要先获取内容
    return ['text', 'code'].includes(category)
  }

  /**
   * 打开文件预览
   * @param file 文件对象
   */
  async function openPreview(file: FileItem) {
    const category = getFileCategory(file)

    if (!canPreview(file)) {
      Message.warning(`暂不支持预览此类型文件（${file.FileExt || '未知格式'}）`)
      return false
    }

    previewLoading.value = true

    try {
      const config: PreviewConfig = {
        file,
        category,
        canPreview: true,
        needFetch: needFetchBlob(file),
      }

      // 如果需要获取文件内容
      if (config.needFetch) {
        const blob = await fetchFileBlob(file.ID)
        config.url = URL.createObjectURL(blob)
      } else {
        // 直接使用下载链接（后端会处理鉴权）
        config.url = `/api/v1/cloud/files/${file.ID}/download`
      }

      currentPreview.value = config
      previewVisible.value = true

      return true
    } catch (e: any) {
      console.error('打开预览失败:', e)
      Message.error(e?.message || '打开预览失败')
      return false
    } finally {
      previewLoading.value = false
    }
  }

  /**
   * 关闭预览
   */
  function closePreview() {
    // 释放ObjectURL
    if (currentPreview.value?.url && currentPreview.value.url.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreview.value.url)
    }

    currentPreview.value = null
    previewVisible.value = false
  }

  /**
   * 预览下一个文件（在文件列表中）
   * @param files 文件列表
   */
  async function previewNext(files: FileItem[]) {
    if (!currentPreview.value) return false

    const currentIndex = files.findIndex((f) => f.ID === currentPreview.value?.file.ID)
    if (currentIndex === -1 || currentIndex === files.length - 1) {
      Message.info('已经是最后一个文件')
      return false
    }

    const nextFile = files[currentIndex + 1]
    closePreview()
    return await openPreview(nextFile)
  }

  /**
   * 预览上一个文件（在文件列表中）
   * @param files 文件列表
   */
  async function previewPrevious(files: FileItem[]) {
    if (!currentPreview.value) return false

    const currentIndex = files.findIndex((f) => f.ID === currentPreview.value?.file.ID)
    if (currentIndex === -1 || currentIndex === 0) {
      Message.info('已经是第一个文件')
      return false
    }

    const prevFile = files[currentIndex - 1]
    closePreview()
    return await openPreview(prevFile)
  }

  /**
   * 获取可预览的文件列表
   * @param files 文件列表
   */
  function getPreviewableFiles(files: FileItem[]): FileItem[] {
    return files.filter(canPreview)
  }

  /**
   * 获取文件图标（Emoji）
   * @param file 文件对象
   */
  function getFileEmoji(file: FileItem): string {
    const category = getFileCategory(file)
    const ext = file.FileExt?.toLowerCase() || ''

    const emojiMap: Record<string, string> = {
      // 图片
      '.jpg': '🖼️',
      '.jpeg': '🖼️',
      '.png': '🖼️',
      '.gif': '🎞️',
      '.svg': '🎨',

      // 视频
      '.mp4': '🎬',
      '.avi': '🎬',
      '.mov': '🎬',

      // 音频
      '.mp3': '🎵',
      '.wav': '🎵',
      '.flac': '🎵',

      // 文档
      '.pdf': '📕',
      '.doc': '📘',
      '.docx': '📘',
      '.xls': '📗',
      '.xlsx': '📗',
      '.ppt': '📙',
      '.pptx': '📙',

      // 代码
      '.js': '📜',
      '.ts': '📜',
      '.vue': '💚',
      '.html': '🌐',
      '.css': '🎨',

      // 压缩包
      '.zip': '🗜️',
      '.rar': '🗜️',
      '.7z': '🗜️',
    }

    return emojiMap[ext] || '📄'
  }

  /**
   * 判断是否为图片
   */
  const isImage = computed(() => currentPreview.value?.category === 'image')

  /**
   * 判断是否为视频
   */
  const isVideo = computed(() => currentPreview.value?.category === 'video')

  /**
   * 判断是否为音频
   */
  const isAudio = computed(() => currentPreview.value?.category === 'audio')

  /**
   * 判断是否为文档
   */
  const isDocument = computed(() => currentPreview.value?.category === 'document')

  /**
   * 判断是否为文本
   */
  const isText = computed(() => currentPreview.value?.category === 'text')

  /**
   * 判断是否为代码
   */
  const isCode = computed(() => currentPreview.value?.category === 'code')

  return {
    // 预览操作
    openPreview,
    closePreview,
    previewNext,
    previewPrevious,

    // 查询操作
    getFileCategory,
    canPreview,
    getPreviewableFiles,
    getFileEmoji,

    // 状态（响应式）
    currentPreview,
    previewVisible,
    previewLoading,

    // 类型判断（computed）
    isImage,
    isVideo,
    isAudio,
    isDocument,
    isText,
    isCode,
  }
}

export default useCloudPreview
