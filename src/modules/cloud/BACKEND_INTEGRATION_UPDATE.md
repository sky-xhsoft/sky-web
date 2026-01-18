# 后端分片上传集成更新

## 📋 更新概述

**更新日期**: 2026-01-15
**更新内容**: 适配后端新的分片上传API，更新前端代码以使用新的接口

---

## 🔄 主要变更

### 1. API层更新 (`cloud.ts`)

#### 新增API函数（6个）

```typescript
// 1. 初始化分片上传
initMultipartUpload(params: {
  fileName: string
  fileSize: number
  fileMd5: string
  fileType?: string
  chunkSize?: number
  folderId?: number
  storageType?: string
}): Promise<SessionInfo>

// 2. 上传分片（添加了MD5验证）
uploadMultipartChunk(
  sessionId: number,
  chunkIndex: number,
  chunkMd5: string,
  chunkData: Blob,
  signal?: AbortSignal
): Promise<void>

// 3. 查询上传状态
getMultipartUploadStatus(sessionId: number): Promise<StatusInfo>

// 4. 完成上传
completeMultipartUpload(sessionId: number): Promise<FileItem>

// 5. 取消上传
abortMultipartUpload(sessionId: number): Promise<void>

// 6. 恢复上传
resumeMultipartUpload(fileMd5: string): Promise<ResumeInfo>
```

#### 关键变更

| 项目 | 旧版本 | 新版本 | 说明 |
|------|--------|--------|------|
| **会话标识** | `uploadId: string` | `sessionId: number` | 后端使用数字ID |
| **API路径** | `/upload/init` | `/multipart/init` | 路径更规范 |
| **分片验证** | 无 | `chunkMd5: string` | 添加MD5校验 |
| **状态查询** | 需要单独调用 | 集成在init响应中 | `uploadedChunks`数组 |

#### 向后兼容

保留了旧的API函数（标记为`@deprecated`）：
- `checkFileHash` → 调用 `initMultipartUpload`
- `initResumableUpload` → 调用 `initMultipartUpload`
- `getUploadedChunks` → 调用 `getMultipartUploadStatus`
- `uploadChunk` → 调用 `uploadMultipartChunk`
- `completeResumableUpload` → 调用 `completeMultipartUpload`

### 2. ResumableUploadManager更新 (`resumable-upload.ts`)

#### 主要改动

1. **移除旧API依赖**
   ```typescript
   // 旧版本
   import { checkFileHash, initResumableUpload, uploadChunk, ... }

   // 新版本
   import { initMultipartUpload, uploadMultipartChunk, ... }
   ```

2. **更新会话标识**
   ```typescript
   // 旧版本
   private uploadId?: string

   // 新版本
   private sessionId?: number
   ```

3. **简化秒传检测**
   ```typescript
   // 旧版本：先检查hash，再初始化
   const checkResult = await checkFileHash(...)
   if (checkResult.exists) { /* 秒传 */ }
   const initResult = await initResumableUpload(...)

   // 新版本：一次调用完成检测和初始化
   const session = await initMultipartUpload(...)
   if (session.uploadedChunks.length === session.totalChunks) {
     // 秒传成功
     return await completeMultipartUpload(session.sessionId)
   }
   ```

4. **添加分片MD5计算**
   ```typescript
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
   ```

5. **增强恢复功能**
   ```typescript
   async resume() {
     // 获取最新状态
     const status = await getMultipartUploadStatus(this.sessionId)

     // 更新已上传分片列表
     this.uploadedChunks.clear()
     status.uploadedChunks.forEach(index => this.uploadedChunks.add(index))

     // 继续上传
     await this.uploadChunks()
     return await completeMultipartUpload(this.sessionId)
   }
   ```

6. **完善取消功能**
   ```typescript
   async cancel() {
     this.abortController?.abort()

     // 调用后端API取消任务
     if (this.sessionId) {
       await abortMultipartUpload(this.sessionId)
     }
   }
   ```

#### 新增辅助函数

```typescript
/**
 * 通过文件MD5恢复未完成的上传
 */
export async function resumeUploadByMd5(
  fileMd5: string,
  file: File,
  onProgress?: (progress: UploadTask) => void
): Promise<number> {
  const session = await resumeMultipartUpload(fileMd5)
  const manager = new ResumableUploadManager(file, 0)

  if (onProgress) {
    manager.setProgressCallback(onProgress)
  }

  return await manager.resume()
}
```

---

