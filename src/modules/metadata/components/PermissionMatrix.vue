<template>
  <div class="permission-matrix">
    <div class="matrix-toolbar">
      <a-space>
        <a-button size="small" @click="checkAll">全选</a-button>
        <a-button size="small" @click="uncheckAll">全不选</a-button>
        <a-button size="small" type="primary" :loading="saving" @click="handleSave">保存</a-button>
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
                <span class="dir-name">{{ item.label }}</span>
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
                <span class="category-label">{{ '├─ ' + item.label }}</span>
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

interface FlatItem {
  key: string
  label: string
  type: 'subsystem' | 'category' | 'table'
  tableId?: number
}

interface Props {
  groupId: number
}

const props = defineProps<Props>()

const flatItems = ref<FlatItem[]>([])
const permissions = ref<Record<number, number>>({})
const saving = ref(false)
const directories = ref<any[]>([])

const checkedCount = computed(() => {
  let count = 0
  for (const item of flatItems.value) {
    if (item.type !== 'table') continue
    const val = permissions.value[item.tableId!] || 0
    for (const bit of bits) {
      if ((val & bit.value) === bit.value) count++
    }
  }
  return count
})

function hasPermission(item: FlatItem, bit: number): boolean {
  if (item.type !== 'table') return false
  const val = permissions.value[item.tableId!] || 0
  return (val & bit) === bit
}

function toggleBit(item: FlatItem, bit: number, checked: boolean) {
  if (item.type !== 'table') return
  const key = item.tableId!
  const current = permissions.value[key] || 0
  if (checked) {
    permissions.value[key] = current | bit
  } else {
    permissions.value[key] = current & ~bit
  }
}

function getItemValue(item: FlatItem): number {
  if (item.type !== 'table') return 0
  return permissions.value[item.tableId!] || 0
}

function checkAll() {
  for (const item of flatItems.value) {
    if (item.type === 'table') {
      permissions.value[item.tableId!] = 255
    }
  }
}

function uncheckAll() {
  permissions.value = {}
}

async function loadMenuTree() {
  try {
    const { data } = await api.get('/menus/tree')
    const tree = data.data || []
    const flat: FlatItem[] = []
    walkTree(tree, flat, '')
    flatItems.value = flat
  } catch {
    Message.error('加载菜单树失败')
  }
}

function walkTree(nodes: any[], flat: FlatItem[], parentKey: string) {
  for (const node of nodes) {
    if (node.type === 'subsystem') {
      flat.push({ key: `s_${node.id}`, label: node.name || node.displayName, type: 'subsystem' })
      if (node.children) walkTree(node.children, flat, `s_${node.id}`)
    } else if (node.type === 'category') {
      flat.push({ key: `c_${node.id}`, label: node.name || node.displayName, type: 'category' })
      if (node.children) walkTree(node.children, flat, `c_${node.id}`)
    } else if (node.type === 'table') {
      flat.push({
        key: `t_${node.id}`,
        label: node.displayName || node.name,
        type: 'table',
        tableId: node.id
      })
    }
  }
}

async function loadPermissions() {
  if (!props.groupId) return
  try {
    const { data } = await api.get(`/groups/${props.groupId}/permissions`)
    const list = data.data || []
    const map: Record<number, number> = {}
    // 先加载目录列表，建立 tableId 映射
    try {
      const dirData = await api.get('/directories')
      const dirs = dirData.data.data || []
      directories.value = dirs

      for (const item of list) {
        const dirId = item.SYS_DIRECTORY_ID || item.sysDirectoryId || item.directoryId
        const perm = item.PERMISSION || item.permission || 0
        // 通过 directory 找到对应的 tableId
        const dir = dirs.find((d: any) => (d.ID || d.id) === dirId)
        const tableId = dir?.SYS_TABLE_ID || dir?.sysTableId
        if (dirId && tableId) {
          map[tableId] = (map[tableId] || 0) | Number(perm)
        }
      }
    } catch { /* ignore */ }
    permissions.value = map
  } catch {
    // 首次可能没有权限数据
  }
}

async function handleSave() {
  saving.value = true
  try {
    // 需要把 table→permission 转换为 directory→permission
    // 从已加载的 directories 中找到每个 table 对应的 directory
    const premList: any[] = []
    for (const item of flatItems.value) {
      if (item.type !== 'table') continue
      const perm = permissions.value[item.tableId!] || 0
      if (perm === 0) continue
      const dir = directories.value.find((d: any) =>
        (d.SYS_TABLE_ID || d.sysTableId) === item.tableId
      )
      if (dir) {
        premList.push({
          sysDirectoryId: dir.ID || dir.id,
          permission: perm
        })
      }
    }
    await api.post(`/groups/${props.groupId}/permissions`, { permissions: premList })
    Message.success('权限配置保存成功')
  } catch {
    Message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadMenuTree()
  await loadDirectories()
  if (props.groupId) await loadPermissions()
})

async function loadDirectories() {
  try {
    const { data } = await api.get('/directories')
    directories.value = data.data || []
  } catch { /* ignore */ }
}

watch(() => props.groupId, async (id) => {
  if (id) await loadPermissions()
})
</script>

<style scoped>
.permission-matrix {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}
.matrix-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #e5e6eb;
}
.matrix-summary {
  font-size: 13px;
  color: #86909c;
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
  background: #f7f8fa;
  padding: 8px 12px;
  text-align: center;
  font-weight: 500;
  color: #1d2129;
  border-bottom: 1px solid #e5e6eb;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.matrix-table td {
  padding: 6px 12px;
  border-bottom: 1px solid #f2f3f5;
  text-align: center;
}
.row-table:hover td {
  background: #f7f8fa;
}
.row-subsystem td {
  background: #e8f0fe;
  padding: 6px 16px;
}
.row-category td {
  background: #f0f5ff;
  padding: 4px 16px;
}
.subsystem-label {
  font-weight: 600;
  font-size: 14px;
  color: #1d2129;
}
.category-label {
  font-weight: 500;
  font-size: 13px;
  color: #4e5969;
}
.col-dir {
  text-align: left !important;
  min-width: 200px;
}
.dir-name {
  font-weight: 500;
  color: #1d2129;
  padding-left: 24px;
}
.col-bit {
  width: 44px;
  padding: 6px 8px !important;
}
.col-val {
  font-family: monospace;
  font-size: 12px;
  color: #86909c;
  width: 44px;
}
</style>
