/**
 * 文件缩略图加载：图片为缩小图，视频为第一帧（由后端生成并缓存）
 *
 * - 结果按文件 ID 缓存为 blob URL，同一会话内不重复请求
 * - 同时最多 4 个请求，避免一屏几十个文件同时请求
 * - 无缩略图（类型不支持、生成失败）也会记住，不重复请求
 */
import api from '@/api/http'
import { fileKindOf } from './file-kind'

const MAX_CONCURRENT = 4
const cache = new Map<number, Promise<string | null>>()
const queue: Array<() => void> = []
let running = 0

/** 是否可能有缩略图（图片、视频） */
export function hasThumbnail(ext?: string | null, mime?: string | null): boolean {
  const kind = fileKindOf(ext, mime)
  return kind === 'image' || kind === 'video'
}

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running += 1
      task()
        .then(resolve, reject)
        .finally(() => {
          running -= 1
          queue.shift()?.()
        })
    }
    if (running < MAX_CONCURRENT) run()
    else queue.push(run)
  })
}

/** 获取缩略图 blob URL，无缩略图时返回 null */
export function loadThumbnail(fileId: number): Promise<string | null> {
  const cached = cache.get(fileId)
  if (cached) return cached

  const promise = schedule(async () => {
    try {
      const { data } = await api.get<Blob>(`/cloud/files/${fileId}/thumbnail`, { responseType: 'blob', timeout: 60000 })
      return data && data.size > 0 ? URL.createObjectURL(data) : null
    } catch {
      return null
    }
  })
  cache.set(fileId, promise)
  return promise
}
