<template>
  <nav class="cloud-breadcrumb" :aria-label="t('cloud.breadcrumb')">
    <template v-for="(item, index) in items" :key="item.id">
      <a
        v-if="index < items.length - 1"
        class="cloud-breadcrumb__link"
        @click.prevent="handleClick(item)"
      >
        <icon-home v-if="index === 0" class="home-icon" />
        {{ item.name }}
      </a>
      <template v-else>
        <span class="cloud-breadcrumb__current">{{ item.name }}</span>
      </template>
      <span v-if="index < items.length - 1" class="cloud-breadcrumb__sep">/</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconHome } from '@arco-design/web-vue/es/icon'

interface BreadcrumbItem {
  id: number | null
  name: string
}

interface Props {
  items: BreadcrumbItem[]
  currentId?: number | null
}

interface Emits {
  (e: 'navigate', item: BreadcrumbItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

function handleClick(item: BreadcrumbItem) {
  if (item.id !== props.currentId) {
    emit('navigate', item)
  }
}
</script>

<style scoped>
.cloud-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  flex-wrap: wrap;
  min-width: 0;
}

.cloud-breadcrumb__link {
  color: var(--brand-blue);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.cloud-breadcrumb__link:hover {
  color: var(--brand-blue-hover);
}

.cloud-breadcrumb__current {
  color: var(--text-primary);
  font-weight: 600;
}

.cloud-breadcrumb__sep {
  color: var(--text-tertiary);
}

.home-icon {
  font-size: 15px;
}
</style>