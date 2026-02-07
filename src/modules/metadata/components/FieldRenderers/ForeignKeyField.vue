<template>
  <div class="foreign-key-field">
    <!-- 查看模式：统一显示只读文本 + 跳转图标 -->
    <div v-if="isDisabled" class="foreign-key-field__view">
      <a-input
        :model-value="displayValue"
        :placeholder="placeholder"
        disabled
        readonly
      />
      <!-- 跳转图标 - 仅当有值且有关联表信息时显示 -->
      <a-button
        v-if="currentValue && refTableId"
        type="text"
        size="small"
        class="foreign-key-field__jump-btn"
        title="查看关联记录"
        @click="handleJumpToRecord"
      >
        <template #icon>
          <icon-share-internal />
        </template>
      </a-button>
    </div>

    <!-- 下拉框模式：IS_DROPDOWN = 'Y' 或空（编辑模式）-->
    <a-select
      v-else-if="isDropdownMode"
      v-model="currentValue"
      :options="options"
      :loading="loading"
      :allow-search="true"
      :allow-clear="true"
      :placeholder="placeholder"
      @search="handleSearch"
      @change="handleChange"
    >
      <template #empty>
        <a-empty description="暂无数据" />
      </template>
    </a-select>

    <!-- 仅查找模式：IS_DROPDOWN = 'N'（编辑模式）-->
    <a-input
      v-else
      :model-value="displayValue"
      :placeholder="placeholder"
      readonly
    >
      <template #suffix>
        <icon-close
          v-if="currentValue"
          style="cursor: pointer; margin-right: 8px"
          @click="handleClear"
        />
        <icon-search
          style="cursor: pointer"
          @click="showLookupDialog = true"
        />
      </template>
    </a-input>

    <!-- FK 查找对话框 -->
    <ForeignKeyLookupDialog
      :visible="showLookupDialog"
      :table-id="refTableId"
      :column-id="refColumnId"
      :title="`查找 - ${displayName}`"
      :current-value="currentValue"
      @update:visible="showLookupDialog = $event"
      @select="handleSelectFromDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { IconSearch, IconClose, IconShareInternal } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { useNavigationStore } from '@/stores/navigation'
import { useForeignKey } from '../../composables/useForeignKey'
import ForeignKeyLookupDialog from '../ForeignKeyLookupDialog.vue'
import type { SysColumn, FormMode, ForeignKeyOption } from '../../types'

const navigationStore = useNavigationStore()

const props = defineProps<{
  column: SysColumn
  modelValue?: number | string | null | undefined
  mode: FormMode
  disabled?: boolean
  record?: Record<string, any> // 新增：完整记录数据
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
  'change': [value: number | string | null, option: ForeignKeyOption | null]
}>()

// 使用外键 composable
const {
  options,
  loading,
  loadOptions,
  searchOptions
} = useForeignKey(props.column)

// 从列配置中直接读取 refTableIsDropdown
const isDropdownMode = computed(() => {
  const refTableIsDropdown = (props.column as any).refTableIsDropdown ||
                             (props.column as any).REF_TABLE_IS_DROPDOWN;
  // 默认为下拉框模式，只有明确配置为 'N' 才使用仅查找模式
  return refTableIsDropdown !== 'N';
});

const currentValue = ref(props.modelValue);
const isDisabled = computed(() => props.disabled || props.mode === 'view');
const placeholder = computed(() => props.column.PLACEHOLDER || '请选择');
const showLookupDialog = ref(false);

// 获取 FK 配置
const refTableId = computed(() => {
  return props.column.REF_TABLE_ID || (props.column as any).refTableId;
});

const refColumnId = computed(() => {
  return props.column.REF_COLUMN_ID || (props.column as any).refColumnId;
});

const displayName = computed(() => {
  return props.column.DISPLAY_NAME || (props.column as any).displayName || '数据';
});

// 显示值（查看模式使用）
const displayValue = computed(() => {
  if (!currentValue.value) return '';

  // 优先使用后端返回的 _display 字段
  const dbName = props.column.DB_NAME || (props.column as any).dbName;
  const displayFieldName = `${dbName}_display`;
  if (props.record && props.record[displayFieldName]) {
    return props.record[displayFieldName];
  }

  // 其次从 options 中查找
  const option = options.value.find(opt => opt.value === currentValue.value);
  return option ? option.label : String(currentValue.value);
});

// 初始化
onMounted(async () => {
  // 查看模式下，如果后端已经返回了 _display 字段，不需要加载 options
  const dbName = props.column.DB_NAME || (props.column as any).dbName;
  const displayFieldName = `${dbName}_display`;
  const hasBackendDisplayValue = props.record && props.record[displayFieldName];

  if (isDisabled.value && hasBackendDisplayValue) {
    return;
  }

  // 编辑模式或没有后端显示值时才加载 options
  await loadOptions();

  // 如果有值但 options 中没有对应项，主动获取显示值
  if (currentValue.value && !options.value.find(opt => opt.value === currentValue.value)) {
    try {
      const { getDisplayValue } = useForeignKey(props.column);
      const label = await getDisplayValue(currentValue.value);
      if (label) {
        options.value.push({
          value: currentValue.value,
          label: label
        });
      }
    } catch (error) {
      console.error('[ForeignKeyField] 获取显示值失败:', error);
    }
  }
});

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal;
});

// 搜索处理
async function handleSearch(keyword: string) {
  await searchOptions(keyword);
}

// 值变化处理
function handleChange(value: number | string | null) {
  const option = options.value.find(opt => opt.value === value);
  emit('update:modelValue', value);
  emit('change', value, option || null);
}

// 清除
function handleClear() {
  currentValue.value = null;
  handleChange(null);
}

// 从对话框选择
function handleSelectFromDialog(row: { value: any; label: string }) {
  currentValue.value = row.value;
  // 将选中的数据添加到 options 中（如果不存在）
  if (!options.value.find(opt => opt.value === row.value)) {
    options.value.push(row);
  }
  handleChange(row.value);
}

// 跳转到关联记录
function handleJumpToRecord() {
  if (!currentValue.value || !refTableId.value) {
    Message.warning('无法跳转：缺少关联信息');
    return;
  }

  // 使用 navigationStore 跳转到关联记录的查看页面
  navigationStore.navigateTo('MetadataFormView', '查看关联记录', {
    tableId: refTableId.value,
    recordId: currentValue.value,
    mode: 'view'
  });
}
</script>

<style scoped>
.foreign-key-field {
  width: 100%;
}

/* 查看模式容器 */
.foreign-key-field__view {
  display: flex;
  align-items: center;
  gap: 8px;
}

.foreign-key-field__view .a-input {
  flex: 1;
}

/* 跳转按钮 */
.foreign-key-field__jump-btn {
  flex-shrink: 0;
  color: #f53f3f;
  transition: all 0.2s;
}

.foreign-key-field__jump-btn:hover {
  color: #cb272d;
  background-color: rgba(245, 63, 63, 0.1);
}
</style>
