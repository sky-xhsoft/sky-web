/**
 * 断点续传工具
 *
 * 支持大文件分片上传、断点恢复、秒传等功能
 */

import SparkMD5 from 'spark-md5'
import {
  initMultipartUpload,
  uploadMultipartChunk,
  getMultipartUploadStatus,
  completeMultipartUpload,
  abortMultipartUpload,
  resumeMultipartUpload,
  getChunkPresignedURL,
  markChunkUploaded,
} from '@/modules/cloud/api'
import type {
  ResumableUploadOptions,
  UploadTask,
  ChunkInfo,
} from '@/modules/cloud/types'
import { RESUMABLE_UPLOAD_CONFIG } from '@/modules/cloud/constants/config'
import { Message } from '@arco-design/web-vue'

/**
 * 计算文件hash（用于秒传检测）
 */
export async function calculateFileHash(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    const chunkSize = 2 * 1024 * 1024 // 2MB per chunk for hash calculation
    let currentChunk = 0
    const chunks = Math.ceil(file.size / chunkSize)

    fileReader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer)
        currentChunk++

        if (onProgress) {
          onProgress(Math.floor((currentChunk / chunks) * 100))
        }

        if (currentChunk < chunks) {
          loadNext()
        } else {
          const hash = spark.end()
          resolve(hash)
        }
      }
    }

    fileReader.onerror = () => {
      reject(new Error('读取文件失败'))
    }

    function loadNext() {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const blob = file.slice(start, end)
      fileReader.readAsArrayBuffer(blob)
    }

    loadNext()
  })
}

/**
 * 将文件分片
 */
export function sliceFile(file: File, chunkSize: number = RESUMABLE_UPLOAD_CONFIG.CHUNK_SIZE): Blob[] {
  const chunks: Blob[] = []
  let start = 0

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    chunks.push(file.slice(start, end))
    start = end
  }

  return chunks
}

/**
 * 断点续传管理器
 */
export class ResumableUploadManager {
  private file: File
  private folderId: number
  private options: ResumableUploadOptions
  private chunks: Blob[] = []
  private chunkMd5Cache: string[] = [] // 缓存每个分片的MD5，避免重复计算
  private uploadedChunks: Set<number> = new Set()
  private sessionId?: number // 改为 sessionId (number)
  private fileHash?: string
  private abortController?: AbortController
  private onProgress?: (progress: UploadTask) => void
  private currentTask?: UploadTask
  private chunkSize?: number // 存储实际使用的分片大小

  constructor(
    file: File,
    folderId: number,
    options: ResumableUploadOptions = {}
  ) {
    this.file = file
    this.folderId = folderId
    this.options = {
      chunkSize: RESUMABLE_UPLOAD_CONFIG.CHUNK_SIZE,
      maxRetries: RESUMABLE_UPLOAD_CONFIG.MAX_RETRIES,
      concurrentCount: RESUMABLE_UPLOAD_CONFIG.CONCURRENT_COUNT,
      useDirectUpload: false,
      ...options,
    }
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: (progress: UploadTask) => void) {
    this.onProgress = callback
  }

  /**
   * 设置初始任务
   */
  setInitialTask(task: UploadTask) {
    // 创建任务对象的副本，避免修改原始任务对象
    this.currentTask = { ...task }
  }

  /**
   * 更新进度
   */
  private updateProgress(updates: Partial<UploadTask>) {
    if (this.currentTask && this.onProgress) {
      // 创建一个新的进度对象，避免直接修改原始任务对象
      const progress = {
        ...this.currentTask,
        ...updates
      }
      this.onProgress(progress)
    }
  }

