<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="t('cloud.createShareTitle')"
    :ok-loading="loading"
    width="500px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" layout="vertical">
      <a-form-item :label="t('cloud.shareItem')">
        <div class="share-item">
          <span class="item-icon">{{ itemIcon }}</span>
          <span class="item-name">{{ itemName }}</span>
        </div>
      </a-form-item>

      <a-form-item
        field="expirationDays"
        :label="t('cloud.expiration')"
        :rules="[{ required: true, message: t('cloud.expirationRequired') }]"
      >
        <a-select v-model="form.expirationDays" :placeholder="t('cloud.selectExpiration')">
          <a-option :value="1">{{ t('cloud.expiration1Day') }}</a-option>
          <a-option :value="7">{{ t('cloud.expiration7Days') }}</a-option>
          <a-option :value="30">{{ t('cloud.expiration30Days') }}</a-option>
          <a-option :value="0">{{ t('cloud.expirationForever') }}</a-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="t('cloud.accessPassword')">
        <a-input-password
          v-model="form.password"
          :placeholder="t('cloud.passwordPlaceholder')"
          :max-length="20"
          allow-clear
        >
          <template #suffix>
            <a-button size="mini" type="text" @click="generatePassword">
              {{ t('cloud.generate') }}
            </a-button>
          </template>
        </a-input-password>
        <div class="hint">{{ t('cloud.passwordHint') }}</div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ShareCreateParams } from '@/modules/cloud/types'
import { useI18n } from 'vue-i18n'

interface Props {
  visible?: boolean
  loading?: boolean
  itemName?: string
  itemType?: 'file' | 'folder'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', params: Omit<ShareCreateParams, 'fileId' | 'resourceId'>): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  itemName: '',
  itemType: 'file',
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const form = ref({
  expirationDays: 7,
  password: '',
})

const { t } = useI18n()

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      // 重置表单，默认生成密码
      form.value = {
        expirationDays: 7,
        password: generateRandomPassword(),
      }
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const itemIcon = computed(() => {
  return props.itemType === 'folder' ? '📁' : '📄'
})

function generateRandomPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generatePassword() {
  form.value.password = generateRandomPassword()
}

function handleOk() {
  const params: Omit<ShareCreateParams, 'fileId' | 'resourceId'> = {
    shareType: form.value.password.trim() ? 'password' : 'public', // 根据是否有密码决定分享类型
    expireDays: form.value.expirationDays,
  }

  // 只在有密码时添加
  if (form.value.password.trim()) {
    params.password = form.value.password.trim()
  }

  emit('confirm', params)
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<style scoped>
.share-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.item-icon {
  font-size: 24px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.hint {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
