/**
 * Resumable upload utilities.
 */
import SparkMD5 from 'spark-md5'
import { completeMultipartUpload, initMultipartUpload, uploadMultipartChunk } from '@/modules/cloud/api'
import type { ResumableUploadOptions, UploadProgress, UploadTask } from '@/modules/cloud/types'
import { RESUMABLE_UPLOAD_CONFIG } from '@/modules/cloud/constants/config'

export async function calculateFileHash(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()
    const chunkSize = 2 * 1024 * 1024
    const chunks = Math.max(1, Math.ceil(file.size / chunkSize))
    let currentChunk = 0

    reader.onload = (event) => {
      const buffer = event.target?.result
      if (!buffer) {
        reject(new Error('Failed to read file chunk'))
        return
      }

      spark.append(buffer as ArrayBuffer)
      currentChunk += 1
      onProgress?.(Math.floor((currentChunk / chunks) * 100))

      if (currentChunk < chunks) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))

    function loadNext() {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      reader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}

export function sliceFile(file: File, chunkSize: number = RESUMABLE_UPLOAD_CONFIG.CHUNK_SIZE): Blob[] {
  const chunks: Blob[] = []
  for (let start = 0; start < file.size; start += chunkSize) {
    chunks.push(file.slice(start, Math.min(start + chunkSize, file.size)))
  }
  return chunks
}

export class ResumableUploadManager {
  private readonly file: File
  private readonly folderId: number
  private readonly options: ResumableUploadOptions
  private progressCallback?: (progress: Partial<UploadProgress> & { progress?: number; uploadedSize?: number; totalSize?: number; status?: UploadTask['status']; error?: string }) => void
  private initialTask?: UploadTask
  private aborted = false

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

  setProgressCallback(callback: (progress: Partial<UploadProgress> & { progress?: number; uploadedSize?: number; totalSize?: number; status?: UploadTask['status']; error?: string }) => void) {
    this.progressCallback = callback
  }

  setInitialTask(task: UploadTask) {
    this.initialTask = task
  }

  async start(): Promise<number | string> {
    this.aborted = false
    const fileHash = await calculateFileHash(this.file, (percent) => {
      this.emitProgress({ progress: Math.min(percent, 10), uploadedSize: 0, totalSize: this.file.size })
    })

    const chunkSize = this.options.chunkSize || RESUMABLE_UPLOAD_CONFIG.CHUNK_SIZE
    const chunks = sliceFile(this.file, chunkSize)
    const session = await initMultipartUpload({
      fileName: this.file.name,
      fileSize: this.file.size,
      fileMd5: fileHash,
      fileType: this.file.type,
      chunkSize,
      folderId: this.folderId,
    })

    const uploaded = new Set<number>(session.uploadedChunks || [])
    for (let index = 0; index < chunks.length; index += 1) {
      if (this.aborted) throw new Error('Upload cancelled')
      if (!uploaded.has(index)) {
        const chunk = chunks[index]
        if (!chunk) continue
        const chunkHash = await this.calculateChunkHash(chunk)
        await uploadMultipartChunk(session.sessionId, index, chunkHash, chunk, this.options.signal)
      }
      const uploadedSize = Math.min((index + 1) * chunkSize, this.file.size)
      this.emitProgress({
        progress: Math.floor((uploadedSize / this.file.size) * 90) + 10,
        uploadedSize,
        totalSize: this.file.size,
      })
    }

    const result = await completeMultipartUpload(session.sessionId)
    this.emitProgress({ status: 'completed', progress: 100, uploadedSize: this.file.size, totalSize: this.file.size })
    return result.ID
  }

  abort() {
    this.aborted = true
  }

  private emitProgress(progress: Partial<UploadProgress> & { progress?: number; uploadedSize?: number; totalSize?: number; status?: UploadTask['status']; error?: string }) {
    this.progressCallback?.(progress)
    this.options.onProgress?.({
      percent: progress.progress ?? 0,
      loaded: progress.uploadedSize ?? 0,
      total: progress.totalSize ?? this.file.size,
      speed: progress.speed ?? 0,
      remainingTime: progress.remainingTime ?? 0,
    })
  }

  private async calculateChunkHash(chunk: Blob): Promise<string> {
    const buffer = await chunk.arrayBuffer()
    return SparkMD5.ArrayBuffer.hash(buffer)
  }
}

export async function uploadWithResumable(
  file: File,
  folderId: number,
  options: ResumableUploadOptions = {}
): Promise<number | string> {
  const manager = new ResumableUploadManager(file, folderId, options)
  return manager.start()
}

export async function resumeUploadByMd5(
  file: File,
  _fileMd5: string,
  options: ResumableUploadOptions = {}
): Promise<number | string> {
  const manager = new ResumableUploadManager(file, 0, options)
  return manager.start()
}
