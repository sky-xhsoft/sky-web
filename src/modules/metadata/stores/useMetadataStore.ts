/**
 * 元数据管理 - Pinia Store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api/metadata'
import type {
  Subsystem,
  TableCategory,
  SysTable,
  SysColumn,
  TableConfig,
  TreeNode
} from '../types'

export const useMetadataStore = defineStore('metadata', () => {
  // ==================== 状态 ====================

  // 子系统
  const subsystems = ref<Subsystem[]>([])
  const subsystemsLoaded = ref(false)

  // 表类别（按子系统ID分组）
  const tableCategories = ref<Map<number, TableCategory[]>>(new Map())

  // 表单（按类别ID分组）
  const tables = ref<Map<number, SysTable[]>>(new Map())

  // 表单配置缓存（TableConfig包含表单+字段）
  const tableConfigs = ref<Map<number, TableConfig>>(new Map())

  // 字段缓存（按表单ID分组）
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
   * 构建子系统树（包含表类别和表单）
   */
  const subsystemTree = computed<TreeNode[]>(() => {
    return activeSubsystems.value.map(subsystem => {
      const categories = tableCategories.value.get(subsystem.ID) || []
      return {
        key: `subsystem-${subsystem.ID}`,
        title: subsystem.SUBSYSTEM_NAME,
        icon: 'icon-folder',
        type: 'subsystem',
        data: subsystem,
        children: categories
          .filter(c => c.IS_ACTIVE === 'Y')
          .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
          .map(category => {
            const categoryTables = tables.value.get(category.ID) || []
            return {
              key: `category-${category.ID}`,
              title: category.CATEGORY_NAME,
              icon: 'icon-folder-open',
              type: 'category',
              data: category,
              children: categoryTables
                .filter(t => t.IS_ACTIVE === 'Y')
                .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
                .map(table => ({
                  key: `table-${table.ID}`,
                  title: table.DISPLAY_NAME,
                  icon: 'icon-file',
                  type: 'table',
                  data: table,
                  isLeaf: true
                }))
            }
          })
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
   * 加载表类别列表
   */
  async function loadTableCategories(subsystemId: number, force = false) {
    if (tableCategories.value.has(subsystemId) && !force) {
      return tableCategories.value.get(subsystemId)!
    }

    loading.value.categories = true
    try {
      const result = await api.fetchTableCategories(subsystemId)
      tableCategories.value.set(subsystemId, result.list)
      return result.list
    } finally {
      loading.value.categories = false
    }
  }

  /**
   * 加载表单列表
   */
  async function loadTables(categoryId: number, force = false) {
    if (tables.value.has(categoryId) && !force) {
      return tables.value.get(categoryId)!
    }

    loading.value.tables = true
    try {
      const result = await api.fetchTables({ categoryId })
      tables.value.set(categoryId, result.list)
      return result.list
    } finally {
      loading.value.tables = false
    }
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

      // 映射 table 对象的字段名
      const tableData: any = { ...config.table }
      if (!tableData.ID && (config.table as any).id) {
        tableData.ID = (config.table as any).id
      }
      config.table = tableData

      // 解析扩展属性
      if (config.table.PROPS) {
        try {
          config.props = JSON.parse(config.table.PROPS)
        } catch (e) {
          config.props = {}
        }
      }

      // 映射字段名：兼容后端返回的小写驼峰格式
      config.columns = config.columns.map(col => {
        const mapped: any = { ...col }
        // 如果后端返回小写字段名，映射到大写
        if (!mapped.DB_NAME && (col as any).dbName) {
          mapped.DB_NAME = (col as any).dbName
        }
        if (!mapped.DISPLAY_NAME && (col as any).displayName) {
          mapped.DISPLAY_NAME = (col as any).displayName
        }
        if (!mapped.IS_VISIBLE && (col as any).isVisible) {
          mapped.IS_VISIBLE = (col as any).isVisible
        }
        if (!mapped.IS_ACTIVE && (col as any).isActive) {
          mapped.IS_ACTIVE = (col as any).isActive
        }
        if (!mapped.ORDERNO && (col as any).orderno !== undefined) {
          mapped.ORDERNO = (col as any).orderno
        }
        if (!mapped.GRID_WIDTH && (col as any).displayCols) {
          mapped.GRID_WIDTH = (col as any).displayCols
        }
        if (!mapped.MASK && (col as any).mask) {
          mapped.MASK = (col as any).mask
        }
        if (!mapped.NULL_ABLE && (col as any).nullAble) {
          mapped.NULL_ABLE = (col as any).nullAble
        }
        if (!mapped.CONTROL_TYPE && (col as any).controlType) {
          mapped.CONTROL_TYPE = (col as any).controlType
        }
        return mapped
      })

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
   * 获取单个字段配置
   */
  function getColumn(tableId: number, columnName: string): SysColumn | undefined {
    const cols = getTableColumns(tableId)
    return cols.find(c => c.DB_NAME === columnName)
  }

  /**
   * 获取显示字段列表（IS_VISIBLE = 'Y'）
   */
  function getVisibleColumns(tableId: number): SysColumn[] {
    return getTableColumns(tableId)
      .filter(c => {
        // 兼容 IS_VISIBLE 和 isVisible，如果字段不存在则默认为可见
        const isVisible = c.IS_VISIBLE || (c as any).isVisible
        if (isVisible !== undefined && isVisible !== 'Y') {
          return false
        }

        // 兼容 IS_ACTIVE 和 isActive
        const isActive = c.IS_ACTIVE || (c as any).isActive
        if (isActive !== undefined && isActive !== 'Y') {
          return false
        }

        return true
      })
      .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
  }

  /**
   * 获取表格可见列
   */
  function getGridColumns(tableId: number): SysColumn[] {
    return getVisibleColumns(tableId).filter(c => {
      // 检查字段 MASK 的第 5 位（索引 4）：列表可见
      // MASK 格式：1111111111（10位）
      // 第 5 位 = 列表可见，第 6 位 = 列表可修改
      // 兼容大写 MASK 和小写 mask
      const mask = c.MASK || (c as any).mask
      if (mask && mask.length >= 5) {
        const listVisible = mask[4] === '1'
        return listVisible
      }

      // 如果没有 MASK 或 MASK 长度不足，检查是否配置了列宽
      const gridWidth = c.GRID_WIDTH || (c as any).displayCols
      if (gridWidth && gridWidth > 0) {
        return true  // 有列宽配置的字段默认显示
      }

      // 没有 MASK 也没有列宽配置，检查是否是系统字段
      const systemFields = ['ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME', 'SYS_COMPANY_ID', 'IS_ACTIVE']
      if (systemFields.includes(c.DB_NAME)) {
        return false  // 系统字段默认不显示（如果既没有 mask 也没有列宽）
      }

      // 其他业务字段默认显示
      return true
    })
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

  /**
   * 清除特定表单的缓存
   */
  function clearTableCache(tableId: number) {
    tableConfigs.value.delete(tableId)
    columns.value.delete(tableId)
  }

  /**
   * 重新加载整个树结构
   */
  async function reloadTree() {
    console.log('[MetadataStore] reloadTree 开始')

    // 先清除缓存
    clearCache()
    console.log('[MetadataStore] 缓存已清除')

    // 重新加载子系统
    const subs = await loadSubsystems(true)
    console.log('[MetadataStore] 子系统加载完成，数量:', subs.length)

    // 并行加载所有表类别
    await Promise.all(
      subs.map(sub => loadTableCategories(sub.ID, true))
    )
    console.log('[MetadataStore] 表类别加载完成，分类总数:', tableCategories.value.size)

    // 并行加载所有表单
    const allCategories = Array.from(tableCategories.value.values()).flat()
    console.log('[MetadataStore] 开始加载表单，分类数量:', allCategories.length)

    await Promise.all(
      allCategories.map(cat => loadTables(cat.ID, true))
    )
    console.log('[MetadataStore] 表单加载完成，表单总数:', tables.value.size)

    // 打印每个分类下的表单数量
    for (const [categoryId, tableList] of tables.value.entries()) {
      console.log(`[MetadataStore] 分类 ${categoryId} 包含 ${tableList.length} 个表单`)
    }

    console.log('[MetadataStore] reloadTree 完成')
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
    loadTableCategories,
    loadTables,
    loadTableConfig,
    getTableColumns,
    getColumn,
    getVisibleColumns,
    getGridColumns,
    clearCache,
    clearTableCache,
    reloadTree
  }
})
