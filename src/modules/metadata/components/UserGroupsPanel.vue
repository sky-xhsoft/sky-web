<template>
  <div class="user-groups-panel">
    <div class="panel-toolbar">
      <a-space>
        <a-button size="small" type="primary" @click="showDialog = true">
          <template #icon><icon-plus /></template>
          添加权限组
        </a-button>
      </a-space>
      <span class="panel-summary">已分配 {{ userGroups.length }} 个权限组</span>
    </div>

    <a-table
      :columns="columns"
      :data="userGroups"
      :pagination="false"
      row-key="id"
      size="small"
    >
      <template #actions="{ record }">
        <a-button type="text" size="mini" status="danger" @click="handleRemove(record)">移除</a-button>
      </template>
    </a-table>

    <a-modal v-model:visible="showDialog" title="选择权限组" :footer="false" width="600px">
      <a-transfer
        v-model:model-value="selectedGroupIds"
        :data="transferData"
        :titles="['可选权限组', '已选权限组']"
        show-search
        :filter-option="filterOption"
      />
      <div class="dialog-footer">
        <a-button @click="showDialog = false">取消</a-button>
        <a-button type="primary" @click="handleAssign">确定</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import api from '@/api/http'

interface Props {
  userId: number
}

const props = defineProps<Props>()

const allGroups = ref<any[]>([])
const userGroups = ref<any[]>([])
const showDialog = ref(false)
const selectedGroupIds = ref<number[]>([])

const columns = [
  { title: '名称', dataIndex: 'NAME', key: 'NAME' },
  { title: '描述', dataIndex: 'DESCRIPTION', key: 'DESCRIPTION', ellipsis: true },
  { title: '安全等级', dataIndex: 'SGRADE', key: 'SGRADE', width: 80 },
  { title: '操作', slotName: 'actions', width: 80 }
]

const transferData = computed(() =>
  allGroups.value.map(g => ({
    key: g.ID || g.id,
    value: g.ID || g.id,
    label: g.NAME || g.name,
    disabled: false
  }))
)

function filterOption(inputValue: string, option: any) {
  return (option.label || '').indexOf(inputValue) > -1
}

async function loadAllGroups() {
  try {
    const { data } = await api.get('/groups')
    allGroups.value = data.data?.records || data.data || []
  } catch { /* ignore */ }
}

async function loadUserGroups() {
  if (!props.userId) return
  try {
    const { data } = await api.get(`/groups/users/${props.userId}`)
    userGroups.value = data.data?.groupPremList || data.data || []
  } catch { /* ignore */ }
}

async function handleRemove(record: any) {
  try {
    await api.delete(`/groups/users/${props.userId}`, {
      data: { groupId: record.GROUP_ID || record.groupId }
    })
    Message.success('移除成功')
    await loadUserGroups()
  } catch {
    Message.error('移除失败')
  }
}

async function handleAssign() {
  if (selectedGroupIds.value.length === 0) {
    Message.warning('请选择权限组')
    return
  }
  try {
    await api.post(`/groups/users/${props.userId}`, { groupIds: selectedGroupIds.value })
    Message.success('分配成功')
    showDialog.value = false
    await loadUserGroups()
  } catch {
    Message.error('分配失败')
  }
}

onMounted(async () => {
  await loadAllGroups()
  if (props.userId) await loadUserGroups()
})

watch(() => props.userId, async (id) => {
  if (id) await loadUserGroups()
})
</script>

<style scoped>
.user-groups-panel {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}
.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #e5e6eb;
}
.panel-summary {
  font-size: 13px;
  color: #86909c;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
