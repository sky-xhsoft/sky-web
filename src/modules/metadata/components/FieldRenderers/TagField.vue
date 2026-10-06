<!-- 标签/多选字段渲染器 -->
<template>
  <div class="tag-field">
    <div v-if="isDisabled || isReadonly || mode === 'view'" class="tag-field__view">
      <div v-if="tagList.length > 0" class="tag-list">
        <a-tag
          v-for="(tag, index) in tagList"
          :key="index"
          :color="tag.color"
          :size="tagSize"
        >
          {{ tag.label }}
        </a-tag>
      </div>
      <span v-else class="tag-empty">{{ placeholder }}</span>
    </div>
    <a-select
      v-else
      v-model="selectedTags"
      :placeholder="placeholder"
      :disabled="disabled || readonly"
      :allow-clear="allowClear"
      :allow-search="allowSearch"
      :multiple="true"
      :options="options"
      :max-tag-count="maxTagCount"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.tag-field {
  width: 100%;
}

.tag-field__view {
  padding: 4px 0;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-empty {
  color: var(--text-tertiary);
  font-size: 14px;
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFieldRendererBase } from '../../composables'
import { getColumnDictOptions } from '../../composables/useDictOptions'
import type { SysColumn, FieldValue, FormMode } from '../../types'

interface TagItem {
  value: string | number
  label: string
  color?: string
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

const options = computed<TagItem[]>(() => {
  const dictOptions = getColumnDictOptions(props.column)
  if (dictOptions.length > 0) {
    return dictOptions.map(opt => ({
      value: opt.value,
      label: opt.label
    }))
  }
  return config.value.options || []
})

const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

const allowSearch = computed(() => {
  return config.value.allowSearch !== false
})

const maxTagCount = computed(() => {
  return config.value.maxTagCount || 'responsive'
})

const tagSize = computed(() => {
  return config.value.tagSize || 'default'
})

const selectedTags = ref<Array<string | number>>([])

const tagList = computed<TagItem[]>(() => {
  if (!selectedTags.value || selectedTags.value.length === 0) return []
  return selectedTags.value.map(v => {
    const opt = options.value.find(o => o.value === v)
    return {
      value: v,
      label: opt?.label || String(v),
      color: opt?.color
    }
  })
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      selectedTags.value = []
      return
    }
    if (Array.isArray(newValue)) {
      selectedTags.value = newValue
    } else if (typeof newValue === 'string') {
      try {
        const parsed = JSON.parse(newValue)
        selectedTags.value = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        selectedTags.value = newValue.split(',').map(s => s.trim()).filter(Boolean)
      }
    } else {
      selectedTags.value = [newValue as string | number]
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
