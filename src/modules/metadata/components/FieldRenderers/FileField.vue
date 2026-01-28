<!-- 文件上传字段 -->
<template>
  <div class="file-field">
    <!-- 查看模式 -->
    <div v-if="mode === 'view'" class="file-field__view">
      <div v-if="fileList.length > 0" class="file-field__list">
        <div
          v-for="(file, index) in fileList"
          :key="index"
          class="file-field__item"
        >
          <icon-file />
          <a :href="file.url" target="_blank" class="file-field__link">
            {{ file.name }}
          </a>
          <span class="file-field__size">{{ formatFileSize(file.size) }}</span>
        </div>
      </div>
      <div v-else class="file-field__empty">
        <icon-empty />
        <span>暂无文件</span>
      </div>
    </div>

    <!-- 编辑模式 -->
    <a-upload
      v-else
      :file-list="fileList"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :accept="acceptTypes"
      :limit="maxCount"
      :disabled="disabled || readonly"
      :multiple="multiple"
      :show-file-list="true"
      :auto-upload="true"
      @change="handleChange"
      @success="handleSuccess"
      @error="handleError"
    >
      <template #upload-button>
        <a-button :disabled="disabled || readonly">
          <template #icon>
            <icon-upload />
          </template>
          {{ placeholder }}
        </a-button>
      </template>
    </a-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconFile, IconUpload, IconEmpty } from '@arco-design/web-vue/es/icon'
import type { SysColumn, FormMode } from '../../types'
import type { FileItem } from '@arco-design/web-vue'
import { getAccessToken } from '@/utils/token'

interface Props {
  column: SysColumn
  modelValue?: any
  mode?: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'blur': []
}>()

// 文件列表
const fileList = ref<FileItem[]>([])

// 解析控件配置
const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

// 上传地址
const uploadUrl = computed(() => {
  return config.value.uploadUrl || '/api/v1/file/upload'
})

// 上传请求头
const uploadHeaders = computed(() => {
  const token = getAccessToken()
  return {
    Authorization: token ? `Bearer ${token}` : '',
    ...config.value.headers
  }
})

// 接受的文件类型
const acceptTypes = computed(() => {
  return config.value.accept || '*'
})

// 最大文件数量
const maxCount = computed(() => {
  return config.value.maxCount || 1
})

// 是否支持多选
const multiple = computed(() => {
  return config.value.multiple !== false
})

// 占位符
const placeholder = computed(() => {
  return config.value.placeholder || '点击上传文件'
})

// 初始化文件列表
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      fileList.value = []
      return
    }

    try {
      // 如果是字符串，尝试解析为 JSON
      if (typeof newValue === 'string') {
        const parsed = JSON.parse(newValue)
        fileList.value = Array.isArray(parsed) ? parsed : [parsed]
      } else if (Array.isArray(newValue)) {
        fileList.value = newValue
      } else {
        fileList.value = [newValue]
      }
    } catch {
      // 如果解析失败，假设是单个文件 URL
      fileList.value = [{
        uid: Date.now().toString(),
        name: newValue.split('/').pop() || 'file',
        url: newValue,
        status: 'done'
      }]
    }
  },
  { immediate: true }
)

/**
 * 文件变化处理
 */
function handleChange(fileList: FileItem[]) {
  // 更新文件列表
  const files = fileList.map(file => {
    // 优先使用后端返回的 accessUrl（仅在上传成功后才有）
    // 如果还在上传中，使用临时的 blob URL 用于预览
    const serverUrl = file.response?.data?.accessUrl || file.response?.data?.url
    return {
      uid: file.uid,
      name: file.name,
      url: serverUrl || file.url || '',
      size: file.size,
      status: file.status
    }
  })

  // 只有当所有文件都上传成功后，才发送更新事件
  const allSuccess = files.every(f => f.status === 'done' && f.url && !f.url.startsWith('blob:'))

  if (allSuccess || files.length === 0) {
    // 发送更新事件
    if (maxCount.value === 1) {
      // 单文件模式：只保存 URL 字符串
      emit('update:modelValue', files[0]?.url || null)
    } else {
      // 多文件模式：保存文件数组的 JSON 字符串
      emit('update:modelValue', JSON.stringify(files))
    }
  }
}

/**
 * 上传成功处理
 */
function handleSuccess(response: any) {
  console.log('[FileField] Upload success response:', response)
  if (response && (response.code === 0 || response.success)) {
    Message.success('上传成功')
  } else {
    Message.error(response?.message || '上传失败')
  }
}

/**
 * 上传失败处理
 */
function handleError(error: any) {
  console.error('[FileField] Upload error:', error)
  Message.error(error?.message || '上传失败')
}

/**
 * 格式化文件大小
 */
function formatFileSize(size?: number): string {
  if (!size) return ''

  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  } else {
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }
}
</script>

<style scoped>
.file-field {
  width: 100%;
}

.file-field__view {
  padding: 8px 0;
}

.file-field__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-field__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}

.file-field__item .arco-icon {
  font-size: 16px;
  color: var(--color-text-3);
}

.file-field__link {
  flex: 1;
  color: var(--color-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-field__link:hover {
  text-decoration: underline;
}

.file-field__size {
  font-size: 12px;
  color: var(--color-text-3);
}

.file-field__empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: var(--color-text-3);
  font-size: 14px;
}

.file-field__empty .arco-icon {
  font-size: 20px;
}
</style>