  /**
   * 开始上传
   */
  async start(): Promise<number> {
    try {
      Message.info(`开始上传：${this.file.name}`)

      // 1. 计算文件hash
      this.updateProgress({ status: 'uploading', progress: 0, uploadedSize: 0 })

      this.fileHash = await calculateFileHash(this.file, (percent) => {
        const progress = Math.floor(percent * 0.1)
        this.updateProgress({ progress, uploadedSize: 0 }) // hash阶段，已上传大小为0
      })

      // 2. 初始化上传（同时检查秒传）
      const session = await initMultipartUpload({
        fileName: this.file.name,
        fileSize: this.file.size,
        fileMd5: this.fileHash,
        fileType: this.file.type,
        chunkSize: this.options.chunkSize,
        folderId: this.folderId,
      })

      this.sessionId = session.sessionId
      this.chunkSize = session.chunkSize

      // 3. 检查是否秒传（所有分片都已上传）
      if (session.uploadedChunks.length === session.totalChunks) {
        // 秒传成功，直接完成
        Message.loading('文件已存在，正在秒传...', 0)
        try {
          const result = await completeMultipartUpload(this.sessionId)
          this.updateProgress({ status: 'completed', progress: 100, uploadedSize: this.file.size })
          Message.clear()
          Message.success(`秒传成功：${this.file.name}`)
          return result.ID
        } catch (e: any) {
          Message.clear()
          throw e
        }
      }

      // 4. 分片文件
      this.chunks = sliceFile(this.file, this.chunkSize)
      this.chunkMd5Cache = new Array(this.chunks.length)

      // 5. 预先计算所有分片的MD5（一次性计算，避免上传过程中重复计算）
      for (let i = 0; i < this.chunks.length; i++) {
        // 更新进度：hash计算占10%，已经完成整体文件hash，现在计算分片hash占额外5%
        const progress = 10 + Math.floor((i / this.chunks.length) * 5)
        this.updateProgress({ progress, uploadedSize: 0 })

        this.chunkMd5Cache[i] = await this.calculateChunkMD5(this.chunks[i])
      }

      // 6. 记录已上传的分片（断点恢复）
      session.uploadedChunks.forEach((index) => this.uploadedChunks.add(index))

      // 7. 上传未完成的分片
      await this.uploadChunks()

      // 等待一小段时间，让所有数据库事务都提交完成
      // 避免因为事务还没提交就开始校验，导致误判缺失分片而重复上传
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 8. 确认所有分片都上传完成（和后端校验，避免前端统计错误）
      let uploadStatus = await getMultipartUploadStatus(this.sessionId)
      const missingChunks: number[] = []

      // 检查是否有缺失的分片
      for (let i = 0; i < this.chunks.length; i++) {
        if (!uploadStatus.uploadedChunks.includes(i)) {
          missingChunks.push(i)
        }
      }

      // 如果有缺失的分片，重新上传
      if (missingChunks.length > 0) {
        Message.info(`检测到${missingChunks.length}个分片上传失败，正在重新上传...`)

        // 重新上传缺失的分片
        await Promise.all(missingChunks.map(chunkIndex =>
          this.uploadChunkWithRetry(chunkIndex, this.chunks[chunkIndex])
        ))

        // 再次校验
        uploadStatus = await getMultipartUploadStatus(this.sessionId)
        for (let i = 0; i < this.chunks.length; i++) {
          if (!uploadStatus.uploadedChunks.includes(i)) {
            throw new Error(`分片${i}上传失败，请重试`)
          }
        }
      }

      // 8. 完成上传（合并分片，带重试）
      Message.loading('所有分片上传完成，正在合并文件，请稍候...', 0)
      let mergeRetries = 0
      const maxMergeRetries = 3 // 最多重试3次
      let result: any

      while (mergeRetries < maxMergeRetries) {
        try {
          // 重试前先查询上传状态，避免重复调用已经在合并的接口
          if (mergeRetries > 0) {
            const uploadStatus = await getMultipartUploadStatus(this.sessionId)
            if (uploadStatus.status === 'completed') {
              // 已经合并完成，直接返回
              // 查询文件信息这里需要后端返回fileId，但是后端接口只返回状态，我们直接尝试调用complete
            }
          }

          result = await completeMultipartUpload(this.sessionId)
          break
        } catch (error: any) {
          mergeRetries++
          if (mergeRetries >= maxMergeRetries) {
            Message.clear()
            this.updateProgress({ status: 'failed', error: error.message })
            throw error
          }
          // 合并失败后等待5秒再重试，给后端足够的处理时间
          console.warn(`合并分片失败，重试第${mergeRetries}次...`, error)
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }

      Message.clear()
      Message.success(`上传成功：${this.file.name}`)
      this.updateProgress({ status: 'completed', progress: 100, uploadedSize: this.file.size })
      return result.ID
    } catch (error: any) {
      this.updateProgress({ status: 'failed', error: error.message })
      throw error
    }
  }

  /**
   * 计算分片MD5
   */
  private async calculateChunkMD5(chunk: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const spark = new SparkMD5.ArrayBuffer()
        spark.append(e.target?.result as ArrayBuffer)
        resolve(spark.end())
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(chunk)
    })
  }

  /**
   * 上传所有分片（并发上传）
   */
  private async uploadChunks(): Promise<void> {
    const totalChunks = this.chunks.length
    const startProgress = 10 // hash完成后的进度
    const uploadProgress = 85 // 上传占85%进度
    const concurrentCount = this.options.concurrentCount || RESUMABLE_UPLOAD_CONFIG.CONCURRENT_COUNT

    // 收集所有需要上传的分片
    const chunksToUpload: number[] = []
    for (let i = 0; i < totalChunks; i++) {
      if (!this.uploadedChunks.has(i)) {
        chunksToUpload.push(i)
      }
    }

    if (chunksToUpload.length === 0) {
      // 所有分片都已上传
      this.updateProgress({
        progress: startProgress + uploadProgress,
        uploadedSize: this.file.size,
      })
      return
    }

    // 并发控制
    const queue: Promise<void>[] = []
    let activeCount = 0
    let index = 0

    // 更新进度的函数
    const updateProgress = () => {
      const uploadedChunkCount = this.uploadedChunks.size
      const progress = startProgress + Math.floor((uploadedChunkCount / totalChunks) * uploadProgress)

      // 计算实际上传的字节数
      let uploadedBytes = 0
      for (let j = 0; j < totalChunks; j++) {
        if (this.uploadedChunks.has(j)) {
          uploadedBytes += this.chunks[j].size
        }
      }

      this.updateProgress({
        progress,
        uploadedSize: Math.min(uploadedBytes, this.file.size),
      })
    }

    return new Promise((resolve, reject) => {
      // 处理下一个分片
      const processNext = async () => {
        if (this.abortController?.signal.aborted) {
          return reject(new Error('上传已取消'))
        }

        if (index >= chunksToUpload.length && activeCount === 0) {
          // 所有分片上传完成
          updateProgress()
          return resolve()
        }

        while (activeCount < concurrentCount && index < chunksToUpload.length) {
          const chunkIndex = chunksToUpload[index]
          index++
          activeCount++

          this.uploadChunkWithRetry(chunkIndex, this.chunks[chunkIndex])
            .then(() => {
              updateProgress()
            })
            .catch((error) => {
              reject(error)
            })
            .finally(() => {
              activeCount--
              processNext()
            })
        }
      }

      processNext()
    })
  }

  /**
   * 上传单个分片（带重试）- 后端中转模式
   */
  private async uploadChunkWithRetry(
    chunkIndex: number,
    chunk: Blob,
    retries: number = 0
  ): Promise<void> {
    if (this.options.useDirectUpload) {
      return this.uploadChunkWithRetryDirect(chunkIndex, chunk, retries)
    }

    try {
      // 每个分片使用独立的AbortController，避免并发上传时互相覆盖
      const abortController = new AbortController()

      // 监听全局取消信号
      const globalAbortListener = () => abortController.abort()
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', globalAbortListener)
      }

      // 从缓存获取分片MD5（已预先计算，不需要重复计算）
      const chunkMd5 = this.chunkMd5Cache[chunkIndex]

      // 上传分片到后端
      console.log(`[后端中转] 上传分片${chunkIndex}，sessionId: ${this.sessionId}, md5: ${chunkMd5}, size: ${chunk.size}`)
      await uploadMultipartChunk(
        this.sessionId!,
        chunkIndex,
        chunkMd5,
        chunk,
        abortController.signal
      )

      // 移除监听
      if (this.abortController) {
        this.abortController.signal.removeEventListener('abort', globalAbortListener)
      }

      this.uploadedChunks.add(chunkIndex)
    } catch (error: any) {
      // 如果是取消操作，直接抛出
      if (error.name === 'AbortError' || this.abortController?.signal.aborted) {
        throw new Error('上传已取消')
      }

      // 重试
      if (retries < this.options.maxRetries!) {
        console.warn(`分片${chunkIndex}上传失败，重试第${retries + 1}次，错误原因：`, error)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1))) // 指数退避
        return await this.uploadChunkWithRetry(chunkIndex, chunk, retries + 1)
      }

      console.error(`分片${chunkIndex}最终上传失败，错误原因：`, error)
      throw new Error(`分片${chunkIndex}上传失败: ${error.message || '网络错误'}`)
    }
  }

  /**
   * 上传单个分片（带重试）- 直传模式（前端直接上传到云存储）
   */
  private async uploadChunkWithRetryDirect(
    chunkIndex: number,
    chunk: Blob,
    retries: number = 0
  ): Promise<void> {
    try {
      if (!this.sessionId) {
        throw new Error('上传会话未初始化')
      }

      // 每个分片使用独立的AbortController
      const abortController = new AbortController()

      // 监听全局取消信号
      const globalAbortListener = () => abortController.abort()
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', globalAbortListener)
      }

      // 从后端获取预签名URL
      console.log(`[直传] 获取分片${chunkIndex}预签名URL`)
      const { presignedUrl } = await getChunkPresignedURL(this.sessionId, chunkIndex)

      // 直接上传分片到预签名URL
      console.log(`[直传] 上传分片${chunkIndex}，size: ${chunk.size}`)

      // 使用 fetch 直接上传
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: chunk,
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })

      if (!response.ok) {
        throw new Error(`上传失败，状态码: ${response.status}`)
      }

      // 获取响应头中的 ETag（云存储返回的分片ETag，用于后续合并）
      const etag = response.headers.get('ETag')
      console.log(`[直传] 分片${chunkIndex}上传完成，ETag: ${etag}`)

      // 移除监听
      if (this.abortController) {
        this.abortController.signal.removeEventListener('abort', globalAbortListener)
      }

      // 通知后端标记分片已上传，并传递ETag
      await markChunkUploaded(this.sessionId!, chunkIndex, etag || undefined)

      this.uploadedChunks.add(chunkIndex)
      console.log(`[直传] 分片${chunkIndex}上传成功`)
    } catch (error: any) {
      // 如果是取消操作，直接抛出
      if (error.name === 'AbortError' || this.abortController?.signal.aborted) {
        throw new Error('上传已取消')
      }

      // 重试
      if (retries < this.options.maxRetries!) {
        console.warn(`[直传] 分片${chunkIndex}上传失败，重试第${retries + 1}次，错误原因：`, error)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1))) // 指数退避
        return await this.uploadChunkWithRetryDirect(chunkIndex, chunk, retries + 1)
      }

      console.error(`[直传] 分片${chunkIndex}最终上传失败，错误原因：`, error)
      throw new Error(`分片${chunkIndex}直传失败: ${error.message || '网络错误'}`)
    }
  }


  /**
   * 暂停上传
   */
  pause() {
    this.abortController?.abort()
  }

  /**
   * 恢复上传
   */
  async resume() {
    if (!this.sessionId) {
      throw new Error('上传任务未初始化')
    }

    // 获取最新的上传状态
    const status = await getMultipartUploadStatus(this.sessionId)

    // 更新已上传的分片列表
    this.uploadedChunks.clear()
    status.uploadedChunks.forEach((index) => this.uploadedChunks.add(index))

    // 重新开始上传未完成的分片
    await this.uploadChunks()

    // 完成上传
    const result = await completeMultipartUpload(this.sessionId)
    this.updateProgress({ status: 'completed', progress: 100, uploadedSize: this.file.size })

    return result.ID
  }

  /**
   * 取消上传
   */
  async cancel() {
    this.abortController?.abort()

    // 调用后端API取消上传任务
    if (this.sessionId) {
      try {
        await abortMultipartUpload(this.sessionId)
      } catch (error) {
        console.error('取消上传失败:', error)
      }
    }
  }

  /**
   * 获取上传进度
   */
  getProgress(): number {
    if (this.chunks.length === 0) return 0
    return Math.floor((this.uploadedChunks.size / this.chunks.length) * 100)
  }
}

/**
 * 便捷的断点续传上传函数
 */
export async function uploadWithResumable(
  file: File,
  folderId: number,
  onProgress?: (progress: UploadTask) => void
): Promise<number> {
  const manager = new ResumableUploadManager(file, folderId, {
    useDirectUpload: true,
  })

  if (onProgress) {
    manager.setProgressCallback(onProgress)
  }

  return await manager.start()
}

/**
 * 通过文件MD5恢复未完成的上传
 */
export async function resumeUploadByMd5(
  fileMd5: string,
  file: File,
  onProgress?: (progress: UploadTask) => void
): Promise<number> {
  // 调用后端恢复接口
  const session = await resumeMultipartUpload(fileMd5)

  // 创建上传管理器
  const manager = new ResumableUploadManager(file, 0, {
    useDirectUpload: true,
  }) // folderId会被忽略，因为会话已存在

  if (onProgress) {
    manager.setProgressCallback(onProgress)
  }

  // 恢复上传
  return await manager.resume()
}
