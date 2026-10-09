<template>
  <div class="cloud-folder-select">
    <a-tree-select
      :model-value="modelValue"
      :data="treeData"
      :loading="loading"
      allow-search
      :filter-tree-node="filterNode"
      :placeholder="placeholder"
      @change="handleChange"
    />
    <!-- 根目录已在下拉框中显示名称，不再重复显示 / -->
    <div v-if="selectedPath && selectedPath !== '/'" class="folder-path">{{ selectedPath }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { TreeNodeData } from '@arco-design/web-vue'
import api from '@/api/http'

/** 云盘根目录的取值（提交时由调用方转换为空） */
const ROOT = 0

interface FolderNode {
  id: number
  name: string
  path: string
  children?: FolderNode[]
}

const props = defineProps<{
  /** 选中的云盘文件夹 ID；0 为云盘根目录，undefined 为未选择 */
  modelValue?: number
  placeholder?: string
  rootLabel: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  /** 选中文件夹的完整路径（根目录为 /，未选择为空），文件夹树加载完成后也会更新 */
  (e: 'path-change', path: string): void
}>()

const loading = ref(false)
const folders = ref<FolderNode[]>([])
const pathMap = ref(new Map<number, string>())

const toNodes = (list: FolderNode[]): TreeNodeData[] =>
  list.map((f) => {
    pathMap.value.set(f.id, f.path)
    return { key: f.id, title: f.name, children: f.children?.length ? toNodes(f.children) : undefined }
  })

const treeData = computed<TreeNodeData[]>(() => [
  { key: ROOT, title: props.rootLabel, children: toNodes(folders.value) },
])

const selectedPath = computed(() => {
  if (props.modelValue === undefined) return ''
  if (props.modelValue === ROOT) return '/'
  return pathMap.value.get(props.modelValue) || ''
})

watch(selectedPath, (path) => emit('path-change', path), { immediate: true })

const filterNode = (search: string, node: TreeNodeData) =>
  String(node.title ?? '').toLowerCase().includes(search.toLowerCase())

const handleChange = (value: unknown) => {
  emit('update:modelValue', Number(value))
}

// 当前用户的云盘文件夹树（含完整路径）
const loadFolders = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/cloud/folders/tree')
    folders.value = Array.isArray(data?.data) ? data.data : []
  } catch {
    folders.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadFolders)
</script>

<style scoped>
.cloud-folder-select {
  width: 100%;
}

.folder-path {
  margin-top: 4px;
  overflow: hidden;
  font-size: 12px;
  color: var(--text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
