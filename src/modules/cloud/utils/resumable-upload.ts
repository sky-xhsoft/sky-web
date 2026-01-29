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
} from '@/modules/cloud/api'
import type {
  ResumableUploadOptions,
  UploadTask,
  ChunkInfo,
} from '@/modules/cloud/types'
import { RESUMABLE_UPLOAD_CONFIG } from '@/modules/cloud/constants/config'

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
        const result = await completeMultipartUpload(this.sessionId)
        this.updateProgress({ status: 'completed', progress: 100, uploadedSize: this.file.size })
        return result.ID
      }

      // 4. 分片文件
      this.chunks = sliceFile(this.file, this.chunkSize)

      // 5. 记录已上传的分片（断点恢复）
      session.uploadedChunks.forEach((index) => this.uploadedChunks.add(index))

      // 6. 上传未完成的分片
      await this.uploadChunks()

      // 7. 完成上传（合并分片）
      const result = await completeMultipartUpload(this.sessionId)

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
   * 上传所有分片
   */
  private async uploadChunks(): Promise<void> {
    const totalChunks = this.chunks.length
    const startProgress = 10 // hash完成后的进度
    const uploadProgress = 85 // 上传占85%进度
    const actualChunkSize = this.chunkSize || this.options.chunkSize! // 使用实际的分片大小

    for (let i = 0; i < totalChunks; i++) {
      // 跳过已上传的分片
      if (this.uploadedChunks.has(i)) {
        continue
      }

      // 检查是否被取消
      if (this.abortController?.signal.aborted) {
        throw new Error('上传已取消')
      }

      // 上传分片（带重试）- 会自动添加到 uploadedChunks
      await this.uploadChunkWithRetry(i, this.chunks[i])

      // 计算已上传的分片数量（包括之前已上传的）
      const uploadedChunkCount = this.uploadedChunks.size
      const progress = startProgress + Math.floor((uploadedChunkCount) / totalChunks * uploadProgress)

      // 计算实际上传的字节数 - 基于所有已上传的分片（包括之前已上传的）
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
  }

  /**
   * 上传单个分片（带重试）
   */
  private async uploadChunkWithRetry(
    chunkIndex: number,
    chunk: Blob,
    retries: number = 0
  ): Promise<void> {
    try {
      this.abortController = new AbortController()

      // 计算分片MD5
      const chunkMd5 = await this.calculateChunkMD5(chunk)

      // 上传分片
      await uploadMultipartChunk(
        this.sessionId!,
        chunkIndex,
        chunkMd5,
        chunk,
        this.abortController.signal
      )

      this.uploadedChunks.add(chunkIndex)
    } catch (error: any) {
      // 如果是取消操作，直接抛出
      if (error.name === 'AbortError' || this.abortController?.signal.aborted) {
        throw new Error('上传已取消')
      }

      // 重试
      if (retries < this.options.maxRetries!) {
        console.warn(`分片${chunkIndex}上传失败，重试第${retries + 1}次...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1))) // 指数退避
        return await this.uploadChunkWithRetry(chunkIndex, chunk, retries + 1)
      }

      throw new Error(`分片${chunkIndex}上传失败: ${error.message}`)
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
  const manager = new ResumableUploadManager(file, folderId)

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
  const manager = new ResumableUploadManager(file, 0) // folderId会被忽略，因为会话已存在

  if (onProgress) {
    manager.setProgressCallback(onProgress)
  }

  // 恢复上传
  return await manager.resume()
}
