<template>
  <div class="live-domain-detail-page">
    <V2PageHeader
      :title="domainInfo.name || domainName"
      :description="domainInfo.type === 0 ? '推流域名详情与地址生成' : '播放域名详情与地址生成'"
      breadcrumb="直播域名 / 详情"
    >
      <template #actions>
        <V2Button type="secondary" @click="goBack">
          <template #icon><icon-left /></template>
          返回
        </V2Button>
      </template>
    </V2PageHeader>

    <!-- 标签页 -->
    <a-tabs v-model:active-key="activeTab" class="v2-detail-tabs">
      <!-- 推流域名：合并基本信息和推流配置 -->
      <a-tab-pane v-if="domainInfo.type === 0" key="push" title="基本信息和推流配置">
        <div class="tab-content">
          <!-- 基本信息 -->
          <V2Card :padding="true" class="section-card">
            <div class="card-title">基本信息</div>
            <div class="detail-rows">
              <span class="dt-label">域名</span>
              <span>{{ domainInfo.name }}</span>
              <span class="dt-label">域名类型</span>
              <span><V2Tag type="info">推流域名</V2Tag></span>
              <span class="dt-label">CNAME</span>
              <span class="cname-cell">
                <code>{{ domainInfo.cname }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(domainInfo.cname)" />
              </span>
              <span class="dt-label">主机记录</span>
              <span class="cname-cell">
                <code>{{ cnameHost(domainInfo.name) }}</code>
                <span class="dt-hint">在域名解析中添加 CNAME 记录，指向上面的地址</span>
              </span>
              <span class="dt-label">CNAME 状态</span>
              <span><V2Tag :type="domainInfo.cnameConfigured === 1 ? 'success' : 'neutral'">{{ domainInfo.cnameConfigured === 1 ? '已配置' : '未配置' }}</V2Tag></span>
              <span class="dt-label">状态</span>
              <span><V2Tag :type="domainInfo.status === 1 ? 'success' : 'error'">{{ domainInfo.status === 1 ? '已启用' : '已禁用' }}</V2Tag></span>
              <span class="dt-label">区域</span>
              <span>{{ domainInfo.region || '全球加速' }}</span>
              <span class="dt-label">创建时间</span>
              <span>{{ formatDateTime(domainInfo.createTime) }}</span>
              <span class="dt-label">更新时间</span>
              <span>{{ formatDateTime(domainInfo.updateTime) }}</span>
            </div>
          </V2Card>

          <!-- 鉴权配置 -->
          <V2Card :padding="true" class="section-card">
            <div class="card-title">鉴权配置</div>
            <div class="info-row">
              <span class="info-label">推流鉴权：</span>
              <V2Tag type="success">开启</V2Tag>
            </div>
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">主KEY：</span>
              <span class="info-value">{{ pushAuthKey }}</span>
              <icon-copy class="copy-icon" @click="copyToClipboard(pushAuthKey)" />
            </div>
          </V2Card>

          <!-- 推流地址生成器 -->
          <V2Card :padding="true" class="section-card">
            <div class="card-title">推流地址生成器</div>
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
                <V2Button size="sm" @click="generatePushUrl">生成地址</V2Button>
              </a-form-item>
            </a-form>
          </V2Card>

          <!-- 生成结果 -->
          <V2Card v-if="generatedPushUrl" :padding="true" class="section-card">
            <div class="section-header">
              <div class="card-title">生成结果（根据上面设置项生成以下地址）</div>
              <V2Button type="secondary" size="sm" @click="copyAllResults">
                <template #icon><icon-copy /></template>
                一键复制全部
              </V2Button>
            </div>
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
                <code class="url-text">{{ item.url }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(item.url)" />
              </div>
            </div>

            <div class="result-item">
              <span class="result-label">OBS服务器：</span>
              <div class="result-value">
                <code class="url-text">{{ generatedPushUrl.obsServer }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(generatedPushUrl.obsServer)" />
              </div>
            </div>
            <div class="result-item">
              <span class="result-label">OBS推流码：</span>
              <div class="result-value">
                <code class="url-text">{{ generatedPushUrl.obsStreamKey }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(generatedPushUrl.obsStreamKey)" />
              </div>
            </div>
          </V2Card>

          <!-- 推流地址解析 -->
          <V2Card :padding="true" class="section-card">
            <a-collapse v-model:active-key="pushCollapseActiveKeys" :bordered="false">
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
          </V2Card>
        </div>
      </a-tab-pane>

      <!-- 播放域名：合并基本信息和播放配置 -->
      <a-tab-pane v-if="domainInfo.type === 1" key="play" title="基本信息和播放配置">
        <div class="tab-content">
          <!-- 基本信息 -->
          <V2Card :padding="true" class="section-card">
            <div class="card-title">基本信息</div>
            <div class="detail-rows">
              <span class="dt-label">域名</span>
              <span>{{ domainInfo.name }}</span>
              <span class="dt-label">域名类型</span>
              <span><V2Tag type="success">播放域名</V2Tag></span>
              <span class="dt-label">CNAME</span>
              <span class="cname-cell">
                <code>{{ domainInfo.cname }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(domainInfo.cname)" />
              </span>
              <span class="dt-label">主机记录</span>
              <span class="cname-cell">
                <code>{{ cnameHost(domainInfo.name) }}</code>
                <span class="dt-hint">在域名解析中添加 CNAME 记录，指向上面的地址</span>
              </span>
              <span class="dt-label">CNAME 状态</span>
              <span><V2Tag :type="domainInfo.cnameConfigured === 1 ? 'success' : 'neutral'">{{ domainInfo.cnameConfigured === 1 ? '已配置' : '未配置' }}</V2Tag></span>
              <span class="dt-label">状态</span>
              <span><V2Tag :type="domainInfo.status === 1 ? 'success' : 'error'">{{ domainInfo.status === 1 ? '已启用' : '已禁用' }}</V2Tag></span>
              <span class="dt-label">区域</span>
              <span>{{ domainInfo.region || '全球加速' }}</span>
              <span class="dt-label">创建时间</span>
              <span>{{ formatDateTime(domainInfo.createTime) }}</span>
              <span class="dt-label">更新时间</span>
              <span>{{ formatDateTime(domainInfo.updateTime) }}</span>
            </div>
          </V2Card>

          <!-- 播放地址生成器 -->
          <V2Card :padding="true" class="section-card">
            <div class="card-title">播放地址生成器</div>
            <div class="info-row" style="margin-bottom: 12px">
              <span class="info-label">播放域名：</span>
              <span class="info-value">{{ domainInfo.name }}</span>
            </div>
            <div class="info-row" style="margin-bottom: 12px">
              <span class="info-label">Key鉴权配置：</span>
              <V2Tag type="neutral">已关闭</V2Tag>
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
                <V2Button size="sm" @click="generatePlayUrl">生成地址</V2Button>
              </a-form-item>
            </a-form>
          </V2Card>

          <!-- 生成结果 -->
          <V2Card v-if="generatedPlayUrl" :padding="true" class="section-card">
            <div class="section-header">
              <div class="card-title">生成结果</div>
              <V2Button type="secondary" size="sm" @click="copyAllPlayResults">
                <template #icon><icon-copy /></template>
                一键复制全部
              </V2Button>
            </div>
            <div class="result-item">
              <span class="result-label">RTMP 地址：</span>
              <div class="result-value">
                <code class="url-text">{{ generatedPlayUrl.rtmpUrl }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.rtmpUrl)" />
              </div>
            </div>
            <div class="result-item">
              <span class="result-label">FLV 地址：</span>
              <div class="result-value">
                <code class="url-text">{{ generatedPlayUrl.flvUrl }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.flvUrl)" />
              </div>
            </div>
            <div class="result-item">
              <span class="result-label">HLS 地址：</span>
              <div class="result-value">
                <code class="url-text">{{ generatedPlayUrl.hlsUrl }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.hlsUrl)" />
              </div>
            </div>
            <div class="result-item">
              <span class="result-label">WebRTC 地址：</span>
              <div class="result-value">
                <code class="url-text">{{ generatedPlayUrl.webrtcUrl }}</code>
                <icon-copy class="copy-icon" @click="copyToClipboard(generatedPlayUrl.webrtcUrl)" />
              </div>
            </div>
          </V2Card>

          <!-- 播放地址格式说明 -->
          <V2Card :padding="true" class="section-card">
            <a-collapse v-model:active-key="playCollapseActiveKeys" :bordered="false">
              <a-collapse-item header="播放地址格式说明" key="1">
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
              </a-collapse-item>
            </a-collapse>
          </V2Card>
        </div>
      </a-tab-pane>

      <!-- 推流域名：回调、录制模板与高光切片（本地配置，同步到本公司腾讯云账号） -->
      <a-tab-pane v-if="domainInfo.type === 0" key="templates" title="模板配置">
        <div class="tab-content">
          <DomainTemplatePanel v-if="activeTab === 'templates'" :domain="domainInfo.name" />
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconLeft } from '@arco-design/web-vue/es/icon'
import { getDomain, generatePushURL } from '@/api/live'
import { useNavigationStore } from '@/stores/navigation'
import { formatDateTime } from '@/utils/date'
import { useLiveStreamUrl } from '@/composables/useLiveStreamUrl'
import { cnameHost, defaultCname } from '@/composables/useDomainList'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import DomainTemplatePanel from './components/DomainTemplatePanel.vue'

const navigationStore = useNavigationStore()

// Props
const props = defineProps<{ domainName: string; tab?: string }>()

const {
  pushAuthKey, pushUrlList, pushForm, generatedPushUrl, generatedPushUrlList, pushCollapseActiveKeys,
  playAuthKey, playUrlList, playForm, generatedPlayUrl, playCollapseActiveKeys,
  copyToClipboard, loadDomainAuthKey,
} = useLiveStreamUrl(() => domainInfo.value.name, () => domainInfo.value.type)

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

// 加载域名信息
const loadDomainInfo = async () => {
  try {
    const response = await getDomain(props.domainName)
    const data = response.data.data
    domainInfo.value = {
      name: data.Name,
      type: data.Type,
      status: data.Status,
      // 腾讯云未返回时按域名类型给默认值
      cname: data.TargetDomain || defaultCname(data.Name, data.Type),
      cnameConfigured: data.BCName || 0,
      region: data.Region || '全球加速',
      createTime: data.CreateTime,
      updateTime: data.UpdateTime
    }

    // 根据域名类型自动切换标签页
        activeTab.value = data.Type === 0 ? (props.tab === 'templates' ? 'templates' : 'push') : 'play'
        // 按域名类型加载对应的鉴权配置（推流/播放）
        loadDomainAuthKey()
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

    // 调用后端 API 生成推流地址
    const response = await generatePushURL({
      domainName: domainInfo.value.name,
      appName: pushForm.appName,
      streamName: pushForm.streamName,
      streamKey: pushAuthKey.value,
      expireTime: expireTimestamp
    })

    const data = response.data.data
    const pushURL = data.pushUrl

    // 解析 RTMP 推流地址
    // pushURL 格式: rtmp://domain/app/streamName?txSecret=xxx&txTime=xxx
    const urlParts = pushURL.split('?')
    const authParams = urlParts[1] || ''
    const pathParts = urlParts[0].split('/')
    const streamName = pathParts[4] // A

    const obsServer = urlParts[0].substring(0, urlParts[0].lastIndexOf('/') + 1)
    const obsStreamKey = streamName + (authParams ? '?' + authParams : '')

    // 使用后端返回的推流地址
    generatedPushUrlList.value = [
      {
        type: 'RTMP 地址',
        url: data.pushUrl
      },
      {
        type: 'WebRTC 地址',
        url: data.pushUrlWebRtc
      },
      {
        type: 'SRT 地址',
        url: data.pushUrlSrt
      }
    ]

    generatedPushUrl.value = {
      pushUrl: pushURL,
      expireTime: pushForm.expireTime,
      obsServer: obsServer,
      obsStreamKey: obsStreamKey
    }

    // 生成地址后折叠格式说明
    pushCollapseActiveKeys.value = []

    Message.success('推流地址生成成功')
  } catch (error: any) {
    Message.error(error.response?.data?.message || '生成推流地址失败')
  }
}

// 复制全部结果
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
    } catch {
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

  // 自动折叠"播放地址格式说明"模块
  playCollapseActiveKeys.value = []

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
    } catch {
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
  padding: 12px;
  background: var(--bg-page);
  min-height: 100%;
  max-height: 100vh;
  overflow-y: auto;
}

.v2-detail-tabs :deep(.arco-tabs-header) {
  border-bottom: 1px solid var(--border-light);
}
.v2-detail-tabs :deep(.arco-tabs-header-title) {
  font-size: 14px;
}
.v2-detail-tabs :deep(.arco-tabs-header-title-active) {
  color: var(--brand-blue);
  font-weight: 600;
}
.v2-detail-tabs :deep(.arco-tabs-header-ink) {
  background: var(--brand-blue);
}

.tab-content {
  padding: 20px 0;
}

.section-card {
  margin-bottom: 16px;
}

.section-card .card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section-header .card-title {
  margin-bottom: 0;
}

.detail-rows {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 10px 14px;
  font-size: 13px;
}

.detail-rows .dt-label {
  color: var(--text-tertiary);
}

.dt-hint { color: var(--color-text-3); font-size: 12px; }
.cname-cell,
.url-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

code {
  background: var(--info-bg);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: ui-monospace, Consolas, monospace;
}

.url-text {
  word-break: break-all;
}

.copy-icon {
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  flex-shrink: 0;
}

.copy-icon:hover {
  color: var(--brand-blue);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 80px;
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
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
  border-bottom: 1px solid var(--border-light);
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 100px;
  flex-shrink: 0;
}

.result-value {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-all;
}

.address-formula {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.formula-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.formula-part {
  padding: 4px 12px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.formula-part.domain {
  background: var(--info-bg);
  color: var(--brand-blue);
}

.formula-part.auth {
  background: var(--warning-bg);
  color: var(--warning);
}

.formula-plus {
  font-size: 14px;
  color: var(--text-tertiary);
}
</style>