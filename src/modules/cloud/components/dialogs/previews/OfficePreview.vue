<template>
  <div class="office-preview">
    <!-- 使用 OnlyOffice 预览和编辑 Office 文档 -->
    <div v-if="isOfficeDocument" class="onlyoffice-container">
      <div ref="onlyOfficeContainer" class="onlyoffice-wrapper"></div>
    </div>

    <!-- 不支持的类型 -->
    <div v-else class="office-unsupported">
      <p>不支持的文档类型</p>
      <a-button type="primary" @click="handleDownload">
        <template #icon>
          <icon-download />
        </template>
        下载
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { IconDownload } from '@arco-design/web-vue/es/icon'

interface Props {
  url: string
  fileName: string
}

const props = defineProps<Props>()

// 判断文档类型
const fileExt = computed(() => {
  return props.fileName.slice(props.fileName.lastIndexOf('.')).toLowerCase()
})

const isOfficeDocument = computed(() =>
  ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExt.value)
)

// OnlyOffice 相关
const onlyOfficeContainer = ref<HTMLDivElement | null>(null)
let onlyOfficeEditor: any = null

// 动态加载 OnlyOffice 脚本
const loadOnlyOfficeScript = () => {
  return new Promise((resolve, reject) => {
    const scriptId = 'onlyoffice-script'
    if (document.getElementById(scriptId)) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://documentserver.onlyoffice.com/web-apps/apps/api/documents/api.js'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load OnlyOffice script'))
    document.body.appendChild(script)
  })
}

// 初始化 OnlyOffice
const initOnlyOffice = async () => {
  if (!onlyOfficeContainer.value) return

  try {
    await loadOnlyOfficeScript()

    await nextTick()

    const config = {
      document: {
        fileType: fileExt.value.slice(1), // 去除前缀 "."
        key: btoa(props.url), // 使用文件URL作为唯一key
        title: props.fileName,
        url: props.url
      },
      documentType: getDocumentType(),
      editorConfig: {
        mode: 'view', // 默认预览模式，如需编辑请改为 'edit'
        lang: 'zh-CN',
        callbackUrl: '' // 保存时的回调URL（需要后端支持）
      },
      width: '100%',
      height: '100%',
      events: {
        'onDocumentReady': () => {
          console.log('OnlyOffice document ready')
        },
        'onLoadError': (error: any) => {
          console.error('OnlyOffice load error:', error)
        }
      }
    }

    // 初始化编辑器
    onlyOfficeEditor = new (window as any).DocsAPI.DocEditor(
      onlyOfficeContainer.value,
      config
    )
  } catch (error) {
    console.error('Failed to initialize OnlyOffice:', error)
  }
}

// 获取文档类型
const getDocumentType = () => {
  const ext = fileExt.value.toLowerCase()
  if (['.doc', '.docx'].includes(ext)) return 'word'
  if (['.xls', '.xlsx'].includes(ext)) return 'cell'
  if (['.ppt', '.pptx'].includes(ext)) return 'slide'
  return 'word'
}

// 下载处理
const handleDownload = () => {
  const a = document.createElement('a')
  a.href = props.url
  a.download = props.fileName
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 组件挂载时初始化
onMounted(() => {
  if (isOfficeDocument.value) {
    initOnlyOffice()
  }
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (onlyOfficeEditor) {
    // 尝试清除 OnlyOffice 实例
    const container = onlyOfficeContainer.value
    if (container) {
      container.innerHTML = ''
    }
    onlyOfficeEditor = null
  }
})
</script>

<style scoped>
.office-preview {
  width: 100%;
  height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.onlyoffice-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.onlyoffice-wrapper {
  width: 100%;
  height: 100%;
}

.office-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
}

.office-unsupported p {
  margin: 0;
  color: #666;
  font-size: 16px;
}
</style>
