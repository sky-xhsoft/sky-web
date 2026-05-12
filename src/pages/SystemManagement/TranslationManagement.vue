<template>
  <div class="translation-management">
    <div class="page-header">
      <h1>翻译管理</h1>
      <div class="header-actions">
        <a-button type="primary" @click="handleImport">
          <template #icon>
            <icon-upload />
          </template>
          导入翻译
        </a-button>
        <a-button @click="handleExport">
          <template #icon>
            <icon-download />
          </template>
          导出翻译
        </a-button>
        <a-button type="primary" @click="handleAdd">
          <template #icon>
            <icon-plus />
          </template>
          新增翻译
        </a-button>
      </div>
    </div>

    <div class="page-content">
      <a-card>
        <div class="search-section">
          <a-form :model="searchForm" layout="inline">
            <a-form-item label="语言">
              <a-select
                v-model="searchForm.language"
                placeholder="请选择语言"
                allow-clear
              >
                <a-option value="zh-CN">简体中文</a-option>
                <a-option value="en-US">English</a-option>
                <a-option value="ja-JP">日本語</a-option>
                <a-option value="ko-KR">한국어</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="模块">
              <a-input
                v-model="searchForm.module"
                placeholder="请输入模块名称"
                style="width: 200px"
              />
            </a-form-item>
            <a-form-item label="翻译键">
              <a-input
                v-model="searchForm.key"
                placeholder="请输入翻译键"
                style="width: 200px"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleSearch">
                <template #icon>
                  <icon-search />
                </template>
                搜索
              </a-button>
              <a-button @click="handleReset">
                重置
              </a-button>
            </a-form-item>
          </a-form>
        </div>

        <a-table
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          :loading="loading"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'action'">
              <a-button type="text" @click="handleEdit(record)">
                <template #icon>
                  <icon-edit />
                </template>
                编辑
              </a-button>
              <a-button type="text" status="danger" @click="handleDelete(record)">
                <template #icon>
                  <icon-delete />
                </template>
                删除
              </a-button>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 添加/编辑对话框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      width="800px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        :model="formData"
        layout="vertical"
        ref="formRef"
      >
        <a-form-item
          field="language"
          label="语言"
          :rules="[{ required: true, message: '请选择语言' }]"
        >
          <a-select v-model="formData.language" placeholder="请选择语言">
            <a-option value="zh-CN">简体中文</a-option>
            <a-option value="en-US">English</a-option>
            <a-option value="ja-JP">日本語</a-option>
            <a-option value="ko-KR">한국어</a-option>
          </a-select>
        </a-form-item>

        <a-form-item
          field="module"
          label="模块"
          :rules="[{ required: true, message: '请输入模块' }]"
        >
          <a-input v-model="formData.module" placeholder="请输入模块名称" />
        </a-form-item>

        <a-form-item
          field="key"
          label="翻译键"
          :rules="[{ required: true, message: '请输入翻译键' }]"
        >
          <a-input v-model="formData.key" placeholder="请输入翻译键" />
        </a-form-item>

        <a-form-item
          field="value"
          label="翻译值"
          :rules="[{ required: true, message: '请输入翻译值' }]"
        >
          <a-textarea
            v-model="formData.value"
            placeholder="请输入翻译值"
            :rows="4"
            show-word-limit
            :max-length="500"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入对话框 -->
    <a-modal
      v-model:visible="importModalVisible"
      title="导入翻译"
      @ok="handleConfirmImport"
      @cancel="handleCancelImport"
    >
      <a-form :model="importForm" layout="vertical">
        <a-form-item field="language" label="语言" required>
          <a-select v-model="importForm.language" placeholder="请选择语言">
            <a-option value="zh-CN">简体中文</a-option>
            <a-option value="en-US">English</a-option>
            <a-option value="ja-JP">日本語</a-option>
            <a-option value="ko-KR">한국어</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="file" label="选择文件" required>
          <a-upload
            v-model="importForm.file"
            :auto-upload="false"
            :accept="'.json'"
            :limit="1"
            @change="handleFileChange"
          >
            <a-button>
              <template #icon>
                <icon-upload />
              </template>
              选择文件
            </a-button>
          </a-upload>
          <div style="margin-top: 12px; color: #666">
            支持 .json 格式文件，文件大小不超过 10MB
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import {
  listTranslations,
  addTranslation,
  updateTranslation,
  deleteTranslation,
  exportTranslations,
  importTranslations
} from '@/api/language/language'

const { t } = useI18n()
const message = useMessage()
const router = useRouter()

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 搜索条件
const searchForm = reactive({
  language: '',
  module: '',
  key: ''
})

