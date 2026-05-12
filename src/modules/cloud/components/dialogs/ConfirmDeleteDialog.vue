<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="t('cloud.deleteConfirmTitle')"
    :ok-loading="loading"
    :ok-text="t('cloud.delete')"
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
          {{ t('cloud.deleteConfirmMsg', { name: itemName }) }}
        </p>
        <p v-else>
          {{ t('cloud.deleteConfirmBatch', { count: count }) }}
        </p>
        <p class="danger-text">{{ t('cloud.deleteIrreversible') }}</p>
      </div>

      <!-- 详细信息 -->
      <div v-if="details" class="details">
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item v-if="details.fileCount" :label="t('cloud.files')">
            {{ details.fileCount }}
          </a-descriptions-item>
          <a-descriptions-item v-if="details.folderCount" :label="t('cloud.folders')">
            {{ details.folderCount }}
          </a-descriptions-item>
          <a-descriptions-item v-if="details.totalSize" :label="t('cloud.totalSize')">
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
import { useI18n } from 'vue-i18n'

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
const { t } = useI18n()

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
