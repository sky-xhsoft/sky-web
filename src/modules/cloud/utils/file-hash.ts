/**
 * 文件 MD5 计算：一次读取同时得到整个文件与每个分片的 MD5
 *
 * 优先在 Web Worker 中计算，避免大文件（GB 级）计算期间页面卡顿；
 * 不支持 Worker 的环境（如测试环境）回退到主线程分段读取。
 */
import SparkMD5 from 'spark-md5'

export interface FileHashResult {
  /** 整个文件的 MD5（秒传、断点续传按此识别文件） */
  fileMd5: string
  /** 每个分片的 MD5（服务端校验分片完整性） */
  chunkMd5s: string[]
}

/** 每次读取的大小：分片内再按 4MB 分段读取，控制内存占用 */
export const HASH_READ_SIZE = 4 * 1024 * 1024

export interface HashMessage {
  type: 'progress' | 'done' | 'error'
  percent?: number
  result?: FileHashResult
  error?: string
}

/**
 * 按分片计算 MD5 的核心逻辑（Worker 与主线程共用）
 * @param readSlice 读取文件区间 [start, end) 的内容
 */
export async function computeChunkedHash(
  size: number,
  chunkSize: number,
  readSlice: (start: number, end: number) => ArrayBuffer | Promise<ArrayBuffer>,
  onProgress?: (percent: number) => void,
  isCancelled?: () => boolean,
): Promise<FileHashResult> {
  const whole = new SparkMD5.ArrayBuffer()
  const chunkMd5s: string[] = []
  const chunkCount = Math.max(1, Math.ceil(size / chunkSize))
  let lastPercent = -1

  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = new SparkMD5.ArrayBuffer()
    const chunkStart = index * chunkSize
    const chunkEnd = Math.min(chunkStart + chunkSize, size)
    for (let offset = chunkStart; offset < chunkEnd; offset += HASH_READ_SIZE) {
      if (isCancelled?.()) throw new Error('Upload cancelled')
      const buffer = await readSlice(offset, Math.min(offset + HASH_READ_SIZE, chunkEnd))
      whole.append(buffer)
      chunk.append(buffer)
      const percent = size > 0 ? Math.floor((Math.min(offset + HASH_READ_SIZE, chunkEnd) / size) * 100) : 100
      if (percent !== lastPercent) {
        lastPercent = percent
        onProgress?.(percent)
      }
    }
    chunkMd5s.push(chunk.end())
  }
  return { fileMd5: whole.end(), chunkMd5s }
}

/**
 * 计算文件与各分片的 MD5，可通过 signal 取消
 */
export function hashFileChunks(
  file: File,
  chunkSize: number,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<FileHashResult> {
  if (typeof Worker === 'undefined') {
    return computeChunkedHash(
      file.size,
      chunkSize,
      (start, end) => file.slice(start, end).arrayBuffer(),
      onProgress,
      () => !!signal?.aborted,
    )
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./file-hash.worker.ts', import.meta.url), { type: 'module' })
    const finish = () => {
      worker.terminate()
      signal?.removeEventListener('abort', onAbort)
    }
    const onAbort = () => {
      finish()
      reject(new Error('Upload cancelled'))
    }
    signal?.addEventListener('abort', onAbort)

    worker.onmessage = (event: MessageEvent<HashMessage>) => {
      const msg = event.data
      if (msg.type === 'progress') {
        onProgress?.(msg.percent ?? 0)
      } else if (msg.type === 'done' && msg.result) {
        finish()
        resolve(msg.result)
      } else if (msg.type === 'error') {
        finish()
        reject(new Error(msg.error || '计算文件校验值失败'))
      }
    }
    worker.onerror = (event) => {
      finish()
      reject(new Error(event.message || '计算文件校验值失败'))
    }
    worker.postMessage({ file, chunkSize })
  })
}
