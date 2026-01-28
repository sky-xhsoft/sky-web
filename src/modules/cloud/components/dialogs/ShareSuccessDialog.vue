<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="分享创建成功"
    :footer="false"
    width="500px"
    @cancel="handleClose"
  >
    <div class="success-content">
      <div class="success-icon">
        <icon-check-circle-fill :size="64" :style="{ color: '#00b42a' }" />
      </div>

      <div class="share-info">
        <div class="info-item">
          <div class="info-label">分享链接</div>
          <div class="info-value link">{{ shareLink }}</div>
        </div>

        <div class="info-item" v-if="password">
          <div class="info-label">访问密码</div>
          <div class="info-value password">{{ password }}</div>
        </div>

        <div class="info-item" v-if="expireTime">
          <div class="info-label">有效期至</div>
          <div class="info-value">{{ formatExpireTime(expireTime) }}</div>
        </div>
      </div>

      <div class="actions">
        <a-button type="primary" long @click="handleCopy">
          <template #icon>
            <icon-copy />
          </template>
          复制链接和密码
        </a-button>
        <a-button long @click="handleOpen" style="margin-top: 12px">
          <template #icon>
            <icon-link />
          </template>
          在新标签页打开
        </a-button>
      </div>

      <div class="tips">
        <icon-info-circle />
        <span>请妥善保管分享链接和密码，分享后无法查看密码</span>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconCheckCircleFill,
  IconCopy,
  IconLink,
  IconInfoCircle,
} from '@arco-design/web-vue/es/icon'

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
  if (!time) return '永久有效'
  return new Date(time).toLocaleString('zh-CN')
}

async function handleCopy() {
  try {
    let text = `分享链接：${shareLink.value}`
    if (props.password) {
      text += `\n访问密码：${props.password}`
    }
    if (props.expireTime) {
      text += `\n有效期至：${formatExpireTime(props.expireTime)}`
    }

    await navigator.clipboard.writeText(text)
    Message.success('已复制到剪贴板')
  } catch (e) {
    console.error('复制失败:', e)
    Message.error('复制失败，请手动复制')
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
  color: #86909c;
  margin-bottom: 8px;
}

.info-value {
  font-size: 14px;
  color: #1d2129;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 4px;
  word-break: break-all;
}

.info-value.link {
  color: #165dff;
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
}

.tips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fff7e8;
  border-radius: 4px;
  font-size: 13px;
  color: #ff7d00;
}

.tips span {
  flex: 1;
  line-height: 1.5;
}
</style>
