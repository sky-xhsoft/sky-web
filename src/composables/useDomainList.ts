/**
 * 域名列表管理 composable
 * 提供 LiveDomain / PushDomain / PlayDomain 三个页面的共享逻辑
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import type { FormInstance, FieldRule } from '@arco-design/web-vue'
import {
  listDomains,
  addDomain,
  deleteDomain,
  enableDomain,
  forbidDomain,
  verifyDomainOwner,
} from '@/api/live'
import { formatDateTime } from '@/utils/date'

export interface DomainInfo {
  name: string
  type: number // 0-推流，1-播放
  status: number // 0-停用，1-启用
  createTime: string
  updateTime?: string
  cname?: string
  region?: string
  cnameConfigured?: number
}

export interface UseDomainListOptions {
  /** 默认域名类型筛选 (0=推流, 1=播放, undefined=全部) */
  defaultType?: number
}

export function useDomainList(options: UseDomainListOptions = {}) {
  const loading = ref(false)
  const domains = ref<DomainInfo[]>([])
  const searchKeyword = ref('')

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: true,
    showPageSize: true,
  })

  // 过滤
  const filteredDomains = computed(() => {
    let result = domains.value

    if (options.defaultType !== undefined) {
      result = result.filter((d) => d.type === options.defaultType)
    }

    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter((d) => d.name.toLowerCase().includes(keyword))
    }

    pagination.total = result.length
    return result
  })

  // 加载列表
  async function loadDomains() {
    loading.value = true
    try {
      const response = await listDomains(undefined)
      const result = response.data
      if (result?.data) {
        const rawDomains = result.data.domains || []
        domains.value = rawDomains.map((d: any) => ({
          name: d.Name,
          type: d.Type,
          status: d.Status,
          createTime: d.CreateTime,
          updateTime: d.UpdateTime,
          cname: d.TargetDomain || '',
          region: d.Region || '全球加速',
          cnameConfigured: d.BCName || 0,
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

  // 搜索
  function handleSearch() {
    pagination.current = 1
  }

  // 启用
  async function handleEnable(row: DomainInfo) {
    Modal.confirm({
      title: '提示',
      content: `确定要启用域名 ${row.name} 吗？`,
      onOk: async () => {
        try {
          await enableDomain(row.name)
          Message.success('启用成功')
          loadDomains()
        } catch (error: any) {
          Message.error(error.response?.data?.message || '启用失败')
        }
      },
    })
  }

  // 禁用
  async function handleForbid(row: DomainInfo) {
    Modal.confirm({
      title: '提示',
      content: `确定要禁用域名 ${row.name} 吗？`,
      onOk: async () => {
        try {
          await forbidDomain(row.name)
          Message.success('禁用成功')
          loadDomains()
        } catch (error: any) {
          Message.error(error.response?.data?.message || '禁用失败')
        }
      },
    })
  }

  // 删除
  async function handleDelete(row: DomainInfo) {
    Modal.confirm({
      title: '警告',
      content: `确定要删除域名 ${row.name} 吗？此操作不可恢复！`,
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        try {
          await deleteDomain(row.name)
          Message.success('删除成功')
          loadDomains()
        } catch (error: any) {
          Message.error(error.response?.data?.message || '删除失败')
        }
      },
    })
  }

  // CNAME 状态提示
  function getCnameStatusTooltip(status?: number): string {
    return status === 1 ? 'CNAME 已配置' : 'CNAME 未配置'
  }

  // 复制
  function copyToClipboard(text: string) {
    if (!text) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => Message.success('复制成功'),
        () => Message.error('复制失败'),
      )
    } else {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        Message.success('复制成功')
      } catch {
        Message.error('复制失败，请手动复制')
      }
    }
  }

  // 添加对话框
  const addDialogVisible = ref(false)
  const submitting = ref(false)
  const currentStep = ref(1)
  const addedDomainName = ref('')
  const cnameStatus = ref(0)
  const addFormRef = ref<FormInstance>()
  const addForm = reactive({ domainName: '', domainType: 0, region: 'global', tags: '' })

  const addFormRules: Record<string, FieldRule | FieldRule[]> = {
    domainName: [
      { required: true, message: '请输入域名' },
      { match: /^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/, message: '请输入有效的域名格式' },
    ],
    domainType: [{ required: true, message: '请选择域名类型' }],
    region: [{ required: true, message: '请选择加速区域' }],
  }

  function showAddDialog() {
    addForm.domainName = ''
    addForm.domainType = options.defaultType ?? 0
    addForm.region = 'global'
    addForm.tags = ''
    currentStep.value = 1
    addedDomainName.value = ''
    cnameStatus.value = 0
    addDialogVisible.value = true
  }

  function handleCancelAdd() {
    addDialogVisible.value = false
    currentStep.value = 1
    addedDomainName.value = ''
    cnameStatus.value = 0
  }

  async function handleAddDomain() {
    if (!addFormRef.value) return
    try {
      await addFormRef.value.validate()
    } catch {
      return
    }
    submitting.value = true
    try {
      await addDomain({ domainName: addForm.domainName, domainType: addForm.domainType })
      Message.success('添加成功')
      addedDomainName.value = addForm.domainName
      cnameStatus.value = 0
      currentStep.value = 2
      loadDomains()
    } catch (error: any) {
      Message.error(error.response?.data?.message || '添加失败')
    } finally {
      submitting.value = false
    }
  }

  function handleFinishAdd() {
    addDialogVisible.value = false
    currentStep.value = 1
    addedDomainName.value = ''
  }

  async function checkCnameStatus() {
    if (!addedDomainName.value) {
      Message.warning('域名不存在')
      return
    }
    try {
      const response = await verifyDomainOwner(addedDomainName.value, 'dnsCheck')
      cnameStatus.value = response.data.data.status
      if (cnameStatus.value === 1) {
        Message.success('CNAME配置验证成功')
      } else {
        Message.error('CNAME配置验证失败')
      }
    } catch (error: any) {
      Message.error(error.response?.data?.message || '查询失败')
    }
  }

  const cnameStatusText = computed(() => ['未配置', '已配置', '配置失败'][cnameStatus.value] || '未配置')
  const cnameStatusColor = computed(() => ['gray', 'green', 'red'][cnameStatus.value] || 'gray')
  const cnameStatusClass = computed(() => cnameStatus.value === 1 ? 'status-enabled' : 'status-disabled')

  const cnameRecords = computed(() => {
    if (!addedDomainName.value) return []
    return [{ domain: addedDomainName.value, host: '@', type: 'CNAME', value: addedDomainName.value + '.liveplay.com' }]
  })

  onMounted(() => loadDomains())

  return {
    loading,
    domains,
    searchKeyword,
    pagination,
    filteredDomains,
    loadDomains,
    handleSearch,
    handleEnable,
    handleForbid,
    handleDelete,
    getCnameStatusTooltip,
    copyToClipboard,
    formatDateTime,
    // 添加对话框
    addDialogVisible,
    submitting,
    currentStep,
    addedDomainName,
    cnameStatus,
    cnameStatusText,
    cnameStatusColor,
    cnameStatusClass,
    cnameRecords,
    addFormRef,
    addForm,
    addFormRules,
    showAddDialog,
    handleCancelAdd,
    handleAddDomain,
    handleFinishAdd,
    checkCnameStatus,
  }
}
