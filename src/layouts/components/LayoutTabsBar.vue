<template>
  <div class="layout-tabs-bar">
    <!-- 侧边栏折叠按钮 -->
    <div
      class="sidebar-toggle"
      role="button"
      tabindex="0"
      :aria-label="sidebarCollapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')"
      @click="$emit('toggle-sidebar')"
      @keydown.enter="$emit('toggle-sidebar')"
    >
      <IconMenuFold v-if="!sidebarCollapsed" />
      <IconMenuUnfold v-else />
    </div>

    <a-tabs
      :active-key="activeTabKey"
      type="card"
      :closable="true"
      :editable="true"
      class="page-tabs"
      @update:active-key="(key: string) => $emit('tab-change', key)"
      @delete="(key: string) => $emit('tab-close', key)"
    >
      <!-- 标签栏右侧操作按钮 -->
      <template #extra>
        <a-space size="small">
          <a-button size="small" :aria-label="t('layout.closeOther')" @click="$emit('close-other')">
            <template #icon><icon-close-circle /></template>
            {{ t('layout.closeOther') }}
          </a-button>
          <a-button size="small" :aria-label="t('layout.closeAll')" @click="$emit('close-all')">
            <template #icon><icon-close /></template>
            {{ t('layout.closeAll') }}
          </a-button>
        </a-space>
      </template>

      <a-tab-pane
        v-for="tab in tabs"
        :key="tab.key"
        :closable="!tab.isFixed"
      >
        <template #title>
          <span
            :title="tab.title"
            @contextmenu.prevent="(e: MouseEvent) => $emit('tab-context-menu', e, tab.key)"
          >
            {{ tab.title }}
          </span>
        </template>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  IconMenuFold,
  IconMenuUnfold,
  IconClose,
  IconCloseCircle,
} from '@arco-design/web-vue/es/icon'

interface TabItem {
  key: string
  title: string
  componentName: string
  params: Record<string, any>
  isFixed?: boolean
}

interface Props {
  tabs: TabItem[]
  activeTabKey: string
  sidebarCollapsed: boolean
}

defineProps<Props>()

defineEmits<{
  (e: 'tab-change', key: string): void
  (e: 'tab-close', key: string): void
  (e: 'tab-context-menu', event: MouseEvent, key: string): void
  (e: 'toggle-sidebar'): void
  (e: 'close-other'): void
  (e: 'close-all'): void
}>()

const { t } = useI18n()
</script>

<style scoped>
.layout-tabs-bar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.sidebar-toggle {
  position: absolute;
  left: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  border-radius: 6px;
  outline: none;
  transition: background-color 0.2s;
}

.sidebar-toggle:hover,
.sidebar-toggle:focus-visible {
  background: #f3f4f6;
}

.sidebar-toggle:focus-visible {
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.3);
}

.page-tabs {
  height: 40px;
  margin-left: 52px;
  flex: 1;
}

.page-tabs :deep(.arco-tabs-header) {
  height: 40px;
  padding: 0;
}

.page-tabs :deep(.arco-tabs-nav) {
  height: 40px;
}

.page-tabs :deep(.arco-tabs-tab) {
  height: 39px;
  line-height: 39px;
  padding: 0 16px;
  border-radius: 6px 6px 0 0;
}

.page-tabs :deep(.arco-tabs-tab-active) {
  background: #f5f6fa;
}

.page-tabs :deep(.arco-tabs-tab-btn) {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-tabs :deep(.arco-tabs-tab-remove) {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .page-tabs :deep(.arco-tabs-header) {
    overflow-x: auto;
    overflow-y: hidden;
  }
  .page-tabs :deep(.arco-tabs-nav-list) {
    flex-wrap: nowrap;
  }
}
</style>