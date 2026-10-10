/**
 * 云盘上传 Composable
 *
 * 封装文件上传逻辑，包含普通上传和断点续传
 */

import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import { uploadFile } from '@/modules/cloud/api'
import { ResumableUploadManager, isCancelledError } from '@/modules/cloud/utils/resumable-upload'
import type { UploadTask, UploadResult, UploadStatus } from '@/modules/cloud/types'

/**
 * 生成唯一的上传任务ID
 */
function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/** 分片上传任务的管理器（模块级共享：各组件调用 useCloudUpload 时都能暂停 / 继续同一任务） */
const resumableManagers = new Map<string, ResumableUploadManager>()

/**
 * 大于该大小的文件使用分片上传：云存储（COS）由浏览器直传存储桶，不经过应用服务器；
 * 不超过该大小的文件经服务器上传（与后端 MaxRelayUploadSize 一致）
 */
export const RESUMABLE_THRESHOLD = 50 * 1024 * 1024

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
      await uploadFile(file, folderId, (percent, loaded) => {
        // 更新任务进度
        const taskIndex = store.uploadQueue.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          const updatedTask: UploadTask = {
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
        const updatedTask: UploadTask = {
          ...store.uploadQueue[taskIndex],
          status: 'completed' as UploadStatus,
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
    const manager = resumableManagers.get(taskId)
    if (manager) {
      const task = store.uploadQueue.find((t) => t.id === taskId)
      if (task && task.status !== 'completed') void manager.cancel()
      resumableManagers.delete(taskId)
    }
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
      (task) => task.status === 'uploading' || task.status === 'pending' || task.status === 'paused'
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

    if (task.resumable && resumableManagers.has(taskId)) {
      return await runResumable(taskId)
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

    void resumableManagers.get(taskId)?.cancel()
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

  function updateTask(taskId: string, patch: Partial<UploadTask>) {
    const index = store.uploadQueue.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      store.uploadQueue.splice(index, 1, { ...store.uploadQueue[index], ...patch })
    }
  }

  /**
   * 执行（或继续）分片上传任务
   */
  async function runResumable(taskId: string): Promise<boolean> {
    const manager = resumableManagers.get(taskId)
    const task = store.uploadQueue.find((t) => t.id === taskId)
    if (!manager || !task) return false

    updateTask(taskId, { status: 'uploading', error: undefined })
    try {
      await manager.start()
      updateTask(taskId, { status: 'completed', progress: 100, uploadedSize: task.file.size, speed: 0, remainingTime: 0 })
      resumableManagers.delete(taskId)
      Message.success(`上传成功：${task.file.name}`)
      await Promise.all([store.loadFiles(), store.loadQuota()])
      return true
    } catch (e: any) {
      const current = store.uploadQueue.find((t) => t.id === taskId)
      // 用户暂停或移除：不算失败
      if (!current || current.status === 'paused' || isCancelledError(e)) {
        return false
      }
      console.error('分片上传失败:', e)
      const message = e?.response?.data?.message || e?.message || '上传失败'
      updateTask(taskId, { status: 'failed', error: message, speed: 0, remainingTime: 0 })
      Message.error(`${task.file.name}：${message}`)
      return false
    }
  }

  /**
   * 大文件分片上传（断点续传）
   * @param file 文件对象
   * @param folderId 目标文件夹ID
   * @param useResumable 是否强制使用分片上传（默认大于 50MB 的文件使用）
   */
  async function uploadWithResumable(
    file: File,
    folderId: number = store.currentFolderId,
    useResumable?: boolean
  ) {
    if (!(useResumable ?? file.size > RESUMABLE_THRESHOLD)) {
      return await uploadSingleFile(file, folderId)
    }

    const taskId = generateUploadId()
    store.uploadQueue.push({
      id: taskId,
      file,
      folderId,
      status: 'uploading',
      progress: 0,
      uploadedSize: 0,
      totalSize: file.size,
      speed: 0,
      remainingTime: 0,
      resumable: true,
      phase: 'hashing',
      hashProgress: 0,
    })

    const manager = new ResumableUploadManager(file, folderId)
    manager.setProgressCallback((progress) => {
      const current = store.uploadQueue.find((t) => t.id === taskId)
      if (!current || current.status === 'paused') return
      const { status, ...rest } = progress
      updateTask(taskId, {
        ...rest,
        ...(status ? { status } : {}),
        uploadedSize: Math.min(Number(progress.uploadedSize ?? current.uploadedSize) || 0, file.size),
        progress: Math.min(Number(progress.progress ?? current.progress) || 0, 100),
        totalSize: file.size,
      })
    })
    resumableManagers.set(taskId, manager)

    return await runResumable(taskId)
  }

  /**
   * 暂停分片上传：中止进行中的请求，已上传的分片保留在服务端
   */
  function pauseResumableUpload(taskId: string) {
    const task = store.uploadQueue.find((t) => t.id === taskId)
    const manager = resumableManagers.get(taskId)
    if (!task || !manager || task.status !== 'uploading') {
      return false
    }
    updateTask(taskId, { status: 'paused', speed: 0, remainingTime: 0 })
    manager.abort()
    return true
  }

  /**
   * 继续分片上传：复用已计算的校验值，跳过已上传的分片
   */
  async function resumeResumableUpload(taskId: string) {
    const task = store.uploadQueue.find((t) => t.id === taskId)
    if (!task || !resumableManagers.has(taskId) || task.status !== 'paused') {
      return false
    }
    return await runResumable(taskId)
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
