<template>
  <V2Modal
    v-model:visible="dialogVisible"
    :title="t('cloudItemPermission.title')"
    :footer="false"
    @cancel="handleCancel"
    @before-ok="() => false"
  >
    <div class="perm-dialog">
      <div class="perm-item-info">
        <a-tag :color="itemType === 'folder' ? 'arcoblue' : 'green'" size="small">
          {{ itemType === 'folder' ? t('cloud.folder') : t('cloud.file') }}
        </a-tag>
        <span class="perm-item-name">{{ itemName }}</span>
      </div>

      <!-- 已有权限列表 -->
      <div class="perm-section-title">{{ t('cloudItemPermission.existing') }}</div>
      <div v-if="loading" class="perm-empty">{{ t('cloudItemPermission.loading') }}</div>
      <div v-else-if="permissions.length === 0" class="perm-empty">
        {{ t('cloudItemPermission.noPerms') }}
      </div>
      <div v-else class="perm-list">
        <div v-for="p in permissions" :key="p.id" class="perm-row">
          <div class="perm-target">
            <icon-user />
            <span class="perm-target-name">{{ resolveTargetName(p) }}</span>
            <a-tag v-if="p.targetType !== 'user'" size="small" color="orange">
              {{ targetTypeLabel(p) }}
            </a-tag>
          </div>
          <div class="perm-flags">
            <a-tag v-if="p.permRead === 'Y'" color="blue" size="small">{{ t('cloudItemPermission.read') }}</a-tag>
            <a-tag v-if="p.permWrite === 'Y'" color="green" size="small">{{ t('cloudItemPermission.write') }}</a-tag>
            <a-tag v-if="p.permRead !== 'Y' && p.permWrite !== 'Y'" size="small" color="gray">{{ t('cloudItemPermission.none') }}</a-tag>
          </div>
          <a-button type="text" size="mini" status="danger" @click="handleRemovePermission(p)">
            <icon-delete />
          </a-button>
        </div>
      </div>

      <!-- 添加授权 -->
      <div class="perm-section-title">{{ t('cloudItemPermission.grant') }}</div>
      <div class="perm-add-row">
        <a-select
          v-model="newPerm.targetType"
          class="perm-type-select"
          :placeholder="t('cloudItemPermission.targetType')"
        >
          <a-option value="user">{{ t('cloudItemPermission.typeUser') }}</a-option>
          <a-option value="role">{{ t('cloudItemPermission.typeRole') }}</a-option>
        </a-select>
        <a-select
          v-model="newPerm.targetId"
          class="perm-user-select"
          :placeholder="t('cloudItemPermission.selectUser')"
          allow-search
          :options="userOptions"
          :filter-option="filterUser"
        />
      </div>
      <div class="perm-check-row">
        <a-checkbox v-model="newPerm.permRead">{{ t('cloudItemPermission.read') }}</a-checkbox>
        <a-checkbox v-model="newPerm.permWrite">{{ t('cloudItemPermission.write') }}</a-checkbox>
        <span class="perm-hint">{{ t('cloudItemPermission.readHint') }}</span>
      </div>
      <div class="perm-add-btn-row">
        <V2Button type="primary" :loading="adding" @click="handleAddPermission">
          {{ t('cloudItemPermission.add') }}
        </V2Button>
      </div>
    </div>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconUser,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import { useI18n } from 'vue-i18n'
import { V2Modal, V2Button } from '@/components/ui'
import {
  getItemPermissions,
  setItemPermission,
  removeItemPermission,
  fetchCompanyUsers,
  type ItemPermission,
} from '@/modules/cloud/api/cloud'

interface Props {
  visible?: boolean
  itemId?: number | null
  itemName?: string
  itemType?: 'file' | 'folder'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'changed'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  itemId: null,
  itemName: '',
  itemType: 'folder',
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const dialogVisible = ref(props.visible)
const loading = ref(false)
const adding = ref(false)
const permissions = ref<ItemPermission[]>([])
const users = ref<{ id: number; username: string; name?: string }[]>([])
const newPerm = ref({
  targetType: 'user',
  targetId: undefined as number | undefined,
  permRead: true,
  permWrite: false,
})

const userOptions = computed(() =>
  users.value.map((u) => ({
    label: u.name ? `${u.username}（${u.name}）` : u.username,
    value: u.id,
  }))
)

function filterUser(option: any, keyword: string) {
  const text = `${option?.label || ''}`.toLowerCase()
  return text.includes(String(keyword || '').toLowerCase())
}

watch(
  () => props.visible,
  async (newValue) => {
    dialogVisible.value = newValue
    if (newValue && props.itemId) {
      await Promise.all([loadPermissions(), loadUsers()])
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

async function loadPermissions() {
  if (!props.itemId) return
  loading.value = true
  try {
    permissions.value = await getItemPermissions(props.itemId)
    // 补充对象名称（关联用户列表）
    const nameMap = new Map(users.value.map((u) => [u.id, u.username]))
    permissions.value.forEach((p) => {
      if (p.targetType === 'user') p.targetName = nameMap.get(p.targetId) || `#${p.targetId}`
    })
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  users.value = await fetchCompanyUsers()
}

function resolveTargetName(p: ItemPermission): string {
  return p.targetName || (p.targetType === 'user' ? `用户 #${p.targetId}` : `#${p.targetId}`)
}

function targetTypeLabel(p: ItemPermission): string {
  return p.targetType === 'role' ? t('cloudItemPermission.typeRole') : t('cloudItemPermission.typeGroup')
}

async function handleAddPermission() {
  if (!props.itemId || !newPerm.value.targetId) {
    Message.warning(t('cloudItemPermission.selectUserFirst'))
    return
  }
  adding.value = true
  try {
    await setItemPermission(props.itemId, {
      targetType: newPerm.value.targetType,
      targetId: newPerm.value.targetId,
      permRead: !!newPerm.value.permRead,
      permWrite: !!newPerm.value.permWrite,
    })
    Message.success(t('cloudItemPermission.addSuccess'))
    const addedUser = users.value.find((u) => u.id === newPerm.value.targetId)
    newPerm.value = { targetType: 'user', targetId: undefined, permRead: true, permWrite: false }
    await loadPermissions()
    if (addedUser) {
      const last = permissions.value[permissions.value.length - 1]
      if (last) last.targetName = addedUser.username
    }
    emit('changed')
  } catch (e: any) {
    Message.error(e?.message || t('cloudItemPermission.addFailed'))
  } finally {
    adding.value = false
  }
}

async function handleRemovePermission(p: ItemPermission) {
  if (!props.itemId) return
  try {
    await removeItemPermission(props.itemId, p.id)
    Message.success(t('cloudItemPermission.removeSuccess'))
    await loadPermissions()
    emit('changed')
  } catch (e: any) {
    Message.error(e?.message || t('cloudItemPermission.removeFailed'))
  }
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<style scoped>
.perm-dialog {
  padding: 4px 0;
}
.perm-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.perm-item-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.perm-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 12px 0 8px;
}
.perm-empty {
  font-size: 13px;
  color: var(--text-3);
  padding: 12px 0;
  text-align: center;
}
.perm-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}
.perm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(245, 246, 250, 0.6);
  border-radius: 6px;
}
.perm-target {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.perm-target-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.perm-flags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.perm-add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.perm-type-select {
  width: 110px;
  flex-shrink: 0;
}
.perm-user-select {
  flex: 1;
}
.perm-check-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.perm-hint {
  font-size: 12px;
  color: var(--text-3);
  margin-left: 8px;
}
.perm-add-btn-row {
  display: flex;
  justify-content: flex-end;
}
</style>