<!-- 动态表格工具栏组件 -->
<template>
  <div class="dynamic-table-toolbar">
    <div class="toolbar-left">
      <a-space>
        <!-- 新增按钮 -->
        <a-button
          v-if="canCreate"
          type="primary"
          @click="$emit('create')"
        >
          <template #icon><icon-plus /></template>
          新增
        </a-button>

        <!-- 导入按钮 -->
        <a-button
          v-if="canImport"
          @click="$emit('import')"
        >
          <template #icon><icon-upload /></template>
          导入
        </a-button>

        <!-- 导出按钮 -->
        <a-button
          v-if="canExport"
          @click="$emit('export')"
        >
          <template #icon><icon-download /></template>
          导出
        </a-button>

        <!-- 自定义左侧插槽 -->
        <slot name="left" />
      </a-space>
    </div>

    <div class="toolbar-right">
      <a-space>
        <!-- 视图切换 -->
        <a-radio-group
          v-if="showViewModeToggle"
          :model-value="viewMode"
          type="button"
          size="small"
          @change="$emit('viewModeChange', $event)"
        >
          <a-radio value="list">
            <template #icon><icon-list /></template>
            列表
          </a-radio>
          <a-radio value="grid">
            <template #icon><icon-apps /></template>
            卡片
          </a-radio>
        </a-radio-group>

        <!-- 刷新按钮 -->
        <a-button
          size="small"
          :loading="refreshing"
          @click="$emit('refresh')"
        >
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>

        <!-- 列设置按钮 -->
        <a-button
          v-if="showColumnSetting"
          size="small"
          @click="$emit('columnSetting')"
        >
          <template #icon><icon-setting /></template>
          列设置
        </a-button>

        <!-- 自定义右侧插槽 -->
        <slot name="right" />
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconUpload, IconDownload, IconList, IconApps, IconRefresh, IconSetting } from '@arco-design/web-vue/es/icon'

interface Props {
  viewMode?: 'list' | 'grid'
  refreshing?: boolean
  canCreate?: boolean
  canImport?: boolean
  canExport?: boolean
  showViewModeToggle?: boolean
  showColumnSetting?: boolean
}

interface Emits {
  (e: 'create'): void
  (e: 'import'): void
  (e: 'export'): void
  (e: 'refresh'): void
  (e: 'viewModeChange', mode: 'list' | 'grid'): void
  (e: 'columnSetting'): void
}

withDefaults(defineProps<Props>(), {
  viewMode: 'list',
  refreshing: false,
  canCreate: true,
  canImport: true,
  canExport: true,
  showViewModeToggle: true,
  showColumnSetting: true
})

defineEmits<Emits>()
</script>

<style scoped>
.dynamic-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .dynamic-table-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: space-between;
  }

  .toolbar-left :deep(.arco-space),
  .toolbar-right :deep(.arco-space) {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .toolbar-left :deep(.arco-btn-text) .arco-btn-text,
  .toolbar-right :deep(.arco-btn-text) .arco-btn-text {
    display: none;
  }
}
</style>