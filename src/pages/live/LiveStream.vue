<template>
  <div class="live-stream-page">
    <V2PageHeader
      :title="t('liveStream.title') || '直播流管理'"
      :description="t('liveStream.desc') || '查看在线流和历史流'"
    >
      <template #actions>
        <a-select
          v-model="searchDomain"
          placeholder="请选择域名"
          allow-clear
          style="width: 200px"
          @change="handleSearch"
        >
          <a-option
            v-for="domain in domains"
            :key="domain.name"
            :value="domain.name"
          >
            {{ domain.name }}
          </a-option>
        </a-select>
        <a-input-search
          v-model="searchKeyword"
          placeholder="输入 StreamName（流ID）搜索"
          style="width: 260px"
          @search="handleSearch"
        />
      </template>
    </V2PageHeader>

    <V2Card :padding="true">
      <a-radio-group v-model="activeTab" type="button" @change="handleTabChange">
        <a-radio value="online">在线流</a-radio>
        <a-radio value="history">历史流</a-radio>
      </a-radio-group>

      <!-- 在线流列表 -->
      <a-table
        v-if="activeTab === 'online'"
        :loading="loading"
        :data="onlineStreams"
        :pagination="pagination"
        :bordered="{ wrapper: true, cell: true }"
        row-key="streamName"
        style="margin-top: 16px;"
      >
        <template #columns>
          <a-table-column title="StreamName" data-index="streamName" :width="200" />
          <a-table-column title="域名" data-index="domainName" :width="200" />
          <a-table-column title="AppName" data-index="appName" :width="150" />
          <a-table-column title="转码" :width="100">
            <template #cell>
              <span>-</span>
            </template>
          </a-table-column>
          <a-table-column title="起始时间" :width="180">
            <template #cell="{ record }">
              {{ formatDateTime(record.startTime) }}
            </template>
          </a-table-column>
          <a-table-column title="开始推流时间" :width="180">
            <template #cell="{ record }">
              {{ formatDateTime(record.publishTime) }}
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="240" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-link @click="handlePreview(record)">预览</a-link>
                <a-link status="danger" @click="handleDropStream(record)">断开</a-link>
              </a-space>
            </template>
          </a-table-column>
        </template>
        <template #empty>
          <a-empty description="暂无数据" />
        </template>
      </a-table>

      <!-- 历史流列表 -->
      <a-table
        v-if="activeTab === 'history'"
        :loading="loading"
        :data="historyStreams"
        :pagination="pagination"
        :bordered="{ wrapper: true, cell: true }"
        :row-key="(record: any, index: number) => record.streamName + '-' + record.startTime + '-' + index"
        style="margin-top: 16px;"
      >
        <template #columns>
          <a-table-column title="StreamName" data-index="streamName" :width="200" />
          <a-table-column title="域名" data-index="domainName" :width="200" />
          <a-table-column title="AppName" data-index="appName" :width="150" />
          <a-table-column title="开始时间" :width="180">
            <template #cell="{ record }">
              {{ formatDateTime(record.startTime) }}
            </template>
          </a-table-column>
          <a-table-column title="结束时间" :width="180">
            <template #cell="{ record }">
              {{ formatDateTime(record.endTime) }}
            </template>
          </a-table-column>
          <a-table-column title="时长(分钟)" :width="120">
            <template #cell="{ record }">
              {{ calculateDuration(record.startTime, record.endTime) }}
            </template>
          </a-table-column>
        </template>
        <template #empty>
          <a-empty description="暂无数据" />
        </template>
      </a-table>
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import {
  getOnlineStreams,
  getHistoryStreams,
  dropStream
} from '@/api/live'
import { listDomains } from '@/api/live'
import { formatDateTime } from '@/utils/date'
import { useNavigationStore } from '@/stores/navigation'
import { V2PageHeader, V2Card } from '@/components/ui'

const navigationStore = useNavigationStore()
const { t } = useI18n()

// 在线流信息接口
interface OnlineStreamInfo {
  streamName: string
  domainName: string
  appName: string
  startTime: string
  publishTime: string
}

// 历史流信息接口
interface HistoryStreamInfo {
  streamName: string
  domainName: string
  appName: string
  startTime: string
  endTime: string
}

// 域名信息接口
interface DomainInfo {
  name: string
  type: number
}

// 数据
const loading = ref(false)
const activeTab = ref('online')
const searchKeyword = ref('')
const searchDomain = ref('')
const domains = ref<DomainInfo[]>([])
const onlineStreams = ref<OnlineStreamInfo[]>([])
const historyStreams = ref<HistoryStreamInfo[]>([])

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true,
  onChange: (page: number) => {
    pagination.current = page
    loadData()
  },
  onPageSizeChange: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.current = 1
    loadData()
  }
})

// 加载域名列表
const loadDomains = async () => {
  try {
    const response = await listDomains(undefined)
    const result = response.data
    if (result && result.data) {
      const rawDomains = result.data.domains || []
      domains.value = rawDomains.map((d: any) => ({
        name: d.Name,
        type: d.Type
      }))
    }
  } catch (error: any) {
    console.error('加载域名列表失败:', error)
  }
}

