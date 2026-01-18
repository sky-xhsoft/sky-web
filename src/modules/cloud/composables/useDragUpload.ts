/**
 * 云盘拖拽上传 Composable
 *
 * 处理文件的拖拽上传功能
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'

/**
 * 拖拽上传配置
 */
export interface DragUploadOptions {
  /**
   * 允许的文件类型（MIME类型）
   * 例如：['image/*', 'application/pdf']
   */
  allowedTypes?: string[]

  /**
   * 最大文件大小（字节）
   */
  maxFileSize?: number

  /**
   * 最多上传文件数量
   */
  maxFiles?: number

  /**
   * 是否允许多文件上传
   */
  multiple?: boolean

  /**
   * 上传回调函数
   * 返回 Promise<void> 以便支持异步上传
   */
  onUpload?: (files: File[]) => Promise<void>

  /**
   * 是否在拖拽进入时显示提示
   */
  showDragHint?: boolean
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<DragUploadOptions> = {
  allowedTypes: [],
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxFiles: 100,
  multiple: true,
  onUpload: async () => {},
  showDragHint: true,
}

/**
 * 检查文件类型是否符合要求
 */
function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true

  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      // 例如：image/*
      const category = type.slice(0, -2)
      return file.type.startsWith(category)
    }
    return file.type === type
  })
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 拖拽上传 Composable
 *
 * @param targetRef 拖拽目标元素的引用
 * @param options 配置选项
 * @returns 拖拽状态和控制方法
 */
export function useDragUpload(
  targetRef: Ref<HTMLElement | undefined>,
  options: DragUploadOptions = {}
) {
  const store = useCloudStore()

  // 合并配置
  const config = { ...DEFAULT_OPTIONS, ...options }

  // 拖拽状态
  const isDragging = ref(false)
  const dragCounter = ref(0) // 用于处理嵌套元素的拖拽

  /**
   * 验证文件
   */
  function validateFiles(files: File[]): { valid: File[]; invalid: File[] } {
    const valid: File[] = []
    const invalid: File[] = []

    for (const file of files) {
      // 检查文件类型
      if (config.allowedTypes.length > 0 && !isFileTypeAllowed(file, config.allowedTypes)) {
        invalid.push(file)
        Message.warning(`文件 "${file.name}" 类型不支持`)
        continue
      }

      // 检查文件大小
      if (file.size > config.maxFileSize) {
        invalid.push(file)
        Message.warning(
          `文件 "${file.name}" 超过大小限制 (${formatFileSize(file.size)} > ${formatFileSize(config.maxFileSize)})`
        )
        continue
      }

      valid.push(file)
    }

    // 检查文件数量
    if (valid.length > config.maxFiles) {
      Message.warning(`最多只能上传 ${config.maxFiles} 个文件`)
      return {
        valid: valid.slice(0, config.maxFiles),
        invalid: [...invalid, ...valid.slice(config.maxFiles)],
      }
    }

    return { valid, invalid }
  }

  /**
   * 处理拖拽进入
   */
  function handleDragEnter(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()

    dragCounter.value++
    if (dragCounter.value === 1) {
      isDragging.value = true
    }
  }

  /**
   * 处理拖拽离开
   */
  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()

    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  /**
   * 处理拖拽经过
   */
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()

    // 设置拖拽效果
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  /**
   * 处理文件放置
   */
  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()

    // 重置拖拽状态
    isDragging.value = false
    dragCounter.value = 0

    // 获取拖拽的文件
    const dataTransfer = e.dataTransfer
    if (!dataTransfer) return

    const items = Array.from(dataTransfer.items || [])
    const files: File[] = []

    // 处理 DataTransferItem
    if (items.length > 0 && items[0].webkitGetAsEntry) {
      // 使用 webkitGetAsEntry API 处理文件和文件夹
      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry()
          if (entry) {
            if (entry.isFile) {
              const file = item.getAsFile()
              if (file) files.push(file)
            } else if (entry.isDirectory) {
              // 暂不支持文件夹，提示用户
              Message.warning('暂不支持拖拽文件夹，请选择文件')
            }
          }
        }
      }
    } else {
      // 降级使用 files API
      files.push(...Array.from(dataTransfer.files || []))
    }

    if (files.length === 0) {
      Message.warning('没有检测到有效的文件')
      return
    }

    // 验证文件
    const { valid, invalid } = validateFiles(files)

    if (valid.length === 0) {
      Message.error('没有符合要求的文件')
      return
    }

    try {
      // 调用上传回调
      await config.onUpload(valid)
    } catch (error) {
      console.error('上传文件时出错:', error)
      Message.error('上传文件失败')
    }
  }

  /**
   * 挂载事件监听器
   */
  function mountListeners() {
    const el = targetRef.value
    if (!el) return

    el.addEventListener('dragenter', handleDragEnter as EventListener)
    el.addEventListener('dragleave', handleDragLeave as EventListener)
    el.addEventListener('dragover', handleDragOver as EventListener)
    el.addEventListener('drop', handleDrop as EventListener)
  }

  /**
   * 卸载事件监听器
   */
  function unmountListeners() {
    const el = targetRef.value
    if (!el) return

    el.removeEventListener('dragenter', handleDragEnter as EventListener)
    el.removeEventListener('dragleave', handleDragLeave as EventListener)
    el.removeEventListener('dragover', handleDragOver as EventListener)
    el.removeEventListener('drop', handleDrop as EventListener)
  }

  // 生命周期钩子
  onMounted(() => {
    mountListeners()
  })

  onUnmounted(() => {
    unmountListeners()
  })

  /**
   * 手动启用/禁用拖拽上传
   */
  function enable() {
    mountListeners()
  }

  function disable() {
    unmountListeners()
    isDragging.value = false
    dragCounter.value = 0
  }

  return {
    // 状态
    isDragging,

    // 方法
    enable,
    disable,
  }
}

export default useDragUpload
