<template>
  <div class="cloud-breadcrumb">
    <a-breadcrumb>
      <a-breadcrumb-item
        v-for="(item, index) in items"
        :key="item.id"
        @click="handleClick(item)"
      >
        <a :class="{ 'is-current': item.id === currentId, 'is-first': index === 0 }">
          <icon-home v-if="index === 0" class="home-icon" />
          {{ item.name }}
        </a>
      </a-breadcrumb-item>
    </a-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { IconHome } from '@arco-design/web-vue/es/icon'

interface BreadcrumbItem {
  id: number
  name: string
}

interface Props {
  items: BreadcrumbItem[]
  currentId?: number
}

interface Emits {
  (e: 'navigate', item: BreadcrumbItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClick(item: BreadcrumbItem) {
  if (item.id !== props.currentId) {
    emit('navigate', item)
  }
}
</script>

<style scoped>
.cloud-breadcrumb {
  flex: 1;
  min-width: 0;
}

.cloud-breadcrumb :deep(.arco-breadcrumb) {
  font-size: 14px;
}

.cloud-breadcrumb :deep(.arco-breadcrumb-item) {
  transition: all 0.2s ease;
}

.cloud-breadcrumb a {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--color-text-2);
  font-weight: 400;
}

.cloud-breadcrumb a:hover:not(.is-current) {
  background: rgba(var(--primary-1), 0.6);
  color: rgb(var(--primary-6));
  transform: translateY(-1px);
}

.cloud-breadcrumb a.is-current {
  color: rgb(var(--primary-6));
  cursor: default;
  font-weight: 600;
  background: rgba(var(--primary-1), 0.3);
}

.cloud-breadcrumb a.is-first {
  font-weight: 500;
}

.home-icon {
  font-size: 16px;
}
</style>
