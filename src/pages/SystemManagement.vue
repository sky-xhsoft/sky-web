<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconApps, IconRight, IconSettings, IconUser, IconDatabase, IconSafe, IconDesktop } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '../stores/menu'
import { useNavigationStore } from '../stores/navigation'

const menuStore = useMenuStore()
const navigationStore = useNavigationStore()

// 系统架构说明
const systemArchitecture = ref({
  title: '系统架构概览',
  description: '本系统采用元数据驱动的架构设计，通过配置化的方式实现灵活的业务功能扩展',
  features: [
    {
      icon: '🏗️',
      title: '元数据驱动',
      description: '通过元数据配置实现动态表单、字段、权限等功能，无需修改代码即可扩展业务'
    },
    {
      icon: '🔐',
      title: '权限管理',
      description: '基于用户-权限组-权限的三层权限体系，实现细粒度的访问控制'
    },
    {
      icon: '📊',
      title: '数据字典',
      description: '统一管理系统中的枚举值、下拉选项等配置数据，保证数据一致性'
    },
    {
      icon: '🔄',
      title: '多租户支持',
      description: '支持多公司、多子系统的数据隔离与管理，满足企业级应用需求'
    }
  ]
})

// 功能模块分类（从后端菜单数据动态获取）
const moduleCategories = computed(() => {
  const systemManagementMenu = menuStore.menus.find((menu: any) => menu.name === '系统管理')

  if (!systemManagementMenu || !systemManagementMenu.children) {
    return []
  }

  return systemManagementMenu.children.map((category: any) => {
    let icon = '📁'
    let color = '#165dff'
    let description = category.name

    // 根据分类名称设置图标和颜色
    if (category.name.includes('元数据')) {
      icon = '📊'
      color = '#165dff'
      description = '系统基础数据配置，包括表结构、字段定义、数据字典等核心元数据'
    } else if (category.name.includes('用户') || category.name.includes('权限')) {
      icon = '🔐'
      color = '#00b42a'
      description = '用户账号管理、权限组配置、访问控制等安全相关功能'
    } else if (category.name.includes('日志')) {
      icon = '📝'
      color = '#f7ba1e'
      description = '系统操作日志、审计追踪、异常记录等监控功能'
    } else if (category.name.includes('配置')) {
      icon = '⚙️'
      color = '#f53f3f'
      description = '系统参数配置、功能开关、环境设置等全局配置'
    }

    return {
      key: category.id,
      title: category.name,
      description: description,
      icon: icon,
      color: color,
      modules: (category.children || []).map((module: any) => ({
        id: module.id,
        name: module.name,
        displayName: module.displayName,
        url: module.url,
        description: getModuleDescription(module.name, module.displayName)
      }))
    }
  })
})

// 获取模块描述
const getModuleDescription = (name: string, displayName: string) => {
  const descriptions: Record<string, string> = {
    'SYS_COMPANY': '管理公司基本信息、组织架构等',
    'SYS_SUBSYSTEM': '管理系统模块划分、功能分组',
    'SYS_TABLE_CATEGORY': '管理数据表的分类和组织结构',
    'SYS_TABLE': '配置系统中的数据表结构和属性',
    'SYS_COLUMN': '定义表字段的类型、验证规则等',
    'SYS_DICT': '管理系统枚举值、下拉选项等字典数据',
    'SYS_SEQ': '配置业务单号、流水号的生成规则',
    'SYS_USER': '管理系统用户账号、基本信息',
    'SYS_GROUPS': '配置权限组、角色定义',
    'SYS_USER_GROUPS': '分配用户所属的权限组',
    'SYS_GROUP_PREM': '配置权限组的具体权限明细'
  }
  return descriptions[name] || `管理${displayName}相关数据`
}

// 处理模块点击
const handleModuleClick = async (module: any) => {
  const path = module.url

  // 检查是否是元数据路由
  if (path.startsWith('/metadata/')) {
    const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
    if (match) {
      const tableId = match[1]
      const MetadataListView = (await import('../modules/metadata/views/MetadataListView.vue')).default
      navigationStore.navigateTo('MetadataListView', module.displayName, { tableId: Number(tableId) }, true)
      return
    }
  }

  // 其他表单路由
  if (path.startsWith('/tables/')) {
    navigationStore.navigateTo('TableView', module.displayName, { tablePath: path }, true)
  }
}

