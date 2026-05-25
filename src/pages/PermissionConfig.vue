<template>
  <div class="permission-config-page">
    <a-tabs v-model:active-key="activeTab" type="card">
      <a-tab-pane key="groups" title="权限组管理">
        <div class="section">
          <div class="section-header">
            <span class="section-title">权限组</span>
            <a-button size="small" type="primary" @click="openGroupEdit()">
              <template #icon><icon-plus /></template>
              新增权限组
            </a-button>
          </div>
          <a-table :columns="groupColumns" :data="groupList" :loading="groupLoading" row-key="id" size="small" :pagination="false">
            <template #actions="{ record }">
              <a-button size="mini" @click="openGroupEdit(record)">编辑</a-button>
              <a-button size="mini" @click="selectGroup(record)">权限配置</a-button>
            </template>
          </a-table>
        </div>

        <div v-if="selectedGroup" class="section">
          <div class="section-header">
            <span class="section-title">权限配置 - {{ selectedGroup.NAME }}</span>
            <a-button size="small" @click="selectedGroup = null">关闭</a-button>
          </div>
          <PermissionMatrix :group-id="selectedGroup.ID || selectedGroup.id" />
        </div>

        <a-modal v-model:visible="groupDialogVisible" :title="editingGroup?.id ? '编辑权限组' : '新增权限组'" width="500px" @ok="handleGroupSave">
          <a-form :model="groupForm" layout="vertical">
            <a-form-item label="名称" required>
              <a-input v-model="groupForm.NAME" placeholder="权限组名称" />
            </a-form-item>
            <a-form-item label="安全等级">
              <a-input-number v-model="groupForm.SGRADE" :min="1" :max="999" placeholder="数字越大权限越高" />
            </a-form-item>
            <a-form-item label="描述">
              <a-textarea v-model="groupForm.DESCRIPTION" placeholder="权限组描述" :rows="3" />
            </a-form-item>
          </a-form>
        </a-modal>
      </a-tab-pane>

      <a-tab-pane key="users" title="用户权限分配">
        <div class="section">
          <div class="section-header"><span class="section-title">用户列表</span></div>
          <a-table :columns="userColumns" :data="userList" :loading="userLoading" row-key="id" size="small" :pagination="false">
            <template #actions="{ record }">
              <a-button size="mini" @click="selectUser(record)">权限组分配</a-button>
            </template>
          </a-table>
        </div>
        <div v-if="selectedUser" class="section">
          <div class="section-header">
            <span class="section-title">权限组分配 - {{ selectedUser.NAME || selectedUser.USERNAME }}</span>
            <a-button size="small" @click="selectedUser = null">关闭</a-button>
          </div>
          <UserGroupsPanel :user-id="selectedUser.ID || selectedUser.id" />
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import api from '@/api/http'
import PermissionMatrix from '../modules/metadata/components/PermissionMatrix.vue'
import UserGroupsPanel from '../modules/metadata/components/UserGroupsPanel.vue'

interface Props {
  groupId?: number
}
const props = defineProps<Props>()

const activeTab = ref('groups')
const groupList = ref<any[]>([])
const groupLoading = ref(false)
const selectedGroup = ref<any>(null)
const groupDialogVisible = ref(false)
const editingGroup = ref<any>(null)
const groupForm = ref({ NAME: '', SGRADE: 1, DESCRIPTION: '' })

const userList = ref<any[]>([])
const userLoading = ref(false)
const selectedUser = ref<any>(null)

const groupColumns = [
  { title: '名称', dataIndex: 'NAME' },
  { title: '安全等级', dataIndex: 'SGRADE', width: 80 },
  { title: '描述', dataIndex: 'DESCRIPTION', ellipsis: true },
  { title: '操作', slotName: 'actions', width: 160 }
]
const userColumns = [
  { title: '用户名', dataIndex: 'USERNAME' },
  { title: '显示名', dataIndex: 'NAME' },
  { title: '是否管理员', dataIndex: 'IS_ADMIN', width: 90 },
  { title: '公司ID', dataIndex: 'SYS_COMPANY_ID', width: 80 },
  { title: '操作', slotName: 'actions', width: 100 }
]

async function loadGroups() {
  groupLoading.value = true
  try {
    const { data } = await api.get('/groups')
    groupList.value = data.data?.records || data.data || []
  } finally { groupLoading.value = false }
}

async function loadUsers() {
  userLoading.value = true
  try {
    const { data } = await api.get('/users')
    userList.value = data.data?.records || data.data || []
  } finally { userLoading.value = false }
}

function openGroupEdit(record?: any) {
  editingGroup.value = record || null
  groupForm.value = record
    ? { NAME: record.NAME, SGRADE: record.SGRADE || 1, DESCRIPTION: record.DESCRIPTION || '' }
    : { NAME: '', SGRADE: 1, DESCRIPTION: '' }
  groupDialogVisible.value = true
}

async function handleGroupSave() {
  try {
    if (editingGroup.value) {
      await api.put(`/groups/${editingGroup.value.id || editingGroup.value.ID}`, groupForm.value)
    } else {
      await api.post('/groups', groupForm.value)
    }
    Message.success(editingGroup.value ? '更新成功' : '创建成功')
    groupDialogVisible.value = false
    await loadGroups()
  } catch { Message.error('保存失败') }
}

function selectGroup(record: any) { selectedGroup.value = record }
function selectUser(record: any) { selectedUser.value = record }

onMounted(async () => {
  await loadGroups()
  loadUsers()
  if (props.groupId) {
    const g = groupList.value.find((g: any) => (g.ID || g.id) === props.groupId)
    if (g) selectGroup(g)
  }
})
</script>

<style scoped>
.permission-config-page { padding: 16px; background: #f5f6fa; min-height: 100%; }
.section { background: #fff; border: 1px solid #e5e6eb; border-radius: 4px; margin-bottom: 16px; }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f7f8fa; border-bottom: 1px solid #e5e6eb; }
.section-title { font-size: 14px; font-weight: 500; color: #1d2129; }
</style>
