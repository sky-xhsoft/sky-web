<!-- 下拉选择框字段渲染器 -->
<template>
  <!-- 查看模式或只读模式：显示文本 -->
  <span v-if="isViewMode" class="select-field-view">
    {{ displayText }}
  </span>

  <!-- 编辑模式：显示下拉框 -->
  <a-select
    v-else
    :model-value="modelValue"
    :placeholder="placeholder"
    :loading="loading"
    :allow-clear="allowClear"
    :allow-search="allowSearch"
    @update:model-value="handleChange"
    @blur="handleBlur"
  >
    <a-option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </a-option>
  </a-select>
</template>

<style scoped>
.select-field-view {
  display: inline-block;
  padding: 4px 0;
  color: #333;
  line-height: 24px;
  min-height: 32px;
  display: flex;
  align-items: center;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDictStore } from '../../stores/useDictStore'
import { useMetadataStore } from '../../stores'
import type { SysColumn, FieldValue } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
  blur: []
}>()

const dictStore = useDictStore()
const metadataStore = useMetadataStore()
const loading = ref(false)

// 是否为查看模式（disabled 或 readonly）
const isViewMode = computed(() => {
  const result = props.disabled || props.readonly
  return result
})

// 占位符
const placeholder = computed(() => {
  return props.column.PLACEHOLDER || `请选择${props.column.DISPLAY_NAME}`
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return props.column.NULL_ABLE === 'Y'
})

// 是否支持搜索
const allowSearch = computed(() => true)

// 选项列表
const options = computed(() => {
  // 优先从 tableConfig.dictData 中获取（新方式）
  const sysDictID = props.column.SYS_DICT_ID || (props.column as any).sysDictId
  const tableId = props.column.TABLE_ID || (props.column as any).tableId || (props.column as any).sysTableId

  if (sysDictID) {
    // 从 metadataStore 获取 tableConfig
    if (tableId) {
      const tableConfig = metadataStore.getTableConfig(tableId)

      if (tableConfig?.dictData) {
        const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
        const dictItems = tableConfig.dictData[dictID]

        if (dictItems && dictItems.length > 0) {
          const opts = dictItems.map(item => ({
            value: item.VALUE || (item as any).value,
            label: item.DISPLAY_NAME || (item as any).displayName
          }))
          return opts
        }
      } else {
      }
    } else {
    }
  }

  // 降级：从 dictStore 获取（旧方式）
  if (props.column.DICT_TABLE_ID) {
    const opts = dictStore.toSelectOptions(props.column.DICT_TABLE_ID)
    return opts
  }

  return []
})

// 显示文本（用于查看模式）
const displayText = computed(() => {

  if (!props.modelValue) return '-'

  const option = options.value.find(opt => opt.value === props.modelValue)
  const result = option ? option.label : String(props.modelValue)
  return result
})

// 值变化处理
function handleChange(value: string | number | undefined) {
  emit('update:modelValue', value ?? null)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}

// 加载字典数据（降级方案）
async function loadDictData() {
  if (!props.column.DICT_TABLE_ID) return

  loading.value = true
  try {
    await dictStore.loadDictItems(props.column.DICT_TABLE_ID)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 如果 tableConfig.dictData 中没有数据，尝试从 dictStore 加载
  const sysDictID = props.column.SYS_DICT_ID || (props.column as any).sysDictId
  if (sysDictID) {
    const tableId = props.column.TABLE_ID || (props.column as any).tableId || (props.column as any).sysTableId
    if (tableId) {
      const tableConfig = metadataStore.getTableConfig(tableId)
      const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
      const dictItems = tableConfig?.dictData?.[dictID]

      if (!dictItems || dictItems.length === 0) {
        loadDictData()
      }
    } else {
      loadDictData()
    }
  } else {
    loadDictData()
  }
})
</script>
