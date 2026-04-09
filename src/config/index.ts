// 应用配置 - 统一管理环境变量
const config = {
  // API 配置
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',

  // 直播相关配置
  live: {
    // 默认推流域名
    defaultPushDomain: import.meta.env.VITE_DEFAULT_PUSH_DOMAIN || 'upload.skyzhou.cn',
    // 默认播放域名
    defaultPlayDomain: import.meta.env.VITE_DEFAULT_PLAY_DOMAIN || 'play.skyzhou.cn',
    // 默认直播应用名
    defaultApp: import.meta.env.VITE_DEFAULT_LIVE_APP || 'live',
    // 默认推流密钥（示例）
    defaultStreamKey: 'd0d87c303d4df45fd648af77ea4a9516',
  }
}

export default config
