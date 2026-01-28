<!-- 富文本编辑器字段 -->
<template>
  <div class="richtext-field">
    <!-- 查看模式 -->
    <div v-if="mode === 'view'" class="richtext-field__view">
      <div v-html="sanitizedHtml" class="richtext-field__content"></div>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="richtext-field__edit">
      <div ref="toolbarRef" class="richtext-field__toolbar"></div>
      <div ref="editorRef" class="richtext-field__editor"></div>
      <div v-if="config.maxLength" class="richtext-field__counter">
        {{ textLength }} / {{ config.maxLength }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { SysColumn, FormMode } from '../../types'

interface Props {
  column: SysColumn
  modelValue: any
  mode: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'blur': []
}>()

// 编辑器引用
const editorRef = ref<HTMLElement>()
const toolbarRef = ref<HTMLElement>()
let editor: any = null
let toolbar: any = null

// 解析控件配置
const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

// 计算编辑器高度（优先使用 DISPLAY_ROWS）
const editorHeight = computed(() => {
  // 优先使用 CONTROL_CONFIG 中的 height
  if (config.value.height) {
    return config.value.height
  }
  // 其次使用 DISPLAY_ROWS 计算高度（每行约 32px）
  const displayRows = props.column.DISPLAY_ROWS || (props.column as any).displayRows
  if (displayRows && displayRows > 1) {
    return displayRows * 32 + (displayRows - 1) * 8
  }
  // 默认 300px
  return 300
})

// 文本长度（不包含 HTML 标签）
const textLength = computed(() => {
  if (!props.modelValue) return 0
  const text = String(props.modelValue).replace(/<[^>]*>/g, '')
  return text.length
})

// 清理 HTML（防止 XSS）
const sanitizedHtml = computed(() => {
  if (!props.modelValue) return '<p style="color: #86909c;">暂无内容</p>'
  // 简单的 HTML 清理，生产环境建议使用 DOMPurify
  return props.modelValue
})

/**
 * 初始化编辑器
 */
onMounted(async () => {
  if (props.mode === 'view') return

  try {
    // 动态导入 WangEditor（按需加载）
    const { createEditor, createToolbar } = await import('@wangeditor/editor')

    if (!editorRef.value || !toolbarRef.value) return

    // 创建编辑器
    editor = createEditor({
      selector: editorRef.value,
      html: props.modelValue || '',
      config: {
        placeholder: config.value.placeholder || '请输入内容...',
        readOnly: props.disabled || props.readonly,
        onChange(editor: any) {
          const html = editor.getHtml()
          emit('update:modelValue', html)
        },
        onBlur() {
          emit('blur')
        }
      },
      mode: 'default'
    })

    // 创建工具栏
    toolbar = createToolbar({
      editor,
      selector: toolbarRef.value,
      config: {
        toolbarKeys: [
          'headerSelect',
          'bold',
          'italic',
          'underline',
          '|',
          'color',
          'bgColor',
          '|',
          'fontSize',
          'fontFamily',
          '|',
          'bulletedList',
          'numberedList',
          '|',
          'justifyLeft',
          'justifyCenter',
          'justifyRight',
          '|',
          'insertLink',
          'insertImage',
          '|',
          'blockquote',
          'codeBlock',
          '|',
          'undo',
          'redo'
        ]
      },
      mode: 'default'
    })
  } catch (error) {
    console.error('[RichTextField] 初始化编辑器失败:', error)
  }
})

/**
 * 监听值变化
 */
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && editor.getHtml() !== newValue) {
      editor.setHtml(newValue || '')
    }
  }
)

/**
 * 监听只读状态
 */
watch(
  () => props.disabled || props.readonly,
  (isReadonly) => {
    if (editor) {
      if (isReadonly) {
        editor.disable()
      } else {
        editor.enable()
      }
    }
  }
)

/**
 * 销毁编辑器
 */
onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
    editor = null
  }
  if (toolbar) {
    toolbar.destroy()
    toolbar = null
  }
})
</script>

<style scoped>
.richtext-field {
  width: 100%;
}

.richtext-field__view {
  padding: 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  min-height: 100px;
  max-height: 500px;
  overflow: auto;
}

.richtext-field__content {
  line-height: 1.6;
  color: #1d2129;
}

.richtext-field__content :deep(p) {
  margin: 0 0 12px 0;
}

.richtext-field__content :deep(p:last-child) {
  margin-bottom: 0;
}

.richtext-field__content :deep(img) {
  max-width: 100%;
  height: auto;
}

.richtext-field__content :deep(pre) {
  background: #f7f8fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.richtext-field__content :deep(blockquote) {
  border-left: 4px solid #e5e6eb;
  padding-left: 12px;
  margin: 12px 0;
  color: #86909c;
}

.richtext-field__edit {
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}

.richtext-field__toolbar {
  border-bottom: 1px solid #e5e6eb;
  background: #fff;
}

.richtext-field__editor {
  min-height: v-bind('editorHeight + "px"');
  background: #fff;
}

.richtext-field__counter {
  padding: 8px 12px;
  text-align: right;
  font-size: 12px;
  color: #86909c;
  border-top: 1px solid #e5e6eb;
  background: #f7f8fa;
}
</style>
