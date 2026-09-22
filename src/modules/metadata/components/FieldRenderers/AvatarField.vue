<!-- 头像字段渲染器 -->
<template>
  <div class="avatar-field">
    <div v-if="isDisabled || isReadonly || mode === 'view'" class="avatar-field__view">
      <a-avatar v-if="avatarUrl" :size="size" :style="{ background: bgColor }">
        <img :src="avatarUrl" :alt="displayName" />
      </a-avatar>
      <a-avatar v-else :size="size" :style="{ background: bgColor }">
        {{ avatarText }}
      </a-avatar>
      <span v-if="showName && displayName" class="avatar-name">{{ displayName }}</span>
    </div>
    <div v-else class="avatar-field__edit">
      <a-upload
        :file-list="fileList"
        :action="uploadUrl"
        :headers="uploadHeaders"
        :accept="acceptTypes"
        :limit="1"
        :disabled="disabled || readonly"
        :show-file-list="false"
        :auto-upload="true"
        @change="handleChange"
        @success="handleSuccess"
        @error="handleError"
      >
        <div v-if="avatarUrl" class="avatar-upload__preview">
          <img :src="avatarUrl" class="avatar-upload__img" />
          <div class="avatar-upload__mask">
            <icon-edit />
          </div>
        </div>
        <div v-else class="avatar-upload__placeholder">
          <icon-plus />
        </div>
      </a-upload>
    </div>
  </div>
</template>

<style scoped>
.avatar-field {
  display: flex;
  align-items: center;
}

.avatar-field__view {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.avatar-name {
  font-size: 14px;
  color: var(--text-primary);
}

.avatar-field__edit {
  display: flex;
  align-items: center;
}

.avatar-upload__preview {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--border);
}

.avatar-upload__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload__mask {
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

.avatar-upload__preview:hover .avatar-upload__mask {
  opacity: 1;
}

.avatar-upload__mask .arco-icon {
  font-size: 24px;
  color: #fff;
}

.avatar-upload__placeholder {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 2px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.avatar-upload__placeholder:hover {
  border-color: var(--brand-blue);
  background: var(--info-bg);
}

.avatar-upload__placeholder .arco-icon {
  font-size: 32px;
  color: var(--text-tertiary);
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconEdit } from '@arco-design/web-vue/es/icon'
import { useFieldRendererBase } from '../../composables'
import type { SysColumn, FieldValue, FormMode } from '../../types'
import type { FileItem } from '@arco-design/web-vue'
import { getAccessToken } from '@/utils/token'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
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
  'update:modelValue': [value: FieldValue]
}>()

const { isReadonly, isDisabled } = useFieldRendererBase(props)

const fileList = ref<FileItem[]>([])

const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

const size = computed(() => {
  return config.value.size || 48
})

const showName = computed(() => {
  return config.value.showName !== false
})

const bgColor = computed(() => {
  return config.value.bgColor || '#165dff'
})

const displayName = computed(() => {
  return config.value.name || ''
})

const uploadUrl = computed(() => {
  return config.value.uploadUrl || '/api/v1/files/upload'
})

const uploadHeaders = computed(() => {
  const token = getAccessToken()
  return {
    Authorization: token ? `Bearer ${token}` : '',
    ...config.value.headers
  }
})

const acceptTypes = computed(() => {
  return config.value.accept || 'image/*'
})

const avatarUrl = computed(() => {
  if (!props.modelValue) return ''
  return String(props.modelValue)
})

const avatarText = computed(() => {
  const name = displayName.value
  if (!name) return '?'
  if (name.length <= 2) return name
  return name.slice(-2)
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      fileList.value = [{
        uid: Date.now().toString(),
        name: 'avatar',
        url: String(newValue),
        status: 'done'
      }]
    } else {
      fileList.value = []
    }
  },
  { immediate: true }
)

function handleChange(fileList: FileItem[]) {
  const files = fileList.map(file => {
    const serverUrl = file.response?.data?.accessUrl || file.response?.data?.url
    return {
      uid: file.uid,
      name: file.name,
      url: serverUrl || file.url || '',
      size: file.size,
      status: file.status
    }
  })

  const allSuccess = files.every(f => f.status === 'done' && f.url && !f.url.startsWith('blob:'))

  if (allSuccess || files.length === 0) {
    emit('update:modelValue', files[0]?.url || null)
  }
}

function handleSuccess(response: any) {
  if (response && (response.code === 0 || response.success)) {
    Message.success('上传成功')
  } else {
    Message.error(response?.message || '上传失败')
  }
}

function handleError(error: any) {
  console.error('[AvatarField] Upload error:', error)
  Message.error(error?.message || '上传失败')
}
</script>
