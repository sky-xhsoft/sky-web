<template>
  <div class="foreign-key-field">
    <a-select
      v-model="currentValue"
      :options="options"
      :loading="loading"
      :allow-search="true"
      :allow-clear="true"
      :disabled="isDisabled"
      :placeholder="placeholder"
      @search="handleSearch"
      @change="handleChange"
    >
      <template #empty>
        <a-empty description="暂无数据" />
      </template>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useForeignKey } from '../../composables/useForeignKey'
import type { SysColumn, FormMode, ForeignKeyOption } from '../../types'

const props = defineProps<{
  column: SysColumn
  modelValue: number | string | null
  mode: FormMode
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
  'change': [value: number | string | null, option: ForeignKeyOption | null]
}>()

// 使用外键 composable
const {
  options,
  loading,
  loadOptions,
  searchOptions
} = useForeignKey(props.column)

const currentValue = ref(props.modelValue)
const isDisabled = computed(() => props.disabled || props.mode === 'view')
const placeholder = computed(() => props.column.PLACEHOLDER || '请选择')

// 初始化
onMounted(async () => {
  await loadOptions()
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal
})

// 搜索处理
async function handleSearch(keyword: string) {
  await searchOptions(keyword)
}

// 值变化处理
function handleChange(value: number | string | null) {
  const option = options.value.find(opt => opt.value === value)
  emit('update:modelValue', value)
  emit('change', value, option || null)
}
</script>

<style scoped>
.foreign-key-field {
  width: 100%;
}
</style>
