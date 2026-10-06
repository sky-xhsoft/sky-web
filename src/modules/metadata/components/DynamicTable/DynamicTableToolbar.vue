<!-- 动态表格工具栏组件 -->
<template>
  <div class="dynamic-table-toolbar">
    <div class="toolbar-left">
          <a-space>
            <!-- 新增按钮 -->
            <V2Button
              v-if="canCreate"
              type="gradient"
              @click="$emit('create')"
            >
              <template #icon><icon-plus /></template>
              新增
            </V2Button>

            <!-- 导入按钮 -->
            <V2Button
              v-if="canImport"
              type="secondary"
              @click="$emit('import')"
            >
              <template #icon><icon-upload /></template>
              导入
            </V2Button>

            <!-- 导出按钮 -->
            <V2Button
              v-if="canExport"
              type="secondary"
              @click="$emit('export')"
            >
              <template #icon><icon-download /></template>
              导出
            </V2Button>

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

        <!-- 列设置按�?-->
        <a-button
          v-if="showColumnSetting"
          size="small"
          @click="$emit('columnSetting')"
        >
          <template #icon><icon-settings /></template>
          列设�?
        </a-button>

        <!-- 自定义右侧插�?-->
        <slot name="right" />
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconUpload, IconDownload, IconList, IconApps, IconRefresh } from '@arco-design/web-vue/es/icon'
import { V2Button } from '@/components/ui'

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
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应�?*/
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
