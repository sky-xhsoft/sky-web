/**
 * 云盘上传 Composable
 *
 * 封装文件上传逻辑，包含普通上传和断点续传
 */

import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import { uploadFile } from '@/modules/cloud/api'
import { ResumableUploadManager } from '@/modules/cloud/utils/resumable-upload'
import type { UploadTask, UploadResult } from '@/modules/cloud/types'

/**
 * 生成唯一的上传任务ID
 */
function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 云盘上传功能
 */
export function useCloudUpload() {
  const store = useCloudStore()

  // 上传队列
  const uploadQueue = computed(() => store.uploadQueue)
  const hasUploadingTasks = computed(() => store.hasUploadingTasks)
  const uploadProgress = computed(() => store.uploadProgress)

  // 上传状态
  const isUploading = ref(false)

  /**
   * 添加文件到上传队列
   * @param files 文件列表
   * @param folderId 目标文件夹ID
   */
  function addToQueue(files: File[], folderId: number = store.currentFolderId) {
    const tasks: UploadTask[] = files.map((file) => ({
      id: generateUploadId(),
      file,
      folderId,
      status: 'pending',
      progress: 0,
      uploadedSize: 0,
      totalSize: file.size,
      speed: 0,
      remainingTime: 0,
    }))

    store.uploadQueue.push(...tasks)
    return tasks
  }

  /**
   * 上传单个文件（普通上传）
   * @param file 文件对象
   * @param folderId 目标文件夹ID
   */
  async function uploadSingleFile(file: File, folderId: number = store.currentFolderId) {
    const taskId = generateUploadId()

    const task: UploadTask = {
      id: taskId,
      file,
      folderId,
      status: 'uploading',
      progress: 0,
      uploadedSize: 0,
      totalSize: file.size,
      speed: 0,
      remainingTime: 0,
    }

    store.uploadQueue.push(task)

    try {
      await uploadFile(file, folderId, (percent, loaded, total) => {
        // 更新任务进度
        const taskIndex = store.uploadQueue.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          const updatedTask = {
            ...store.uploadQueue[taskIndex],
            progress: Math.min(percent, 100),
            uploadedSize: Math.min(loaded, file.size),
            totalSize: file.size,
          }
          // 直接替换整个任务对象，确保状态一致性
          store.uploadQueue.splice(taskIndex, 1, updatedTask)
        }
      })

      // 更新任务状态为完成
      const taskIndex = store.uploadQueue.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        const updatedTask = {
          ...store.uploadQueue[taskIndex],
          status: 'completed',
          progress: 100,
          uploadedSize: file.size,
          totalSize: file.size,
        }
        // 直接替换整个任务对象，确保状态一致性
        store.uploadQueue.splice(taskIndex, 1, updatedTask)
      }

      Message.success(`上传成功：${file.name}`)

      // 刷新文件列表和配额
      await Promise.all([store.loadFiles(), store.loadQuota()])

      return true
    } catch (e: any) {
      console.error('上传文件失败:', e)

      // 更新任务状态为失败
      const taskIndex = store.uploadQueue.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        store.uploadQueue[taskIndex].status = 'failed'
        store.uploadQueue[taskIndex].error = e?.message || '上传失败'
      }

      Message.error(e?.message || '上传文件失败')
      return false
    }
  }

  /**
   * 批量上传文件（支持并发上传）
   * @param files 文件列表
   * @param folderId 目标文件夹ID
   * @param concurrency 并发数量，默认为3
   */
  async function batchUpload(
    files: File[],
    folderId: number = store.currentFolderId,
    concurrency: number = 3
  ): Promise<UploadResult[]> {
    if (files.length === 0) {
      Message.warning('请选择要上传的文件')
      return []
    }

    isUploading.value = true

    Message.info(`开始上传 ${files.length} 个文件（并发数：${concurrency}）...`)

    // 创建上传队列
    const queue = [...files]
    const results: UploadResult[] = []

    /**
     * 上传工作线程
     * 从队列中取出文件并上传，直到队列为空
     */
    const uploadWorker = async () => {
      while (queue.length > 0) {
        const file = queue.shift()
        if (file) {
          try {
            const result = await uploadSingleFile(file, folderId)
            results.push({
              success: true,
              file,
              result
            })
          } catch (error) {
            results.push({
              success: false,
              file,
              error
            })
          }
        }
      }
    }

    // 启动并发 worker
    await Promise.all(
      Array(concurrency).fill(null).map(() => uploadWorker())
    )

    // 统计上传结果
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    isUploading.value = false

    // 显示结果消息
    if (failCount > 0) {
      Message.warning(`上传完成：成功 ${successCount}，失败 ${failCount}`)
    } else {
      Message.success(`成功上传 ${successCount} 个文件`)
    }

    return results
  }


  /**
   * 从上传队列中移除任务
   * @param taskId 任务ID
   */
  function removeFromQueue(taskId: string) {
    const index = store.uploadQueue.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      store.uploadQueue.splice(index, 1)
    }
  }

  /**
   * 清空已完成/失败的任务
   */
  function clearCompletedTasks() {
    store.uploadQueue = store.uploadQueue.filter(
      (task) => task.status === 'uploading' || task.status === 'pending'
    )
  }

  /**
   * 清空所有上传任务
   */
  function clearAllTasks() {
    if (hasUploadingTasks.value) {
      Message.warning('有文件正在上传，请等待完成后再清空')
      return false
    }
    store.uploadQueue = []
    return true
  }

  /**
   * 重试失败的上传任务
   * @param taskId 任务ID
   */
  async function retryUpload(taskId: string) {
    const task = store.uploadQueue.find((t) => t.id === taskId)
    if (!task || task.status !== 'failed') {
      return false
    }

    task.status = 'uploading'
    task.progress = 0
    task.uploadedSize = 0
    task.error = undefined

    return await uploadSingleFile(task.file, task.folderId)
  }

  /**
   * 取消上传任务
   * @param taskId 任务ID
   */
  function cancelUpload(taskId: string) {
    const task = store.uploadQueue.find((t) => t.id === taskId)
    if (!task || task.status !== 'uploading') {
      return false
    }

    task.status = 'failed'
    task.error = '用户取消'
    Message.info('已取消上传')
    return true
  }

  /**
   * 获取上传任务
   * @param taskId 任务ID
   */
  function getTask(taskId: string): UploadTask | null {
    return store.uploadQueue.find((t) => t.id === taskId) || null
  }

  /**
   * 获取指定状态的任务列表
   * @param status 任务状态
   */
  function getTasksByStatus(status: UploadTask['status']): UploadTask[] {
    return store.uploadQueue.filter((t) => t.status === status)
  }

  /**
   * 获取上传统计信息
   */
  function getUploadStats() {
    return {
      total: store.uploadQueue.length,
      uploading: getTasksByStatus('uploading').length,
      completed: getTasksByStatus('completed').length,
      failed: getTasksByStatus('failed').length,
      pending: getTasksByStatus('pending').length,
    }
  }

  /**
   * 断点续传上传（大文件）
   * @param file 文件对象
   * @param folderId 目标文件夹ID
   * @param useResumable 是否强制使用断点续传（默认根据文件大小自动判断）
   */
  async function uploadWithResumable(
    file: File,
    folderId: number = store.currentFolderId,
    useResumable?: boolean
  ) {
    // 判断是否使用断点续传（大于500MB的文件默认使用）
    const shouldUseResumable = useResumable ?? file.size > 500 * 1024 * 1024

    if (!shouldUseResumable) {
      // 小文件使用普通上传
      return await uploadSingleFile(file, folderId)
    }

    const taskId = generateUploadId()

    const task: UploadTask = {
      id: taskId,
      file,
      folderId,
      status: 'uploading',
      progress: 0,
      uploadedSize: 0,
      totalSize: file.size,
      speed: 0,
      remainingTime: 0,
      resumable: true, // 标记为断点续传任务
    }

    store.uploadQueue.push(task)

    try {
      const manager = new ResumableUploadManager(file, folderId)

      // 设置进度回调，传入初始任务
    manager.setProgressCallback((progress) => {
      const taskIndex = store.uploadQueue.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        // 确保更新所有字段，避免 NaN
        const currentTask = store.uploadQueue[taskIndex]
        const updatedTask = {
          ...currentTask,
          ...progress,
          // 确保这些字段始终有值且单位一致
          uploadedSize: Math.min(Number(progress.uploadedSize) || 0, file.size),
          totalSize: file.size,
          progress: Math.min(Number(progress.progress) || 0, 100),
        }
        // 直接替换整个任务对象，确保状态一致性
        store.uploadQueue.splice(taskIndex, 1, updatedTask)
      }
    })

      // 设置初始任务，让 manager 知道任务结构
      manager.setInitialTask(task)

      // 开始上传
      await manager.start()

      // 更新任务状态为完成
      const taskIndex = store.uploadQueue.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        const updatedTask = {
          ...store.uploadQueue[taskIndex],
          status: 'completed',
          progress: 100,
          uploadedSize: file.size,
          totalSize: file.size,
        }
        // 直接替换整个任务对象，确保状态一致性
        store.uploadQueue.splice(taskIndex, 1, updatedTask)
      }

      Message.success(`上传成功：${file.name}`)

      // 刷新文件列表和配额
      await Promise.all([store.loadFiles(), store.loadQuota()])

      return true
    } catch (e: any) {
      console.error('断点续传失败:', e)

      // 更新任务状态为失败
      const taskIndex = store.uploadQueue.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        store.uploadQueue[taskIndex].status = 'failed'
        store.uploadQueue[taskIndex].error = e?.message || '上传失败'
      }

      Message.error(e?.message || '上传文件失败')
      return false
    }
  }

  /**
   * 暂停断点续传任务
   * @param taskId 任务ID
   */
  function pauseResumableUpload(taskId: string) {
    const task = store.uploadQueue.find((t) => t.id === taskId)
    if (!task || !task.resumable) {
      return false
    }

    // 这里需要保存manager实例的引用，暂时标记为暂停
    task.status = 'pending'
    Message.info('已暂停上传')
    return true
  }

  /**
   * 恢复断点续传任务
   * @param taskId 任务ID
   */
  async function resumeResumableUpload(taskId: string) {
    const task = store.uploadQueue.find((t) => t.id === taskId)
    if (!task || !task.resumable || task.status !== 'pending') {
      return false
    }

    // 重新开始上传
    return await uploadWithResumable(task.file, task.folderId, true)
  }

  return {
    // 上传操作
    uploadSingleFile,
    batchUpload,
    addToQueue,
    uploadWithResumable, // 断点续传

    // 队列管理
    removeFromQueue,
    clearCompletedTasks,
    clearAllTasks,

    // 任务控制
    retryUpload,
    cancelUpload,
    pauseResumableUpload, // 暂停断点续传
    resumeResumableUpload, // 恢复断点续传

    // 查询操作
    getTask,
    getTasksByStatus,
    getUploadStats,

    // 状态（响应式）
    uploadQueue,
    hasUploadingTasks,
    uploadProgress,
    isUploading,
  }
}

export default useCloudUpload
