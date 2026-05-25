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
        {{ t('cloud.toggleSortOrder') }}
        <span class="order-label">{{ sortOrderText }}</span>
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IconSort,
  IconCheck,
  IconSwap,
} from '@arco-design/web-vue/es/icon'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

const internalSortOptions = computed<SortOption[]>(() => [
  { value: 'name', label: t('cloud.sortByName'), icon: '📝' },
  { value: 'size', label: t('cloud.sortBySize'), icon: '📦' },
  { value: 'date', label: t('cloud.sortByDate'), icon: '📅' },
])

const props = withDefaults(defineProps<Props>(), {
  sortBy: 'name',
  sortOrder: 'asc',
})

const emit = defineEmits<Emits>()

const sortOptions = computed<SortOption[]>(() => {
  if (props.sortOptions?.length) {
    return props.sortOptions
  }
  return internalSortOptions.value
})

const currentOption = computed(() => {
  return sortOptions.value.find((opt) => opt.value === props.sortBy) || sortOptions.value[0]
})

const currentLabel = computed(() => {
  return `${t('cloud.sortBy')}${currentOption.value?.label || ''}`
})

const sortOrderIcon = computed(() => {
  return props.sortOrder === 'asc' ? '↑' : '↓'
})

const sortOrderText = computed(() => {
  return props.sortOrder === 'asc' ? t('cloud.ascending') : t('cloud.descending')
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
