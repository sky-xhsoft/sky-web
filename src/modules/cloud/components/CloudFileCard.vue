<template>
  <div
    class="cloud-file-card"
    :class="{
      'is-selected': selected,
      'is-folder': item.type === 'folder',
    }"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 选择框 -->
    <div v-if="selectable" class="cloud-file-card__checkbox" @click.stop>
      <a-checkbox :model-value="selected" @change="handleSelect" />
    </div>

    <!-- 图标 -->
    <div
      class="cloud-file-card__icon"
      :style="{ backgroundColor: item.bg, color: item.color }"
    >
      <span class="icon-emoji">{{ item.icon }}</span>
    </div>

    <!-- 信息 -->
    <div class="cloud-file-card__info">
      <div class="cloud-file-card__name" :title="item.name">
        {{ item.name }}
      </div>
      <div class="cloud-file-card__meta">
        {{ item.meta }}
      </div>
    </div>

    <!-- 操作菜单 -->
    <div v-if="showActions" class="cloud-file-card__actions" @click.stop>
      <a-dropdown trigger="click" @select="handleAction">
        <a-button size="mini" type="text">
          <icon-more />
        </a-button>
        <template #content>
          <a-doption value="preview" v-if="item.type === 'file'">
            <icon-eye />
            预览
          </a-doption>
          <a-doption value="download" v-if="item.type === 'file'">
            <icon-download />
            下载
          </a-doption>
          <a-doption value="rename">
            <icon-edit />
            重命名
          </a-doption>
          <a-doption value="move">
            <icon-export />
            移动
          </a-doption>
          <a-doption value="share">
            <icon-share-alt />
            分享
          </a-doption>
          <a-doption value="delete" class="danger-option">
            <icon-delete />
            删除
          </a-doption>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconMore,
  IconEye,
  IconDownload,
  IconEdit,
  IconExport,
  IconShareAlt,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import type { GridItem } from '@/modules/cloud/types'

interface Props {
  item: GridItem
  selected?: boolean
  selectable?: boolean
  showActions?: boolean
}

interface Emits {
  (e: 'click', item: GridItem): void
  (e: 'dblclick', item: GridItem): void
  (e: 'select', item: GridItem, selected: boolean): void
  (e: 'action', action: string, item: GridItem): void
  (e: 'contextmenu', event: MouseEvent, item: GridItem): void
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectable: false,
  showActions: true,
})

const emit = defineEmits<Emits>()

function handleClick() {
  emit('click', props.item)
}

function handleDoubleClick() {
  emit('dblclick', props.item)
}

function handleSelect(value: boolean | (string | number | boolean)[]) {
  emit('select', props.item, value as boolean)
}

function handleAction(value: string | number | Record<string, any> | undefined) {
  if (typeof value === 'string') {
    emit('action', value, props.item)
  }
}

function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', event, props.item)
}

</script>

<style scoped>
.cloud-file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.cloud-file-card:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.cloud-file-card.is-selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.cloud-file-card.is-folder:hover {
  border-color: #fbbf24;
}

.cloud-file-card__checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.cloud-file-card__icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.cloud-file-card:hover .cloud-file-card__icon {
  transform: scale(1.05);
}

.icon-emoji {
  font-size: 48px;
  line-height: 1;
}

.cloud-file-card__info {
  width: 100%;
  text-align: center;
}

.cloud-file-card__name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.cloud-file-card__meta {
  font-size: 12px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-file-card__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.cloud-file-card:hover .cloud-file-card__actions {
  opacity: 1;
}

.danger-option {
  color: #f53f3f;
}
</style>