// 加载在线流列表
const loadOnlineStreams = async () => {
  loading.value = true
  try {
    const params: any = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    if (searchDomain.value) {
      params.domainName = searchDomain.value
    }

    if (searchKeyword.value) {
      params.streamName = searchKeyword.value
    }

    const response = await getOnlineStreams(params)
    const result = response.data

    if (result && result.data) {
      const streams = result.data.onlineInfo || []
      onlineStreams.value = streams.map((s: any) => ({
        streamName: s.streamName || '',
        domainName: s.domainName || '',
        appName: s.appName || '',
        startTime: '', // 在线流没有 startTime 字段
        publishTime: Array.isArray(s.publishTime) && s.publishTime.length > 0 ? s.publishTime[0] : ''
      }))
      pagination.total = result.data.totalNum || 0
    } else {
      onlineStreams.value = []
      pagination.total = 0
    }
  } catch (error: any) {
    console.error('加载在线流列表失败:', error)
    Message.error(error.response?.data?.message || '加载在线流列表失败')
    onlineStreams.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 加载历史流列表
const loadHistoryStreams = async () => {
  loading.value = true
  try {
    // 如果没有选择域名，优先使用第一个推流域名（历史流记录来自推流域名），否则用第一个域名
    let domainName = searchDomain.value
    if (!domainName && domains.value.length > 0) {
      domainName = (domains.value.find(d => d.type === 0) || domains.value[0]).name
    }

    // 如果还是没有域名，提示用户
    if (!domainName) {
      Message.warning('没有可用的域名，请先添加域名')
      historyStreams.value = []
      pagination.total = 0
      loading.value = false
      return
    }

    // 获取最近7天的数据
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000)

    const params: any = {
      domainName: domainName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    if (searchKeyword.value) {
      params.streamName = searchKeyword.value
    }

    const response = await getHistoryStreams(params)
    const result = response.data

    if (result && result.data) {
      const streams = result.data.historyInfo || []
      historyStreams.value = streams.map((s: any) => ({
        streamName: s.streamName || '',
        domainName: s.domainName || '',
        appName: s.appName || '',
        startTime: s.streamStartTime || '',
        endTime: s.streamEndTime || ''
      }))
      pagination.total = result.data.totalNum || 0
    } else {
      historyStreams.value = []
      pagination.total = 0
    }
    // 当前页超出总页数（如数据减少后停在空页）：回到最后一页
    const lastPage = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    if (!historyStreams.value.length && pagination.current > lastPage) {
      pagination.current = lastPage
      await loadHistoryStreams()
      return
    }
  } catch (error: any) {
    console.error('加载历史流列表失败:', error)
    Message.error(error.response?.data?.message || '加载历史流列表失败')
    historyStreams.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 加载数据
const loadData = () => {
  switch (activeTab.value) {
    case 'online':
      loadOnlineStreams()
      break
    case 'history':
      loadHistoryStreams()
      break
  }
}

// 标签页切换
const handleTabChange = () => {
  // 两个列表共用分页：切换时清掉上一个列表的总数，避免请求返回前显示旧值
  pagination.current = 1
  pagination.total = 0
  loadData()
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 预览直播流
const handlePreview = async (record: OnlineStreamInfo) => {
  try {
    // 获取播放域名（类型为1的域名）
    const playDomain = domains.value.find(d => d.type === 1)

    if (!playDomain) {
      Message.warning('未找到播放域名，请先添加播放域名')
      return
    }

    // 使用 navigationStore 跳转到预览页面
    navigationStore.navigateTo('LivePreview', '直播预览', {
      streamName: record.streamName,
      appName: record.appName || 'live',
      playDomain: playDomain.name
    })
  } catch (error: any) {
    console.error('预览失败:', error)
    Message.error('预览失败')
  }
}

// 断开推流
const handleDropStream = (record: OnlineStreamInfo) => {
  Modal.confirm({
    title: '确认断开',
    content: `确定要断开流 ${record.streamName} 吗？`,
    okText: '确定',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger'
    },
    onOk: async () => {
      try {
        await dropStream({
          streamName: record.streamName,
          domainName: record.domainName,
          appName: record.appName
        })
        Message.success('断开推流成功')
        loadOnlineStreams()
      } catch (error: any) {
        Message.error(error.response?.data?.message || '断开推流失败')
      }
    }
  })
}

// 计算时长（分钟）
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-'
  try {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const duration = Math.floor((end - start) / 1000 / 60)
    return duration > 0 ? duration : 0
  } catch {
    return '-'
  }
}

// 初始化
onMounted(() => {
  loadDomains()
  loadData()
})
</script>

<style scoped>
.live-stream-page {
  padding: 12px;
  background: var(--bg-page);
  min-height: 100%;
  overflow-y: auto;
}

</style>
