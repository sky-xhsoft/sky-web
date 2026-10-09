/**
 * 文件 MD5 计算 Worker：在后台线程同步读取文件，计算整个文件与各分片的 MD5
 */
import { computeChunkedHash, type HashMessage } from './file-hash'

// 应用的 tsconfig 只包含 DOM 类型，这里补充 Worker 中可用的同步读取 API
declare const FileReaderSync: { new (): { readAsArrayBuffer(blob: Blob): ArrayBuffer } }

const ctx = self as unknown as {
  postMessage: (msg: HashMessage) => void
  onmessage: ((event: MessageEvent<{ file: File; chunkSize: number }>) => void) | null
}

ctx.onmessage = async (event) => {
  const { file, chunkSize } = event.data
  try {
    const reader = new FileReaderSync()
    const result = await computeChunkedHash(
      file.size,
      chunkSize,
      (start, end) => reader.readAsArrayBuffer(file.slice(start, end)),
      (percent) => ctx.postMessage({ type: 'progress', percent }),
    )
    ctx.postMessage({ type: 'done', result })
  } catch (error) {
    ctx.postMessage({ type: 'error', error: error instanceof Error ? error.message : String(error) })
  }
}
