<template>
  <div class="live-domain-page">
    <!-- 顶部说明 -->
    <div class="page-notice">
      <div class="notice-item">
        <strong>关于推流域名：</strong>
        系统提供的推流域名仅供测试使用，<a href="#" target="_blank">使用上有诸多限制</a>，建议您尽快添加自有域名。
      </div>
      <div class="notice-item">
        <strong>关于播放域名：</strong>
        若需要在您自有域名下播放直播流，需要先添加播放域名，并完成域名CNAME配置。<a href="#" target="_blank">域名管理</a> 或 <a href="#" target="_blank">CNAME配置</a>
      </div>
      <div class="notice-item">
        您当前已添加 <a href="#" target="_blank">域名归属</a> 中包含主播推流的域名。
      </div>
    </div>

    <!-- 标签页和搜索 -->
    <div class="page-toolbar">
      <a-radio-group v-model="activeTab" type="button" @change="handleTabChange">
        <a-radio value="push">直播域名</a-radio>
        <a-radio value="play">播放域名</a-radio>
      </a-radio-group>

      <div class="toolbar-right">
        <a-input-search
          v-model="searchKeyword"
          placeholder="输入关键词搜索域名"
          style="width: 260px"
          @search="handleSearch"
        />
        <a-button type="primary" @click="showAddDialog">
          <template #icon>
            <icon-plus />
          </template>
          添加域名
        </a-button>
      </div>
    </div>

    <!-- 域名列表表格 -->
    <a-table
      :loading="loading"
      :data="filteredDomains"
      :pagination="pagination"
      :bordered="{ wrapper: true, cell: true }"
      row-key="name"
    >
      <template #columns>
        <a-table-column title="域名" data-index="name" :width="200">
          <template #cell="{ record }">
            <div class="domain-cell">
              <a-link>{{ record.name }}</a-link>
              <icon-copy class="copy-icon" @click="copyToClipboard(record.name)" />
            </div>
          </template>
        </a-table-column>

        <a-table-column title="CNAME" :width="250">
          <template #cell="{ record }">
            <div class="cname-cell">
              <a-tooltip :content="getCnameStatusTooltip(record.cnameConfigured)">
                <icon-check-circle-fill
                  v-if="record.cnameConfigured === 1"
                  class="cname-status-icon cname-success"
                />
                <icon-exclamation-circle-fill
                  v-else
                  class="cname-status-icon cname-unconfigured"
                />
              </a-tooltip>
              <span>{{ record.cname || record.name + '.liveplay.com' }}</span>
              <icon-copy class="copy-icon" @click="copyToClipboard(record.cname)" />
            </div>
          </template>
        </a-table-column>

        <a-table-column title="类型" :width="120">
          <template #cell="{ record }">
            <a-tag :color="record.type === 0 ? 'blue' : 'green'">
              {{ record.type === 0 ? '推流域名' : '播放域名' }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="区域" data-index="region" :width="120">
          <template #cell="{ record }">
            {{ record.region || '全球加速' }}
          </template>
        </a-table-column>

        <a-table-column title="状态" :width="120">
          <template #cell="{ record }">
            <div class="status-cell">
              <span :class="['status-dot', record.status === 1 ? 'status-enabled' : 'status-disabled']"></span>
              <span>{{ record.status === 1 ? '已启用' : '已禁用' }}</span>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="创建时间" :width="180">
          <template #cell="{ record }">
            {{ formatDateTime(record.createTime) }}
          </template>
        </a-table-column>

        <a-table-column title="操作" :width="200" fixed="right">
          <template #cell="{ record }">
            <a-space>
              <a-link @click="handleManage(record)">管理</a-link>
              <a-link
                v-if="record.status === 1"
                @click="handleForbid(record)"
              >
                禁用
              </a-link>
              <a-link
                v-else
                status="success"
                @click="handleEnable(record)"
              >
                启用
              </a-link>
              <a-link status="danger" @click="handleDelete(record)">删除</a-link>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <!-- 添加域名对话框 - 步进式 -->
    <a-modal
      v-model:visible="addDialogVisible"
      :title="currentStep === 1 ? '添加域名' : 'CNAME配置'"
      :width="700"
      :footer="false"
      @cancel="handleCancelAdd"
    >
      <a-steps :current="currentStep" style="margin-bottom: 24px">
        <a-step title="基本配置" />
        <a-step title="CNAME配置" />
      </a-steps>

      <!-- 步骤1：基本配置 -->
      <div v-if="currentStep === 1">
        <a-form
          ref="addFormRef"
          :model="addForm"
          :rules="addFormRules"
          layout="vertical"
        >
          <a-form-item label="类型" field="domainType">
            <a-radio-group v-model="addForm.domainType">
              <a-radio :value="0">推流域名</a-radio>
              <a-radio :value="1">播放域名</a-radio>
            </a-radio-group>
            <div class="form-tip">
              推流域名用于推送直播流，播放域名用于播放直播流
            </div>
          </a-form-item>

          <a-form-item label="加速区域" field="region">
            <a-select v-model="addForm.region" placeholder="请选择加速区域">
              <a-option value="global">全球加速</a-option>
              <a-option value="cn">中国大陆</a-option>
              <a-option value="overseas">海外及港澳台</a-option>
            </a-select>
          </a-form-item>

          <a-form-item label="域名" field="domainName">
            <a-input
              v-model="addForm.domainName"
              placeholder="请输入域名，如：push.example.com"
            />
            <div class="form-tip">
              域名需要已完成ICP备案，且未被其他账号添加
            </div>
          </a-form-item>

          <a-form-item label="标签（可选）">
            <a-input
              v-model="addForm.tags"
              placeholder="请输入标签，多个标签用逗号分隔"
            />
            <div class="form-tip">
              标签用于分类管理域名，便于后续查找和管理
            </div>
          </a-form-item>
        </a-form>

        <div style="text-align: right; margin-top: 24px">
          <a-space>
            <a-button @click="handleCancelAdd">取消</a-button>
            <a-button type="primary" :loading="submitting" @click="handleAddDomain">
              添加域名并进入下一步
            </a-button>
          </a-space>
        </div>
      </div>

      <!-- 步骤2：CNAME配置 -->
      <div v-if="currentStep === 2">
        <a-alert type="success" style="margin-bottom: 20px">
          域名 {{ addedDomainName }} 已添加成功！请按照以下步骤完成 CNAME 配置。
        </a-alert>

        <!-- CNAME 配置状态 -->
        <div class="cname-status-card" style="margin-bottom: 20px">
          <div class="status-header">
            <span class="status-label">CNAME 配置状态：</span>
            <a-tag :color="cnameStatusColor" size="large">
              <template #icon>
                <span :class="['status-dot', cnameStatusClass]"></span>
              </template>
              {{ cnameStatusText }}
            </a-tag>
          </div>
        </div>

        <div class="cname-config-section">
          <h4>配置步骤：</h4>
          <ol class="config-steps">
            <li>登录您的域名服务商（如阿里云、腾讯云、DNSPod等）</li>
            <li>找到域名解析设置页面</li>
            <li>添加以下 CNAME 记录：</li>
          </ol>

          <a-table
            :data="cnameRecords"
            :pagination="false"
            :bordered="{ wrapper: true, cell: true }"
            style="margin: 16px 0"
          >
            <template #columns>
              <a-table-column title="域名" data-index="domain" :width="200" />
              <a-table-column title="主机记录" data-index="host" :width="120" />
              <a-table-column title="记录类型" data-index="type" :width="100" />
              <a-table-column title="记录值" data-index="value">
                <template #cell="{ record }">
                  <div class="cname-cell">
                    <span>{{ record.value }}</span>
                    <icon-copy class="copy-icon" @click="copyToClipboard(record.value)" />
                  </div>
                </template>
              </a-table-column>
            </template>
          </a-table>

          <a-alert type="info" style="margin-bottom: 16px">
            <template #icon>
              <icon-info-circle />
            </template>
            CNAME 配置生效时间通常为 5-10 分钟，最长可能需要 24 小时。配置完成后，您可以点击下方按钮查询配置状态。
          </a-alert>

          <div class="config-links">
            <a href="https://cloud.tencent.com/document/product/267/19908" target="_blank">
              如何配置 CNAME？
            </a>
            <span class="divider">|</span>
            <a href="#" @click.prevent="checkCnameStatus">
              查询 CNAME 状态
            </a>
          </div>
        </div>

        <div style="text-align: right; margin-top: 24px">
          <a-space>
            <a-button @click="handleFinishAdd">稍后配置</a-button>
            <a-button type="primary" @click="handleFinishAdd">
              完成
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconPlus,
  IconCopy,
  IconInfoCircle,
  IconCheckCircleFill,
  IconExclamationCircleFill
} from '@arco-design/web-vue/es/icon'
import type { FormInstance, FieldRule } from '@arco-design/web-vue'
import {
  listDomains,
  addDomain,
  deleteDomain,
  enableDomain,
  forbidDomain,
  verifyDomainOwner
} from '@/api/live'
import { useNavigationStore } from '@/stores/navigation'
import { formatDateTime } from '@/utils/date'

