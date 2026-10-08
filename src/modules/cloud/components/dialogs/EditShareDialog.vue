<template>
  <V2Modal
    v-model:visible="dialogVisible"
    :title="t('cloud.editShareTitle')"
    :ok-loading="loading"
    width="600px"
    :on-before-ok="validateForm"
    @ok="handleOk"
    @cancel="handleCancel"
    :footer-extra="renderFooterExtra"
  >
    <a-form :model="form" layout="vertical" ref="formRef">
      <!-- 分享基本信息 -->
      <V2FormItem :label="t('cloud.shareInfoLabel')">
        <div class="share-info">
          <div class="info-row">
            <span class="info-label">{{ t('cloud.shareLinkLabel') }}</span>
            <span class="info-value copyable" @click="handleCopyLink">{{ shareLink }}</span>
            <V2Button size="sm" type="text" @click="handleCopyLink">
              <template #icon><icon-copy /></template>
              {{ t('cloud.copy') }}
            </V2Button>
          </div>
          <div class="info-row" v-if="props.share?.password">
            <span class="info-label">{{ t('cloud.accessPassword') }}:</span>
            <span class="info-value copyable" @click="handleCopyPassword">{{ props.share.password }}</span>
            <V2Button size="sm" type="text" @click="handleCopyPassword">
              <template #icon><icon-copy /></template>
              {{ t('cloud.copy') }}
            </V2Button>
          </div>
        </div>
      </V2FormItem>

      <!-- 有效期设置 -->
      <V2FormItem
        field="expirationDays"
        :label="t('cloud.newExpiration')"
        :rules="[{ required: true, message: t('cloud.expirationRequired') }]"
      >
        <V2Select v-model="form.expirationDays" :placeholder="t('cloud.selectExpiration')">
          <a-option :value="1">{{ t('cloud.expiration1Day') }}</a-option>
          <a-option :value="7">{{ t('cloud.expiration7Days') }}</a-option>
          <a-option :value="30">{{ t('cloud.expiration30Days') }}</a-option>
          <a-option :value="0">{{ t('cloud.expirationForever') }}</a-option>
        </V2Select>
        <div class="hint" v-if="form.expirationDays === 0">
          {{ t('cloud.expirationForeverWarning') }}
        </div>
        <div class="hint" v-else>
          {{ t('cloud.expireDaysHint', { days: form.expirationDays }) }}
        </div>
      </V2FormItem>

      <!-- 访问密码 -->
      <V2FormItem :label="t('cloud.accessPassword')">
        <a-input-password
          v-model="form.password"
          :placeholder="t('cloud.passwordPlaceholder')"
          :max-length="20"
          allow-clear
          show-password-toggle
          class="v2-password-input"
        >
          <template #prefix>
            <icon-lock v-if="form.password" />
            <icon-unlock v-else />
          </template>
          <template #suffix>
            <V2Button size="sm" type="text" @click="generatePassword" :disabled="generating">
              <icon-refresh v-if="generating" />
              {{ generating ? t('cloud.loading') : t('cloud.generate') }}
            </V2Button>
          </template>
        </a-input-password>
        <div class="hint">
          <icon-info-circle /> {{ t('cloud.passwordChangeWarning') }}
        </div>
      </V2FormItem>

      <!-- 分享详情信息 -->
      <V2FormItem :label="t('cloud.shareInfoLabel')">
        <div class="share-details">
          <div class="detail-row">
            <span class="detail-label">{{ t('cloud.createTime') }}:</span>
            <span class="detail-value">{{ formatDate(createTime) }}</span>
          </div>
          <div class="detail-row" v-if="expirationTime">
            <span class="detail-label">{{ t('cloud.expireTime') }}</span>
            <span class="detail-value" :class="{ 'text-warning': isExpiringSoon }">
              {{ formatDate(expirationTime) }}
              <span v-if="isExpiringSoon" class="expiration-warning">{{ t('cloud.expiringSoon') }}</span>
            </span>
          </div>
          <div class="detail-row" v-if="form.expirationDays > 0">
            <span class="detail-label">{{ t('cloud.remainingDays') }}</span>
            <span class="detail-value" :class="{ 'text-danger': remainingDays <= 1, 'text-warning': remainingDays <= 3 }">
              {{ remainingDays }} {{ t('cloud.days') }}
            </span>
          </div>
        </div>
      </V2FormItem>
    </a-form>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, h } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { IconCopy, IconLock, IconUnlock, IconRefresh, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import type { ShareListItem } from '@/modules/cloud/types'
import { formatDate } from '@/modules/cloud/utils/format'
import { V2Modal, V2Select, V2FormItem, V2Button } from '@/components/ui'

const { t } = useI18n()

interface Props {
  visible?: boolean
  loading?: boolean
  share?: ShareListItem | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', params: { expirationDays: number; password?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  share: null,
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const formRef = ref()
const generating = ref(false)

const form = ref({
  expirationDays: 7,
  password: '',
})

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue && props.share) {
      form.value = {
        expirationDays: 7,
        password: props.share.password || '',
      }
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const shareLink = computed(() => {
  if (!props.share) return ''
  return `${window.location.origin}/share/${props.share.shareCode}`
})

const createTime = computed(() => {
  return props.share?.createTime || ''
})

const expirationTime = computed(() => {
  return props.share?.expireTime || ''
})

const remainingDays = computed(() => {
  return calculateRemainingDays(props.share?.expireTime)
})

const isExpiringSoon = computed(() => {
  const days = remainingDays.value
  return days > 0 && days <= 3
})

function calculateRemainingDays(expirationTime?: string): number {
  if (!expirationTime) return 0
  const expTime = new Date(expirationTime).getTime()
  const now = Date.now()
  const diff = expTime - now
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generatePassword() {
  generating.value = true
  setTimeout(() => {
    form.value.password = generateRandomPassword()
    generating.value = false
    Message.success(t('cloud.passwordGenerated'))
  }, 300)
}

function handleCopyLink() {
  if (!shareLink.value) return

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(shareLink.value).then(() => {
      Message.success(t('cloud.shareLinkCopied'))
    }).catch(() => {
      fallbackCopy(shareLink.value, t('cloud.shareLinkCopied'))
    })
  } else {
    fallbackCopy(shareLink.value, t('cloud.shareLinkCopied'))
  }
}

function handleCopyPassword() {
  if (!props.share?.password) return

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(props.share.password).then(() => {
      Message.success(t('cloud.accessPasswordCopied'))
    }).catch(() => {
      fallbackCopy(props.share.password, t('cloud.accessPasswordCopied'))
    })
  } else {
    fallbackCopy(props.share.password, t('cloud.accessPasswordCopied'))
  }
}

function fallbackCopy(text: string, successMsg: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    Message.success(successMsg)
  } catch {
    Message.error(t('cloud.copyFailed'))
  } finally {
    document.body.removeChild(textarea)
  }
}

