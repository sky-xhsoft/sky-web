<!-- 树形选择字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly || mode === 'view'" class="tree-select-field-view">
    {{ displayValue }}
  </span>
  <a-tree-select
    v-else
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :allow-clear="allowClear"
    :multiple="multiple"
    :tree-checkable="treeCheckable"
    :show-search="showSearch"
    :tree-data="treeData"
    :field-names="fieldNames"
    :tree-default-expand-all="defaultExpandAll"
    :tree-expand-on-click-node="expandOnClickNode"
    @update:model-value="handleChange"
  />
</template>

<style scoped>
.tree-select-field-view {
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

interface TreeNode {
  value: string | number
  title: string
  children?: TreeNode[]
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

const treeData = computed<TreeNode[]>(() => {
  return config.value.treeData || []
})

const allowClear = computed(() => {
  return !props.disabled && !props.readonly
})

const multiple = computed(() => {
  return config.value.multiple === true
})

const treeCheckable = computed(() => {
  return config.value.treeCheckable === true
})

const showSearch = computed(() => {
  return config.value.showSearch !== false
})

const defaultExpandAll = computed(() => {
  return config.value.defaultExpandAll !== false
})

const expandOnClickNode = computed(() => {
  return config.value.expandOnClickNode !== false
})

const fieldNames = computed(() => {
  return config.value.fieldNames || {
    label: 'title',
    value: 'value',
    children: 'children'
  }
})

const separator = computed(() => {
  return config.value.separator || ', '
})

const selectedLabels = ref<string[]>([])

const displayValue = computed(() => {
  if (selectedLabels.value.length > 0) {
    return selectedLabels.value.join(separator.value)
  }
  if (!props.modelValue) return ''
  return String(props.modelValue)
})

function findLabels(data: TreeNode[], values: any[]): string[] {
  const labels: string[] = []
  const valueSet = new Set(values)

  function traverse(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (valueSet.has(node.value)) {
        labels.push(node.title)
      }
      if (node.children) {
        traverse(node.children)
      }
    }
  }

  traverse(data)
  return labels
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      selectedLabels.value = []
      return
    }
    let values: any[]
    if (Array.isArray(newValue)) {
      values = newValue
    } else if (typeof newValue === 'string') {
      try {
        const parsed = JSON.parse(newValue)
        values = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        values = newValue.split(',').map(s => s.trim()).filter(Boolean)
      }
    } else {
      values = [newValue]
    }
    selectedLabels.value = findLabels(treeData.value, values)
  },
  { immediate: true }
)

function handleChange(value: any) {
  emit('update:modelValue', value)
}
</script>