const navigationStore = useNavigationStore()

// 前端使用的域名信息接口（小写字段）
interface DomainInfo {
  name: string
  type: number
  status: number
  createTime: string
  updateTime?: string
  cname?: string
  region?: string
  cnameConfigured?: number // 0-未配置，1-已配置，2-配置失败
}

// 数据
const loading = ref(false)
const domains = ref<DomainInfo[]>([])
const activeTab = ref('push')
const searchKeyword = ref('')

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

// 添加对话框
const addDialogVisible = ref(false)
const submitting = ref(false)
const currentStep = ref(1)
const addedDomainName = ref('')
const cnameStatus = ref(0) // 0-未配置，1-已配置，2-配置失败
const addFormRef = ref<FormInstance>()
const addForm = reactive({
  domainName: '',
  domainType: 0,
  region: 'global',
  tags: ''
})

// 表单验证规则
const addFormRules: Record<string, FieldRule | FieldRule[]> = {
  domainName: [
    { required: true, message: '请输入域名' },
    {
      match: /^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
      message: '请输入有效的域名格式'
    }
  ],
  domainType: [
    { required: true, message: '请选择域名类型' }
  ],
  region: [
    { required: true, message: '请选择加速区域' }
  ]
}

// 过滤后的域名列表
const filteredDomains = computed(() => {
  let result = domains.value

  // 根据标签页过滤
  if (activeTab.value === 'push') {
    result = result.filter(d => d.type === 0)
  } else if (activeTab.value === 'play') {
    result = result.filter(d => d.type === 1)
  }

  // 根据搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(keyword)
    )
  }

  pagination.total = result.length
  return result
})

