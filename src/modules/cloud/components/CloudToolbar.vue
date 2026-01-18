<template>
  <div class="cloud-toolbar">
    <div class="cloud-toolbar__left">
      <!-- 上传按钮 -->
      <a-upload
        :custom-request="handleUpload"
        :show-file-list="false"
        multiple
      >
        <template #upload-button>
          <a-button type="primary">
            <icon-upload />
            上传文件
          </a-button>
        </template>
      </a-upload>

      <!-- 新建文件夹 -->
      <a-button @click="handleCreateFolder">
        <icon-folder-add />
        新建文件夹
      </a-button>

      <!-- 刷新 -->
      <a-button @click="handleRefresh" :loading="refreshing">
        <icon-refresh />
        刷新
      </a-button>
    </div>

    <div class="cloud-toolbar__right">
      <!-- 搜索栏插槽 -->
      <slot name="search"></slot>

      <!-- 排序下拉插槽 -->
      <slot name="sort"></slot>

      <!-- 视图切换 -->
      <a-radio-group
        :model-value="viewMode"
        type="button"
        size="small"
        @change="handleViewModeChange"
      >
        <a-radio value="grid">
          <icon-apps />
          网格
        </a-radio>
        <a-radio value="list">
          <icon-list />
          列表
        </a-radio>
      </a-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconUpload,
  IconFolderAdd,
  IconRefresh,
  IconApps,
  IconList,
} from '@arco-design/web-vue/es/icon'
import type { RequestOption } from '@arco-design/web-vue'

interface Props {
  viewMode?: 'grid' | 'list'
  refreshing?: boolean
}

interface Emits {
  (e: 'upload', files: File[]): void
  (e: 'createFolder'): void
  (e: 'refresh'): void
  (e: 'viewModeChange', mode: 'grid' | 'list'): void
}

withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
  refreshing: false,
})

const emit = defineEmits<Emits>()

function handleUpload(option: RequestOption) {
  const { fileItem } = option
  if (fileItem.file) {
    emit('upload', [fileItem.file])
  }
  return Promise.resolve()
}

function handleCreateFolder() {
  emit('createFolder')
}

function handleRefresh() {
  emit('refresh')
}

function handleViewModeChange(value: string | number | boolean) {
  emit('viewModeChange', value as 'grid' | 'list')
}
</script>

<style scoped>
.cloud-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
  border-bottom: 2px solid #e8e8e8;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.cloud-toolbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cloud-toolbar__left :deep(.arco-btn) {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cloud-toolbar__left :deep(.arco-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.cloud-toolbar__left :deep(.arco-btn-primary) {
  background: linear-gradient(135deg, rgb(var(--primary-6)) 0%, rgb(var(--primary-5)) 100%);
  border: none;
  font-weight: 500;
}

.cloud-toolbar__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cloud-toolbar__right :deep(.arco-radio-group) {
  background: #ffffff;
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cloud-toolbar {
    padding: 16px;
    gap: 16px;
  }

  .cloud-toolbar__left,
  .cloud-toolbar__right {
    width: 100%;
    justify-content: space-between;
  }

  .cloud-toolbar__left {
    order: 2;
  }

  .cloud-toolbar__right {
    order: 1;
  }
}
</style>
