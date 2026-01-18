<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="`重命名${itemType === 'folder' ? '文件夹' : '文件'}`"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" @submit="handleSubmit">
      <a-form-item
        field="newName"
        label="新名称"
        :rules="[
          { required: true, message: '请输入新名称' },
          { minLength: 1, message: '名称至少1个字符' },
          { maxLength: 255, message: '名称最多255个字符' },
          { validator: validateName },
        ]"
        :validate-trigger="['change', 'blur']"
      >
        <a-input
          v-model="form.newName"
          placeholder="请输入新名称"
          :max-length="255"
          allow-clear
          @keyup.enter="handleSubmit"
        />
      </a-form-item>
      <div class="hint">
        原名称：<span class="old-name">{{ oldName }}</span>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { validateFileName } from '@/modules/cloud/utils/validation'

interface Props {
  visible?: boolean
  loading?: boolean
  oldName?: string
  itemType?: 'file' | 'folder'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', newName: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  oldName: '',
  itemType: 'file',
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const form = ref({
  newName: '',
})

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      // 预填充原名称
      form.value.newName = props.oldName
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

function validateName(value: string, callback: (error?: string) => void) {
  const result = validateFileName(value)
  if (!result.valid) {
    callback(result.error)
  } else {
    callback()
  }
}

function handleSubmit() {
  if (form.value.newName.trim()) {
    handleOk()
  }
}

function handleOk() {
  const newName = form.value.newName.trim()
  if (newName && newName !== props.oldName) {
    const result = validateFileName(newName)
    if (result.valid) {
      emit('confirm', newName)
    }
  }
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<style scoped>
.hint {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.old-name {
  color: #1f2937;
  font-weight: 500;
}
</style>
