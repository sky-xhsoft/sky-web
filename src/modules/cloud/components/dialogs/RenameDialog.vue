<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="itemType === 'folder' ? texts.renameTitleFolder : texts.renameTitleFile"
    :ok-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="form" @submit="handleSubmit">
      <a-form-item
        field="newName"
        :label="texts.newNameLabel"
        :rules="[
          { required: true, message: texts.nameRequired },
          { minLength: 1, message: texts.nameMinLength },
          { maxLength: 255, message: texts.englishNameMaxLength },
          { validator: validateName },
        ]"
        :validate-trigger="['change', 'blur']"
      >
        <a-input
          v-model="form.newName"
          :placeholder="texts.newNamePlaceholder"
          :max-length="255"
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
      <div class="hint">
        {{ texts.originalName }}<span class="old-name">{{ oldName }}</span>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { validateFileName } from '@/modules/cloud/utils/validation'

const { t } = useI18n()

const texts = computed(() => ({
  renameTitleFile: t('cloud.renameTitleFile'),
  renameTitleFolder: t('cloud.renameTitleFolder'),
  newNameLabel: t('cloud.newNameLabel'),
  newNamePlaceholder: t('cloud.newNamePlaceholder'),
  englishName: t('cloud.englishName'),
  englishNamePlaceholder: t('cloud.englishNamePlaceholder'),
  englishNameMaxLength: t('cloud.englishNameMaxLength'),
  nameRequired: t('cloud.nameRequired'),
  nameMinLength: t('cloud.nameMinLength'),
  originalName: t('cloud.originalName'),
}))

interface Props {
  visible?: boolean
  loading?: boolean
  oldName?: string
  oldEName?: string
  itemType?: 'file' | 'folder'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', newName: string, eName?: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  oldName: '',
  oldEName: '',
  itemType: 'file',
})

const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const form = ref({
  newName: '',
  eName: '',
})

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue) {
      // 预填充原名称
      form.value.newName = props.oldName
      form.value.eName = props.oldEName
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
  const eName = form.value.eName.trim()
  if (newName && newName !== props.oldName) {
    const result = validateFileName(newName)
    if (result.valid) {
      emit('confirm', newName, eName)
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
