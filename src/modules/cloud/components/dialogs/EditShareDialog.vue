<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="texts.editShareTitle"
    :ok-loading="loading"
    width="600px"
    @ok="handleOk"
    @cancel="handleCancel"
    :footer-extra="renderFooterExtra"
  >
    <a-form :model="form" layout="vertical" ref="formRef">
      <!-- 分享基本信息 -->
      <a-form-item :label="texts.shareInfoLabel">
        <div class="share-info">
          <div class="info-row">
            <span class="info-label">{{ texts.linkLabel }}</span>
            <span class="info-value copyable" @click="handleCopyLink">{{ shareLink }}</span>
            <a-button size="mini" type="text" @click="handleCopyLink">
              <icon-copy />
              {{ texts.copy }}
            </a-button>
          </div>
          <div class="info-row" v-if="props.share?.password">
            <span class="info-label">{{ texts.accessPasswordLabel }}</span>
            <span class="info-value copyable" @click="handleCopyPassword">{{ props.share.password }}</span>
            <a-button size="mini" type="text" @click="handleCopyPassword">
              <icon-copy />
              {{ texts.copy }}
            </a-button>
          </div>
        </div>
      </a-form-item>

      <!-- 有效期设置 -->
      <a-form-item
        field="expirationDays"
        :label="texts.newExpirationLabel"
        :rules="[{ required: true, message: texts.selectValidity }]"
      >
        <a-select v-model="form.expirationDays" :placeholder="texts.selectExpiration">
          <a-option :value="1">{{ texts.valid1Day }}</a-option>
          <a-option :value="7">{{ texts.valid7Days }}</a-option>
          <a-option :value="30">{{ texts.valid30Days }}</a-option>
          <a-option :value="0">{{ texts.validForever }}</a-option>
        </a-select>
        <div class="hint" v-if="form.expirationDays === 0">
          {{ texts.permanentShareWarning }}
        </div>
        <div class="hint" v-else>
          {{ texts.shareExpireHint.replace('{days}', form.expirationDays) }}
        </div>
      </a-form-item>

      <!-- 访问密码 -->
      <a-form-item :label="texts.accessPassword">
        <a-input-password
          v-model="form.password"
          :placeholder="texts.passwordPlaceholder"
          :max-length="20"
          allow-clear
          show-password-toggle
        >
          <template #prefix>
            <icon-lock v-if="form.password" />
            <icon-unlock v-else />
          </template>
          <template #suffix>
            <a-button size="mini" type="text" @click="generatePassword" :disabled="generating">
              <icon-refresh v-if="generating" />
              {{ generating ? texts.generating : texts.generate }}
            </a-button>
          </template>
        </a-input-password>
        <div class="hint">
          <icon-info-circle /> {{ texts.passwordChangeHint }}
        </div>
      </a-form-item>

      <!-- 分享详情信息 -->
      <a-form-item :label="texts.shareDetailsLabel">
        <div class="share-details">
          <div class="detail-row">
            <span class="detail-label">{{ texts.createTimeLabel }}</span>
            <span class="detail-value">{{ formatDate(createTime) }}</span>
          </div>
          <div class="detail-row" v-if="expirationTime">
            <span class="detail-label">{{ texts.expireTimeLabel }}</span>
            <span class="detail-value" :class="{ 'text-warning': isExpiringSoon }">
              {{ formatDate(expirationTime) }}
              <span v-if="isExpiringSoon" class="expiration-warning">({{ texts.expiringSoon }})</span>
            </span>
          </div>
          <div class="detail-row" v-if="form.expirationDays > 0">
            <span class="detail-label">{{ texts.daysRemaining }}</span>
            <span class="detail-value" :class="{ 'text-danger': remainingDays <= 1, 'text-warning': remainingDays <= 3 }">
              {{ remainingDays }}{{ texts.daysUnit }}
            </span>
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconLock, IconUnlock, IconRefresh, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import type { ShareListItem } from '@/modules/cloud/types'
import { formatDate } from '@/modules/cloud/utils/format'

const { t } = useI18n()

