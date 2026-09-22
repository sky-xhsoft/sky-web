/**
 * 直播流地址生成 composable
 * 从 LiveDomainDetail.vue 提取推流/播放地址逻辑
 */
import { ref, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { generatePushURL, getDomainAuthKey } from '@/api/live'

export function useLiveStreamUrl(domainName: () => string, domainType?: () => number) {
  // 推流鉴权密钥（从腾讯云接口获取，fallback 空）
  const pushAuthKey = ref('')

  // 播放鉴权密钥
  const playAuthKey = ref('')

  // 加载鉴权KEY（keyType: push/play）
  const loadAuthKey = async (keyType: string) => {
    const domain = domainName()
    if (!domain) return
    try {
      const response = await getDomainAuthKey(domain, keyType)
      const data = response.data?.data
      if (!data) return
      if (keyType === 'play') {
        playAuthKey.value = data.masterKey || ''
      } else {
        pushAuthKey.value = data.masterKey || ''
      }
    } catch (error: any) {
      // 静默失败，保留空值
      Message.error(error.response?.data?.message || `获取${keyType === 'play' ? '播放' : '推流'}鉴权配置失败`)
    }
  }

  // 按域名类型加载对应鉴权KEY
  const loadDomainAuthKey = async () => {
    const type = domainType ? domainType() : 0
    if (type === 1) {
      await loadAuthKey('play')
    } else {
      await loadAuthKey('push')
    }
  }

  // 推流地址列表
  const pushUrlList = ref([
    { type: 'RTMP 地址', url: 'rtmp://upload.skyzhou.cn/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)' },
    { type: 'WebRTC 地址', url: 'webrtc://upload.skyzhou.cn/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)' },
    { type: 'SRT 地址', url: 'srt://upload.skyzhou.cn:9000?streamid=#!::h=upload.skyzhou.cn,r=AppName/StreamName,bSecret=md5(key+StreamName+hex(time)),bTime=hex(time)' },
    { type: 'RTMP over SRT 地址', url: 'rtmp://upload.skyzhou.cn:3570/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)' },
    { type: 'RTMP over QUIC 地址', url: 'rtmp://upload.skyzhou.cn:443/AppName/StreamName?bSecret=md5(key+StreamName+hex(time))&bTime=hex(time)' },
  ])

  // 推流表单
  const pushForm = reactive({
    appName: 'live',
    encryptType: 'MD5',
    streamName: '',
    expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  const generatedPushUrl = ref<any>(null)
  const generatedPushUrlList = ref<any[]>([])
  const pushCollapseActiveKeys = ref<string[]>(['1'])

  // 播放鉴权密钥（已在顶部声明，加载时从接口获取）
  // 播放地址列表
  const playUrlList = computed(() => {
    const domain = domainName() || '播放域名'
    return [
      { type: 'RTMP 地址', url: `rtmp://${domain}/AppName/StreamName` },
      { type: 'FLV 地址', url: `http(s)://${domain}/AppName/StreamName.flv` },
      { type: 'HLS 地址', url: `http(s)://${domain}/AppName/StreamName.m3u8` },
      { type: 'WebRTC 地址', url: `webrtc://${domain}/AppName/StreamName` },
    ]
  })

  const playForm = reactive({
    encryptType: 'MD5',
    streamMode: 'original',
    streamName: '',
    expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  const generatedPlayUrl = ref<any>(null)
  const playCollapseActiveKeys = ref<string[]>(['1'])

  // 模板数据
  const transcodeTemplates = ref<any[]>([])
  const recordTemplates = ref<any[]>([])
  const snapshotTemplates = ref<any[]>([])

  // 生成推流地址
  async function handleGeneratePushUrl() {
    try {
      const result = await generatePushURL({
        domainName: domainName(),
        appName: pushForm.appName,
        streamName: pushForm.streamName,
        streamKey: pushAuthKey.value,
        expireTime: Math.floor(pushForm.expireTime.getTime() / 1000),
      })
      if (result.data?.data) {
        generatedPushUrl.value = result.data.data
        generatedPushUrlList.value = result.data.data.addresses || []
        pushCollapseActiveKeys.value = ['2']
        Message.success('推流地址生成成功')
      }
    } catch (error: any) {
      Message.error(error.response?.data?.message || '生成推流地址失败')
    }
  }

  // 生成播放地址
  async function handleGeneratePlayUrl() {
    generatedPlayUrl.value = {
      appName: 'live',
      streamName: playForm.streamName || 'StreamName',
      addresses: playUrlList.value,
    }
    Message.success('播放地址生成成功')
  }

  // 复制
  function copyToClipboard(text: string) {
    if (!text) return
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => Message.success('复制成功'), () => Message.error('复制失败'))
    }
  }

  return {
    pushAuthKey, pushUrlList, pushForm, generatedPushUrl, generatedPushUrlList, pushCollapseActiveKeys,
    playAuthKey, playUrlList, playForm, generatedPlayUrl, playCollapseActiveKeys,
    transcodeTemplates, recordTemplates, snapshotTemplates,
    handleGeneratePushUrl, handleGeneratePlayUrl, copyToClipboard,
    loadDomainAuthKey, loadAuthKey,
  }
}
