<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="编辑分享"
    :ok-loading="loading"
    width="500px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" layout="vertical">
      <a-form-item label="分享链接">
        <div class="share-info">
          <span class="info-label">链接:</span>
          <span class="info-value">{{ shareLink }}</span>
        </div>
        <div class="share-info">
          <span class="info-label">提取码:</span>
          <span class="info-value">{{ shareCode }}</span>
        </div>
      </a-form-item>

      <a-form-item
        field="expirationDays"
        label="有效期"
        :rules="[{ required: true, message: '请选择有效期' }]"
      >
        <a-select v-model="form.expirationDays" placeholder="请选择有效期">
          <a-option :value="1">1天</a-option>
          <a-option :value="7">7天</a-option>
          <a-option :value="30">30天</a-option>
          <a-option :value="0">永久</a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="访问密码">
        <a-input-password
          v-model="form.password"
          placeholder="留空则不设置密码"
          :max-length="20"
          allow-clear
        >
          <template #suffix>
            <a-button size="mini" type="text" @click="generatePassword">
              生成
            </a-button>
          </template>
        </a-input-password>
        <div class="hint">修改密码后，旧密码将失效</div>
      </a-form-item>

      <a-form-item label="创建时间">
        <div class="share-info">
          <span class="info-value">{{ formatDate(createTime) }}</span>
        </div>
      </a-form-item>

      <a-form-item v-if="expirationTime" label="过期时间">
        <div class="share-info">
          <span class="info-value">{{ formatDate(expirationTime) }}</span>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ShareListItem } from '@/modules/cloud/types'
import { formatDate } from '@/modules/cloud/utils/format'

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
      form.value = {
        expirationDays: calculateRemainingDays(props.share.expireTime),
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

const shareCode = computed(() => {
  return props.share?.shareCode || ''
})

const createTime = computed(() => {
  return props.share?.createTime || ''
})

const expirationTime = computed(() => {
  return props.share?.expireTime || ''
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
  const params: { expirationDays: number; password?: string } = {
    expirationDays: form.value.expirationDays,
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
.share-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 4px;
  margin-bottom: 8px;
}

.share-info:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
  min-width: 60px;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  font-family: monospace;
}

.hint {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
