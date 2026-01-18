<template>
  <div class="cloud-search-bar">
    <a-input-search
      v-model="searchValue"
      :placeholder="placeholder"
      :loading="searching"
      allow-clear
      @search="handleSearch"
      @clear="handleClear"
    >
      <template #prefix>
        <icon-search />
      </template>
    </a-input-search>

    <!-- 搜索统计 -->
    <div v-if="showStats && hasResults" class="cloud-search-bar__stats">
      找到 <strong>{{ resultCount }}</strong> 个结果
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconSearch } from '@arco-design/web-vue/es/icon'

interface Props {
  modelValue?: string
  placeholder?: string
  searching?: boolean
  resultCount?: number
  showStats?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', query: string): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索文件...',
  searching: false,
  resultCount: 0,
  showStats: true,
})

const emit = defineEmits<Emits>()

const searchValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    searchValue.value = newValue
  }
)

watch(searchValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const hasResults = computed(() => props.resultCount > 0)

function handleSearch(value: string) {
  emit('search', value)
}

function handleClear() {
  emit('clear')
}
</script>

<script lang="ts">
import { computed } from 'vue'
export default {
  name: 'CloudSearchBar',
}
</script>

<style scoped>
.cloud-search-bar {
  width: 320px;
}

.cloud-search-bar :deep(.arco-input-wrapper) {
  border-radius: 20px;
  background: #ffffff;
  border: 1.5px solid #e5e7eb;
  padding: 2px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.cloud-search-bar :deep(.arco-input-wrapper:hover) {
  border-color: rgb(var(--primary-5));
  box-shadow: 0 2px 6px rgba(var(--primary-2), 0.3);
}

.cloud-search-bar :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 0 0 3px rgba(var(--primary-1), 0.5);
}

.cloud-search-bar :deep(.arco-input) {
  font-size: 14px;
}

.cloud-search-bar :deep(.arco-input::placeholder) {
  color: #9ca3af;
}

.cloud-search-bar :deep(.arco-icon-search) {
  color: rgb(var(--primary-6));
}

.cloud-search-bar__stats {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  text-align: right;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cloud-search-bar__stats strong {
  color: rgb(var(--primary-6));
  font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cloud-search-bar {
    width: 100%;
  }
}
</style>
