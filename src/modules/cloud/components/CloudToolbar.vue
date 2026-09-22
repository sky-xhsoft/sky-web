<template>
  <div class="cloud-toolbar">
    <div class="cloud-toolbar__left">
      <!-- Upload button -->
      <a-upload
        :custom-request="handleUpload"
        :show-file-list="false"
        multiple
        class="cloud-toolbar__upload"
      >
        <template #upload-button>
          <V2Button type="gradient">
            <template #icon><icon-upload /></template>
            {{ t('cloud.upload') }}
          </V2Button>
        </template>
      </a-upload>

      <!-- New folder -->
      <V2Button type="secondary" @click="handleCreateFolder">
        <template #icon><icon-folder-add /></template>
        {{ t('cloud.createFolder') }}
      </V2Button>

      <!-- Refresh -->
      <V2Button type="secondary" @click="handleRefresh" :loading="refreshing">
        <template #icon><icon-refresh /></template>
        {{ t('cloud.refresh') }}
      </V2Button>
    </div>

    <div class="cloud-toolbar__right">
      <!-- Search slot -->
      <slot name="search"></slot>

      <!-- Sort slot -->
      <slot name="sort"></slot>

      <!-- View toggle (对齐 drive.html 网格/列表 btn-primary / btn-secondary) -->
      <div class="view-toggle">
        <button
          type="button"
          class="view-toggle__btn"
          :class="{ 'view-toggle__btn--active': viewMode === 'grid' }"
          @click="handleViewModeChange('grid')"
        >
          <icon-apps />
          {{ t('cloud.gridView') }}
        </button>
        <button
          type="button"
          class="view-toggle__btn"
          :class="{ 'view-toggle__btn--active': viewMode === 'list' }"
          @click="handleViewModeChange('list')"
        >
          <icon-list />
          {{ t('cloud.listView') }}
        </button>
      </div>
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
import { V2Button } from '@/components/ui'

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

function handleViewModeChange(value: 'grid' | 'list') {
  emit('viewModeChange', value)
}
</script>

<style scoped>
.cloud-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.cloud-toolbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.cloud-toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

/* 网格/列表切换 (对齐原型 btn-sm btn-primary / btn-secondary) */
.view-toggle {
  display: inline-flex;
  gap: 6px;
  padding: 3px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.view-toggle__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.view-toggle__btn:hover {
  color: var(--brand-blue);
}

.view-toggle__btn--active {
  background: var(--brand-blue);
  color: #fff;
}

.view-toggle__btn--active:hover {
  color: #fff;
}

@media (max-width: 768px) {
  .cloud-toolbar {
    padding: 0;
    gap: 12px;
  }
  .cloud-toolbar__left,
  .cloud-toolbar__right {
    width: 100%;
    justify-content: space-between;
  }
  .cloud-toolbar__right {
    margin-left: 0;
  }
}
</style>