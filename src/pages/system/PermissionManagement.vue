<template>
  <div class="permission-management-page">
    <V2PageHeader title="权限矩阵" description="查看各权限组在安全目录/业务表上的权限分布">
      <template #actions>
        <V2Button type="secondary" :loading="loading" @click="loadMatrix">
          <template #icon><icon-refresh /></template>
          刷新
        </V2Button>
      </template>
    </V2PageHeader>

    <V2Card class="groups-card" :padding="true">
      <div class="card-section-title">权限组</div>
      <div v-if="matrix.groups.length" class="groups-list">
        <V2Tag v-for="group in matrix.groups" :key="group.id" type="info">{{ group.name }}</V2Tag>
      </div>
      <a-empty v-else description="暂无权限组" />
    </V2Card>

    <V2Card :padding="false" style="overflow: hidden;">
      <a-table
        :loading="loading"
        :data="flattenedModules"
        :pagination="false"
        :bordered="{ wrapper: true, cell: true }"
        row-key="id"
        :scroll="{ x: 1600 }"
      >
        <template #columns>
          <a-table-column title="模块/目录" fixed="left" :width="260">
            <template #cell="{ record }">
              <div class="module-name" :style="{ paddingLeft: `${record.depth * 16}px` }">
                <span class="module-icon">{{ record.type === 'directory' ? '📁' : '📊' }}</span>
                <span>{{ record.name }}</span>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="类型" :width="90">
            <template #cell="{ record }">
              <V2Tag :type="record.type === 'table' ? 'success' : 'neutral'">{{ record.type === 'table' ? '数据表' : '目录' }}</V2Tag>
            </template>
          </a-table-column>
          <a-table-column
            v-for="bit in permissionBits"
            :key="bit.bit"
            :title="bit.label"
            :width="140"
          >
            <template #cell="{ record }">
              <div class="permission-cell">
                <V2Tag
                  v-for="groupId in getAssignedGroups(record, bit.bit)"
                  :key="groupId"
                  type="info"
                  size="sm"
                >{{ groupMap.get(groupId) || groupId }}</V2Tag>
                <span v-if="!getAssignedGroups(record, bit.bit).length" class="text-muted">-</span>
              </div>
            </template>
          </a-table-column>
        </template>
        <template #empty>
          <a-empty description="暂无权限矩阵数据" />
        </template>
      </a-table>
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import { getPermissionMatrix, type PermissionMatrix, type PermissionMatrixModule } from '@/api/groups'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'

const loading = ref(false)
const matrix = reactive<PermissionMatrix>({ groups: [], modules: [] })

const permissionBits = [
  { bit: 1, label: '读取' },
  { bit: 2, label: '创建' },
  { bit: 4, label: '更新' },
  { bit: 8, label: '删除' },
  { bit: 16, label: '提交' },
  { bit: 32, label: '反提交' },
  { bit: 64, label: '导出' },
  { bit: 128, label: '导入' }
]

const groupMap = computed(() => {
  const map = new Map<number, string>()
  matrix.groups.forEach((g) => map.set(g.id, g.name))
  return map
})

interface FlatModule extends PermissionMatrixModule {
  depth: number
}

const flattenModules = (modules: PermissionMatrixModule[], depth = 0): FlatModule[] => {
  const result: FlatModule[] = []
  modules.forEach((m) => {
    result.push({ ...m, depth })
    if (m.children?.length) {
      result.push(...flattenModules(m.children, depth + 1))
    }
  })
  return result
}

const flattenedModules = computed(() => flattenModules(matrix.modules))

const getAssignedGroups = (record: FlatModule, bit: number) => {
  const perm = record.permissions?.find((p) => p.bit === bit)
  return perm?.assignedGroups || []
}

const loadMatrix = async () => {
  loading.value = true
  try {
    const data = await getPermissionMatrix()
    matrix.groups = data.groups || []
    matrix.modules = data.modules || []
  } catch (error: any) {
    console.error('加载权限矩阵失败:', error)
    Message.error(error.response?.data?.message || '加载权限矩阵失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadMatrix())
</script>

<style scoped>
.permission-management-page {
  padding: 12px;
  background: var(--bg-page);
  height: 100%;
  overflow-y: auto;
}

.groups-card {
  margin-bottom: 16px;
}

.card-section-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.module-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 500;
}

.module-icon {
  color: var(--text-secondary);
  font-size: 16px;
  flex-shrink: 0;
}

.permission-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.text-muted {
  color: var(--text-tertiary);
}
</style>
