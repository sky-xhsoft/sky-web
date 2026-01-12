<script setup lang="ts">
const stats = [
  { title: '今日访问', value: '12,480', trend: '+8.3%' },
  { title: '在线用户', value: '286', trend: '+2.1%' },
  { title: '待办任务', value: '18', trend: '-1.2%' },
]
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">首页概览</div>
        <div class="page-subtitle">基于 Vite + Vue3 + Arco Design 的管理后台脚手架</div>
      </div>
      <a-space>
        <a-button type="outline">刷新</a-button>
        <a-button type="primary">新建</a-button>
      </a-space>
    </div>

    <a-row :gutter="16" class="section">
      <a-col :span="8" v-for="item in stats" :key="item.title">
        <a-card :title="item.title" size="small">
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-trend">{{ item.trend }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="快速开始" size="small">
      <a-space direction="vertical" size="medium">
        <div>· 在 <code>src/router</code> 中添加业务路由</div>
        <div>· 在 <code>src/pages</code> 中编写页面，使用 Arco 组件快速构建界面</div>
        <div>· 整合后端 API（例如 sky-server）并在 <code>src/api</code> 中封装请求</div>
      </a-space>
    </a-card>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
}
.page-subtitle {
  color: var(--color-text-2);
}
.section {
  margin-top: 4px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
}
.stat-trend {
  margin-top: 4px;
  color: #00a870;
}
</style>