// CNAME 配置记录
const cnameRecords = computed(() => {
  if (!addedDomainName.value) return []

  return [{
    domain: addedDomainName.value,
    host: '@',
    type: 'CNAME',
    value: addedDomainName.value + '.liveplay.com'
  }]
})

// CNAME 状态文本
const cnameStatusText = computed(() => {
  switch (cnameStatus.value) {
    case 1:
      return '已配置'
    case 2:
      return '配置失败'
    default:
      return '未配置'
  }
})

// CNAME 状态颜色
const cnameStatusColor = computed(() => {
  switch (cnameStatus.value) {
    case 1:
      return 'green'
    case 2:
      return 'red'
    default:
      return 'gray'
  }
})

// CNAME 状态样式类
const cnameStatusClass = computed(() => {
  switch (cnameStatus.value) {
    case 1:
      return 'status-enabled'
    case 2:
      return 'status-disabled'
    default:
      return 'status-disabled'
  }
})

// 加载域名列表
const loadDomains = async () => {
  loading.value = true
  try {
    const response = await listDomains(undefined)

    // 后端返回格式: { code: 200, data: { domains: [...], total: 3 } }
    const result = response.data
    if (result && result.data) {
      // 后端返回的字段名是大写的，需要转换为小写以便前端使用
      const rawDomains = result.data.domains || []
      domains.value = rawDomains.map((d: any) => ({
        name: d.Name,
        type: d.Type,
        status: d.Status,
        createTime: d.CreateTime,
        updateTime: d.UpdateTime,
        cname: d.TargetDomain || '', // 使用后端返回的 TargetDomain 字段
        region: d.Region || '全球加速',
        cnameConfigured: d.BCName || 0 // 使用后端返回的 BCName 字段
      }))
    } else {
      domains.value = []
    }
  } catch (error: any) {
    console.error('加载域名列表失败:', error)
    Message.error(error.response?.data?.message || '加载域名列表失败')
    domains.value = []
  } finally {
    loading.value = false
  }
}

// 标签页切换
const handleTabChange = () => {
  pagination.current = 1
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
}

// 显示添加对话框
const showAddDialog = () => {
  addForm.domainName = ''
  addForm.domainType = activeTab.value === 'push' ? 0 : 1
  addForm.region = 'global'
  addForm.tags = ''
  currentStep.value = 1
  addedDomainName.value = ''
  cnameStatus.value = 0 // 重置为未配置
  addDialogVisible.value = true
}

// 取消添加
const handleCancelAdd = () => {
  addDialogVisible.value = false
  currentStep.value = 1
  addedDomainName.value = ''
  cnameStatus.value = 0 // 重置为未配置
}

// 添加域名（步骤1）
const handleAddDomain = async () => {

  if (!addFormRef.value) {
    return
  }

  try {
    await addFormRef.value.validate()
  } catch (error) {
    // 验证失败
    console.error('Validation error:', error)
    return
  }

  submitting.value = true
  try {
    await addDomain({
      domainName: addForm.domainName,
      domainType: addForm.domainType
    })
    Message.success('添加域名成功')
    addedDomainName.value = addForm.domainName
    cnameStatus.value = 0 // 重置为未配置
    currentStep.value = 2
    loadDomains()
  } catch (error: any) {
    console.error('Add domain error:', error)
    Message.error(error.response?.data?.message || '添加域名失败')
  } finally {
    submitting.value = false
  }
}