const texts = computed(() => ({
  editShareTitle: t('cloud.editShareTitle'),
  shareInfoLabel: t('cloud.shareInfoLabel'),
  linkLabel: t('cloud.linkLabel'),
  copy: t('cloud.copy'),
  accessPasswordLabel: t('cloud.accessPasswordLabel'),
  newExpirationLabel: t('cloud.newExpirationLabel'),
  selectExpiration: t('cloud.selectExpiration'),
  selectValidity: t('cloud.selectValidity'),
  valid1Day: t('cloud.valid1Day'),
  valid7Days: t('cloud.valid7Days'),
  valid30Days: t('cloud.valid30Days'),
  validForever: t('cloud.validForever'),
  permanentShareWarning: t('cloud.permanentShareWarning'),
  shareExpireHint: t('cloud.shareExpireHint'),
  accessPassword: t('cloud.accessPassword'),
  passwordPlaceholder: t('cloud.passwordPlaceholder'),
  generate: t('cloud.generate'),
  generating: t('cloud.generating'),
  passwordChangeHint: t('cloud.passwordChangeHint'),
  shareDetailsLabel: t('cloud.shareDetailsLabel'),
  createTimeLabel: t('cloud.createTimeLabel'),
  expireTimeLabel: t('cloud.expireTimeLabel'),
  daysRemaining: t('cloud.daysRemaining'),
  daysUnit: t('cloud.daysUnit'),
  expiringSoon: t('cloud.expiringSoon'),
  passwordGenerated: t('cloud.passwordGenerated'),
  linkCopied: t('cloud.linkCopied'),
  passwordCopied: t('cloud.passwordCopied'),
  copyFailed: t('cloud.copyFailed'),
  shareLinkUnchangedHint: t('cloud.shareLinkUnchangedHint'),
}))

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
      // 根据当前分享信息初始化表单
      // expirationDays 默认为7天，用户可以修改
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
  // 模拟生成动画
  setTimeout(() => {
    form.value.password = generateRandomPassword()
    generating.value = false
    Message.success(texts.value.passwordGenerated)
  }, 300)
}

function handleCopyLink() {
  if (!shareLink.value) return

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(shareLink.value).then(() => {
      Message.success(texts.value.linkCopied)
    }).catch(() => {
      fallbackCopy(shareLink.value, texts.value.linkCopied)
    })
  } else {
    fallbackCopy(shareLink.value, texts.value.linkCopied)
  }
}

function handleCopyPassword() {
  if (!props.share?.password) return

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(props.share.password).then(() => {
      Message.success(texts.value.passwordCopied)
    }).catch(() => {
      fallbackCopy(props.share.password, texts.value.passwordCopied)
    })
  } else {
    fallbackCopy(props.share.password, texts.value.passwordCopied)
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
  } catch (err) {
    Message.error(texts.value.copyFailed)
  } finally {
    document.body.removeChild(textarea)
  }
}

function handleOk() {
  formRef.value?.validate().then(() => {
    const params: { expirationDays: number; password?: string } = {
      expirationDays: form.value.expirationDays,
    }

    // 只在有密码时添加
    if (form.value.password.trim()) {
      params.password = form.value.password.trim()
    }

    emit('confirm', params)
  }).catch(() => {
    // 验证失败，不提交
  })
}

function handleCancel() {
  dialogVisible.value = false
}

// 渲染 footer 额外内容
function renderFooterExtra() {
  return h('div', { class: 'footer-extra' }, [
    h(IconInfoCircle, { style: 'margin-right: 4px;' }),
    texts.value.shareLinkUnchangedHint
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
  background: #f9fafb;
  border-radius: 6px;
  transition: all 0.2s;
}

.info-row:hover {
  background: #f3f4f6;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
  min-width: 50px;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  font-family: monospace;
  overflow-x: auto;
  white-space: nowrap;
  flex: 1;
}

.copyable {
  cursor: pointer;
  transition: color 0.2s;
}

.copyable:hover {
  color: #3b82f6;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hint.warning {
  color: #f59e0b;
}

.hint.danger {
  color: #ef4444;
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
  color: #6b7280;
  min-width: 70px;
}

.detail-value {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.detail-value.text-warning {
  color: #f59e0b;
}

.detail-value.text-danger {
  color: #ef4444;
}

.expiration-warning {
  font-size: 12px;
  color: #f59e0b;
  margin-left: 4px;
}

.footer-extra {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式适配 */
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