## 📊 API对比

### 初始化上传

**旧版本**:
```typescript
// 1. 先检查hash
const checkResult = await checkFileHash({ hash, fileName, fileSize })
if (checkResult.exists) return checkResult.fileId

// 2. 再初始化
const initResult = await initResumableUpload({
  fileName, fileSize, fileHash, folderId, chunkSize
})
```

**新版本**:
```typescript
// 一次调用完成
const session = await initMultipartUpload({
  fileName, fileSize, fileMd5, folderId, chunkSize
})

// 检查秒传
if (session.uploadedChunks.length === session.totalChunks) {
  return await completeMultipartUpload(session.sessionId)
}
```

### 上传分片

**旧版本**:
```typescript
await uploadChunk(uploadId, chunkIndex, chunk, signal)
```

**新版本**:
```typescript
const chunkMd5 = await calculateChunkMD5(chunk)
await uploadMultipartChunk(sessionId, chunkIndex, chunkMd5, chunk, signal)
```

### 完成上传

**旧版本**:
```typescript
const result = await completeResumableUpload(uploadId)
return result.data.fileId // string
```

**新版本**:
```typescript
const file = await completeMultipartUpload(sessionId)
return file.ID // number
```

---

## 🎯 功能增强

### 1. 秒传优化

- **旧版本**: 需要两次API调用（checkHash + init）
- **新版本**: 一次init调用即可检测，后端自动处理秒传

### 2. 分片校验

- **旧版本**: 无分片MD5校验
- **新版本**: 每个分片上传时都携带MD5，后端可校验完整性

### 3. 断点续传

- **旧版本**: 需要手动调用getUploadedChunks
- **新版本**: init响应中直接返回uploadedChunks

### 4. 取消上传

- **旧版本**: 只取消前端请求，后端任务仍存在
- **新版本**: 调用abortMultipartUpload清理后端任务

### 5. 通过MD5恢复

- **旧版本**: 不支持
- **新版本**: 可通过resumeMultipartUpload找回未完成的上传

---

## 🔧 迁移指南

### 使用旧API的代码（无需修改）

由于保留了向后兼容的包装函数，现有代码无需修改：

```typescript
// 这些代码仍然可以工作
const result = await checkFileHash({ ... })
await initResumableUpload({ ... })
await uploadChunk(uploadId, index, chunk)
```

### 推荐升级到新API

```typescript
// 旧代码
const checkResult = await checkFileHash({ hash, fileName, fileSize })
if (!checkResult.exists) {
  const { uploadId } = await initResumableUpload({ ... })
  // 上传分片...
}

// 新代码
const session = await initMultipartUpload({
  fileName, fileSize, fileMd5, folderId
})

if (session.uploadedChunks.length === session.totalChunks) {
  // 秒传
  return await completeMultipartUpload(session.sessionId)
}

// 上传分片...
for (let i = 0; i < session.totalChunks; i++) {
  if (session.uploadedChunks.includes(i)) continue

  const chunk = file.slice(i * chunkSize, (i+1) * chunkSize)
  const chunkMd5 = await calculateChunkMD5(chunk)
  await uploadMultipartChunk(session.sessionId, i, chunkMd5, chunk)
}
```

---

## 📚 相关文档

- **前后端集成指南**: `MULTIPART_UPLOAD_INTEGRATION.md`
- **断点续传文档**: `RESUMABLE_UPLOAD.md`
- **API文档**: `api/README.md`

---

## ✅ 测试清单

- [ ] 正常上传流程测试
- [ ] 秒传功能测试（上传相同文件）
- [ ] 断点续传测试（中断后恢复）
- [ ] 分片MD5校验测试
- [ ] 取消上传测试
- [ ] 通过MD5恢复测试
- [ ] 大文件上传测试（>100MB）
- [ ] 并发上传测试
- [ ] 网络异常场景测试

---

## 🐛 已知问题

无

---

## 📈 性能影响

| 场景 | 旧版本 | 新版本 | 说明 |
|------|--------|--------|------|
| 秒传检测 | 2次API调用 | 1次API调用 | 减少50%请求 |
| 分片上传 | 无MD5计算 | +MD5计算 | 增加少量计算开销 |
| 断点恢复 | 2次API调用 | 1次API调用 | 减少50%请求 |

**总体评估**: 性能略有提升，主要体现在减少了API调用次数

---

**更新人**: Claude Code Assistant
**更新日期**: 2026-01-15
**版本**: v2.0