// 分页信息
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  pageSizeOpts: ['10', '20', '50', '100'],
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
})

// 表单数据
const formData = reactive({
  id: undefined,
  language: 'zh-CN',
  module: '',
  key: '',
  value: ''
})

// 导入表单
const importForm = reactive({
  language: 'zh-CN',
  file: null
})

// 对话框状态
const modalVisible = ref(false)
const importModalVisible = ref(false)
const modalTitle = ref('新增翻译')

// 表单引用
const formRef = ref()

// 列定义
const columns = [
  {
    title: '语言',
    dataIndex: 'language',
    width: 120,
    customRender: ({ text }) => {
      const langMap = {
        'zh-CN': '简体中文',
        'en-US': 'English',
        'ja-JP': '日本語',
        'ko-KR': '한국어'
      }
      return langMap[text] || text
    }
  },
  { title: '模块', dataIndex: 'module', width: 150 },
  { title: '翻译键', dataIndex: 'key', width: 200 },
  { title: '翻译值', dataIndex: 'value', ellipsis: true },
  {
    title: '操作',
    dataIndex: 'action',
    width: 120,
    fixed: 'right',
    className: 'table-action'
  }
]

// 查询数据
const queryData = async () => {
  loading.value = true
  try {
    const res = await listTranslations({
      language: searchForm.language,
      module: searchForm.module,
      key: searchForm.key,
      page: pagination.current,
      pageSize: pagination.pageSize
    })

    if (res && res.items) {
      tableData.value = res.items
      pagination.total = res.total
    }
  } catch (error) {
    console.error('查询翻译失败:', error)
    message.error('查询翻译失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  queryData()
}

// 重置
const handleReset = () => {
  searchForm.language = ''
  searchForm.module = ''
  searchForm.key = ''
  pagination.current = 1
  queryData()
}

// 分页
const handlePageChange = (page: number) => {
  pagination.current = page
  queryData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  queryData()
}

// 新增
const handleAdd = () => {
  modalTitle.value = '新增翻译'
  formData.id = undefined
  formData.language = 'zh-CN'
  formData.module = ''
  formData.key = ''
  formData.value = ''
  modalVisible.value = true
  nextTick(() => {
    formRef.value?.resetFields()
  })
}

// 编辑
const handleEdit = (record: any) => {
  modalTitle.value = '编辑翻译'
  formData.id = record.id
  formData.language = record.language
  formData.module = record.module
  formData.key = record.key
  formData.value = record.value
  modalVisible.value = true
  nextTick(() => {
    formRef.value?.resetFields()
  })
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    const values = await formRef.value.validate()
    if (!values) return

    if (formData.id) {
      // 更新
      await updateTranslation(formData)
      message.success('更新成功')
    } else {
      // 新增
      await addTranslation(formData)
      message.success('新增成功')
    }

    modalVisible.value = false
    queryData()
  } catch (error) {
    console.error('操作失败:', error)
    message.error('操作失败')
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  formRef.value?.resetFields()
}

// 删除
const handleDelete = async (record: any) => {
  try {
    await deleteTranslation(record.id)
    message.success('删除成功')
    queryData()
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败')
  }
}

// 导出
const handleExport = () => {
  const language = searchForm.language || 'zh-CN'
  exportTranslations(language).then((blob) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translations_${language}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }).catch(error => {
    console.error('导出失败:', error)
    message.error('导出失败')
  })
}

// 导入
const handleImport = () => {
  importForm.language = 'zh-CN'
  importForm.file = null
  importModalVisible.value = true
}

// 文件选择
const handleFileChange = (file: any) => {
  if (file && file.file) {
    importForm.file = file.file
  }
}

// 确认导入
const handleConfirmImport = async () => {
  if (!importForm.file) {
    message.warning('请选择文件')
    return
  }

  try {
    await importTranslations(importForm.file, importForm.language)
    message.success('导入成功')
    importModalVisible.value = false
    importForm.file = null
    queryData()
  } catch (error) {
    console.error('导入失败:', error)
    message.error('导入失败')
  }
}

// 取消导入
const handleCancelImport = () => {
  importModalVisible.value = false
  importForm.file = null
}

// 页面加载
import { onMounted } from 'vue'
onMounted(() => {
  queryData()
})
</script>

<style scoped>
.translation-management {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #fff;
  border-bottom: 1px solid #e5e6eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.page-content {
  padding: 24px;
}

.search-section {
  margin-bottom: 20px;
}

.table-action {
  display: flex;
  gap: 8px;
}

:deep(.arco-table-td) {
  word-break: break-all;
}
</style>
