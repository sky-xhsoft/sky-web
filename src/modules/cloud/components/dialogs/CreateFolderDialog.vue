<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="创建文件夹"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" @submit="handleSubmit">
      <a-form-item
        field="folderName"
        label="文件夹名称"
        :rules="[
          { required: true, message: '请输入文件夹名称' },
          { minLength: 1, message: '名称至少1个字符' },
          { maxLength: 100, message: '名称最多100个字符' },
          { validator: validateFolderName },
        ]"
        :validate-trigger="['change', 'blur']"
      >
        <a-input
          v-model="form.folderName"
          placeholder="请输入文件夹名称"
          :max-length="100"
          allow-clear
          @keyup.enter="handleSubmit"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { validateFileName } from '@/modules/cloud/utils/validation'

interface Props {
  visible?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', folderName: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const form = ref({
  folderName: '',
})

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      // 重置表单
      form.value.folderName = ''
    }
  }
)

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

function validateFolderName(value: string, callback: (error?: string) => void) {
  const result = validateFileName(value)
  if (!result.valid) {
    callback(result.error)
  } else {
    callback()
  }
}

function handleSubmit() {
  if (form.value.folderName.trim()) {
    handleOk()
  }
}

function handleOk() {
  const folderName = form.value.folderName.trim()
  if (folderName) {
    const result = validateFileName(folderName)
    if (result.valid) {
      emit('confirm', folderName)
    }
  }
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<style scoped>
/* 样式由Arco Design提供 */
</style>
