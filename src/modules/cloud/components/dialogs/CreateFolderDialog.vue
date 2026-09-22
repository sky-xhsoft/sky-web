<template>
  <V2Modal
    v-model:visible="dialogVisible"
    :title="t('cloud.createFolderTitle')"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" @submit="handleSubmit">
      <V2FormItem
        field="folderName"
        :label="t('cloud.folderName')"
        :rules="[
          { required: true, message: t('cloud.folderNamePlaceholder') },
          { minLength: 1, message: t('cloud.folderNamePlaceholder') },
          { maxLength: 100, message: t('cloud.folderNameMaxLength') },
          { validator: validateFolderName },
        ]"
        :validate-trigger="['change', 'blur']"
      >
        <V2Input
          v-model="form.folderName"
          :placeholder="t('cloud.folderNamePlaceholder')"
          :max-length="100"
          allow-clear
          @keyup.enter="handleSubmit"
        />
      </V2FormItem>
    </a-form>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { validateFileName } from '@/modules/cloud/utils/validation'
import { useI18n } from 'vue-i18n'
import { V2Modal, V2Input, V2FormItem } from '@/components/ui'

const { t } = useI18n()

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