<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="texts.createFolderTitle"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" @submit="handleSubmit">
      <a-form-item
        field="folderName"
        :label="texts.folderName"
        :rules="[
          { required: true, message: texts.nameRequired },
          { minLength: 1, message: texts.nameMinLength },
          { maxLength: 100, message: texts.nameMaxLength },
          { validator: validateFolderName },
        ]"
        :validate-trigger="['change', 'blur']"
      >
        <a-input
          v-model="form.folderName"
          :placeholder="texts.namePlaceholder"
          :max-length="100"
          allow-clear
          @keyup.enter="handleSubmit"
        />
      </a-form-item>
      <a-form-item
        field="eName"
        :label="texts.englishName"
        :rules="[
          { maxLength: 255, message: texts.englishNameMaxLength },
        ]"
        :validate-trigger="['change', 'blur']"
      >
        <a-input
          v-model="form.eName"
          :placeholder="texts.englishNamePlaceholder"
          :max-length="255"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { validateFileName } from '@/modules/cloud/utils/validation'

const { t } = useI18n()

const texts = computed(() => ({
  createFolderTitle: t('cloud.createFolderTitle'),
  folderName: t('cloud.folderName'),
  englishName: t('cloud.englishName'),
  nameRequired: t('cloud.nameRequired'),
  nameMinLength: t('cloud.nameMinLength'),
  nameMaxLength: t('cloud.nameMaxLength'),
  englishNameMaxLength: t('cloud.englishNameMaxLength'),
  namePlaceholder: t('cloud.namePlaceholder'),
  englishNamePlaceholder: t('cloud.englishNamePlaceholder'),
}))

interface Props {
  visible?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', folderName: string, eName?: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const form = ref({
  folderName: '',
  eName: '',
})

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      // 重置表单
      form.value.folderName = ''
      form.value.eName = ''
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
  const eName = form.value.eName.trim()
  if (folderName) {
    const result = validateFileName(folderName)
    if (result.valid) {
      emit('confirm', folderName, eName)
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
