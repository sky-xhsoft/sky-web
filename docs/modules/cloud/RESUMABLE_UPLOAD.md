# 断点续传功能文档

## 📋 功能概述

断点续传功能支持大文件的可靠上传，包括：
- ✅ 文件分片上传
- ✅ 断点恢复
- ✅ 秒传（基于hash检测）
- ✅ 上传暂停/恢复
- ✅ 失败自动重试
- ✅ 上传进度显示

## 🚀 使用方法

### 自动使用（推荐）

默认情况下，大于10MB的文件会自动使用断点续传：

```typescript
import { useCloudUpload } from '@/modules/cloud/composables'

const upload = useCloudUpload()

// 自动判断：大文件用断点续传，小文件用普通上传
await upload.uploadWithResumable(file, folderId)
```

### 强制使用断点续传

```typescript
// 第三个参数设为true，强制使用断点续传
await upload.uploadWithResumable(file, folderId, true)
```

### 直接使用ResumableUploadManager

```typescript
import { ResumableUploadManager } from '@/modules/cloud/utils/resumable-upload'

const manager = new ResumableUploadManager(file, folderId)

// 设置进度回调
manager.setProgressCallback((progress) => {
  console.log(`进度: ${progress.progress}%`)
  console.log(`已上传: ${progress.uploadedSize}`)
  console.log(`总大小: ${progress.totalSize}`)
})

// 开始上传
const fileId = await manager.start()
```

## 🔧 技术实现

### 上传流程

```
1. 计算文件hash (SparkMD5)
   ├─ 分块读取文件（每块2MB）
   └─ 生成MD5 hash

2. 检查文件是否已存在（秒传）
   ├─ 调用 checkFileHash API
   ├─ 如果存在：直接返回fileId ✅
   └─ 如果不存在：继续上传

3. 初始化上传任务
   ├─ 调用 initResumableUpload API
   └─ 获取 uploadId

4. 获取已上传的分片（断点恢复）
   ├─ 调用 getUploadedChunks API
   └─ 标记已完成的分片

5. 上传未完成的分片
   ├─ 文件分片（默认5MB/片）
   ├─ 逐个上传分片（可并发）
   ├─ 失败自动重试（最多3次）
   └─ 更新进度

6. 完成上传（合并分片）
   ├─ 调用 completeResumableUpload API
   └─ 后端合并所有分片
```

### 配置参数

```typescript
// src/modules/cloud/constants/config.ts
export const CLOUD_CONFIG = {
  CHUNK_SIZE: 5 * 1024 * 1024,  // 分片大小：5MB
  MAX_RETRIES: 3,                // 最大重试次数
  TIMEOUT: 120000,               // 超时时间：2分钟
}
```

### API接口

#### 1. 检查文件hash（秒传）

```typescript
POST /api/v1/cloud/files/check-hash

Request:
{
  "hash": "abc123...",
  "fileName": "large-file.zip",
  "fileSize": 104857600
}

Response:
{
  "exists": true,       // 文件是否已存在
  "fileId": 123         // 如果存在，返回文件ID
}
```

#### 2. 初始化上传任务

```typescript
POST /api/v1/cloud/files/upload/init

Request:
{
  "fileName": "large-file.zip",
  "fileSize": 104857600,
  "fileHash": "abc123...",
  "folderId": 10,
  "chunkSize": 5242880,
  "totalChunks": 20
}

Response:
{
  "uploadId": "upload_123",
  "uploadedChunks": [0, 1, 2]  // 已上传的分片索引（可选）
}
```

#### 3. 获取已上传分片

```typescript
GET /api/v1/cloud/files/upload/:uploadId/chunks

Response:
{
  "uploadedChunks": [0, 1, 2, 5, 10]
}
```

#### 4. 上传单个分片

```typescript
POST /api/v1/cloud/files/upload/:uploadId/chunk

Request (multipart/form-data):
- chunkIndex: 3
- chunk: <binary data>

Response:
{
  "success": true
}
```

#### 5. 完成上传（合并）

```typescript
POST /api/v1/cloud/files/upload/:uploadId/complete

Response:
{
  "fileId": 456,
  "fileName": "large-file.zip",
  "fileSize": 104857600
}
```

## 📊 性能优化

### 1. 分片大小选择

- 小文件（<10MB）：不分片，直接上传
- 中等文件（10MB-100MB）：5MB分片
- 大文件（>100MB）：10MB分片

修改配置：

