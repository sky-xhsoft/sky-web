<template>
  <div class="group-permission-view">
    <header class="page-header">
      <a-button @click="handleBack">
        <template #icon><icon-left /></template>
        返回
      </a-button>
      <span class="page-title">权限配置 - {{ group?.NAME || '' }}</span>
    </header>
    <main class="page-body">
      <a-spin :loading="loading">
        <PermissionMatrix v-if="groupId" :group-id="groupId" />
      </a-spin>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNavigationStore } from '@/stores/navigation'
import { IconLeft } from '@arco-design/web-vue/es/icon'
import api from '@/api/http'
import PermissionMatrix from '../modules/metadata/components/PermissionMatrix.vue'

interface Props {
  groupId?: number
}
const props = defineProps<Props>()
const navigationStore = useNavigationStore()
const group = ref<any>(null)
const loading = ref(false)

onMounted(async () => {
  if (props.groupId) {
    loading.value = true
    try {
      const { data } = await api.get(`/groups/${props.groupId}`)
      group.value = data.data
    } catch { /* ignore */ }
    loading.value = false
  }
})

function handleBack() {
  navigationStore.goBack()
}
</script>

<style scoped>
.group-permission-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f6fa;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;
}
.page-title {
  font-size: 15px;
  font-weight: 500;
}
.page-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
