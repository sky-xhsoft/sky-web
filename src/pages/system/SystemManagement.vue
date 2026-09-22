<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh, IconRight } from '@arco-design/web-vue/es/icon'
import { useMenuStore } from '@/stores/menu'
import { useNavigationStore } from '@/stores/navigation'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'

const menuStore = useMenuStore()
const navigationStore = useNavigationStore()

const systemFeatures = ref([
  { icon: '📊', title: '元数据驱动', desc: '通过配置化方式实现灵活的业务功能扩展' },
  { icon: '🔐', title: '权限管理', desc: '基于安全目录与权限组的细粒度访问控制' },
  { icon: '📝', title: '数据字典', desc: '统一维护下拉选项与枚举值' },
  { icon: '🔄', title: '多租户隔离', desc: '公司级数据隔离与独立配置' }
])

const builtInModules = [
  {
    key: 'permission',
    title: '权限矩阵',
    component: 'PermissionManagement',
    description: '查看权限组在各目录/数据表上的权限分布',
    icon: '🔐'
  },
  {
    key: 'company',
    title: '公司配置',
    component: 'CompanyConfig',
    description: '管理租户全局配置与云服务商凭证',
    icon: '⚙️'
  }
]

const moduleCategories = computed(() => {
  const systemMenu = menuStore.menus.find((menu: any) => menu.name === '系统管理')
  if (!systemMenu?.children) return []

  return systemMenu.children.map((category: any) => {
    let icon = '📁'
    let color = '#165dff'
    let description = category.name

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
      description,
      icon,
      color,
      modules: (category.children || []).map((module: any) => ({
        id: module.id,
        name: module.name,
        displayName: module.displayName,
        url: module.url,
        description: `管理${module.displayName || module.name}相关数据`
      }))
    }
  })
})

const handleModuleClick = async (module: any) => {
  const path = module.url
  if (!path) return

  if (path.startsWith('/metadata/')) {
    const match = path.match(/\/metadata\/(?:list|browse)\/(\d+)/)
    if (match) {
      const tableId = match[1]
      await import('@/modules/metadata/views/MetadataListView.vue')
      navigationStore.navigateTo('MetadataListView', module.displayName, { tableId: Number(tableId) }, true)
      return
    }
  }

  if (path.startsWith('/tables/')) {
    navigationStore.navigateTo('TableView', module.displayName, { tablePath: path }, true)
  }
}

const navigateToComponent = (componentName: string, title: string) => {
  navigationStore.navigateTo(componentName, title, {}, true)
}

const loadMenus = async () => {
  try {
    await menuStore.loadMenus()
    Message.success('菜单已刷新')
  } catch {
    Message.error('刷新菜单失败')
  }
}
</script>

<template>
  <div class="system-management-page">
    <V2PageHeader title="系统管理" description="元数据、权限、配置等系统级功能入口">
      <template #actions>
        <V2Button type="secondary" @click="loadMenus">
          <template #icon><icon-refresh /></template>
          刷新菜单
        </V2Button>
      </template>
    </V2PageHeader>

    <div class="dashboard-grid-4 stagger">
      <V2Card v-for="(feature, idx) in systemFeatures" :key="idx" hover class="feature-card">
        <div class="feature-icon">{{ feature.icon }}</div>
        <div class="feature-title">{{ feature.title }}</div>
        <div class="feature-desc">{{ feature.desc }}</div>
      </V2Card>
    </div>

    <div class="modules-section">
      <div v-for="category in moduleCategories" :key="category.key" class="category-block">
        <V2Card :padding="true">
          <div class="category-header">
            <span class="category-icon" :style="{ color: category.color }">{{ category.icon }}</span>
            <div class="category-info">
              <div class="category-title">{{ category.title }}</div>
              <div class="category-desc">{{ category.description }}</div>
            </div>
            <V2Tag type="neutral">{{ category.modules.length }} 个模块</V2Tag>
          </div>
          <div class="modules-grid">
            <V2Card
              v-for="module in category.modules"
              :key="module.id"
              hover
              class="module-card"
              @click="handleModuleClick(module)"
            >
              <div class="module-content">
                <div class="module-header">
                  <span class="module-icon" :style="{ color: category.color }">{{ category.icon }}</span>
                  <div class="module-name">{{ module.displayName || module.name }}</div>
                </div>
                <div class="module-description">{{ module.description }}</div>
                <div class="module-action">
                  进入
                  <icon-right class="action-icon" />
                </div>
              </div>
            </V2Card>
          </div>
        </V2Card>
      </div>

      <div class="category-block">
        <V2Card :padding="true">
          <div class="category-header">
            <span class="category-icon" style="color: #f53f3f;">🔐</span>
            <div class="category-info">
              <div class="category-title">系统安全</div>
              <div class="category-desc">权限矩阵与公司配置</div>
            </div>
            <V2Tag type="neutral">{{ builtInModules.length }} 个模块</V2Tag>
          </div>
          <div class="modules-grid">
            <V2Card
              v-for="module in builtInModules"
              :key="module.key"
              hover
              class="module-card"
              @click="navigateToComponent(module.component, module.title)"
            >
              <div class="module-content">
                <div class="module-header">
                  <span class="module-icon" style="color: #f53f3f;">{{ module.icon }}</span>
                  <div class="module-name">{{ module.title }}</div>
                </div>
                <div class="module-description">{{ module.description }}</div>
                <div class="module-action">
                  进入
                  <icon-right class="action-icon" />
                </div>
              </div>
            </V2Card>
          </div>
        </V2Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-management-page {
  padding: 12px;
  background: var(--bg-page);
  height: 100%;
  overflow-y: auto;
}

.dashboard-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.feature-card {
  cursor: default;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.feature-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modules-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-block {
  margin-bottom: 4px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
}

.category-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.category-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.module-card {
  cursor: pointer;
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.module-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.module-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.module-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.module-description {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}

.module-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--brand-blue);
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

@media (max-width: 1200px) {
  .dashboard-grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-grid-4 {
    grid-template-columns: 1fr;
  }
}
</style>
