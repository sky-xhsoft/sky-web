<template>
  <V2Modal
    v-model:visible="dialogVisible"
    :title="t('cloud.shareSuccessTitle')"
    :footer="false"
    width="500px"
    @cancel="handleClose"
  >
    <div class="success-content">
      <div class="success-icon">
        <icon-check-circle-fill :size="64" :style="{ color: 'var(--success)' }" />
      </div>

      <div class="share-info">
        <div class="info-item">
          <div class="info-label">{{ t('cloud.shareLinkTitle') }}</div>
          <div class="info-value link">{{ shareLink }}</div>
        </div>

        <div class="info-item" v-if="password">
          <div class="info-label">{{ t('cloud.accessPasswordTitle') }}</div>
          <div class="info-value password">{{ password }}</div>
        </div>

        <div class="info-item" v-if="expireTime">
          <div class="info-label">{{ t('cloud.expireTimeLabel') }}</div>
          <div class="info-value">{{ formatExpireTime(expireTime) }}</div>
        </div>
      </div>

      <div class="actions">
        <V2Button type="primary" class="full-width" @click="handleCopy">
          <template #icon>
            <icon-copy />
          </template>
          {{ t('cloud.copyLinkAndPassword') }}
        </V2Button>
        <V2Button type="secondary" class="full-width" @click="handleOpen">
          <template #icon>
            <icon-link />
          </template>
          {{ t('cloud.openInNewTab') }}
        </V2Button>
      </div>

      <div class="tips">
        <icon-info-circle />
        <span>{{ t('cloud.shareSafetyTip') }}</span>
      </div>
    </div>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import {
  IconCheckCircleFill,
  IconCopy,
  IconLink,
  IconInfoCircle,
} from '@arco-design/web-vue/es/icon'
import { V2Modal, V2Button } from '@/components/ui'

const { t } = useI18n()

interface Props {
  visible?: boolean
  shareCode?: string
  password?: string
  expireTime?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  shareCode: '',
  password: '',
  expireTime: '',
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

const shareLink = computed(() => {
  if (!props.shareCode) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}/share/${props.shareCode}`
})

function formatExpireTime(time: string): string {
  if (!time) return t('cloud.foreverValid')
  return new Date(time).toLocaleString(
    t('language.zhCN') === '简体中文' ? 'zh-CN' : 'en-US'
  )
}

async function handleCopy() {
  try {
    let text = `${t('cloud.shareLinkTitle')}：${shareLink.value}`
    if (props.password) {
      text += `\n${t('cloud.accessPasswordTitle')}：${props.password}`
    }
    if (props.expireTime) {
      text += `\n${t('cloud.expireTimeLabel')}：${formatExpireTime(props.expireTime)}`
    }

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        Message.success(t('cloud.copiedToClipboard'))
      } catch (e) {
        console.error('复制失败:', e)
        fallbackCopy(text, t('cloud.copiedToClipboard'))
      }
    } else {
      fallbackCopy(text, t('cloud.copiedToClipboard'))
    }
  } catch (error) {
    console.error('复制操作失败:', error)
    Message.error(t('cloud.copyFailed'))
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
    console.error('复制失败:', err)
    Message.error(t('cloud.copyFailed'))
  } finally {
    document.body.removeChild(textarea)
  }
}

function handleOpen() {
  window.open(shareLink.value, '_blank')
}

function handleClose() {
  dialogVisible.value = false
}
</script>

<style scoped>
.success-content {
  padding: 20px 0;
}

.success-icon {
  text-align: center;
  margin-bottom: 24px;
}

.share-info {
  margin-bottom: 24px;
}

.info-item {
  margin-bottom: 16px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  word-break: break-all;
}

.info-value.link {
  color: var(--brand-blue);
  font-weight: 500;
}

.info-value.password {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
  text-align: center;
}

.actions {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.full-width {
  width: 100%;
  justify-content: center;
}

.tips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--warning-bg);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--warning);
}

.tips span {
  flex: 1;
  line-height: 1.5;
}
</style>
