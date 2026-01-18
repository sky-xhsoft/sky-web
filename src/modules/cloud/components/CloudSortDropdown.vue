<template>
  <a-dropdown trigger="click" @select="handleSelect">
    <a-button>
      <icon-sort />
      {{ currentLabel }}
      <span class="sort-order-icon">{{ sortOrderIcon }}</span>
    </a-button>
    <template #content>
      <a-doption
        v-for="option in sortOptions"
        :key="option.value"
        :value="option.value"
      >
        <span class="option-icon">{{ option.icon }}</span>
        {{ option.label }}
        <icon-check
          v-if="sortBy === option.value"
          class="check-icon"
        />
      </a-doption>
      <a-divider margin="4px" />
      <a-doption value="toggle-order">
        <icon-swap />
        切换排序方向
        <span class="order-label">{{ sortOrderText }}</span>
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  IconSort,
  IconCheck,
  IconSwap,
} from '@arco-design/web-vue/es/icon'
import type { FileSortBy, SortOrder } from '@/modules/cloud/types'

interface SortOption {
  value: FileSortBy
  label: string
  icon: string
}

interface Props {
  sortBy?: FileSortBy
  sortOrder?: SortOrder
  sortOptions?: SortOption[]
}

interface Emits {
  (e: 'sortByChange', sortBy: FileSortBy): void
  (e: 'sortOrderToggle'): void
}

const props = withDefaults(defineProps<Props>(), {
  sortBy: 'name',
  sortOrder: 'asc',
  sortOptions: () => [
    { value: 'name', label: '名称', icon: '📝' },
    { value: 'size', label: '大小', icon: '📦' },
    { value: 'date', label: '日期', icon: '📅' },
  ],
})

const emit = defineEmits<Emits>()

const currentOption = computed(() => {
  return props.sortOptions.find((opt) => opt.value === props.sortBy) || props.sortOptions[0]
})

const currentLabel = computed(() => {
  return `排序：${currentOption.value.label}`
})

const sortOrderIcon = computed(() => {
  return props.sortOrder === 'asc' ? '↑' : '↓'
})

const sortOrderText = computed(() => {
  return props.sortOrder === 'asc' ? '升序' : '降序'
})

function handleSelect(value: string | number | Record<string, any> | undefined) {
  if (typeof value !== 'string') return

  if (value === 'toggle-order') {
    emit('sortOrderToggle')
  } else {
    emit('sortByChange', value as FileSortBy)
  }
}
</script>

<style scoped>
.sort-order-icon {
  margin-left: 4px;
  font-size: 12px;
  color: #6b7280;
}

.option-icon {
  margin-right: 8px;
  font-size: 16px;
}

.check-icon {
  margin-left: auto;
  color: #3b82f6;
}

.order-label {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
}
</style>
