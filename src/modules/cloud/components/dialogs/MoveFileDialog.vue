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
          :load-more="loadMore"
          @select="handleSelect"
        >
          <template #icon>
            <span class="folder-icon">📁</span>
          </template>
        </a-tree>
      </div>

      <div class="target-info" v-if="targetFolder !== null">
        目标位置：<strong>{{ targetFolderPath }}</strong>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { fetchFolders } from '@/modules/cloud/api'
import type { Folder } from '@/modules/cloud/types'
import type { TreeNodeData } from '@arco-design/web-vue'

interface Props {
  visible?: boolean
  loading?: boolean
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
  selectedCount: 0,
  currentFolderId: 0,
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const selectedKeys = ref<number[]>([0])
const targetFolder = ref<number | null>(null)
const folderTreeData = ref<TreeNodeData[]>([])
const folderPathMap = ref<Map<number, string>>(new Map())

watch(
  () => props.visible,
  async (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      // 重置选择
      selectedKeys.value = [0]
      targetFolder.value = 0
      folderPathMap.value.clear()
      folderPathMap.value.set(0, '/根目录')

      // 加载根目录的子文件夹
      await loadRootFolders()
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const selectedItemsText = computed(() => {
  return `${props.selectedCount} 项`
})

const targetFolderPath = computed(() => {
  if (targetFolder.value === null) return ''
  return folderPathMap.value.get(targetFolder.value) || '/根目录'
})

// 加载根目录的子文件夹
async function loadRootFolders() {
  try {
    const folders = await fetchFolders(0)
    folderTreeData.value = [{
      key: 0,
      title: '根目录',
      isLeaf: false,
      children: folders.map(folder => convertFolderToTreeNode(folder, '/根目录')),
    }]
  } catch (error) {
    console.error('加载根目录失败:', error)
  }
}

// 懒加载子文件夹
async function loadMore(node: TreeNodeData): Promise<void> {
  const folderId = node.key as number

  try {
    const folders = await fetchFolders(folderId)
    const parentPath = folderPathMap.value.get(folderId) || '/根目录'

    node.children = folders.map(folder => convertFolderToTreeNode(folder, parentPath))
  } catch (error) {
    console.error('加载子文件夹失败:', error)
    node.children = []
  }
}

// 将 Folder 转换为 TreeNodeData
function convertFolderToTreeNode(folder: Folder, parentPath: string): TreeNodeData {
  const folderId = folder.ID || folder.id || 0
  const folderPath = `${parentPath}/${folder.name}`

  // 保存路径映射
  folderPathMap.value.set(folderId, folderPath)

  return {
    key: folderId,
    title: folder.name,
    isLeaf: false, // 假设所有文件夹都可能有子文件夹
    disabled: folderId === props.currentFolderId, // 禁用当前文件夹
  }
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
