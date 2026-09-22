<template>
  <V2Modal
    v-model:visible="dialogVisible"
    :title="t('cloud.moveTitle')"
    :ok-loading="loading"
    width="600px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="move-file-dialog">
      <div class="current-selection">
        {{ t('cloud.selected') }}：<strong>{{ selectedItemsText }}</strong>
      </div>

      <a-divider />

      <div class="folder-tree-container">
        <div class="folder-tree-header">
          <span>{{ t('cloud.selectDestination') }}：</span>
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
        {{ t('cloud.targetLocation') }}：<strong>{{ targetFolderPath }}</strong>
      </div>
    </div>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { fetchFolders } from '@/modules/cloud/api'
import type { Folder } from '@/modules/cloud/types'
import type { TreeNodeData } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { V2Modal } from '@/components/ui'

const { t } = useI18n()

interface Props {
  visible?: boolean
  loading?: boolean
  selectedCount?: number
  currentFolderId?: number | null
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
  return `${props.selectedCount} ${t('cloud.items')}`
})

const targetFolderPath = computed(() => {
  if (targetFolder.value === null) return ''
  return folderPathMap.value.get(targetFolder.value) || `/${t('cloud.rootDirectory')}`
})

async function loadRootFolders() {
  try {
    const folders = await fetchFolders(0)
    folderTreeData.value = [{
      key: 0,
      title: t('cloud.rootDirectory'),
      isLeaf: false,
      children: folders.map(folder => convertFolderToTreeNode(folder, `/${t('cloud.rootDirectory')}`)),
    }]
  } catch (error) {
    console.error('加载根目录失败:', error)
  }
}

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

function handleSelect(selectedKeysList: (string | number)[], _data: { node?: TreeNodeData }) {
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
  color: var(--text-primary);
}

.current-selection strong {
  color: var(--brand-blue);
}

.folder-tree-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.folder-tree-container :deep(.arco-tree-node-title:hover) {
  background: var(--info-bg);
}

.folder-tree-container :deep(.arco-tree-node-selected .arco-tree-node-title) {
  background: var(--info-bg);
  color: var(--brand-blue);
}

.folder-tree-header {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.folder-icon {
  font-size: 16px;
  margin-right: 4px;
}

.target-info {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.target-info strong {
  color: var(--text-primary);
}
</style>