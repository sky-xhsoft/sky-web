<template>
  <a-form-item
    :field="field"
    :label="label"
    :required="required"
    :rules="rules"
    :validate-status="validateStatus"
    :help="help"
    class="v2-form-item"
  >
    <slot />
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
    <template v-if="$slots.extra" #extra>
      <slot name="extra" />
    </template>
  </a-form-item>
</template>

<script setup lang="ts">
import type { FieldRule, ValidateStatus } from '@arco-design/web-vue/es/form/interface'

interface Props {
  field?: string
  label?: string
  required?: boolean
  rules?: FieldRule | FieldRule[]
  validateStatus?: ValidateStatus
  help?: string
}

withDefaults(defineProps<Props>(), {
  field: undefined,
  label: '',
  required: false,
  rules: undefined,
  validateStatus: undefined,
  help: '',
})
</script>

<style scoped>
.v2-form-item :deep(.arco-form-label-item) {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.v2-form-item :deep(.arco-form-item-message) {
  font-size: 12px;
}

.v2-form-item :deep(.arco-form-item-error .arco-form-label-item) {
  color: var(--error);
}
</style>