// 完成添加（步骤2）
const handleFinishAdd = () => {
  addDialogVisible.value = false
  currentStep.value = 1
  addedDomainName.value = ''
  cnameStatus.value = 0 // 重置为未配置
}

// 查询 CNAME 状态
const checkCnameStatus = async () => {
  if (!addedDomainName.value) {
    Message.warning('域名信息不存在')
    return
  }

  try {
    const response = await verifyDomainOwner(addedDomainName.value, 'dnsCheck')
    const result = response.data.data

    // 更新状态
    cnameStatus.value = result.status

    if (result.status === 1) {
      Message.success('CNAME 配置验证成功！')
    } else {
      // status === 0 (未验证) 或 status === 2 (验证失败) 都显示相同提示
      Message.error('域名未正确配置成功，请检查DNS记录是否正确配置')
    }
  } catch (error: any) {
    Message.error(error.response?.data?.message || '查询CNAME状态失败')
  }
}

// 获取 CNAME 状态提示文本
const getCnameStatusTooltip = (status?: number) => {
  return status === 1 ? 'CNAME 已配置' : 'CNAME 未配置'
}

// 管理域名
const handleManage = (row: DomainInfo) => {
  // 使用 navigationStore 跳转到域名详情页
  navigationStore.navigateTo('LiveDomainDetail', `域名详情 - ${row.name}`, { domainName: row.name })
}

// 启用域名
const handleEnable = async (row: DomainInfo) => {
  Modal.confirm({
    title: '提示',
    content: `确定要启用域名 ${row.name} 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await enableDomain(row.name)
        Message.success('启用域名成功')
        loadDomains()
      } catch (error: any) {
        Message.error(error.response?.data?.message || '启用域名失败')
      }
    }
  })
}

// 禁用域名
const handleForbid = async (row: DomainInfo) => {
  Modal.confirm({
    title: '提示',
    content: `确定要禁用域名 ${row.name} 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await forbidDomain(row.name)
        Message.success('禁用域名成功')
        loadDomains()
      } catch (error: any) {
        Message.error(error.response?.data?.message || '禁用域名失败')
      }
    }
  })
}

// 删除域名
const handleDelete = async (row: DomainInfo) => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除域名 ${row.name} 吗？此操作不可恢复！`,
    okText: '确定',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger'
    },
    onOk: async () => {
      try {
        await deleteDomain(row.name)
        Message.success('删除域名成功')
        loadDomains()
      } catch (error: any) {
        Message.error(error.response?.data?.message || '删除域名失败')
      }
    }
  })
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  if (!text) return

  // 优先使用 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      Message.success('已复制到剪贴板')
    }).catch(() => {
      Message.error('复制失败')
    })
  } else {
    // 降级方案：使用传统的 document.execCommand
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        Message.success('已复制到剪贴板')
      } else {
        Message.error('复制失败')
      }
    } catch (err) {
      Message.error('复制失败，请手动复制')
    }
  }
}

// 初始化
onMounted(() => {
  loadDomains()
})
</script>

<style scoped>
.live-domain-page {
  padding: 20px;
  background: #fff;
  min-height: 100%;
}

.page-notice {
  background: #e8f4ff;
  border: 1px solid #bedaff;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.8;
}

.notice-item {
  margin-bottom: 8px;
}

.notice-item:last-child {
  margin-bottom: 0;
}

.notice-item strong {
  font-weight: 600;
  color: #1d2129;
}

.notice-item a {
  color: #165dff;
  text-decoration: none;
}

.notice-item a:hover {
  text-decoration: underline;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.domain-cell,
.cname-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-icon {
  cursor: pointer;
  color: #86909c;
  font-size: 14px;
}

.copy-icon:hover {
  color: #165dff;
}

.cname-status-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.cname-success {
  color: #00b42a;
}

.cname-failed {
  color: #f53f3f;
}

.cname-unconfigured {
  color: #86909c;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-enabled {
  background-color: #00b42a;
}

.status-disabled {
  background-color: #86909c;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

.cname-config-section {
  padding: 8px 0;
}

.cname-config-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 12px;
}

.config-steps {
  margin: 0 0 16px 0;
  padding-left: 20px;
  font-size: 14px;
  color: #4e5969;
  line-height: 1.8;
}

.config-steps li {
  margin-bottom: 8px;
}

.config-links {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.config-links a {
  color: #165dff;
  text-decoration: none;
}

.config-links a:hover {
  text-decoration: underline;
}

.config-links .divider {
  color: #e5e6eb;
}

.cname-status-card {
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 16px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}
</style>
