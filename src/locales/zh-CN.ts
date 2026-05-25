export default {
  dashboard: {
    welcomeBack: '欢迎回来，管理员',
    haveANiceDay: '祝您今天工作愉快！',
    createLiveRoom: '新建直播间',
    liveRooms: '活跃直播间',
    cloudStorage: '云盘使用量',
    viewCount: '今日观看人次',
    pendingTasks: '待处理任务',
    comparedYesterday: '较昨日',
    comparedLastWeek: '较上周',
    items: '项',
    commonFunctions: '常用功能',
    liveRoomManagement: '直播间管理',
    liveRoomManagementDesc: '查看和管理所有直播间',
    cloudStorageManagement: '云盘管理',
    cloudStorageManagementDesc: '管理云端存储的文件',
    domainManagement: '域名管理',
    domainManagementDesc: '配置直播推流和播放域名',
    socialDistribution: '社媒分发',
    socialDistributionDesc: '管理跨平台直播分发任务',
    systemSettings: '系统设置',
    systemSettingsDesc: '配置系统参数和用户权限',
    userGuide: '使用指南',
    userGuideDesc: '查看平台功能使用教程',
    recentOperations: '最近操作',
    systemNotices: '系统公告',
    important: '重要',
    createdLiveRoom: '创建了直播间',
    uploadedVideoFile: '上传了视频文件',
    modifiedDomainConfig: '修改了域名配置',
    createdDistributionTask: '创建了新的分发任务',
    updatedSystemPermissions: '更新了系统权限配置',
    justNow: '刚刚',
    minutesAgo: '分钟前',
    hoursAgo: '小时前',
    yesterday: '昨天',
    systemMaintenanceNotice: '系统升级维护通知',
    systemMaintenanceNoticeDesc: '本周日00:00-06:00系统将进行升级维护，期间服务可能短暂中断，请提前做好准备。',
    newFeatureLiveSync: '新功能上线：多平台同步直播',
    newFeatureLiveSyncDesc: '现在支持同时推流到抖音、快手、视频号等10+平台，快来体验吧！',
    storageCapacityOffer: '存储容量扩容优惠',
    storageCapacityOfferDesc: '云盘存储容量现在买一送一，更多优惠请联系客户经理。',
    jumpingTo: '跳转到',
    weekdays: {
      0: '周日',
      1: '周一',
      2: '周二',
      3: '周三',
      4: '周四',
      5: '周五',
      6: '周六'
    },
    comparedUp: '+',
    comparedDown: '-',
    percentage: '%',
    up: '较昨日',
    down: '较昨日',
    date: {
      year: '年',
      month: '月',
      day: '日'
    },
    cloudStorageFeatures: [
      '集中存储录制和切片文件',
      '文件夹分类管理和搜索',
      '上传、下载和分享文件',
      '查看文件详情和存储空间'
    ]
  },
  language: {
    zhCN: '简体中文',
    enUS: 'English',
    switchLanguage: '切换语言',
    currentLanguage: '当前语言'
  },
  layout: {
    refresh: '刷新',
    close: '关闭',
    closeOther: '关闭其他',
    closeAll: '关闭所有',
    expandSidebar: '展开侧边栏',
    collapseSidebar: '折叠侧边栏',
    cloud: '云盘',
    dataCenter: '数据中心',
    mainNav: '主导航',
    logout: '退出',
    systemManagement: '系统管理',
    liveGuide: '视频直播功能说明',
    liveDomain: '直播域名管理',
    pushDomains: '推流域名管理',
    playDomains: '播放域名管理',
    domainDetail: '域名详情',
    liveStreams: '直播流管理',
    pullStream: '社媒分发',
    createTask: '创建分发任务',
    editTask: '编辑分发任务',
    highlightClips: '高光切片',
    recordings: '录制列表',
    rooms: '直播间管理',
    createRoom: '创建直播间',
    editRoom: '编辑直播间',
    roomDetail: '直播间详情',
    userProfile: '个人中心',
    mono: '单屏',
    dual: '双屏',
    quad: '四屏',
    multi: '多屏',
    overlay: '画中画'
  },
  error: {
    pagePathError: '页面路径不正确',
    pageLoadError: '页面加载失败，请稍后重试'
  },

  common: {
    copy: '副本'
  },

  userProfile: {
    title: '个人中心',
    personalInfo: '个人信息',
    username: '用户名',
    email: '邮箱',
    phone: '手机号',
    department: '部门',
    languageSettings: '语言设置',
    language: '语言',
    timezoneCurrency: '时区与货币',
    timezone: '时区',
    timezoneOptions: {
      asiaShanghai: '北京时间 (UTC+8)',
      americaNewYork: '纽约时间 (UTC-5)',
      europeLondon: '伦敦时间 (UTC+0)',
      asiaTokyo: '东京时间 (UTC+9)',
      asiaSeoul: '首尔时间 (UTC+9)'
    },
    currency: '货币',
    currencyOptions: {
      cny: '人民币 (CNY)',
      usd: '美元 (USD)',
      jpy: '日元 (JPY)',
      krw: '韩元 (KRW)'
    },
    accountSecurity: '账户安全',
    changePassword: '修改密码',
    logout: '退出登录',
    changePasswordModal: {
      title: '修改密码',
      oldPassword: '旧密码',
      oldPasswordPlaceholder: '请输入旧密码',
      newPassword: '新密码',
      newPasswordPlaceholder: '请输入新密码（至少6位）',
      confirmPassword: '确认密码',
      confirmPasswordPlaceholder: '请确认新密码',
      okButton: '确认修改',
      cancelButton: '取消',
      messages: {
        success: '密码修改成功，请重新登录',
        error: '修改密码失败'
      },
      validation: {
        oldPasswordRequired: '请输入旧密码',
        newPasswordRequired: '请输入新密码',
        newPasswordMinLength: '密码长度至少6位',
        confirmPasswordRequired: '请确认新密码',
        confirmPasswordMatch: '两次输入的密码不一致'
      }
    },
    messages: {
      languageChanged: '语言已切换',
      logoutSuccess: '已退出登录',
      logoutError: '退出登录失败'
    }
  },

  cloud: {
    // CloudView.vue
    dropFiles: '释放文件以上传',
    dropFilesHint: '支持多个文件同时上传',
    myShares: '我的分享',
    selectedItems: '已选中 {count} 项',
    batchActions: '批量操作',
    totalSize: '共 {size}',
    selectAll: '全选',
    deselectAll: '取消',
    download: '下载',
    move: '移动',
    delete: '删除',
    refreshSuccess: '刷新成功',
    fileTooLarge: '文件 {name} 超过 20GB 限制，无法上传',
    previewNotSupported: '暂不支持预览此类型文件',
    myCloud: '我的云盘',

    // Toolbar
    upload: '上传',
    createFolder: '新建文件夹',
    refresh: '刷新',
    viewMode: '视图',
    gridView: '网格',
    listView: '列表',
    search: '搜索',
    searchPlaceholder: '搜索文件或文件夹...',
    searching: '搜索中...',
    searchResults: '{count} 个结果',
    clearSearch: '清除搜索',
    sortBy: '排序',
    sortByName: '名称',
    sortBySize: '大小',
    sortByDate: '日期',
    sortByModified: '修改时间',
    toggleSortOrder: '切换排序方向',
    sortByCreated: '创建时间',
    ascending: '升序',
    descending: '降序',

    // File display
    fileName: '文件名',
    fileSize: '大小',
    modified: '修改时间',
    fileType: '类型',
    actions: '操作',
    preview: '预览',
    open: '打开',
    rename: '重命名',
    share: '分享',
    deleteItem: '删除',
    viewDetails: '查看详情',

    // Dialogs
    createFolderTitle: '新建文件夹',
    folderName: '文件夹名称',
    folderNamePlaceholder: '请输入文件夹名称',
    create: '创建',
    cancel: '取消',
    renameTitle: '重命名{type}',
    newName: '新名称',
    save: '保存',
    enterNewName: '请输入新名称',
    nameMinLength: '名称至少1个字符',
    nameMaxLength: '名称最多255个字符',
    originalName: '原名称',
    folder: '文件夹',
    file: '文件',
    items: '项',
    rootDirectory: '根目录',
    folderNameMaxLength: '名称最多100个字符',
    moveTitle: '移动到',
    selectDestination: '选择目标文件夹',
    selected: '已选择',
    targetLocation: '目标位置',
    moveConfirm: '移动',
    deleteConfirmTitle: '确认删除',
    deleteConfirmMsg: '确定要删除 {name} 吗？',
    deleteConfirmBatch: '确定要删除选中的 {count} 项吗？',
    deleteIrreversible: '此操作不可恢复！',
    files: '文件',
    folders: '文件夹',
    confirm: '确定',

    // Share
    createShareTitle: '创建分享链接',
    shareItem: '分享项',
    expiration: '有效期',
    expirationRequired: '请选择有效期',
    selectExpiration: '请选择有效期',
    expiration1Day: '1天',
    expiration7Days: '7天',
    expiration30Days: '30天',
    expirationForever: '永久',
    accessPassword: '访问密码',
    passwordPlaceholder: '留空则不设置密码',
    generate: '生成',
    passwordHint: '建议设置密码以保护分享内容',
    shareType: '分享类型',
    shareTypeFile: '文件分享',
    shareTypeFolder: '文件夹分享',
    shareLink: '分享链接',
    sharePassword: '访问密码',
    sharePasswordPlaceholder: '设置访问密码（可选）',
    shareExpiration: '有效期',
    shareExpiration7Days: '7天',
    shareExpiration30Days: '30天',
    shareExpirationNever: '永久',
    copyLink: '复制链接',
    copySuccess: '链接已复制到剪贴板',
    editShare: '编辑分享',
    shareStats: '分享统计',
    viewCount: '查看次数',
    downloadCount: '下载次数',
    shareCreated: '分享创建成功',
    // Share manager
    searchFileName: '搜索文件名称',
    filterStatus: '筛选状态',
    shareStatusAll: '全部',
    shareStatusActive: '有效',
    shareStatusExpired: '已过期',
    shareTotal: '总分享',
    shareActive: '有效分享',
    shareExpired: '已过期',
    shareEmpty: '暂无分享',
    shareSearchEmpty: '未找到匹配的分享',
    folderEmpty: '此文件夹为空',
    loading: '加载中...',
    unknownFile: '未知文件',
    shareCode: '分享码',
    createTime: '创建时间',
    copyPassword: '复制密码',
    shareCodeCopied: '分享码已复制',
    accessPasswordCopied: '访问密码已复制',
    copyFailed: '复制失败，请手动复制',
    shareExpiredLabel: '已过期',
    shareRemainingDays: '剩余 {days} 天',
    shareForever: '永久',
    viewStats: '查看统计',
    deleteConfirmShare: '确定要删除分享"{fileName}"吗？',
    batchDeleteTitle: '批量删除',
    batchDeleteConfirm: '确定要删除选中的 {count} 个分享吗？',

    // Edit share dialog
    editShareTitle: '编辑分享',
    shareInfoLabel: '分享信息',
    shareLinkCopied: '链接已复制',
    shareLinkLabel: '链接：',
    newExpiration: '新有效期',
    expirationForeverWarning: '永久分享将长期有效，请谨慎设置',
    expireDaysHint: '分享将在 {days} 天后过期（从现在开始计算）',
    passwordGenerated: '密码已生成',
    passwordChangeWarning: '修改密码后，旧密码将立即失效',
    expireTime: '过期时间：',
    expiringSoon: '(即将过期)',
    remainingDays: '剩余天数：',
    linkModifyNote: '修改后分享链接保持不变',
    days: '天',
    copy: '复制',

    // Share success dialog
    shareSuccessTitle: '分享创建成功',
    expireTimeLabel: '有效期至',
    shareLinkTitle: '分享链接',
    accessPasswordTitle: '访问密码',
    foreverValid: '永久有效',
    copyLinkAndPassword: '复制链接和密码',
    openInNewTab: '在新标签页打开',
    shareSafetyTip: '请妥善保管分享链接和密码，分享后无法查看密码',
    copiedToClipboard: '已复制到剪贴板',

    // Share stats dialog
    shareStatsTitle: '访问统计',
    statsNote: '统计数据来自分享创建以来的累计访问和下载次数',

    // Cloud share manager page
    myCloudReturn: '返回云盘',

    // Upload
    uploading: '上传中...',
    uploadSuccess: '上传成功',
    uploadFailed: '上传失败',
    uploadRetry: '重试',
    uploadRemove: '移除',
    uploadClearCompleted: '清除已完成',
    uploadProgress: '{percent}%',

    // Batch operations
    batchOperation: '批量操作',
    batchProgressTitle: '批量操作进度',
    batchSuccessCount: '成功 {count} 项',
    batchFailedCount: '失败 {count} 项',
    batchRetry: '重试失败项',
    batchClose: '关闭',

    // Quota
    quotaUsed: '已用 {used} / {total}',
    storageQuota: '存储空间',
    storageUsage: '存储使用情况',
    usedSpace: '已使用',
    usageRate: '使用率',

    // File types
    typeFolder: '文件夹',
    typeImage: '图片',
    typeVideo: '视频',
    typeAudio: '音频',
    typeDocument: '文档',
    typeArchive: '压缩包',
    typeOther: '其他'
  },

  company: {
    logo: '公司Logo',
    address: '地址',
    contact: '联系人',
    phone: '联系电话',
    email: '联系邮箱',
    defaultLanguage: '默认语言',
    timezone: '时区',
    currency: '货币',
    maxStorageSize: '最大存储大小',
    maxFileSize: '最大文件大小',
    maxFiles: '最大文件数',
    storageConfig: '存储配置'
  },
  share: {
    title: '文件分享',
    password: {
      label: '访问密码',
      placeholder: '请输入访问密码',
      required: '请输入访问密码',
      error: '密码错误，请重试',
      accessBtn: '访问'
    },
    verifying: '验证中...',
    verifyingSuccess: '验证成功',
    fromSharer: 'From {name} shared',
    notFound: {
      title: '分享不存在或已失效',
      desc: '请检查分享链接是否正确，或联系分享者重新分享'
    },
    resource: {
      file: '文件',
      folder: '文件夹',
      sharer: '分享者',
      expires: '过期时间',
      size: '大小'
    },
    actions: {
      download: '下载文件',
      downloadItem: '下载',
      preview: '预览',
      startDownload: '开始下载'
    },
    close: '关闭',
    loading: '加载中...',
    empty: '此文件夹为空',
    browserNotSupportVideo: '您的浏览器不支持视频播放',
    browserNotSupportAudio: '您的浏览器不支持音频播放',
    getShareInfoFailed: '获取分享信息失败',
    previewNotSupport: '该文件类型不支持预览',
    error: {
      passwordRequired: '请输入访问密码'
    }
  },
  player: {
    title: '播放器',
    liveView: '直播视图',
    download: '下载',
    good: '良好',
    overview: '概览',
    recordInfo: '录制信息',
    customInfo: '自定义信息',
    videoInfo: '视频信息',
    fileFormat: '文件格式',
    uploadUser: '上传用户',
    uploadTime: '上传时间',
    fileSize: '文件大小',
    resolution: '分辨率',
    frameRate: '帧率',
    duration: '时长',
    bitrate: '比特率',
    codec: '编码',
    scene: '场景',
    shoot: '拍摄',
    take: '截取',
    acronym: '缩写',
    audioFileNumber: '音频文件编号',
    add: '添加',
    remark: '备注',
    original: '原始',
    speed: '速度'
  },
  filters: {
    tag: '标签',
    date: '日期',
    sort: '排序'
  },
  messages: {
    loadFailed: '加载失败',
    verifySuccess: '验证成功',
    previewNotSupport: '该文件类型不支持预览'
  },
  login: {
    backButton: '返回选择',
    platforms: {
      live: '直播中心',
      cloud: '云盘中心',
      all: '综合中心'
    },
    fields: {
      username: '用户名',
      password: '密码',
      placeholder: {
        username: '请输入用户名',
        password: '请输入密码'
      }
    },
    button: '登录',
    noAccount: '还没有账号？',
    register: '注册',
    success: '登录成功',
    error: '登录失败，请检查账号信息'
  },
  register: {
    title: '企业注册',
    subtitle: '创建公司账户，开始使用 AI 视频管理平台',
    back: '返回',
    steps: {
      company: '公司信息',
      admin: '管理员账号',
      done: '完成'
    },
    company: {
      name: '企业名称',
      namePlaceholder: '请输入企业全称',
      code: '企业代码',
      codePlaceholder: '英文缩写，如: ACME',
      email: '企业邮箱',
      emailPlaceholder: 'company@example.com',
      getCode: '获取验证码',
      codeRetry: '{n}s',
      verifyCode: '验证码',
      verifyCodePlaceholder: '6位验证码',
      codeSent: '验证码已发送（模拟）',
      codeRequired: '请先输入企业邮箱',
      codeInvalid: '请输入6位验证码',
      contact: '联系人',
      contactPlaceholder: '姓名',
      phone: '联系电话',
      phonePlaceholder: '手机号',
      next: '下一步'
    },
    admin: {
      desc: '为「{name}」创建管理员账号',
      username: '用户名',
      usernamePlaceholder: '管理员用户名',
      password: '密码',
      passwordPlaceholder: '至少8位',
      confirmPassword: '确认密码',
      confirmPlaceholder: '再次输入密码',
      adminName: '管理员姓名',
      adminNamePlaceholder: '真实姓名',
      prev: '上一步',
      submit: '提交注册',
      passwordMismatch: '两次密码不一致'
    },
    complete: {
      title: '注册成功！',
      desc: '公司账户已创建，管理员账号已激活',
      goLogin: '进入登录'
    },
    error: '注册失败',
    success: '注册成功'
  },
  liveGuide: {
    quickStart: '快速开始',
    quickStartDesc: '按照以下步骤快速开始使用直播服务',
    steps: {
      domainConfig: '配置域名',
      domainConfigDesc: '添加推流和播放域名，配置 CNAME 解析',
      startStreaming: '开始推流',
      startStreamingDesc: '获取推流地址，使用 OBS 等工具推流',
      manageLive: '管理直播',
      manageLiveDesc: '监控直播状态，管理直播流',
      contentManage: '内容管理',
      contentManageDesc: '录制、切片和云盘存储管理'
    },
    modules: {
      liveDomain: '直播域名',
      liveDomainDesc: '管理推流和播放域名，配置 CNAME 解析',
      liveDomainFeatures: ['添加推流域名和播放域名', '配置 CNAME 解析记录', '查看域名状态和配置信息', '启用、禁用或删除域名'],
      liveStream: '直播流管理',
      liveStreamDesc: '实时监控和管理所有直播流',
      liveStreamFeatures: ['查看所有直播流状态和推流时长', '获取推流地址和播放地址', '禁用、恢复或断开直播流', '查看直播流历史记录'],
      socialDistribution: '社媒分发',
      socialDistributionDesc: '同步分发到多个社交媒体平台',
      socialDistributionFeatures: ['同时推流到抖音、快手、B站等平台', '配置各平台推流地址和密钥', '实时监控各平台推流状态', '启动、停止或编辑分发任务'],
      highlightClips: '直播切片',
      highlightClipsDesc: '保存直播精彩片段',
      highlightClipsFeatures: ['直播过程中实时生成切片文件', '标记和保存精彩时刻', '查看、下载或删除切片文件', '在线预览切片内容'],
      liveRecording: '直播录制',
      liveRecordingDesc: '自动录制直播内容',
      liveRecordingFeatures: ['配置录制规则和存储位置', '自动录制直播全程内容', '查看录制文件列表和详情', '下载、播放或删除录制文件']
    },
    enterManage: '进入管理'
  },
  welcome: {
    brandTitle: 'AI Live',
    brandSubtitle: 'AI视频平台',
    navLinks: {
      features: '功能介绍',
      platforms: '产品平台',
      stats: '数据统计'
    },
    heroBadge: '全新版本已上线',
    heroTitle: '专业的',
    heroTitleGradient: '云数据平台',
    heroDescription: '提供直播管理、云盘存储、社媒分发等一站式解决方案。让您的内容创作和管理更加高效便捷。',
    heroButtons: {
      start: '立即开始',
      demo: '观看演示'
    },
    platforms: {
      title: '选择您的平台',
      subtitle: '根据您的需求选择合适的产品平台，也可以选择综合中心使用全部功能',
      liveCenter: {
        title: '直播中心',
        description: '专注于直播流管理、域名配置和直播内容生产',
        features: ['直播间管理', '域名配置', '直播录制与切片'],
        button: '进入直播中心'
      },
      cloudCenter: {
        title: '云盘中心',
        description: '专注于文件存储、管理和分享的云存储解决方案',
        features: ['文件上传下载', '文件夹管理', '文件分享'],
        button: '进入云盘中心'
      },
      allCenter: {
        title: '综合中心',
        description: '使用全部功能，包括直播、云盘、社媒分发等所有模块',
        features: ['全部直播功能', '全部云盘功能', '社媒分发'],
        button: '进入综合中心'
      }
    },
    features: {
      title: '强大的功能特性',
      subtitle: '我们提供全方位的解决方案，满足您的各种需求',
      domainManagement: {
        title: '域名管理',
        description: '灵活的推流和播放域名配置，支持 CNAME 解析和状态监控'
      },
      liveStreamManagement: {
        title: '直播流管理',
        description: '实时监控所有直播流状态，支持推流地址生成和流控制'
      },
      socialDistribution: {
        title: '社媒分发',
        description: '一键同步推流到抖音、快手、B站等多个主流社交媒体平台'
      },
      liveClips: {
        title: '直播切片',
        description: '实时生成直播精彩片段，支持标记和导出剪辑内容'
      },
      liveRecording: {
        title: '直播录制',
        description: '自动录制直播全程，支持录制规则配置和文件管理'
      },
      cloudStorage: {
        title: '云盘存储',
        description: '安全可靠的云存储服务，支持文件管理、分享和协作'
      }
    },
    stats: {
      users: '活跃用户',
      sessions: '直播场次',
      storage: '存储数据',
      availability: '服务可用性'
    },
    cta: {
      title: '准备开始使用了吗？',
      description: '立即登录，体验专业的云数据平台服务，让您的内容管理更加高效',
      loginButton: '立即登录',
      contactButton: '联系我们'
    },
    footer: {
      brandText: '专业的云数据平台，提供直播管理、云盘存储等一站式解决方案',
      productTitle: '产品',
      productLinks: ['直播中心', '云盘中心', '社媒分发', 'API 文档'],
      companyTitle: '公司',
      companyLinks: ['关于我们', '新闻动态', '加入我们', '联系方式'],
      supportTitle: '支持',
      supportLinks: ['帮助中心', '使用教程', '服务状态', '提交工单'],
      copyright: '© 2024 AI Live AI视频平台. All rights reserved.'
    }
  },
  systemManagement: {
    systemArchitecture: '系统架构特性',
    systemArchitectureDesc: '了解系统的核心设计理念和技术特点',
    metadataDriven: '元数据驱动',
    metadataDrivenDesc: '通过元数据配置实现动态表单、字段、权限等功能，无需修改代码即可扩展业务',
    permissionManagement: '权限管理',
    permissionManagementDesc: '基于用户-权限组-权限的三层权限体系，实现细粒度的访问控制',
    dataDictionary: '数据字典',
    dataDictionaryDesc: '统一管理系统中的枚举值、下拉选项等配置数据，保证数据一致性',
    multiTenant: '多租户支持',
    multiTenantDesc: '支持多公司、多子系统的数据隔离与管理，满足企业级应用需求',
    systemConfigFlow: '系统配置流程',
    systemConfigFlowDesc: '按照以下步骤完成系统初始化配置',
    configureMetadata: '配置元数据',
    configureMetadataDesc: '首先配置公司、子系统、表结构等基础元数据',
    setPermissions: '设置权限',
    setPermissionsDesc: '创建用户账号、配置权限组和权限明细',
    configureDictionary: '配置字典',
    configureDictionaryDesc: '维护数据字典、序号规则等业务配置',
    businessUse: '业务使用',
    businessUseDesc: '基于配置的元数据开展具体业务操作',
    moduleDescriptions: {
      SYS_COMPANY: '管理公司基本信息、组织架构等',
      SYS_SUBSYSTEM: '管理系统模块划分、功能分组',
      SYS_TABLE_CATEGORY: '管理数据表的分类和组织结构',
      SYS_TABLE: '配置系统中的数据表结构和属性',
      SYS_COLUMN: '定义表字段的类型、验证规则等',
      SYS_DICT: '管理系统枚举值、下拉选项等字典数据',
      SYS_SEQ: '配置业务单号、流水号的生成规则',
      SYS_USER: '管理系统用户账号、基本信息',
      SYS_GROUPS: '配置权限组、角色定义',
      SYS_USER_GROUPS: '分配用户所属的权限组',
      SYS_GROUP_PREM: '配置权限组的具体权限明细'
    }
  },
  liveDomain: {
    pageTitle: '直播域名管理',
    pageNotice: {
      pushDomain: '关于推流域名：系统提供的推流域名仅供测试使用，使用上有诸多限制，建议您尽快添加自有域名。',
      playDomain: '关于播放域名：若需要在您自有域名下播放直播流，需要先添加播放域名，并完成域名CNAME配置。',
      domainOwner: '您当前已添加域名归属中包含主播推流的域名。'
    },
    searchPlaceholder: '输入关键词搜索域名',
    addDomain: '添加域名',
    domainTable: {
      domain: '域名',
      cname: 'CNAME',
      type: '类型',
      region: '区域',
      status: '状态',
      createTime: '创建时间',
      operations: '操作',
      pushDomain: '推流域名',
      playDomain: '播放域名',
      globalAcceleration: '全球加速',
      enabled: '已启用',
      disabled: '已禁用',
      manage: '管理',
      forbid: '禁用',
      enable: '启用',
      delete: '删除'
    },
    addDialog: {
      basicConfig: '基本配置',
      cnameConfig: 'CNAME配置',
      domainType: '类型',
      domainTypeTip: '推流域名用于推送直播流，播放域名用于播放直播流',
      accelerationRegion: '加速区域',
      region: {
        global: '全球加速',
        cn: '中国大陆',
        overseas: '海外及港澳台'
      },
      domainName: '域名',
      domainNamePlaceholder: '请输入域名，如：push.example.com',
      domainNameTip: '域名需要已完成ICP备案，且未被其他账号添加',
      tags: '标签（可选）',
      tagsPlaceholder: '请输入标签，多个标签用逗号分隔',
      tagsTip: '标签用于分类管理域名，便于后续查找和管理',
      nextStep: '添加域名并进入下一步',
      laterConfig: '稍后配置',
      complete: '完成'
    },
    addStepTitle: {
      step1: '添加域名',
      step2: 'CNAME配置'
    },
    configSteps: {
      loginToDomainProvider: '登录您的域名服务商（如阿里云、腾讯云、DNSPod等）',
      findDnsSettings: '找到域名解析设置页面',
      addRecord: '添加以下 CNAME 记录'
    },
    configLinks: {
      howToConfig: '如何配置 CNAME？',
      checkCname: '查询 CNAME 状态'
    },
    confirm: {
      confirm: '确定',
      cancel: '取消',
      delete: '删除',
      enable: '启用',
      forbid: '禁用',
      tip: '提示',
      warning: '警告'
    },
    cname: {
      status: {
        label: 'CNAME 配置状态：',
        configured: '已配置',
        unconfigured: '未配置',
        failed: '配置失败'
      },
      configSteps: '配置步骤：',
      statusCheckTip: 'CNAME 配置生效时间通常为 5-10 分钟，最长可能需要 24 小时。配置完成后，您可以点击下方按钮查询配置状态。',
      configSuccess: '域名 {name} 已添加成功！请按照以下步骤完成 CNAME 配置。',
      record: {
        domain: '域名',
        host: '主机记录',
        type: '记录类型',
        value: '记录值'
      }
    },
    messages: {
      addSuccess: '添加域名成功',
      enableSuccess: '启用域名成功',
      forbidSuccess: '禁用域名成功',
      deleteSuccess: '删除域名成功',
      copySuccess: '已复制到剪贴板',
      copyFailed: '复制失败',
      cnameCheckSuccess: 'CNAME 配置验证成功！',
      cnameCheckFailed: '域名未正确配置成功，请检查DNS记录是否正确配置',
      domainNotExists: '域名信息不存在'
    }
  },
  liveRoomDetail: {
    return: '返回',
    pullStreamTask: '社媒分发',
    highlightClips: '直播切片',
    recordings: '直播录制',
    edit: '编辑',
    share: '分享',
    delete: '删除',
    basicInfo: '基本信息',
    roomId: '直播间ID',
    roomName: '直播间名称',
    broadcastFormat: '播出形式',
    broadcastFormatOptions: {
      live: '直播',
      vod: '点播/录播',
      pseudo: '伪直播'
    },
    startTime: '开始时间',
    status: '状态',
    statusOptions: {
      draft: '未开始',
      scheduled: '已排期',
      live: '直播中',
      ended: '已结束',
      archived: '已归档'
    },
    coverImage: '直播间封面',
    settings: {
      pushInfo: '推流信息',
      pullInfo: '拉流信息',
      copy: '复制',
      copyAll: '一键复制所有地址'
    },
    urlLabels: {
      rtmpPush: 'RTMP 地址：',
      webrtcPush: 'WebRTC 地址：',
      srtPush: 'SRT 地址：',
      obsServer: 'OBS服务器：',
      obsStreamKey: 'OBS推流码：',
      rtmpPull: 'RTMP 地址：',
      flvPull: 'HTTP-FLV 地址：',
      hlsPull: 'HLS 地址：'
    },
    messages: {
      copySuccess: '已复制到剪贴板',
      copyFailed: '复制失败',
      deleteConfirm: {
        title: '确认删除',
        content: '确定要删除直播间"{name}"吗？'
      },
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败',
      fetchFailed: '获取直播间信息失败'
    },
    shareFeature: '分享功能开发中'
  },
  liveRoomForm: {
    return: '返回',
    submit: '立即创建',
    edit: '修改',
    compliance: '请您遵守国家相关规定，禁止发布含有违法、违规、低俗、暴力、色情、虚假宣传等内容的直播。AI Live将会对直播内容进行监管，如发现违规行为将会对直播内容进行下架、封禁等操作',
    broadcastFormat: '直播形式',
    broadcastFormatOptions: {
      live: '直播',
      vod: '点播/录播',
      pseudo: '伪直播'
    },
    broadcastFormatTips: {
      live: '实时直播形式，根据实际画面进行传播，无法快进或回放'
    },
    roomName: '直播名称',
    roomNamePlaceholder: '请输入直播名称，100字内',
    roomNameMaxLength: '直播名称不能超过100字',
    startTime: '开始时间',
    coverImage: '直播封面',
    coverImageTips: '推荐图片尺寸为：1000*562 支持JPG、PNG格式',
    upload: '选择图片',
    delete: '删除',
    replace: '更换',
    submitSuccess: '创建成功',
    editSuccess: '更新成功',
    submitError: '创建失败',
    editError: '更新失败',
    deleteCoverSuccess: '已删除封面',
    uploadSuccess: '上传成功',
    uploadError: '上传失败',
    validation: {
      required: '请选择',
      roomName: '请输入直播名称',
      startTime: '请选择开始时间'
    }
  },
  liveRoomList: {
    createLiveRoom: '创建直播',
    refresh: '刷新',
    batchDelete: '批量删除',
    allFilters: '所有筛选',
    filterBy: '直播名称',
    liveName: '直播名称',
    liveId: '直播ID',
    streamName: '流名称',
    searchPlaceholder: '请输入直播名称',
    search: '搜索',
    id: 'ID',
    liveRoom: '直播间',
    broadcastFormat: '直播形式',
    liveStatus: '直播状态',
    startTime: '开始',
    operations: '操作',
    manage: '管理',
    preview: '预览',
    socialDistribution: '社媒分发',
    highlightClips: '高光切片',
    liveRecordings: '直播录制',
    more: '更多',
    edit: '编辑',
    delete: '删除',
    filters: {
      roomType: '直播类型',
      broadcastFormat: '直播形式',
      liveStatus: '直播状态',
      viewingMethod: '观看方式'
    },
    viewingMethods: {
      public: '公开',
      password: '密码',
      pay: '付费'
    },
    roomTypes: {
      video: '视频直播',
      image: '图片直播',
      vr: 'VR直播',
      audio: '语音直播',
      graphic: '图文直播'
    },
    broadcastFormats: {
      live: '直播',
      vod: '点播/录播',
      pseudo: '伪直播'
    },
    statuses: {
      draft: '未开始',
      scheduled: '已排期',
      live: '直播中',
      ended: '已结束',
      archived: '已归档'
    },
    batchDeleteConfirm: {
      title: '确认批量删除',
      content: '确定要将选中的 {count} 个直播间移至回收站吗？',
      success: '已成功删除 {count} 个直播间'
    },
    recycleConfirm: {
      title: '确认回收',
      content: '确定要将直播间"{name}"移至回收站吗？',
      success: '已移至回收站',
      failed: '回收失败'
    },
    messages: {
      featureDevelopment: '功能开发中',
      share: '分享功能开发中',
      recommend: '推荐功能开发中',
      tag: '打标签功能开发中',
      dataAnalysis: '数据分析功能开发中',
      operationRecommend: '推荐运营功能开发中',
      screenInteraction: '大屏互动功能开发中',
      downloadPlayback: '下载回放视频功能开发中',
      setChannel: '设置直播频道功能开发中',
      adminMonitor: '管理员监听功能开发中',
      copySuccess: '复制成功',
      copyFailed: '复制失败',
      liveStarted: '直播已开始',
      operationFailed: '操作失败',
      refreshPassword: {
        title: '刷新密码',
        content: '确定要刷新该直播间的观看密码吗？',
        success: '密码已刷新为: {password}',
        failed: '刷新密码失败'
      },
      preview: {
        noPlayDomain: '未找到播放域名，请先添加播放域名',
        failed: '预览失败'
      },
      fetchData: '获取数据失败',
      recycle: '回收站功能开发中'
    }
  }
}
