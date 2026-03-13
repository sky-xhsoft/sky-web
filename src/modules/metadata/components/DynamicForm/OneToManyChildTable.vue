<!-- 1:n 子表组件 -->
<template>
  <div class="one-to-many-child-table">
    <a-tabs v-if="childTables.length > 1" v-model:active-key="activeTabKey">
      <a-tab-pane
        v-for="(childTable, index) in childTables"
        :key="String(index)"
        :title="getChildTableTitle(childTable)"
      >
        <ChildTableContent :child-table="childTable" />
      </a-tab-pane>
    </a-tabs>
    <ChildTableContent v-else :child-table="childTables[0]" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
import ChildTablePanel from './ChildTablePanel.vue'
import ChildTableInlinePanel from './ChildTableInlinePanel.vue'

// ==================== Props ====================
interface Props {
  childTables: any[]
  mode?: 'view' | 'edit' | 'create'
  parentTableId?: number
  parentRecordId?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view'
})

// ==================== 状态 ====================
const activeTabKey = ref('0')

// ==================== 计算属性 ====================
const tableMode = computed(() => {
  // 新增模式下，子表只能查看，不能编辑
  return props.mode === 'create' ? 'view' : props.mode
})

// ==================== 方法 ====================
/**
 * 获取子表标题
 */
function getChildTableTitle(childTable: any): string {
  return childTable.ref.displayName ||
         childTable.ref.DISPLAY_NAME ||
         childTable.table.DISPLAY_NAME ||
         childTable.table.displayName ||
         '明细信息'
}

/**
 * 判断是否使用内嵌编辑
 */
function shouldUseInlineEdit(childTable: any): boolean {
  const editType = childTable.ref.editType || childTable.ref.EDIT_TYPE
  return editType === 'Y' || editType === 'A'
}

/**
 * 判断是否使用弹出框编辑
 */
function shouldUsePopupEdit(childTable: any): boolean {
  const editType = childTable.ref.editType || childTable.ref.EDIT_TYPE
  return editType === 'NP' || editType === 'NS'
}

// ==================== 内部组件 ====================
const ChildTableContent = defineComponent({
  props: ['childTable'],
  setup(cprops) {
    return () => {
      return h('div', [
        // 新增模式提示：需要先保存主表
        props.mode === 'create' ? h('a-alert', {
          type: 'info',
          style: 'margin-bottom: 16px;'
        }, '请先保存主表信息后，再添加明细数据') : null,

        // 根据 EDIT_TYPE 决定使用哪种组件
        shouldUseInlineEdit(cprops.childTable) ? h(ChildTableInlinePanel, {
          parentTableId: props.parentTableId,
          parentRecordId: props.parentRecordId,
          childTable: cprops.childTable,
          mode: tableMode.value
        }) : shouldUsePopupEdit(cprops.childTable) ? h(ChildTablePanel, {
          parentTableId: props.parentTableId,
          parentRecordId: props.parentRecordId,
          childTable: cprops.childTable,
          mode: tableMode.value
        }) : null
      ])
    }
  }
})
</script>

<style scoped>
.one-to-many-child-table {
  width: 100%;
}
</style>