<template>
  <V2Modal
    v-model:visible="dialogVisible"
    :title="t('cloud.createShareTitle')"
    :ok-loading="loading"
    width="500px"
    :on-before-ok="validateForm"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <V2FormItem :label="t('cloud.shareItem')">
        <div class="share-item">
          <span class="item-icon">{{ itemIcon }}</span>
          <span class="item-name">{{ itemName }}</span>
        </div>
      </V2FormItem>

      <V2FormItem
        field="expirationDays"
        :label="t('cloud.expiration')"
        :rules="[{ required: true, message: t('cloud.expirationRequired') }]"
      >
        <V2Select v-model="form.expirationDays" :placeholder="t('cloud.selectExpiration')">
          <a-option :value="1">{{ t('cloud.expiration1Day') }}</a-option>
          <a-option :value="7">{{ t('cloud.expiration7Days') }}</a-option>
          <a-option :value="30">{{ t('cloud.expiration30Days') }}</a-option>
          <a-option :value="0">{{ t('cloud.expirationForever') }}</a-option>
        </V2Select>
      </V2FormItem>

      <V2FormItem :label="t('cloud.shareMode')">
        <div class="field-stack">
          <a-radio-group v-model="form.shareType" type="button">
            <a-radio value="password">{{ t('cloud.shareModePassword') }}</a-radio>
            <a-radio value="public">{{ t('cloud.shareModePublic') }}</a-radio>
            <a-radio value="private">{{ t('cloud.shareModePrivate') }}</a-radio>
          </a-radio-group>
          <div class="hint">{{ shareModeHint }}</div>
        </div>
      </V2FormItem>

      <V2FormItem
        v-if="form.shareType === 'password'"
        field="password"
        :label="t('cloud.accessPassword')"
        :rules="[{ required: true, message: t('cloud.sharePasswordRequired') }]"
      >
        <a-input-password
          v-model="form.password"
          :placeholder="t('cloud.sharePasswordRequired')"
          :max-length="20"
          allow-clear
          class="v2-password-input"
        >
          <template #suffix>
            <V2Button size="sm" type="text" @click="generatePassword">
              {{ t('cloud.generate') }}
            </V2Button>
          </template>
        </a-input-password>
      </V2FormItem>

      <V2FormItem :label="t('cloud.maxDownloads')">
        <div class="field-stack">
          <a-input-number v-model="form.maxDownloads" :min="0" :precision="0" :step="1" style="width: 160px" />
          <div class="hint">{{ t('cloud.maxDownloadsHint') }}</div>
        </div>
      </V2FormItem>
    </a-form>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ShareCreateParams } from '@/modules/cloud/types'
import { useI18n } from 'vue-i18n'
import { V2Modal, V2Select, V2FormItem, V2Button } from '@/components/ui'

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

type ShareMode = 'password' | 'public' | 'private'

const dialogVisible = ref(props.visible)
const formRef = ref()
const form = ref({
  shareType: 'password' as ShareMode,
  expirationDays: 7,
  password: '',
  maxDownloads: 0,
})

const { t } = useI18n()

const shareModeHint = computed(() => {
  switch (form.value.shareType) {
    case 'public':
      return t('cloud.shareModePublicHint')
    case 'private':
      return t('cloud.shareModePrivateHint')
    default:
      return t('cloud.passwordHint')
  }
})

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      form.value = {
        shareType: 'password',
        expirationDays: 7,
        password: generateRandomPassword(),
        maxDownloads: 0,
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

// 校验不通过时返回 false，阻止弹窗关闭
async function validateForm(): Promise<boolean> {
  form.value.password = form.value.password.trim()
  return !(await formRef.value?.validate())
}

function handleOk() {
  const params: Omit<ShareCreateParams, 'fileId' | 'resourceId'> = {
    shareType: form.value.shareType,
    expireDays: form.value.expirationDays,
    maxDownloads: form.value.maxDownloads || 0,
  }

  if (form.value.shareType === 'password') {
    params.password = form.value.password
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
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.item-icon {
  font-size: 24px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.field-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.v2-password-input :deep(.arco-input) {
  height: 34px;
  border-radius: var(--radius-md);
}
</style>