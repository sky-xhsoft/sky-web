<script setup lang="ts">
import { IconApps } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '../../stores/menu'
import type { NavItem } from '../composables/menuUtils'

interface Props {
  items: NavItem[]
  openKeys: string[]
  selectedKeys: string[]
  mobileShow: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:openKeys', keys: string[]): void
  (e: 'update:selectedKeys', keys: string[]): void
  (e: 'click', key: string): void
  (e: 'toggleMobile'): void
}>()

const menuStore = useMenuStore()
</script>

<template>
  <aside class="side-nav" :class="{ collapsed: menuStore.sidebarCollapsed, 'mobile-show': mobileShow }">
    <a-menu
      :open-keys="openKeys"
      :selected-keys="selectedKeys"
      @update:open-keys="emit('update:openKeys', $event)"
      @update:selected-keys="emit('update:selectedKeys', $event)"
      @menu-item-click="emit('click', $event)"
      :accordion="true"
      :collapsed="menuStore.sidebarCollapsed"
      :popup-max-height="400"
    >
      <template v-for="item in items" :key="item.key">
        <a-sub-menu v-if="item.children?.length" :key="item.key">
          <template #icon><IconApps /></template>
          <template #title>{{ item.title }}</template>
          <a-menu-item v-for="child in item.children" :key="child.key">
            {{ child.title }}
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item v-else :key="item.key">
          <template #icon><IconApps /></template>
          {{ item.title }}
        </a-menu-item>
      </template>
    </a-menu>
  </aside>

  <!-- 移动端遮罩层 -->
  <div
    class="mobile-overlay"
    :class="{ show: mobileShow }"
    @click="emit('toggleMobile')"
  ></div>
</template>

<style scoped>
.side-nav {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  flex-shrink: 0;
  transition: width 0.2s;
  display: flex;
  flex-direction: column;
}
.side-nav.collapsed {
  width: 60px;
}
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 19;
}
.mobile-overlay.show {
  display: block;
}
@media (max-width: 768px) {
  .side-nav {
    position: fixed;
    left: -240px;
    top: 0;
    bottom: 0;
    z-index: 20;
    transition: left 0.3s;
  }
  .side-nav.mobile-show {
    left: 0;
  }
  .side-nav.collapsed {
    width: 240px;
    left: -240px;
  }
}
</style>
