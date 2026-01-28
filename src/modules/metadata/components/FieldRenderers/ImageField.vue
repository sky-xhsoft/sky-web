<!-- 图片上传字段 -->
<template>
  <div class="image-field">
    <!-- 查看模式 -->
    <div v-if="mode === 'view'" class="image-field__view">
      <div v-if="imageList.length > 0" class="image-field__gallery">
        <div
          v-for="(image, index) in imageList"
          :key="index"
          class="image-field__item"
          @click="handlePreview(index)"
        >
          <img :src="image.url" :alt="image.name" class="image-field__img" />
          <div class="image-field__mask">
            <icon-eye />
          </div>
        </div>
      </div>
      <div v-else class="image-field__empty">
        <icon-image />
        <span>暂无图片</span>
      </div>
    </div>

    <!-- 编辑模式 -->
    <a-upload
      v-else
      :file-list="imageList"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :accept="acceptTypes"
      :limit="maxCount"
      :disabled="disabled || readonly"
      :multiple="multiple"
      :show-file-list="true"
      :list-type="listType"
      :image-preview="true"
      :auto-upload="true"
      @change="handleChange"
      @success="handleSuccess"
      @error="handleError"
      @preview="handlePreview"
    >
      <template #upload-button>
        <div class="image-field__upload-btn">
          <icon-plus />
          <div class="image-field__upload-text">{{ placeholder }}</div>
        </div>
      </template>
    </a-upload>

    <!-- 图片预览 -->
    <a-image-preview
      v-model:visible="previewVisible"
      :src="previewUrl"
      :src-list="previewList"
      :current="previewIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconEye, IconImage } from '@arco-design/web-vue/es/icon'
import type { SysColumn, FormMode } from '../../types'
import type { FileItem } from '@arco-design/web-vue'

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

// 图片列表
const imageList = ref<FileItem[]>([])

// 预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewIndex = ref(0)

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
  return config.value.uploadUrl || '/api/v1/file/upload/image'
})

// 上传请求头
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
    ...config.value.headers
  }
})

// 接受的文件类型
const acceptTypes = computed(() => {
  return config.value.accept || 'image/*'
})

// 最大文件数量
const maxCount = computed(() => {
  return config.value.maxCount || 1
})

// 是否支持多选
const multiple = computed(() => {
  return config.value.multiple !== false && maxCount.value > 1
})

// 列表类型
const listType = computed(() => {
  return config.value.listType || 'picture-card'
})

// 占位符
const placeholder = computed(() => {
  return config.value.placeholder || '上传图片'
})

// 预览图片列表
const previewList = computed(() => {
  return imageList.value.map(img => img.url || '').filter(Boolean)
})

// 初始化图片列表
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      imageList.value = []
      return
    }

    try {
      // 如果是字符串，尝试解析为 JSON
      if (typeof newValue === 'string') {
        // 尝试解析为 JSON 数组
        try {
          const parsed = JSON.parse(newValue)
          imageList.value = Array.isArray(parsed) ? parsed : [{ url: newValue, name: 'image', status: 'done' }]
        } catch {
          // 如果解析失败，假设是单个图片 URL
          imageList.value = [{
            uid: Date.now().toString(),
            name: newValue.split('/').pop() || 'image',
            url: newValue,
            status: 'done'
          }]
        }
      } else if (Array.isArray(newValue)) {
        imageList.value = newValue
      } else {
        imageList.value = [newValue]
      }
    } catch {
      imageList.value = []
    }
  },
  { immediate: true }
)

/**
 * 文件变化处理
 */
function handleChange(fileList: FileItem[]) {
  // 更新图片列表
  const images = fileList.map(file => ({
    uid: file.uid,
    name: file.name,
    url: file.url || file.response?.data?.url || '',
    status: file.status
  }))

  // 发送更新事件
  if (maxCount.value === 1) {
    // 单图模式：只保存 URL 字符串
    emit('update:modelValue', images[0]?.url || null)
  } else {
    // 多图模式：保存图片数组的 JSON 字符串
    emit('update:modelValue', JSON.stringify(images))
  }
}

/**
 * 上传成功处理
 */
function handleSuccess(response: any) {
  if (response.code === 0 || response.success) {
    Message.success('上传成功')
  } else {
    Message.error(response.message || '上传失败')
  }
}

/**
 * 上传失败处理
 */
function handleError(error: any) {
  Message.error(error.message || '上传失败')
}

/**
 * 预览图片
 */
function handlePreview(index: number | FileItem) {
  if (typeof index === 'number') {
    previewIndex.value = index
    previewUrl.value = imageList.value[index]?.url || ''
  } else {
    const idx = imageList.value.findIndex(img => img.uid === index.uid)
    previewIndex.value = idx >= 0 ? idx : 0
    previewUrl.value = index.url || ''
  }
  previewVisible.value = true
}
</script>

<style scoped>
.image-field {
  width: 100%;
}

.image-field__view {
  padding: 8px 0;
}

.image-field__gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-field__item {
  position: relative;
  width: 104px;
  height: 104px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.image-field__item:hover {
  border-color: var(--color-primary);
}

.image-field__item:hover .image-field__mask {
  opacity: 1;
}

.image-field__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-field__mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

.image-field__mask .arco-icon {
  font-size: 24px;
  color: #fff;
}

.image-field__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--color-text-3);
  font-size: 14px;
  background: #f7f8fa;
  border: 1px dashed #e5e6eb;
  border-radius: 4px;
}

.image-field__empty .arco-icon {
  font-size: 32px;
}

.image-field__upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 104px;
  background: #f7f8fa;
  border: 1px dashed #e5e6eb;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.image-field__upload-btn:hover {
  border-color: var(--color-primary);
  background: #f2f5ff;
}

.image-field__upload-btn .arco-icon {
  font-size: 24px;
  color: var(--color-text-3);
}

.image-field__upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-3);
}
</style>
