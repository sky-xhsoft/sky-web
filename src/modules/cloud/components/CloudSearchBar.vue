<template>
  <div class="cloud-search-bar">
    <a-input-search
      v-model="searchValue"
      :placeholder="computedPlaceholder"
      :loading="searching"
      allow-clear
      class="cloud-search-bar__input"
      @search="handleSearch"
      @clear="handleClear"
    >
      <template #prefix>
        <icon-search />
      </template>
    </a-input-search>

    <!-- Search stats -->
    <div v-if="showStats && hasResults" class="cloud-search-bar__stats">
      <strong>{{ resultCount }}</strong> {{ t('cloud.searchResults', { count: resultCount }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { IconSearch } from '@arco-design/web-vue/es/icon'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  placeholder: '',
  searching: false,
  resultCount: 0,
  showStats: true,
})

const emit = defineEmits<Emits>()

const computedPlaceholder = computed(() => props.placeholder || t('cloud.searchPlaceholder'))

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
export default {
  name: 'CloudSearchBar',
}
</script>

<style scoped>
.cloud-search-bar {
  width: 320px;
}

.cloud-search-bar__input :deep(.arco-input-wrapper) {
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  height: 34px;
  transition: border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.cloud-search-bar__input :deep(.arco-input-wrapper:hover) {
  border-color: var(--brand-blue);
}

.cloud-search-bar__input :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 3px var(--info-bg);
}

.cloud-search-bar__input :deep(.arco-input) {
  font-size: 13px;
}

.cloud-search-bar__input :deep(.arco-input::placeholder) {
  color: var(--text-tertiary);
}

.cloud-search-bar__input :deep(.arco-input-search-btn) {
  background: var(--brand-blue);
  color: #fff;
}

.cloud-search-bar__input :deep(.arco-icon-search) {
  color: var(--brand-blue);
}

.cloud-search-bar__stats {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
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
  color: var(--brand-blue);
  font-weight: 600;
}

@media (max-width: 768px) {
  .cloud-search-bar {
    width: 100%;
  }
}
</style>