<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left-wrap">
        <!-- 品牌区 -->
        <div
          class="brand-area"
          role="button"
          tabindex="0"
          :aria-label="brandLabel"
          @click="$emit('home')"
          @keydown.enter="$emit('home')"
        >
          <div class="logo-mark">AI</div>
          <div class="brand-text">
            <div class="brand-title">{{ brandTitle }}</div>
            <div class="brand-subtitle">{{ brandSubtitle }}</div>
          </div>
        </div>

        <!-- 顶级菜单 -->
        <div class="root-menu-bar" role="navigation" :aria-label="t('layout.mainNav')">
          <a-menu
            mode="horizontal"
            :selected-keys="rootSelectedKeys"
            class="root-menu-flat"
            :ellipsis="false"
            @menu-item-click="(key: string) => $emit('root-click', key)"
          >
            <a-menu-item v-for="item in rootMenus" :key="item.key">
              {{ item.title }}
            </a-menu-item>
          </a-menu>
        </div>
      </div>

      <!-- 用户操作 -->
      <div class="header-actions">
        <a-button type="text" size="small" :aria-label="t('layout.userProfile')" @click="$emit('profile')">
          {{ t('layout.userProfile') }}
        </a-button>
        <a-button type="text" size="small" :aria-label="t('layout.logout')" @click="$emit('logout')">
          {{ t('layout.logout') }}
        </a-button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface NavItem {
  key: string
  title: string
}

interface Props {
  rootMenus: NavItem[]
  rootSelectedKeys: string[]
  brandTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  brandTitle: 'Zigebo',
})

defineEmits<{
  (e: 'home'): void
  (e: 'profile'): void
  (e: 'logout'): void
  (e: 'root-click', key: string): void
}>()

const { t } = useI18n()
const brandSubtitle = computed(() => t('layout.dataCenter'))
const brandLabel = computed(() => `${props.brandTitle} - ${brandSubtitle.value}`)
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background: linear-gradient(135deg, #1a3458 0%, #2a4878 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.header-left-wrap {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 56px;
  cursor: pointer;
  user-select: none;
  width: 220px;
  flex-shrink: 0;
  outline: none;
  transition: background-color 0.2s;
}

.brand-area:hover,
.brand-area:focus-visible {
  background: rgba(255, 255, 255, 0.05);
}

.brand-area:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f8cff, #2a4878);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-text {
  color: #fff;
  min-width: 0;
}

.brand-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}

.root-menu-bar {
  flex: 1;
  min-width: 0;
  height: 56px;
  display: flex;
  align-items: center;
  padding-left: 20px;
}

.root-menu-bar :deep(.arco-menu) {
  background: transparent;
  border: none;
}

.root-menu-bar :deep(.arco-menu-item) {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.root-menu-bar :deep(.arco-menu-item:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.root-menu-bar :deep(.arco-menu-item.arco-menu-selected) {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-actions :deep(.arco-btn-text) {
  color: rgba(255, 255, 255, 0.85);
}

.header-actions :deep(.arco-btn-text:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .brand-area {
    width: auto;
    min-width: auto;
    padding: 0 16px;
  }
  .brand-text {
    display: none;
  }
}
</style>