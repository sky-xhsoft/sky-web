<template>
  <div class="cloud-toolbar">
    <div class="cloud-toolbar__left">
      <!-- Upload button -->
      <a-upload
        :custom-request="handleUpload"
        :show-file-list="false"
        multiple
      >
        <template #upload-button>
          <a-button type="primary">
            <icon-upload />
            {{ t('cloud.upload') }}
          </a-button>
        </template>
      </a-upload>

      <!-- New folder -->
      <a-button @click="handleCreateFolder">
        <icon-folder-add />
        {{ t('cloud.createFolder') }}
      </a-button>

      <!-- Refresh -->
      <a-button @click="handleRefresh" :loading="refreshing">
        <icon-refresh />
        {{ t('cloud.refresh') }}
      </a-button>
    </div>

    <div class="cloud-toolbar__right">
      <!-- Search slot -->
      <slot name="search"></slot>

      <!-- Sort slot -->
      <slot name="sort"></slot>

      <!-- View toggle -->
      <a-radio-group
        :model-value="viewMode"
        type="button"
        size="small"
        @change="handleViewModeChange"
      >
        <a-radio value="grid">
          <icon-apps />
          {{ t('cloud.gridView') }}
        </a-radio>
        <a-radio value="list">
          <icon-list />
          {{ t('cloud.listView') }}
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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

/* Responsive adjustments */
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
