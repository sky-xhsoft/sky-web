<template>
  <div class="permission-matrix">
    <div class="matrix-toolbar">
      <a-space>
        <V2Button type="secondary" size="sm" @click="checkAll">全选</V2Button>
        <V2Button type="secondary" size="sm" @click="uncheckAll">全不选</V2Button>
        <V2Button type="primary" size="sm" :loading="saving" @click="handleSave">保存</V2Button>
      </a-space>
      <span class="matrix-summary">
        菜单 {{ flatItems.length }} 项，已选 {{ checkedCount }} 项
      </span>
    </div>

    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="col-dir">菜单</th>
            <th class="col-bit">读</th>
            <th class="col-bit">增</th>
            <th class="col-bit">改</th>
            <th class="col-bit">删</th>
            <th class="col-bit">提交</th>
            <th class="col-bit">反提交</th>
            <th class="col-bit">导出</th>
            <th class="col-bit">导入</th>
            <th class="col-val">值</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in flatItems" :key="item.key">
            <tr v-if="item.type === 'table'" class="row-table">
              <td class="col-dir">
                <span class="dir-name" :style="{ paddingLeft: `${item.depth * 16 + 24}px` }">{{ item.label }}</span>
              </td>
              <td class="col-bit" v-for="bit in bits" :key="bit.value">
                <a-checkbox
                  :model-value="hasPermission(item, bit.value)"
                  :disabled="saving"
                  @change="(v: boolean) => toggleBit(item, bit.value, v)"
                />
              </td>
              <td class="col-val">{{ getItemValue(item) }}</td>
            </tr>
            <tr v-else-if="item.type === 'subsystem'" class="row-subsystem">
              <td class="col-dir" :colspan="10">
                <span class="subsystem-label">{{ item.label }}</span>
              </td>
            </tr>
            <tr v-else-if="item.type === 'category'" class="row-category">
              <td class="col-dir" :colspan="10">
                <span class="category-label" :style="{ paddingLeft: `${item.depth * 16}px` }">{{ item.label }}</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '@/api/http'
import { V2Button } from '@/components/ui'

const bits = [
  { label: '读', value: 1 },
  { label: '增', value: 2 },
  { label: '改', value: 4 },
  { label: '删', value: 8 },
  { label: '提交', value: 16 },
  { label: '反提交', value: 32 },
  { label: '导出', value: 64 },
  { label: '导入', value: 128 },
]

interface PermissionBitInfo {
  bit: number
  label: string
  assignedGroups: number[]
}

interface PermissionMatrixModule {
  id: number
  name: string
  displayName?: string
  type: 'directory' | 'table' | string
  tableId?: number
  directoryId: number
  permissions: PermissionBitInfo[]
  children?: PermissionMatrixModule[]
}

interface FlatItem {
  key: string
  label: string
  type: 'subsystem' | 'category' | 'table'
  depth: number
  directoryId: number
}

interface Props {
  groupId: number
}

const props = defineProps<Props>()

const matrixGroups = ref<any[]>([])
const modules = ref<PermissionMatrixModule[]>([])
const flatItems = ref<FlatItem[]>([])
const checkedBits = ref<Record<number, number>>({})
const saving = ref(false)

const checkedCount = computed(() => {
  let count = 0
  for (const item of flatItems.value) {
    if (item.type !== 'table') continue
    const val = checkedBits.value[item.directoryId] || 0
    for (const bit of bits) {
      if ((val & bit.value) === bit.value) count++
    }
  }
  return count
})

function hasPermission(item: FlatItem, bit: number): boolean {
  if (item.type !== 'table') return false
  const val = checkedBits.value[item.directoryId] || 0
  return (val & bit) === bit
}

function toggleBit(item: FlatItem, bit: number, checked: boolean) {
  if (item.type !== 'table') return
  const key = item.directoryId
  const current = checkedBits.value[key] || 0
  if (checked) {
    checkedBits.value[key] = current | bit
  } else {
    checkedBits.value[key] = current & ~bit
  }
}

function getItemValue(item: FlatItem): number {
  if (item.type !== 'table') return 0
  return checkedBits.value[item.directoryId] || 0
}

function checkAll() {
  for (const item of flatItems.value) {
    if (item.type === 'table') {
      checkedBits.value[item.directoryId] = 255
    }
  }
}

function uncheckAll() {
  checkedBits.value = {}
}

function computeFlatItems(nodes: PermissionMatrixModule[], depth = 0): FlatItem[] {
  const flat: FlatItem[] = []
  for (const node of nodes) {
    const isTable = node.type === 'table'
    let type: FlatItem['type']
    if (isTable) {
      type = 'table'
    } else if (depth === 0) {
      type = 'subsystem'
    } else {
      type = 'category'
    }

    flat.push({
      key: `${type}_${node.id}`,
      label: node.displayName || node.name,
      type,
      depth,
      directoryId: node.directoryId,
    })

    if (node.children?.length) {
      flat.push(...computeFlatItems(node.children, depth + 1))
    }
  }
  return flat
}

function buildCheckedMap(nodes: PermissionMatrixModule[]): Record<number, number> {
  const map: Record<number, number> = {}
  for (const node of nodes) {
    let value = 0
    for (const perm of node.permissions || []) {
      if (perm.assignedGroups.map(Number).includes(props.groupId)) {
        value |= perm.bit
      }
    }
    if (value > 0) {
      map[node.directoryId] = value
    }
    if (node.children?.length) {
      Object.assign(map, buildCheckedMap(node.children))
    }
  }
  return map
}

async function loadMatrix() {
  try {
    const { data } = await api.get('/permissions/matrix')
    const result = data.data || {}
    matrixGroups.value = result.groups || []
    modules.value = result.modules || []
    flatItems.value = computeFlatItems(modules.value)
    checkedBits.value = buildCheckedMap(modules.value)
  } catch {
    Message.error('加载权限矩阵失败')
  }
}

async function handleSave() {
  if (!props.groupId) {
    Message.warning('请选择权限组')
    return
  }
  saving.value = true
  try {
    const premList: { sysDirectoryId: number; permission: number }[] = []
    for (const item of flatItems.value) {
      const perm = checkedBits.value[item.directoryId] || 0
      if (perm === 0) continue
      premList.push({
        sysDirectoryId: item.directoryId,
        permission: perm,
      })
    }
    await api.post(`/groups/${props.groupId}/permissions`, { permissions: premList })
    Message.success('权限配置保存成功')
    await loadMatrix()
  } catch {
    Message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadMatrix()
})

watch(() => props.groupId, async () => {
  checkedBits.value = buildCheckedMap(modules.value)
})
</script>

<style scoped>
.permission-matrix {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.matrix-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border);
}
.matrix-summary {
  font-size: 13px;
  color: var(--text-secondary);
}
.matrix-table-wrap {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}
.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.matrix-table th {
  background: var(--bg-hover);
  padding: 8px 12px;
  text-align: center;
  font-weight: 500;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.matrix-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}
.row-table:hover td {
  background: var(--bg-hover);
}
.row-subsystem td {
  background: var(--info-bg);
  padding: 6px 16px;
}
.row-category td {
  background: var(--bg-hover);
  padding: 4px 16px;
}
.subsystem-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
.category-label {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-secondary);
}
.col-dir {
  text-align: left !important;
  min-width: 200px;
}
.dir-name {
  font-weight: 500;
  color: var(--text-primary);
}
.col-bit {
  width: 44px;
  padding: 6px 8px !important;
}
.col-val {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-secondary);
  width: 44px;
}
</style>
