<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="移动到"
    :ok-loading="loading"
    width="600px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="move-file-dialog">
      <div class="current-selection">
        已选择：<strong>{{ selectedItemsText }}</strong>
      </div>

      <a-divider />

      <div class="folder-tree-container">
        <div class="folder-tree-header">
          <span>选择目标文件夹：</span>
        </div>
        <a-tree
          :data="folderTreeData"
          :selected-keys="selectedKeys"
          :default-expand-all="true"
          @select="handleSelect"
        >
          <template #icon>
            <span class="folder-icon">📁</span>
          </template>
        </a-tree>
      </div>

      <div class="target-info" v-if="targetFolder">
        目标位置：<strong>{{ targetFolderPath }}</strong>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Folder } from '@/modules/cloud/types'
import type { TreeNodeData } from '@arco-design/web-vue'

interface Props {
  visible?: boolean
  loading?: boolean
  folderTree?: Folder[]
  selectedCount?: number
  currentFolderId?: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', targetFolderId: number): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  folderTree: () => [],
  selectedCount: 0,
  currentFolderId: 0,
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const selectedKeys = ref<number[]>([0])
const targetFolder = ref<number | null>(null)

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      // 重置选择
      selectedKeys.value = [0]
      targetFolder.value = 0
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const selectedItemsText = computed(() => {
  return `${props.selectedCount} 项`
})

const folderTreeData = computed<TreeNodeData[]>(() => {
  const rootNode: TreeNodeData = {
    key: 0,
    title: '根目录',
    children: convertToTreeData(props.folderTree),
  }
  return [rootNode]
})

const targetFolderPath = computed(() => {
  if (targetFolder.value === null) return ''
  if (targetFolder.value === 0) return '/根目录'

  const path = findFolderPath(props.folderTree, targetFolder.value)
  return path ? `/根目录/${path.join('/')}` : '/根目录'
})

function convertToTreeData(folders: Folder[]): TreeNodeData[] {
  return folders.map((folder) => ({
    key: folder.ID || folder.id || 0,
    title: folder.name,
    children: folder.Children ? convertToTreeData(folder.Children) : [],
    // 禁用当前文件夹（不能移动到自己）
    disabled: (folder.ID || folder.id) === props.currentFolderId,
  }))
}

function findFolderPath(folders: Folder[], targetId: number, path: string[] = []): string[] | null {
  for (const folder of folders) {
    const currentPath = [...path, folder.name]
    if ((folder.ID || folder.id) === targetId) {
      return currentPath
    }
    if (folder.Children) {
      const result = findFolderPath(folder.Children, targetId, currentPath)
      if (result) return result
    }
  }
  return null
}

function handleSelect(selectedKeysList: (string | number)[], data: { node?: TreeNodeData }) {
  if (selectedKeysList.length > 0) {
    const key = selectedKeysList[0]
    if (typeof key === 'number') {
      targetFolder.value = key
      selectedKeys.value = [key]
    }
  }
}

function handleOk() {
  if (targetFolder.value !== null && targetFolder.value !== props.currentFolderId) {
    emit('confirm', targetFolder.value)
  }
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<style scoped>
.move-file-dialog {
  padding: 8px 0;
}

.current-selection {
  font-size: 14px;
  color: #1f2937;
}

.current-selection strong {
  color: #3b82f6;
}

.folder-tree-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.folder-tree-header {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 12px;
}

.folder-icon {
  font-size: 16px;
  margin-right: 4px;
}

.target-info {
  margin-top: 12px;
  font-size: 13px;
  color: #6b7280;
}

.target-info strong {
  color: #1f2937;
}
</style>
