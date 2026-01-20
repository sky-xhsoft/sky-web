# Sky-Web 元数据驱动动态表单系统 - 完整设计文档（第3部分）

## 7. 状态管理设计

### 7.1 Pinia Store架构

#### 7.1.1 MetadataStore - 元数据状态管理

**职责**：
- 缓存子系统、表类别、表单、字段等元数据
- 提供元数据查询和访问接口
- 管理元数据加载状态

**实现**：
```typescript
// src/modules/metadata/stores/useMetadataStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api'
import type {
  Subsystem,
  TableCategory,
  SysTable,
  SysColumn,
  TableConfig
} from '../types'

export const useMetadataStore = defineStore('metadata', () => {
  // ==================== 状态 ====================

  // 子系统
  const subsystems = ref<Subsystem[]>([])
  const subsystemsLoaded = ref(false)

  // 表类别
  const tableCategories = ref<Map<number, TableCategory[]>>(new Map())

  // 表单
  const tables = ref<Map<number, SysTable[]>>(new Map())

  // 表单配置缓存
  const tableConfigs = ref<Map<number, TableConfig>>(new Map())

  // 字段缓存
  const columns = ref<Map<number, SysColumn[]>>(new Map())

  // 加载状态
  const loading = ref({
    subsystems: false,
    categories: false,
    tables: false,
    config: false
  })

  // ==================== 计算属性 ====================

  /**
   * 获取激活的子系统列表
   */
  const activeSubsystems = computed(() => {
    return subsystems.value
      .filter(s => s.IS_ACTIVE === 'Y')
      .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
  })

  /**
   * 构建子系统树（包含表类别）
   */
  const subsystemTree = computed(() => {
    return activeSubsystems.value.map(subsystem => {
      const categories = tableCategories.value.get(subsystem.ID) || []
      return {
        ...subsystem,
        children: categories
          .filter(c => c.IS_ACTIVE === 'Y')
          .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
      }
    })
  })

  // ==================== Actions ====================

  /**
   * 加载子系统列表
   */
  async function loadSubsystems(force = false) {
    if (subsystemsLoaded.value && !force) {
      return subsystems.value
    }

    loading.value.subsystems = true
    try {
      const result = await api.fetchSubsystems()
      subsystems.value = result.list
      subsystemsLoaded.value = true
      return result.list
    } finally {
      loading.value.subsystems = false
    }
  }

  /**
   * 根据ID获取子系统
   */
  function getSubsystemById(id: number): Subsystem | undefined {
    return subsystems.value.find(s => s.ID === id)
  }

  /**
   * 加载表单配置（表单+字段）
   */
  async function loadTableConfig(tableId: number, force = false): Promise<TableConfig> {
    // 检查缓存
    if (tableConfigs.value.has(tableId) && !force) {
      return tableConfigs.value.get(tableId)!
    }

    loading.value.config = true
    try {
      const config = await api.fetchTableConfig(tableId)

      // 解析扩展属性
      if (config.table.PROPS) {
        try {
          config.props = JSON.parse(config.table.PROPS)
        } catch (e) {
          config.props = {}
        }
      }

      // 缓存配置
      tableConfigs.value.set(tableId, config)
      columns.value.set(tableId, config.columns)

      return config
    } finally {
      loading.value.config = false
    }
  }

  /**
   * 获取表单字段列表
   */
  function getTableColumns(tableId: number): SysColumn[] {
    return columns.value.get(tableId) || []
  }

  /**
   * 清除缓存
   */
  function clearCache() {
    subsystems.value = []
    subsystemsLoaded.value = false
    tableCategories.value.clear()
    tables.value.clear()
    tableConfigs.value.clear()
    columns.value.clear()
  }

  // ==================== 返回 ====================

  return {
    // 状态
    subsystems,
    subsystemsLoaded,
    tableCategories,
    tables,
    tableConfigs,
    columns,
    loading,

    // 计算属性
    activeSubsystems,
    subsystemTree,

    // 方法
    loadSubsystems,
    getSubsystemById,
    loadTableConfig,
    getTableColumns,
    clearCache
  }
})
```

完整的设计文档已经创建了3个部分，包含：

**第1部分**：
- 项目概述
- 系统架构设计
- 数据模型设计
- 接口设计

**第2部分**：
- 前端架构设计
- 组件设计（DynamicForm、DynamicTable、字段渲染器等）

**第3部分**：
- 状态管理设计（Pinia Stores）
- 组合式函数（Composables）
- 路由设计
- 权限控制设计

现在可以开始基于这个设计文档进行实际开发了。您希望我：

1. **继续完成第4部分**（UI/UX设计、性能优化、测试、部署）
2. **开始编码实现** - 按照设计文档逐步实现功能
3. **先做一个简化版原型** - 验证核心功能可行性

请告诉我接下来的方向！
