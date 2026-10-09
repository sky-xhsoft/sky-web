<template>
  <!-- 个人中心：左侧个人信息与账号，右侧公司配置（无标签页，一屏完成） -->
  <div class="user-center-page">
    <div class="ucp-layout">
      <UserProfile />
      <CompanyConfig />
    </div>
  </div>
</template>

<script setup lang="ts">
import UserProfile from './UserProfile.vue'
import CompanyConfig from './CompanyConfig.vue'
</script>

<style scoped>
.user-center-page {
  height: 100%;
  padding: 8px;
  overflow-y: auto;
}

.ucp-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  max-width: 1200px;
}

@media (max-width: 1000px) {
  .ucp-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
