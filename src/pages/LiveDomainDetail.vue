<template>
  <div class="live-domain-detail-page">
    <!-- 顶部面包屑导航 -->
    <div class="page-header">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <a-link @click="goBack">域名管理</a-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item>{{ domainName }}</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 标签页 -->
    <a-tabs v-model:active-key="activeTab" type="card-gutter">
      <!-- 推流域名：合并基本信息和推流配置 -->
      <a-tab-pane v-if="domainInfo.type === 0" key="push" title="基本信息和推流配置">
        <div class="tab-content">
          <!-- 基本信息 -->
          <div class="section">
            <h3 class="section-title">基本信息</h3>
            <a-descriptions :column="2" bordered :label-style="{ width: '120px' }" :value-style="{ width: '200px' }">
              <a-descriptions-item label="域名">
                {{ domainInfo.name }}
              </a-descriptions-item>
              <a-descriptions-item label="域名类型">
                <a-tag color="blue">推流域名</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="CNAME">
                <div class="cname-cell">
                  <span>{{ domainInfo.cname }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(domainInfo.cname)" />
                </div>
              </a-descriptions-item>
              <a-descriptions-item label="CNAME 状态">
                <a-tag :color="domainInfo.cnameConfigured === 1 ? 'green' : 'gray'">
                  {{ domainInfo.cnameConfigured === 1 ? '已配置' : '未配置' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="domainInfo.status === 1 ? 'green' : 'red'">
                  {{ domainInfo.status === 1 ? '已启用' : '已禁用' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="区域">
                {{ domainInfo.region || '全球加速' }}
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">
                {{ formatDateTime(domainInfo.createTime) }}
              </a-descriptions-item>
              <a-descriptions-item label="更新时间">
                {{ formatDateTime(domainInfo.updateTime) }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>

        <!-- 推流配置 -->
        <div class="tab-content compact">
          <!-- 鉴权配置 - 放在最上面，更紧凑 -->
          <div class="section compact-section">
            <h3 class="section-title">鉴权配置</h3>
            <a-space direction="vertical" :size="12" fill>
              <div class="info-row">
                <span class="info-label">推流鉴权：</span>
                <a-tag color="green" size="small">开启</a-tag>
              </div>
              <div class="info-row">
                <span class="info-label">主KEY：</span>
                <span class="info-value">{{ pushAuthKey }}</span>
                <icon-copy class="copy-icon" @click="copyToClipboard(pushAuthKey)" />
              </div>
            </a-space>
          </div>

          <!-- 推流地址生成器 - 紧凑布局 -->
          <div class="section compact-section">
            <h3 class="section-title">推流地址生成器</h3>
            <a-form :model="pushForm" layout="inline" class="compact-form">
              <a-form-item label="AppName" style="width: 200px">
                <a-input
                  v-model="pushForm.appName"
                  placeholder="应用名称"
                  size="small"
                />
              </a-form-item>
              <a-form-item label="StreamName" style="width: 280px">
                <a-input
                  v-model="pushForm.streamName"
                  placeholder="输入流名称"
                  size="small"
                />
              </a-form-item>
              <a-form-item label="加密类型">
                <a-radio-group v-model="pushForm.encryptType" size="small">
                  <a-radio value="MD5">MD5</a-radio>
                  <a-radio value="SHA256">SHA256</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item label="过期时间">
                <a-date-picker
                  v-model="pushForm.expireTime"
                  show-time
                  format="YYYY-MM-DD HH:mm:ss"
                  style="width: 200px"
                  size="small"
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="generatePushUrl" size="small">
                  生成地址
                </a-button>
              </a-form-item>
            </a-form>
          </div>

          <!-- 生成结果 - 紧凑显示 -->
          <div v-if="generatedPushUrl" class="section compact-section">
            <div class="section-header">
              <h3 class="section-title">生成结果（根据上面设置项生成以下地址）</h3>
              <a-button type="outline" size="mini" @click="copyAllResults">
                <template #icon><icon-copy /></template>
                一键复制全部
              </a-button>
            </div>
            <a-space direction="vertical" :size="8" fill>
              <div class="result-item">
                <span class="result-label">地址类型：</span>
                <span class="result-value">推流地址</span>
              </div>
              <div class="result-item">
                <span class="result-label">有效时间：</span>
                <span class="result-value">{{ generatedPushUrl.expireTime }}(UTC+8)</span>
              </div>

              <!-- 各种推流地址 -->
              <div v-for="item in generatedPushUrlList" :key="item.type" class="result-item">
                <span class="result-label">{{ item.type }}：</span>
                <div class="result-value">
                  <span class="url-text">{{ item.url }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(item.url)" />
                </div>
              </div>

              <div class="result-item">
                <span class="result-label">OBS服务器：</span>
                <div class="result-value">
                  <span class="url-text">{{ generatedPushUrl.obsServer }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(generatedPushUrl.obsServer)" />
                </div>
              </div>
              <div class="result-item">
                <span class="result-label">OBS推流码：</span>
                <div class="result-value">
                  <span class="url-text">{{ generatedPushUrl.obsStreamKey }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(generatedPushUrl.obsStreamKey)" />
                </div>
              </div>
            </a-space>
          </div>

          <!-- 推流地址解析 - 折叠显示 -->
          <div class="section compact-section">
            <a-collapse :default-active-key="['1']" :bordered="false">
              <a-collapse-item header="推流地址格式说明" key="1">
                <a-table
                  :data="pushUrlList"
                  :pagination="false"
                  :bordered="{ wrapper: true, cell: true }"
                  size="small"
                >
                  <template #columns>
                    <a-table-column title="地址类型" data-index="type" :width="200" />
                    <a-table-column title="推流地址格式" data-index="url">
                      <template #cell="{ record }">
                        <div class="url-cell">
                          <span class="url-text">{{ record.url }}</span>
                          <icon-copy class="copy-icon" @click="copyToClipboard(record.url)" />
                        </div>
                      </template>
                    </a-table-column>
                  </template>
                </a-table>
              </a-collapse-item>
            </a-collapse>
          </div>
        </div>
      </a-tab-pane>

      <!-- 播放域名：合并基本信息和播放配置 -->
      <a-tab-pane v-if="domainInfo.type === 1" key="play" title="基本信息和播放配置">
        <div class="tab-content">
          <!-- 基本信息 -->
          <div class="section">
            <h3 class="section-title">基本信息</h3>
            <a-descriptions :column="2" bordered :label-style="{ width: '120px' }" :value-style="{ width: '200px' }">
              <a-descriptions-item label="域名">
                {{ domainInfo.name }}
              </a-descriptions-item>
              <a-descriptions-item label="域名类型">
                <a-tag color="green">播放域名</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="CNAME">
                <div class="cname-cell">
                  <span>{{ domainInfo.cname }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(domainInfo.cname)" />
                </div>
              </a-descriptions-item>
              <a-descriptions-item label="CNAME 状态">
                <a-tag :color="domainInfo.cnameConfigured === 1 ? 'green' : 'gray'">
                  {{ domainInfo.cnameConfigured === 1 ? '已配置' : '未配置' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="domainInfo.status === 1 ? 'green' : 'red'">
                  {{ domainInfo.status === 1 ? '已启用' : '已禁用' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="区域">
                {{ domainInfo.region || '全球加速' }}
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">
                {{ formatDateTime(domainInfo.createTime) }}
              </a-descriptions-item>
              <a-descriptions-item label="更新时间">
                {{ formatDateTime(domainInfo.updateTime) }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>

        <!-- 播放配置 -->
        <div class="tab-content compact">
          <!-- 播放地址解析 -->
          <div class="section compact-section">
            <h3 class="section-title">播放地址解析</h3>
            <div class="address-formula">
              <span class="formula-label">地址组成：</span>
              <span class="formula-part domain">播放域名</span>
              <span class="formula-plus">+</span>
              <span class="formula-part">AppName</span>
              <span class="formula-plus">+</span>
              <span class="formula-part">StreamName</span>
              <span class="formula-plus">+</span>
              <span class="formula-part auth">鉴权信息</span>
            </div>
            <a-table
              :data="playUrlList"
              :pagination="false"
              :bordered="{ wrapper: true, cell: true }"
              size="small"
              style="margin-top: 16px"
            >
              <template #columns>
                <a-table-column title="地址类型" data-index="type" :width="150" />
                <a-table-column title="播放地址格式" data-index="url">
                  <template #cell="{ record }">
                    <div class="url-cell">
                      <span class="url-text">{{ record.url }}</span>
                      <icon-copy class="copy-icon" @click="copyToClipboard(record.url)" />
                    </div>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </div>

          <!-- 播放地址生成器 -->
          <div class="section compact-section">
            <h3 class="section-title">播放地址生成器</h3>
            <div class="info-row" style="margin-bottom: 12px">
              <span class="info-label">播放域名：</span>
              <span class="info-value">{{ domainInfo.name }}</span>
            </div>
            <div class="info-row" style="margin-bottom: 12px">
              <span class="info-label">Key鉴权配置：</span>
              <a-tag color="green" size="small">已关闭</a-tag>
            </div>
            <a-form :model="playForm" layout="inline" class="compact-form">
              <a-form-item label="加密类型">
                <a-radio-group v-model="playForm.encryptType" size="small">
                  <a-radio value="MD5">MD5</a-radio>
                  <a-radio value="SHA256">SHA256</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item label="鉴权Key">
                <span class="info-value">{{ playAuthKey }}</span>
              </a-form-item>
            </a-form>
            <a-form :model="playForm" layout="inline" class="compact-form" style="margin-top: 12px">
              <a-form-item>
                <a-radio-group v-model="playForm.streamMode" size="small">
                  <a-radio value="original">播放原始流</a-radio>
                  <a-radio value="transcode">播放转码流</a-radio>
                  <a-radio value="adaptive">播放自适应码流</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-form>
            <a-form :model="playForm" layout="inline" class="compact-form" style="margin-top: 12px">
              <a-form-item label="StreamName" style="width: 280px">
                <a-input
                  v-model="playForm.streamName"
                  placeholder="输入流名称"
                  size="small"
                />
              </a-form-item>
              <a-form-item label="地址有效时间">
                <a-date-picker
                  v-model="playForm.expireTime"
                  show-time
                  format="YYYY-MM-DD HH:mm:ss"
                  style="width: 200px"
                  size="small"
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="generatePlayUrl" size="small">
                  生成地址
                </a-button>
              </a-form-item>
            </a-form>
          </div>

          <!-- 生成结果 -->
          <div v-if="generatedPlayUrl" class="section compact-section">
            <div class="section-header">
              <h3 class="section-title">生成结果</h3>
              <a-button type="outline" size="mini" @click="copyAllPlayResults">
                <template #icon><icon-copy /></template>
                一键复制全部
              </a-button>
            </div>
            <a-space direction="vertical" :size="8" fill>
              <div class="result-item">
                <span class="result-label">RTMP 地址：</span>
                <div class="result-value">
                  <span class="url-text">{{ generatedPlayUrl.rtmpUrl }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.rtmpUrl)" />
                </div>
              </div>
              <div class="result-item">
                <span class="result-label">FLV 地址：</span>
                <div class="result-value">
                  <span class="url-text">{{ generatedPlayUrl.flvUrl }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.flvUrl)" />
                </div>
              </div>
              <div class="result-item">
                <span class="result-label">HLS 地址：</span>
                <div class="result-value">
                  <span class="url-text">{{ generatedPlayUrl.hlsUrl }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.hlsUrl)" />
                </div>
              </div>
              <div class="result-item">
                <span class="result-label">WebRTC 地址：</span>
                <div class="result-value">
                  <span class="url-text">{{ generatedPlayUrl.webrtcUrl }}</span>
                  <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.webrtcUrl)" />
                </div>
              </div>
            </a-space>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconCopy,
  IconQuestionCircle,
  IconPlus
} from '@arco-design/web-vue/es/icon'
import { getDomain, generatePushURL } from '@/api/live'
import { useNavigationStore } from '@/stores/navigation'
import { formatDateTime } from '@/utils/date'

const navigationStore = useNavigationStore()

// Props
const props = defineProps<{
  domainName: string
}>()

// 域名信息
const domainInfo = ref({
  name: '',
  type: 0,
  status: 0,
  cname: '',
  cnameConfigured: 0,
  region: '',
  createTime: '',
  updateTime: ''
})

// 当前标签页
const activeTab = ref('push')

// 推流鉴权密钥
const pushAuthKey = ref('d0d87c303d4df45fd648af77ea4a9516')

// 推流地址列表
const pushUrlList = ref([
  {
    type: 'RTMP 地址',
    url: 'rtmp://e.skyzhou.cn/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)'
  },
  {
    type: 'WebRTC 地址',
    url: 'webrtc://e.skyzhou.cn/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)'
  },
  {
    type: 'SRT 地址',
    url: 'srt://e.skyzhou.cn:9000?streamid=#!::h=e.skyzhou.cn,r=AppName/StreamName,bSecret=md5(key+StreamName+hex(time)),bTime=hex(time)'
  },
  {
    type: 'RTMP over SRT 地址',
    url: 'rtmp://e.skyzhou.cn:3570/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)'
  },
  {
    type: 'RTMP over QUIC 地址',
    url: 'rtmp://e.skyzhou.cn:443/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)'
  }
])

// 推流表单
const pushForm = reactive({
  appName: 'live', // 应用名称，默认为 live
  encryptType: 'MD5',
  streamName: '',
  expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 默认7天后
})

// 生成的推流地址
const generatedPushUrl = ref<any>(null)

// 生成的推流地址列表
const generatedPushUrlList = ref<any[]>([])

// 播放鉴权密钥
const playAuthKey = ref('d0d87c303d4df45fd648aff7ea4a9516')

// 播放地址列表（根据当前域名动态生成）
const playUrlList = computed(() => {
  const domain = domainInfo.value.name || '播放域名'
  return [
    {
      type: 'RTMP 地址',
      url: `rtmp://${domain}/AppName/StreamName`
    },
    {
      type: 'FLV 地址',
      url: `http(s)://${domain}/AppName/StreamName.flv`
    },
    {
      type: 'HLS 地址',
      url: `http(s)://${domain}/AppName/StreamName.m3u8`
    },
    {
      type: 'WebRTC 地址',
      url: `webrtc://${domain}/AppName/StreamName`
    }
  ]
})

// 播放表单
const playForm = reactive({
  encryptType: 'MD5',
  streamMode: 'original',
  streamName: '',
  expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 默认7天后
})

// 生成的播放地址
const generatedPlayUrl = ref<any>(null)

// 模板配置数据
const transcodeTemplates = ref([
  // 示例数据，实际应从后端获取
])

const recordTemplates = ref([
  // 示例数据，实际应从后端获取
])

const snapshotTemplates = ref([
  // 示例数据，实际应从后端获取
])

const watermarkTemplates = ref([
  // 示例数据，实际应从后端获取
])

// 高级配置数据
const callbackConfig = ref({
  pushUrl: '',
  breakUrl: '',
  recordUrl: '',
  snapshotUrl: ''
})

const refererConfig = ref({
  enabled: false,
  type: 'white',
  rules: []
})

const httpsConfig = ref({
  enabled: false,
  certType: '',
  expireTime: ''
})

const bandwidthConfig = ref({
  enabled: false,
  threshold: 0
})

// 配置对话框显示状态
const showCallbackConfig = ref(false)
const showRefererConfig = ref(false)
const showHttpsConfig = ref(false)
const showBandwidthConfig = ref(false)

// 解绑模板
const unbindTemplate = (type: string, record: any) => {
  Message.info(`解绑${type}模板功能待实现`)
}

// 加载域名信息
const loadDomainInfo = async () => {
  try {
    const response = await getDomain(props.domainName)
    const data = response.data.data
    domainInfo.value = {
      name: data.Name,
      type: data.Type,
      status: data.Status,
      cname: data.TargetDomain || '',
      cnameConfigured: data.BCName || 0,
      region: data.Region || '全球加速',
      createTime: data.CreateTime,
      updateTime: data.UpdateTime
    }
  } catch (error: any) {
    Message.error(error.response?.data?.message || '加载域名信息失败')
  }
}

// 生成推流地址
const generatePushUrl = async () => {
  if (!pushForm.appName) {
    Message.warning('请输入 AppName')
    return
  }
  if (!pushForm.streamName) {
    Message.warning('请输入 StreamName')
    return
  }

  try {
    // 计算过期时间（秒）
    const expireTimestamp = Math.floor(new Date(pushForm.expireTime).getTime() / 1000)
    const nowTimestamp = Math.floor(Date.now() / 1000)
    const expireTime = expireTimestamp - nowTimestamp

    // 调用后端 API 生成推流地址
    const response = await generatePushURL({
      domainName: domainInfo.value.name,
      appName: pushForm.appName,
      streamName: pushForm.streamName,
      streamKey: pushAuthKey.value,
      expireTime: expireTimestamp
    })

    const data = response.data.data
    const pushURL = data.pushURL

    // 解析 RTMP 推流地址
    // pushURL 格式: rtmp://domain/app/streamName?txSecret=xxx&txTime=xxx
    const urlParts = pushURL.split('?')
    const authParams = urlParts[1] || ''
    const pathParts = urlParts[0].split('/')
    const domain = pathParts[2] // upload.skyzhou.cn
    const appName = pathParts[3] // live
    const streamName = pathParts[4] // A

    const obsServer = urlParts[0].substring(0, urlParts[0].lastIndexOf('/') + 1)
    const obsStreamKey = streamName + (authParams ? '?' + authParams : '')

    // 生成各种格式的推流地址
    generatedPushUrlList.value = [
      {
        type: 'RTMP 地址',
        url: pushURL
      },
      {
        type: 'WebRTC 地址',
        url: `webrtc://${domain}/${appName}/${streamName}${authParams ? '?' + authParams : ''}`
      },
      {
        type: 'SRT 地址',
        url: `srt://${domain}:9000?streamid=#!::h=${domain},r=${appName}/${streamName}${authParams ? ',' + authParams.replace(/&/g, ',') : ''}`
      },
      {
        type: 'RTMP over SRT 地址',
        url: `rtmp://${domain}:3570/${appName}/${streamName}${authParams ? '?' + authParams : ''}`
      },
      {
        type: 'RTMP over QUIC 地址',
        url: `rtmp://${domain}:443/${appName}/${streamName}${authParams ? '?' + authParams : ''}`
      }
    ]

    generatedPushUrl.value = {
      pushUrl: pushURL,
      expireTime: pushForm.expireTime,
      obsServer: obsServer,
      obsStreamKey: obsStreamKey
    }

    Message.success('推流地址生成成功')
  } catch (error: any) {
    Message.error(error.response?.data?.message || '生成推流地址失败')
  }
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  if (!text) return

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      Message.success('已复制到剪贴板')
    }).catch(() => {
      Message.error('复制失败')
    })
  } else {
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

// 一键复制全部结果
const copyAllResults = () => {
  if (!generatedPushUrl.value) return

  let allText = `地址类型：推流地址
有效时间：${generatedPushUrl.value.expireTime}(UTC+8)
`

  // 添加所有推流地址
  generatedPushUrlList.value.forEach(item => {
    allText += `${item.type}：${item.url}\n`
  })

  allText += `OBS服务器：${generatedPushUrl.value.obsServer}
OBS推流码：${generatedPushUrl.value.obsStreamKey}`

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(allText).then(() => {
      Message.success('已复制全部信息到剪贴板')
    }).catch(() => {
      Message.error('复制失败')
    })
  } else {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = allText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        Message.success('已复制全部信息到剪贴板')
      } else {
        Message.error('复制失败')
      }
    } catch (err) {
      Message.error('复制失败，请手动复制')
    }
  }
}

// 生成播放地址
const generatePlayUrl = () => {
  if (!playForm.streamName) {
    Message.warning('请输入 StreamName')
    return
  }

  // 这里应该调用后端接口生成真实的播放地址
  // 目前使用模拟数据
  const appName = 'live' // 默认应用名
  generatedPlayUrl.value = {
    rtmpUrl: `rtmp://${domainInfo.value.name}/${appName}/${playForm.streamName}`,
    flvUrl: `http://${domainInfo.value.name}/${appName}/${playForm.streamName}.flv`,
    hlsUrl: `http://${domainInfo.value.name}/${appName}/${playForm.streamName}.m3u8`,
    webrtcUrl: `webrtc://${domainInfo.value.name}/${appName}/${playForm.streamName}`
  }

  Message.success('播放地址生成成功')
}

// 一键复制全部播放结果
const copyAllPlayResults = () => {
  if (!generatedPlayUrl.value) return

  const allText = `RTMP 地址：${generatedPlayUrl.value.rtmpUrl}
FLV 地址：${generatedPlayUrl.value.flvUrl}
HLS 地址：${generatedPlayUrl.value.hlsUrl}
WebRTC 地址：${generatedPlayUrl.value.webrtcUrl}`

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(allText).then(() => {
      Message.success('已复制全部信息到剪贴板')
    }).catch(() => {
      Message.error('复制失败')
    })
  } else {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = allText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        Message.success('已复制全部信息到剪贴板')
      } else {
        Message.error('复制失败')
      }
    } catch (err) {
      Message.error('复制失败，请手动复制')
    }
  }
}

// 返回列表页
const goBack = () => {
  // 使用 navigationStore 返回上一页
  if (!navigationStore.goBack()) {
    // 如果历史栈为空，返回域名列表页
    navigationStore.navigateTo('LiveDomain', '直播域名管理', {}, false)
  }
}

// 初始化
onMounted(() => {
  loadDomainInfo()
})
</script>

<style scoped>
.live-domain-detail-page {
  padding: 20px;
  background: #fff;
  min-height: 100%;
  max-height: 100vh;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 20px;
}

.tab-content {
  padding: 20px 0;
}

.section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.cname-cell,
.url-cell,
.key-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-text {
  word-break: break-all;
  flex: 1;
}

.copy-icon {
  cursor: pointer;
  color: #86909c;
  font-size: 14px;
  flex-shrink: 0;
}

.copy-icon:hover {
  color: #165dff;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

/* 紧凑布局样式 */
.tab-content.compact {
  padding: 16px 0;
}

.compact-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 4px;
}

.compact-section .section-title {
  font-size: 14px;
  margin-bottom: 12px;
}

.compact-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.compact-section .section-header .section-title {
  margin-bottom: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #4e5969;
  min-width: 80px;
}

.info-value {
  font-size: 13px;
  color: #1d2129;
  font-family: 'Consolas', 'Monaco', monospace;
}

.compact-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.compact-form .arco-form-item {
  margin-bottom: 0;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #e5e6eb;
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-size: 13px;
  color: #4e5969;
  min-width: 100px;
  flex-shrink: 0;
}

.result-value {
  flex: 1;
  font-size: 13px;
  color: #1d2129;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-all;
}

/* 播放地址解析样式 */
.address-formula {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
}

.formula-label {
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
}

.formula-part {
  padding: 4px 12px;
  background: #f2f3f5;
  border-radius: 4px;
  font-size: 13px;
  color: #1d2129;
}

.formula-part.domain {
  background: #e8f3ff;
  color: #165dff;
}

.formula-part.auth {
  background: #fff7e8;
  color: #ff7d00;
}

.formula-plus {
  font-size: 14px;
  color: #86909c;
}

</style>
