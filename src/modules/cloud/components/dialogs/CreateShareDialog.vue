<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="texts.createShareTitle"
    :ok-loading="loading"
    width="500px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" layout="vertical">
      <a-form-item :label="texts.shareItem">
        <div class="share-item">
          <span class="item-icon">{{ itemIcon }}</span>
          <span class="item-name">{{ itemName }}</span>
        </div>
      </a-form-item>

      <a-form-item
        field="expirationDays"
        :label="texts.validityPeriod"
        :rules="[{ required: true, message: texts.selectValidity }]"
      >
        <a-select v-model="form.expirationDays" :placeholder="texts.selectValidity">
          <a-option :value="1">{{ texts.validity1Day }}</a-option>
          <a-option :value="7">{{ texts.validity7Days }}</a-option>
          <a-option :value="30">{{ texts.validity30Days }}</a-option>
          <a-option :value="0">{{ texts.validityForever }}</a-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="texts.accessPassword">
        <a-input-password
          v-model="form.password"
          :placeholder="texts.passwordPlaceholder"
          :max-length="20"
          allow-clear
        >
          <template #suffix>
            <a-button size="mini" type="text" @click="generatePassword">
              {{ texts.generate }}
            </a-button>
          </template>
        </a-input-password>
        <div class="hint">{{ texts.passwordHint }}</div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ShareCreateParams } from '@/modules/cloud/types'

const { t } = useI18n()

const texts = computed(() => ({
  createShareTitle: t('cloud.createShareTitle'),
  shareItem: t('cloud.shareItem'),
  validityPeriod: t('cloud.validityPeriod'),
  selectValidity: t('cloud.selectValidity'),
  validity1Day: t('cloud.validity1Day'),
  validity7Days: t('cloud.validity7Days'),
  validity30Days: t('cloud.validity30Days'),
  validityForever: t('cloud.validityForever'),
  accessPassword: t('cloud.accessPassword'),
  passwordPlaceholder: t('cloud.passwordPlaceholder'),
  generate: t('cloud.generate'),
  passwordHint: t('cloud.passwordHint'),
}))

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