// 使用流程说明
const usageFlow = ref([
  {
    step: 1,
    title: '配置元数据',
    description: '首先配置公司、子系统、表结构等基础元数据',
    icon: '📊',
    color: '#165dff'
  },
  {
    step: 2,
    title: '设置权限',
    description: '创建用户账号、配置权限组和权限明细',
    icon: '🔐',
    color: '#00b42a'
  },
  {
    step: 3,
    title: '配置字典',
    description: '维护数据字典、序号规则等业务配置',
    icon: '📝',
    color: '#f7ba1e'
  },
  {
    step: 4,
    title: '业务使用',
    description: '基于配置的元数据开展具体业务操作',
    icon: '🚀',
    color: '#722ed1'
  }
])
</script>

<template>
  <div class="system-management-page">
    <!-- 系统架构特性 -->
    <div class="architecture-section">
      <div class="section-header">
        <h2 class="section-title">🏗️ 系统架构特性</h2>
        <p class="section-description">了解系统的核心设计理念和技术特点</p>
      </div>
      <div class="features-grid">
        <a-card
          v-for="feature in systemArchitecture.features"
          :key="feature.title"
          class="feature-card"
          :bordered="false"
        >
          <div class="feature-content">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 使用流程 -->
    <div class="flow-section">
      <div class="section-header">
        <h2 class="section-title">🔄 系统配置流程</h2>
        <p class="section-description">按照以下步骤完成系统初始化配置</p>
      </div>
      <div class="flow-timeline">
        <div v-for="(item, index) in usageFlow" :key="item.step" class="flow-item">
          <div class="flow-step" :style="{ backgroundColor: item.color }">
            <span class="step-number">{{ item.step }}</span>
          </div>
          <div class="flow-content">
            <div class="flow-icon">{{ item.icon }}</div>
            <h3 class="flow-title">{{ item.title }}</h3>
            <p class="flow-description">{{ item.description }}</p>
          </div>
          <div v-if="index < usageFlow.length - 1" class="flow-connector"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-management-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px;
  max-width: 1600px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 40px;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-icon {
  font-size: 64px;
  line-height: 1;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-description {
  font-size: 16px;
  margin: 0;
  opacity: 0.95;
  line-height: 1.6;
  max-width: 800px;
}

/* 通用区块样式 */
.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1d2129;
}

.section-description {
  font-size: 14px;
  color: #86909c;
  margin: 0;
}

/* 系统架构特性 */
.architecture-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e5e6eb;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #165dff;
}

.feature-card :deep(.arco-card-body) {
  padding: 24px;
}

.feature-content {
  text-align: center;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1d2129;
}

.feature-description {
  font-size: 14px;
  color: #86909c;
  margin: 0;
  line-height: 1.6;
}

/* 使用流程 */
.flow-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.flow-timeline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.flow-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.flow-step {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.step-number {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.flow-content {
  flex: 1;
}

.flow-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.flow-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1d2129;
}

.flow-description {
  font-size: 13px;
  color: #86909c;
  margin: 0;
  line-height: 1.6;
}

.flow-connector {
  display: none;
}

@media (min-width: 768px) {
  .flow-timeline {
    grid-template-columns: repeat(4, 1fr);
  }

  .flow-item {
    position: relative;
  }

  .flow-connector {
    display: block;
    position: absolute;
    top: 24px;
    left: calc(50% + 24px);
    width: calc(100% - 48px);
    height: 2px;
    background: linear-gradient(to right, #e5e6eb 0%, #e5e6eb 100%);
  }

  .flow-item:last-child .flow-connector {
    display: none;
  }
}

/* 功能模块分类 */
.modules-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.category-block {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f2f3f5;
}

.category-icon {
  font-size: 40px;
  line-height: 1;
}

.category-info {
  flex: 1;
}

.category-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #1d2129;
}

.category-description {
  font-size: 14px;
  margin: 0;
  color: #86909c;
  line-height: 1.6;
}

.category-badge {
  background: #f2f3f5;
  color: #4e5969;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

/* 模块网格 */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.module-card {
  border-radius: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e5e6eb;
  background: #fafafa;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #165dff;
  background: white;
}

.module-card :deep(.arco-card-body) {
  padding: 20px;
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.module-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.module-icon {
  font-size: 24px;
}

.module-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1d2129;
}

.module-description {
  font-size: 13px;
  color: #86909c;
  margin: 0;
  flex: 1;
  line-height: 1.6;
}

.module-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
}

.module-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  transition: gap 0.2s ease;
}

.module-card:hover .module-action {
  gap: 8px;
}

.action-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.module-card:hover .action-icon {
  transform: translateX(2px);
}
</style>