// 校验不通过时返回 false，阻止弹窗关闭（Arco 的 validate() 失败时返回错误对象而不是抛异常）
async function validateForm(): Promise<boolean> {
  return !(await formRef.value?.validate())
}

function handleOk() {
  const params: { expirationDays: number; password?: string } = {
    expirationDays: form.value.expirationDays,
  }

  if (form.value.password.trim()) {
    params.password = form.value.password.trim()
  }

  emit('confirm', params)
}

function handleCancel() {
  dialogVisible.value = false
}

function renderFooterExtra() {
  return h('div', { class: 'footer-extra' }, [
    h(IconInfoCircle, { style: 'margin-right: 4px;' }),
    t('cloud.linkModifyNote')
  ])
}
</script>

<style scoped>
.share-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast);
}

.info-row:hover {
  background: var(--border-light);
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 50px;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: monospace;
  overflow-x: auto;
  white-space: nowrap;
  flex: 1;
}

.copyable {
  cursor: pointer;
  transition: color var(--duration-fast);
}

.copyable:hover {
  color: var(--brand-blue);
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.share-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 70px;
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.detail-value.text-warning {
  color: var(--warning);
}

.detail-value.text-danger {
  color: var(--error);
}

.expiration-warning {
  font-size: 12px;
  color: var(--warning);
  margin-left: 4px;
}

.footer-extra {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.v2-password-input :deep(.arco-input) {
  height: 34px;
  border-radius: var(--radius-md);
}

@media (max-width: 640px) {
  .info-label,
  .detail-label {
    min-width: 40px;
    font-size: 12px;
  }

  .info-value,
  .detail-value {
    font-size: 12px;
  }

  .hint {
    font-size: 11px;
  }
}
</style>