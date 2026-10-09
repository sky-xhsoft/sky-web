/**
 * 大文件分片上传（断点续传）
 *
 * 流程：后台线程计算文件与分片 MD5 → 初始化会话（命中秒传 / 续传时返回已上传分片）
 *      → 并发上传剩余分片（失败自动重试）→ 完成合并
 * 暂停后再次 start() 复用已计算的 MD5，并按服务端记录跳过已上传的分片。
 */
import {
  abortMultipartUpload,
  completeMultipartUpload,
  initMultipartUpload,
  uploadMultipartChunk,
} from '@/modules/cloud/api'
import type { ResumableUploadOptions, UploadProgress, UploadTask } from '@/modules/cloud/types'
import { RESUMABLE_UPLOAD_CONFIG } from '@/modules/cloud/constants/config'
import { hashFileChunks, type FileHashResult } from './file-hash'

export type UploadPhase = 'hashing' | 'uploading' | 'merging'

export type ResumableProgress = Partial<UploadProgress> & {
  progress?: number
  uploadedSize?: number
  totalSize?: number
  status?: UploadTask['status']
  phase?: UploadPhase
  hashProgress?: number
  error?: string
}

/** 进度回调节流间隔（毫秒） */
const PROGRESS_INTERVAL = 300
/** 计算速度的时间窗口（毫秒） */
const SPEED_WINDOW = 5000

const CANCELLED = 'Upload cancelled'

export function isCancelledError(error: unknown): boolean {
  const e = error as { message?: string; name?: string; code?: string } | undefined
  return e?.message === CANCELLED || e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED'
}

/** 这些错误重试也不会成功：会话不存在、无权限、登录失效 */
function isRetryable(error: unknown): boolean {
  if (isCancelledError(error)) return false
  const status = (error as { response?: { status?: number } })?.response?.status
  return !(status === 401 || status === 403 || status === 404)
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error(CANCELLED))
    }, { once: true })
  })

export class ResumableUploadManager {
  private readonly file: File
  private readonly folderId: number
  private readonly options: Required<Pick<ResumableUploadOptions, 'chunkSize' | 'maxRetries' | 'concurrentCount'>> & ResumableUploadOptions
  private progressCallback?: (progress: ResumableProgress) => void
  private hashes?: FileHashResult
  private controller?: AbortController
  private sessionId?: number

  // 进度与速度统计
  private completedBytes = 0
  private inflight = new Map<number, number>()
  private samples: { time: number; bytes: number }[] = []
  private lastEmit = 0

  constructor(file: File, folderId: number, options: ResumableUploadOptions = {}) {
    this.file = file
    this.folderId = folderId
    this.options = {
      chunkSize: RESUMABLE_UPLOAD_CONFIG.CHUNK_SIZE,
      maxRetries: RESUMABLE_UPLOAD_CONFIG.MAX_RETRIES,
      concurrentCount: RESUMABLE_UPLOAD_CONFIG.CONCURRENT_COUNT,
      ...options,
    }
  }

  setProgressCallback(callback: (progress: ResumableProgress) => void) {
    this.progressCallback = callback
  }

  /** 兼容旧调用，任务结构由调用方维护 */
  setInitialTask(_task: UploadTask) {}

