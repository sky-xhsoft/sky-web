/**
 * 云盘模块配置常量
 */

/**
 * 断点续传配置
 */
export const RESUMABLE_UPLOAD_CONFIG = {
  /** 分片大小（字节），默认 50MB */
  CHUNK_SIZE: 50 * 1024 * 1024,

  /** 最大重试次数 */
  MAX_RETRIES: 3,

  /** 重试延迟（毫秒） */
  RETRY_DELAY: 1000,

  /** 并发上传数量 */
  CONCURRENT_COUNT: 3,

  /** 是否启用断点续传（可通过环境变量控制） */
  ENABLED: true,
}

/**
 * 文件上传配置
 */
export const UPLOAD_CONFIG = {
  /** 单文件最大大小（字节），默认 20GB */
  MAX_FILE_SIZE: 20 * 1024 * 1024 * 1024,

  /** 同时上传的最大文件数 */
  MAX_CONCURRENT_UPLOADS: 3,

  /** 上传超时时间（毫秒），0表示不限制 */
  TIMEOUT: 0,

  /** 允许的文件类型（空数组表示允许所有类型） */
  ALLOWED_TYPES: [] as string[],

  /** 允许的文件扩展名（空数组表示允许所有扩展名） */
  ALLOWED_EXTS: [] as string[],
}

/**
 * 文件预览配置
 */
export const PREVIEW_CONFIG = {
  /** 文本文件预览最大大小（字节），默认 1MB */
  TEXT_MAX_SIZE: 1 * 1024 * 1024,

  /** 支持预览的文本文件扩展名 */
  TEXT_EXTS: [
    '.txt',
    '.md',
    '.json',
    '.xml',
    '.html',
    '.css',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.vue',
    '.py',
    '.java',
    '.go',
    '.php',
    '.c',
    '.cpp',
    '.h',
    '.sql',
    '.log',
    '.yaml',
    '.yml',
    '.ini',
    '.conf',
  ],

  /** 支持预览的图片文件扩展名 */
  IMAGE_EXTS: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'],

  /** 支持预览的视频文件扩展名 */
  VIDEO_EXTS: ['.mp4', '.webm', '.ogg', '.mov'],

  /** 支持预览的音频文件扩展名 */
  AUDIO_EXTS: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
}

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  /** 默认每页显示数量 */
  DEFAULT_PAGE_SIZE: 50,

  /** 可选的每页显示数量 */
  PAGE_SIZE_OPTIONS: [20, 50, 100, 200],
}

/**
 * 搜索配置
 */
export const SEARCH_CONFIG = {
  /** 搜索防抖延迟（毫秒） */
  DEBOUNCE_DELAY: 300,

  /** 最小搜索关键词长度 */
  MIN_QUERY_LENGTH: 1,

  /** 搜索历史最大保存数量 */
  MAX_HISTORY_COUNT: 10,
}

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  /** 文件夹树缓存时间（毫秒） */
  FOLDER_TREE_CACHE: 5 * 60 * 1000, // 5分钟

  /** 文件列表缓存时间（毫秒） */
  FILE_LIST_CACHE: 2 * 60 * 1000, // 2分钟

  /** 配额信息缓存时间（毫秒） */
  QUOTA_CACHE: 1 * 60 * 1000, // 1分钟
}

/**
 * UI配置
 */
export const UI_CONFIG = {
  /** 网格视图每行显示的列数（响应式） */
  GRID_COLUMNS: {
    xs: 1, // 移动端
    sm: 2, // 小屏平板
    md: 3, // 平板
    lg: 4, // 桌面
    xl: 5, // 大屏桌面
  },

  /** 文件卡片默认高度（像素） */
  CARD_HEIGHT: 120,

  /** 列表视图行高（像素） */
  LIST_ROW_HEIGHT: 48,

  /** 虚拟滚动缓冲区大小 */
  VIRTUAL_SCROLL_BUFFER: 5,
}

/**
 * 分享配置
 */
export const SHARE_CONFIG = {
  /** 默认分享过期天数 */
  DEFAULT_EXPIRE_DAYS: 7,

  /** 分享密码最小长度 */
  MIN_PASSWORD_LENGTH: 4,

  /** 分享密码最大长度 */
  MAX_PASSWORD_LENGTH: 20,

  /** 分享码长度 */
  SHARE_CODE_LENGTH: 6,
}

/**
 * API配置
 */
export const API_CONFIG = {
  /** API基础路径 */
  BASE_PATH: '/api/v1/cloud',

  /** 请求超时时间（毫秒） */
  TIMEOUT: 15000,

  /** 上传请求超时时间（毫秒），0表示不限制 */
  UPLOAD_TIMEOUT: 0,
}
