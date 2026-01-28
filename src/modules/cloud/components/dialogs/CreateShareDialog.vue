<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="创建分享链接"
    :ok-loading="loading"
    width="500px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" layout="vertical">
      <a-form-item label="分享项">
        <div class="share-item">
          <span class="item-icon">{{ itemIcon }}</span>
          <span class="item-name">{{ itemName }}</span>
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
        <div class="hint">建议设置密码以保护分享内容</div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ShareCreateParams } from '@/modules/cloud/types'

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