  /** 开始或继续上传，返回文件 ID */
  async start(): Promise<number | string> {
    const controller = new AbortController()
    this.controller = controller
    const { signal } = controller
    const { chunkSize } = this.options
    const total = this.file.size

    // 1. 计算 MD5（暂停后继续时复用）
    if (!this.hashes) {
      this.emit({ phase: 'hashing', hashProgress: 0, progress: 0, uploadedSize: 0 }, true)
      this.hashes = await hashFileChunks(
        this.file,
        chunkSize,
        (percent) => this.emit({ phase: 'hashing', hashProgress: percent }),
        signal,
      )
    }
    const { fileMd5, chunkMd5s } = this.hashes

    // 2. 初始化会话：命中秒传或断点续传时返回已上传的分片
    const session = await initMultipartUpload({
      fileName: this.file.name,
      fileSize: total,
      fileMd5,
      fileType: this.file.type,
      chunkSize,
      folderId: this.folderId,
    })
    this.sessionId = session.sessionId
    if (signal.aborted) throw new Error(CANCELLED)

    const uploaded = new Set<number>(session.uploadedChunks || [])
    const chunkCount = chunkMd5s.length
    const chunkBytes = (index: number) => Math.min(chunkSize, total - index * chunkSize)
    const pending: number[] = []
    this.completedBytes = 0
    for (let index = 0; index < chunkCount; index += 1) {
      if (uploaded.has(index)) this.completedBytes += chunkBytes(index)
      else pending.push(index)
    }
    this.inflight.clear()
    this.samples = [{ time: Date.now(), bytes: this.completedBytes }]
    this.emit({ phase: 'uploading', hashProgress: 100 }, true)

    // 3. 并发上传剩余分片
    const uploadOne = async (index: number) => {
      const start = index * chunkSize
      const blob = this.file.slice(start, start + chunkBytes(index))
      for (let attempt = 0; ; attempt += 1) {
        try {
          await uploadMultipartChunk(session.sessionId, index, chunkMd5s[index], blob, signal, (loaded) => {
            this.inflight.set(index, loaded)
            this.emit({ phase: 'uploading' })
          })
          this.inflight.delete(index)
          this.completedBytes += chunkBytes(index)
          this.emit({ phase: 'uploading' })
          return
        } catch (error) {
          this.inflight.delete(index)
          if (signal.aborted) throw new Error(CANCELLED)
          if (attempt >= this.options.maxRetries || !isRetryable(error)) throw error
          await sleep(RESUMABLE_UPLOAD_CONFIG.RETRY_DELAY * 2 ** attempt, signal)
        }
      }
    }

    let cursor = 0
    const workers = Array.from({ length: Math.min(this.options.concurrentCount, pending.length) }, async () => {
      while (cursor < pending.length) {
        if (signal.aborted) throw new Error(CANCELLED)
        const index = pending[cursor]
        cursor += 1
        await uploadOne(index)
      }
    })
    try {
      await Promise.all(workers)
    } catch (error) {
      controller.abort() // 任一分片最终失败时停止其余分片
      throw error
    }

    // 4. 完成：COS 由存储端合并，本地存储由服务端合并
    this.emit({ phase: 'merging', speed: 0, remainingTime: 0 }, true)
    const result = await completeMultipartUpload(session.sessionId)
    this.emit({ status: 'completed', phase: 'merging', progress: 100, uploadedSize: total, totalSize: total, speed: 0, remainingTime: 0 }, true)
    return result.ID
  }

  /** 暂停：中止进行中的请求与 MD5 计算，可再次 start() 继续 */
  abort() {
    this.controller?.abort()
  }

  /** 取消：中止并通知服务端删除会话与已上传的分片 */
  async cancel() {
    this.abort()
    if (this.sessionId) {
      await abortMultipartUpload(this.sessionId).catch(() => undefined)
    }
  }

  private emit(extra: ResumableProgress, force = false) {
    const now = Date.now()
    if (!force && extra.phase === 'uploading' && now - this.lastEmit < PROGRESS_INTERVAL) return
    this.lastEmit = now

    const total = this.file.size
    let progress: ResumableProgress = { totalSize: total, ...extra }
    if (extra.phase === 'uploading') {
      let inflightBytes = 0
      this.inflight.forEach((bytes) => { inflightBytes += bytes })
      const uploadedSize = Math.min(this.completedBytes + inflightBytes, total)
      this.samples.push({ time: now, bytes: uploadedSize })
      while (this.samples.length > 2 && now - this.samples[0].time > SPEED_WINDOW) this.samples.shift()
      const first = this.samples[0]
      const elapsed = (now - first.time) / 1000
      const speed = elapsed > 0.5 ? Math.max(0, (uploadedSize - first.bytes) / elapsed) : 0
      progress = {
        ...progress,
        uploadedSize,
        progress: total > 0 ? Math.floor((uploadedSize / total) * 100) : 100,
        speed,
        remainingTime: speed > 0 ? Math.ceil((total - uploadedSize) / speed) : 0,
      }
    }

    this.progressCallback?.(progress)
    this.options.onProgress?.({
      percent: progress.progress ?? 0,
      loaded: progress.uploadedSize ?? 0,
      total,
      speed: progress.speed ?? 0,
      remainingTime: progress.remainingTime ?? 0,
    })
  }
}