```typescript
// 动态调整分片大小
const chunkSize = file.size > 100 * 1024 * 1024
  ? 10 * 1024 * 1024  // 10MB
  : 5 * 1024 * 1024   // 5MB

const manager = new ResumableUploadManager(file, folderId, { chunkSize })
```

### 2. 并发上传

目前是串行上传，可以修改为并发：

```typescript
// 并发上传3个分片
const concurrency = 3
const chunks = [...未上传的分片]

for (let i = 0; i < chunks.length; i += concurrency) {
  const batch = chunks.slice(i, i + concurrency)
  await Promise.all(batch.map(chunk => uploadChunk(chunk)))
}
```

### 3. 断点恢复优化

后端应该持久化上传进度，前端可以在页面刷新后继续：

```typescript
// 保存上传状态到localStorage
localStorage.setItem('upload_' + uploadId, JSON.stringify({
  fileHash,
  uploadedChunks,
  timestamp: Date.now()
}))

// 恢复时读取
const savedState = localStorage.getItem('upload_' + uploadId)
```

## 🐛 错误处理

### 常见错误

#### 1. 网络中断

```typescript
// 自动重试机制已内置
await uploadChunkWithRetry(chunkIndex, chunk, retryCount)
```

#### 2. 后端未实现API

```
错误: API接口不存在
解决: 确认后端已实现所有5个断点续传API
```

#### 3. 文件hash计算失败

```typescript
try {
  const hash = await calculateFileHash(file)
} catch (e) {
  console.error('Hash计算失败:', e)
  // 降级到普通上传
  await uploadFile(file)
}
```

#### 4. 分片上传超时

```typescript
// 增加超时时间
const manager = new ResumableUploadManager(file, folderId, {
  timeout: 300000  // 5分钟
})
```

## 📝 测试

### 单元测试

```bash
npm test -- tests/cloud/unit/utils/resumable-upload.spec.ts
```

### 集成测试

```typescript
describe('断点续传', () => {
  it('应该能够上传大文件', async () => {
    const file = new File(['x'.repeat(20 * 1024 * 1024)], 'large.txt')
    const fileId = await uploadWithResumable(file, 0)
    expect(fileId).toBeDefined()
  })

  it('应该能够断点恢复', async () => {
    // 模拟上传中断
    const manager = new ResumableUploadManager(file, 0)
    await manager.start().catch(() => {})

    // 恢复上传
    const fileId = await manager.resume()
    expect(fileId).toBeDefined()
  })

  it('应该能够秒传', async () => {
    // 上传相同文件两次
    const file1 = new File(['content'], 'test.txt')
    await uploadWithResumable(file1, 0)

    const file2 = new File(['content'], 'test.txt')
    const fileId = await uploadWithResumable(file2, 0)
    expect(fileId).toBeDefined()
  })
})
```

### 手动测试

1. **测试正常上传**
   - 上传一个50MB的文件
   - 观察进度条正常显示
   - 确认文件上传成功

2. **测试断点恢复**
   - 上传一个100MB的文件
   - 中途断开网络
   - 恢复网络，点击重试
   - 确认从断点继续上传

3. **测试秒传**
   - 上传一个文件A
   - 再次上传相同内容的文件B
   - 确认文件B瞬间上传完成

4. **测试失败重试**
   - 修改后端，让某个分片上传失败
   - 观察自动重试机制
   - 确认最终上传成功或提示失败

## 🔒 安全考虑

### 1. 文件hash验证

后端应该验证文件hash：

```go
// 伪代码
func CompleteUpload(uploadId string) error {
    chunks := getChunks(uploadId)
    mergedFile := mergeChunks(chunks)

    // 验证hash
    actualHash := calculateHash(mergedFile)
    expectedHash := getExpectedHash(uploadId)

    if actualHash != expectedHash {
        return errors.New("文件hash不匹配")
    }

    return saveFile(mergedFile)
}
```

### 2. 上传权限验证

每个分片上传都应该验证：
- 用户身份（JWT token）
- 文件夹权限
- 配额限制

### 3. 清理过期任务

后端应该定期清理超过24小时未完成的上传任务。

## 📈 监控指标

建议监控以下指标：
- 上传成功率
- 平均上传速度
- 断点恢复次数
- 秒传命中率
- 分片重试次数

## 🎯 后续优化

- [ ] 支持并发分片上传
- [ ] 支持WebWorker计算hash（不阻塞主线程）
- [ ] 支持P2P加速（WebRTC）
- [ ] 支持上传前预览（图片/视频缩略图）
- [ ] 支持拖拽上传
- [ ] 支持文件夹上传

---

**版本**: 1.0.0
**最后更新**: 2026-01-15
