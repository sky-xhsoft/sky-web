/**
 * 字典选项加载 Composable
 * 用于 SelectField、RadioField、TagField 等组件
 */

import { ref, computed, onMounted } from 'vue'
import { useDictStore } from '../stores/useDictStore'
import { useMetadataStore } from '../stores'
import type { SysColumn } from '../types'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  color?: string
  [key: string]: any
}

export interface UseDictOptionsOptions {
  column: SysColumn
  loadOnMount?: boolean
}

export function useDictOptions({
  column,
  loadOnMount = true,
}: UseDictOptionsOptions) {
  const dictStore = useDictStore()
  const metadataStore = useMetadataStore()
  const loading = ref(false)

  // 获取字典ID
  const dictId = computed(() => {
    const sysDictID = column.SYS_DICT_ID || (column as any).sysDictId
    const dictTableId = column.DICT_TABLE_ID || (column as any).dictTableId
    return sysDictID || dictTableId
  })

  // 获取表格ID
  const tableId = computed(() => {
    return column.TABLE_ID || (column as any).tableId || (column as any).sysTableId
  })

  // 检查是否有字典配置
  const hasDictConfig = computed(() => !!dictId.value)

  // 优先从 tableConfig.dictData 中获取字典项
  const dictOptions = computed<SelectOption[]>(() => {
    if (!dictId.value) {
      return []
    }

    // 从 metadataStore 获取 tableConfig
    if (tableId.value) {
      const tableConfig = metadataStore.getTableConfig(tableId.value)
      const dictIDNum = typeof dictId.value === 'string' ? parseInt(dictId.value, 10) : dictId.value

      if (tableConfig?.dictData) {
        const dictItems = tableConfig.dictData[dictIDNum]

        if (dictItems && dictItems.length > 0) {
          return dictItems.map(item => ({
            value: item.VALUE || (item as any).value,
            label: String(item.DISPLAY_NAME || (item as any).displayName || ''),
            color: (item as any).CSS_CLASS || (item as any).cssClass,
          }))
        }
      }
    }

    // 降级：从 dictStore 获取
    if (column.DICT_TABLE_ID) {
      return dictStore.toSelectOptions(column.DICT_TABLE_ID)
    }

    return []
  })

  // 检查是否已加载字典数据
  const hasDictData = computed(() => dictOptions.value.length > 0)

  // 加载字典数据
  async function loadDictData() {
    if (!dictId.value) return
    if (hasDictData.value) return

    loading.value = true
    try {
      await dictStore.loadDictItems(dictId.value)
    } finally {
      loading.value = false
    }
  }

  // 如果启用 loadOnMount，在组件挂载时加载
  onMounted(() => {
    if (loadOnMount) {
      // 检查是否需要加载字典数据
      if (!hasDictData.value && dictId.value) {
        loadDictData()
      }
    }
  })

  return {
    dictOptions,
    hasDictConfig,
    hasDictData,
    loading,
    loadDictData,
    dictId,
    tableId,
  }
}
