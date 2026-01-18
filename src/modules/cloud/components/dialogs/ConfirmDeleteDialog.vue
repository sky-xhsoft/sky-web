<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="确认删除"
    :ok-loading="loading"
    ok-text="删除"
    :ok-button-props="{ status: 'danger' }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="confirm-delete-dialog">
      <div class="warning-icon">
        <icon-exclamation-circle-fill />
      </div>
      <div class="warning-message">
        <p v-if="count === 1">
          确定要删除 <strong>{{ itemName }}</strong> 吗？
        </p>
        <p v-else>
          确定要删除选中的 <strong>{{ count }}</strong> 项吗？
        </p>
        <p class="danger-text">此操作不可恢复！</p>
      </div>

      <!-- 详细信息 -->
      <div v-if="details" class="details">
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item v-if="details.fileCount" label="文件">
            {{ details.fileCount }} 个
          </a-descriptions-item>
          <a-descriptions-item v-if="details.folderCount" label="文件夹">
            {{ details.folderCount }} 个
          </a-descriptions-item>
          <a-descriptions-item v-if="details.totalSize" label="总大小">
            {{ formatSize(details.totalSize) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconExclamationCircleFill } from '@arco-design/web-vue/es/icon'
import { formatSize } from '@/modules/cloud/utils/format'

interface DeleteDetails {
  fileCount?: number
  folderCount?: number
  totalSize?: number
}

interface Props {
  visible?: boolean
  loading?: boolean
  itemName?: string
  count?: number
  details?: DeleteDetails
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  itemName: '',
  count: 1,
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

function handleOk() {
  emit('confirm')
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<style scoped>
.confirm-delete-dialog {
  padding: 8px 0;
}

.warning-icon {
  text-align: center;
  font-size: 48px;
  color: #f53f3f;
  margin-bottom: 16px;
}

.warning-message {
  text-align: center;
  margin-bottom: 16px;
}

.warning-message p {
  margin: 8px 0;
  font-size: 14px;
  color: #1f2937;
}

.warning-message strong {
  color: #f53f3f;
  font-weight: 600;
}

.danger-text {
  color: #f53f3f;
  font-weight: 500;
}

.details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
