<!-- 级联选择字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly || mode === 'view'" class="cascader-field-view">
    {{ displayValue }}
  </span>
  <a-cascader
    v-else
    :model-value="arrayValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :allow-clear="allowClear"
    :allow-search="allowSearch"
    :options="options"
    :change-on-select="changeOnSelect"
    :show-search="showSearch"
    :field-names="fieldNames"
    @update:model-value="handleChange"
  />
</template>

<style scoped>
.cascader-field-view {
  display: inline-block;
  padding: 4px 0;
  color: var(--text-primary);
  line-height: 24px;
  min-height: 32px;
  display: flex;
  align-items: center;
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFieldRendererBase } from '../../composables'
import type { SysColumn, FieldValue, FormMode } from '../../types'

interface CascaderOption {
  value: string | number
  label: string
  children?: CascaderOption[]
  disabled?: boolean
}

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  mode?: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
}>()

const { placeholder, isReadonly, isDisabled } = useFieldRendererBase(props)

const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

const options = computed<CascaderOption[]>(() => {
  return config.value.options || []
})

const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

const allowSearch = computed(() => {
  return config.value.allowSearch !== false
})

const changeOnSelect = computed(() => {
  return config.value.changeOnSelect !== false
})

const showSearch = computed(() => {
  return config.value.showSearch !== false
})

const fieldNames = computed(() => {
  return config.value.fieldNames || {
    label: 'label',
    value: 'value',
    children: 'children'
  }
})

const separator = computed(() => {
  return config.value.separator || ' / '
})

const arrayValue = ref<Array<string | number>>([])

const displayValue = computed(() => {
  if (arrayValue.value.length === 0) return ''
  const labels: string[] = []
  let currentOptions: CascaderOption[] | undefined = options.value
  for (const val of arrayValue.value) {
    const found = currentOptions?.find(o => o.value === val)
    if (found) {
      labels.push(found.label)
      currentOptions = found.children
    } else {
      labels.push(String(val))
      currentOptions = undefined
    }
  }
  return labels.join(separator.value)
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      arrayValue.value = []
      return
    }
    if (Array.isArray(newValue)) {
      arrayValue.value = newValue
    } else if (typeof newValue === 'string') {
      try {
        const parsed = JSON.parse(newValue)
        arrayValue.value = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        arrayValue.value = newValue.split(',').map(s => s.trim()).filter(Boolean)
      }
    } else {
      arrayValue.value = [newValue as string | number]
    }
  },
  { immediate: true }
)

function handleChange(values: Array<string | number>) {
  if (values.length === 0) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', values)
  }
}
</script>
