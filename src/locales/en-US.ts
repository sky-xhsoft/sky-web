export default {
  dashboard: {
    welcomeBack: 'Welcome back, Administrator',
    haveANiceDay: 'Have a nice day at work!',
    createLiveRoom: 'Create Live Room',
    liveRooms: 'Active Live Rooms',
    cloudStorage: 'Cloud Storage Usage',
    viewCount: 'Today\'s Views',
    pendingTasks: 'Pending Tasks',
    comparedYesterday: 'vs yesterday',
    comparedLastWeek: 'vs last week',
    items: 'items',
    commonFunctions: 'Common Functions',
    liveRoomManagement: 'Live Room Management',
    liveRoomManagementDesc: 'View and manage all live rooms',
    cloudStorageManagement: 'Cloud Storage Management',
    cloudStorageManagementDesc: 'Manage files stored in the cloud',
    domainManagement: 'Domain Management',
    domainManagementDesc: 'Configure live stream push and play domains',
    socialDistribution: 'Social Media Distribution',
    socialDistributionDesc: 'Manage cross-platform live stream distribution tasks',
    systemSettings: 'System Settings',
    systemSettingsDesc: 'Configure system parameters and user permissions',
    userGuide: 'User Guide',
    userGuideDesc: 'View platform feature tutorials',
    recentOperations: 'Recent Operations',
    systemNotices: 'System Notices',
    important: 'Important',
    createdLiveRoom: 'Created live room',
    uploadedVideoFile: 'Uploaded video file',
    modifiedDomainConfig: 'Modified domain configuration',
    createdDistributionTask: 'Created new distribution task',
    updatedSystemPermissions: 'Updated system permission configuration',
    justNow: 'Just now',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    yesterday: 'Yesterday',
    systemMaintenanceNotice: 'System Upgrade Maintenance Notice',
    systemMaintenanceNoticeDesc: 'System upgrade maintenance from 00:00-06:00 this Sunday, service may be interrupted briefly, please prepare in advance.',
    newFeatureLiveSync: 'New Feature: Multi-platform Live Streaming',
    newFeatureLiveSyncDesc: 'Now supports simultaneous streaming to 10+ platforms such as Douyin, Kuaishou, Video Account, etc. Come and experience it!',
    storageCapacityOffer: 'Storage Capacity Expansion Offer',
    storageCapacityOfferDesc: 'Cloud storage capacity buy one get one free now, more offers contact account manager.',
    jumpingTo: 'Jumping to',
    weekdays: {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    },
    comparedUp: '+',
    comparedDown: '-',
    percentage: '%',
    up: 'vs yesterday',
    down: 'vs yesterday',
    date: {
      year: '',
      month: '',
      day: ''
    },
    cloudStorageFeatures: [
      'Centralized storage for recordings and clips',
      'Folder classification and search',
      'Upload, download and share files',
      'View file details and storage space'
    ]
  },
  language: {
    zhCN: '简体中文',
    enUS: 'English',
    switchLanguage: 'Switch Language',
    currentLanguage: 'Current Language'
  },
  layout: {
    refresh: 'Refresh',
    close: 'Close',
    closeOther: 'Close Other',
    closeAll: 'Close All',
    expandSidebar: 'Expand Sidebar',
    collapseSidebar: 'Collapse Sidebar',
    cloud: 'Cloud Storage',
    dataCenter: 'Data Center',
    mainNav: 'Main Navigation',
    logout: 'Logout',
    systemManagement: 'System Management',
    liveGuide: 'Live Streaming Guide',
    liveDomain: 'Live Domain Management',
    pushDomains: 'Push Domains',
    playDomains: 'Play Domains',
    domainDetail: 'Domain Detail',
    liveStreams: 'Live Stream Management',
    pullStream: 'Social Media Distribution',
    createTask: 'Create Task',
    editTask: 'Edit Task',
    highlightClips: 'Highlight Clips',
    recordings: 'Recordings List',
    rooms: 'Live Room Management',
    createRoom: 'Create Live Room',
    editRoom: 'Edit Live Room',
    roomDetail: 'Live Room Detail',
    userProfile: 'User Profile',
    mono: 'Mono',
    dual: 'Dual',
    quad: 'Quad',
    multi: 'Multi-screen',
    overlay: 'Overlay'
  },
  error: {
    pagePathError: 'Invalid page path',
    pageLoadError: 'Failed to load page. Please try again later.'
  },

  common: {
    copy: 'Copy'
  },

  userProfile: {
    title: 'User Profile',
    personalInfo: 'Personal Information',
    username: 'Username',
    email: 'Email',
    phone: 'Phone',
    department: 'Department',
    languageSettings: 'Language Settings',
    language: 'Language',
    timezoneCurrency: 'Timezone & Currency',
    timezone: 'Timezone',
    timezoneOptions: {
      asiaShanghai: 'Beijing Time (UTC+8)',
      americaNewYork: 'New York Time (UTC-5)',
      europeLondon: 'London Time (UTC+0)',
      asiaTokyo: 'Tokyo Time (UTC+9)',
      asiaSeoul: 'Seoul Time (UTC+9)'
    },
    currency: 'Currency',
    currencyOptions: {
      cny: 'Chinese Yuan (CNY)',
      usd: 'US Dollar (USD)',
      jpy: 'Japanese Yen (JPY)',
      krw: 'Korean Won (KRW)'
    },
    accountSecurity: 'Account Security',
    changePassword: 'Change Password',
    logout: 'Logout',
    changePasswordModal: {
      title: 'Change Password',
      oldPassword: 'Old Password',
      oldPasswordPlaceholder: 'Please enter your old password',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Please enter new password (at least 6 characters)',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Please confirm your new password',
      okButton: 'Confirm',
      cancelButton: 'Cancel',
      messages: {
        success: 'Password changed successfully. Please login again.',
        error: 'Failed to change password'
      },
      validation: {
        oldPasswordRequired: 'Please enter your old password',
        newPasswordRequired: 'Please enter your new password',
        newPasswordMinLength: 'Password must be at least 6 characters',
        confirmPasswordRequired: 'Please confirm your new password',
        confirmPasswordMatch: 'Passwords do not match'
      }
    },
    messages: {
      languageChanged: 'Language changed successfully',
      logoutSuccess: 'Logged out successfully',
      logoutError: 'Failed to logout'
    }
  },

  cloud: {
    // CloudView.vue
    dropFiles: 'Release to upload',
    dropFilesHint: 'Supports multiple files at once',
    myShares: 'My Shares',
    selectedItems: 'Selected {count} items',
    batchActions: 'Batch Actions',
    totalSize: 'Total {size}',
    selectAll: 'Select All',
    deselectAll: 'Cancel',
    download: 'Download',
    move: 'Move',
    delete: 'Delete',
    refreshSuccess: 'Refresh successful',
    fileTooLarge: 'File {name} exceeds 20GB limit, cannot upload',
    previewNotSupported: 'Preview not supported for this file type',
    rootDirectory: 'Root Directory',
    myCloud: 'My Cloud',

    // Toolbar
    upload: 'Upload',
    createFolder: 'New Folder',
    refresh: 'Refresh',
    viewMode: 'View',
    gridView: 'Grid',
    listView: 'List',
    search: 'Search',
    searchPlaceholder: 'Search files or folders...',
    searching: 'Searching...',
    searchResults: '{count} results',
    clearSearch: 'Clear',
    sortBy: 'Sort',
    sortByName: 'Name',
    sortBySize: 'Size',
    sortByDate: 'Date',
    sortByModified: 'Modified',
    toggleSortOrder: 'Toggle Sort Order',
    sortByCreated: 'Created',
    ascending: 'Ascending',
    descending: 'Descending',

    // File display
    fileName: 'File Name',
    fileSize: 'Size',
    modified: 'Modified',
    fileType: 'Type',
    actions: 'Actions',
    preview: 'Preview',
    open: 'Open',
    rename: 'Rename',
    share: 'Share',
    deleteItem: 'Delete',
    viewDetails: 'View Details',

    // Dialogs
    createFolderTitle: 'New Folder',
    folderName: 'Folder Name',
    folderNamePlaceholder: 'Enter folder name',
    create: 'Create',
    cancel: 'Cancel',
    renameTitle: 'Rename {type}',
    newName: 'New Name',
    save: 'Save',
    enterNewName: 'Enter new name',
    nameMinLength: 'Name must be at least 1 character',
    nameMaxLength: 'Name can be up to 255 characters',
    originalName: 'Original name',
    folder: 'Folder',
    file: 'File',
    items: 'items',
    folderNameMaxLength: 'Folder name can be up to 100 characters',
    moveTitle: 'Move to',
    selectDestination: 'Select destination folder',
    selected: 'Selected',
    targetLocation: 'Target location',
    moveConfirm: 'Move',
    deleteConfirmTitle: 'Confirm Delete',
    deleteConfirmMsg: 'Are you sure you want to delete {name}?',
    deleteConfirmBatch: 'Are you sure you want to delete {count} selected items?',
    deleteIrreversible: 'This action cannot be undone!',
    files: 'Files',
    folders: 'Folders',
    confirm: 'Confirm',

    // Share
    createShareTitle: 'Create Share Link',
    shareItem: 'Share Item',
    expiration: 'Expiration',
    expirationRequired: 'Please select expiration time',
    selectExpiration: 'Please select expiration time',
    expiration1Day: '1 Day',
    expiration7Days: '7 Days',
    expiration30Days: '30 Days',
    expirationForever: 'Forever',
    accessPassword: 'Access Password',
    passwordPlaceholder: 'Leave blank for no password',
    generate: 'Generate',
    passwordHint: 'It is recommended to set a password to protect your shared content',
    shareType: 'Share Type',
    shareTypeFile: 'File Share',
    shareTypeFolder: 'Folder Share',
    shareLink: 'Share Link',
    sharePassword: 'Access Password',
    sharePasswordPlaceholder: 'Set access password (optional)',
    shareExpiration: 'Expiration',
    shareExpiration7Days: '7 Days',
    shareExpiration30Days: '30 Days',
    shareExpirationNever: 'Never Expire',
    copyLink: 'Copy Link',
    copySuccess: 'Link copied to clipboard',
    editShare: 'Edit Share',
    shareStats: 'Share Statistics',
    viewCount: 'Views',
    downloadCount: 'Downloads',
    shareCreated: 'Share created successfully',
    // Share manager
    searchFileName: 'Search file name',
    filterStatus: 'Filter status',
    shareStatusAll: 'All',
    shareStatusActive: 'Active',
    shareStatusExpired: 'Expired',
    shareTotal: 'Total shares',
    shareActive: 'Active shares',
    shareExpired: 'Expired shares',
    shareEmpty: 'No shares yet',
    shareSearchEmpty: 'No matching shares found',
    folderEmpty: 'This folder is empty',
    loading: 'Loading...',
    unknownFile: 'Unknown file',
    shareCode: 'Share code',
    createTime: 'Created time',
    copyPassword: 'Copy password',
    shareCodeCopied: 'Share code copied',
    accessPasswordCopied: 'Access password copied',
    copyFailed: 'Copy failed, please copy manually',
    shareExpiredLabel: 'Expired',
    shareRemainingDays: '{days} days remaining',
    shareForever: 'Forever',
    viewStats: 'View statistics',
    deleteConfirmShare: 'Are you sure you want to delete the share "{fileName}"?',
    batchDeleteTitle: 'Batch Delete',
    batchDeleteConfirm: 'Are you sure you want to delete {count} selected shares?',

    // Edit share dialog
    editShareTitle: 'Edit Share',
    shareInfoLabel: 'Share Information',
    shareLinkCopied: 'Link copied',
    shareLinkLabel: 'Link: ',
    newExpiration: 'New Expiration',
    expirationForeverWarning: 'Permanent shares will remain valid. Please set with caution.',
    expireDaysHint: 'Share will expire in {days} days (calculated from now)',
    passwordGenerated: 'Password generated',
    passwordChangeWarning: 'After changing the password, the old password will be immediately invalid',
    expireTime: 'Expiration Time: ',
    expiringSoon: '(Expiring soon)',
    remainingDays: 'Remaining Days: ',
    linkModifyNote: 'Share link remains unchanged after modification',
    days: 'days',
    copy: 'Copy',

    // Share success dialog
    shareSuccessTitle: 'Share Created Successfully',
    expireTimeLabel: 'Expires On',
    shareLinkTitle: 'Share Link',
    accessPasswordTitle: 'Access Password',
    foreverValid: 'Valid Forever',
    copyLinkAndPassword: 'Copy Link and Password',
    openInNewTab: 'Open in New Tab',
    shareSafetyTip: 'Please keep the share link and password safe. The password cannot be viewed after sharing.',
    copiedToClipboard: 'Copied to clipboard',

    // Share stats dialog
    shareStatsTitle: 'View Statistics',
    statsNote: 'Statistics are cumulative views and downloads since the share was created',

    // Cloud share manager page
    myCloudReturn: 'Back to Cloud',

    // Upload
    uploading: 'Uploading...',
    uploadSuccess: 'Upload successful',
    uploadFailed: 'Upload failed',
    uploadRetry: 'Retry',
    uploadRemove: 'Remove',
    uploadClearCompleted: 'Clear Completed',
    uploadProgress: '{percent}%',

    // Batch operations
    batchOperation: 'Batch Operation',
    batchProgressTitle: 'Batch Operation Progress',
    batchSuccessCount: '{count} succeeded',
    batchFailedCount: '{count} failed',
    batchRetry: 'Retry Failed',
    batchClose: 'Close',

    // Quota
    quotaUsed: '{used} / {total} used',
    storageQuota: 'Storage Quota',
    storageUsage: 'Storage Usage',
    usedSpace: 'Used',
    usageRate: 'Usage rate',

    // File types
    typeFolder: 'Folder',
    typeImage: 'Image',
    typeVideo: 'Video',
    typeAudio: 'Audio',
    typeDocument: 'Document',
    typeArchive: 'Archive',
    typeOther: 'Other'
  },

  company: {
    logo: 'Company Logo',
    address: 'Address',
    contact: 'Contact',
    phone: 'Phone',
    email: 'Email',
    defaultLanguage: 'Default Language',
    timezone: 'Timezone',
    currency: 'Currency',
    maxStorageSize: 'Max Storage Size',
    maxFileSize: 'Max File Size',
    maxFiles: 'Max Files',
    storageConfig: 'Storage Config'
  },
  share: {
    title: 'File Share',
    password: {
      label: 'Access Password',
      placeholder: 'Enter access password',
      required: 'Please enter access password',
      error: 'Incorrect password, please try again',
      accessBtn: 'Access'
    },
    verifying: 'Verifying...',
    verifyingSuccess: 'Verification successful',
    fromSharer: 'From {name} shared',
    notFound: {
      title: 'Share does not exist or has expired',
      desc: 'Please check the share link or contact the sharer to re-share'
    },
    resource: {
      file: 'File',
      folder: 'Folder',
      sharer: 'Sharer',
      expires: 'Expires',
      size: 'Size'
    },
    actions: {
      download: 'Download File',
      downloadItem: 'Download',
      preview: 'Preview',
      startDownload: 'Starting download'
    },
    close: 'Close',
    loading: 'Loading...',
    empty: 'This folder is empty',
    browserNotSupportVideo: 'Your browser does not support video playback',
    browserNotSupportAudio: 'Your browser does not support audio playback',
    getShareInfoFailed: 'Failed to get share information',
    previewNotSupport: 'This file type does not support preview',
    error: {
      passwordRequired: 'Please enter access password'
    }
  },
  player: {
    title: 'Player',
    liveView: 'Live view',
    download: 'Download',
    good: 'Good',
    overview: 'Overview',
    recordInfo: 'Record information',
    customInfo: 'Custom info',
    videoInfo: 'Video info',
    fileFormat: 'File format',
    uploadUser: 'Upload user',
    uploadTime: 'Upload time',
    fileSize: 'File Size',
    resolution: 'Resolution',
    frameRate: 'Frame rate',
    duration: 'Duration',
    bitrate: 'Bitrate',
    codec: 'Codec',
    scene: 'Scene',
    shoot: 'Shoot',
    take: 'Take',
    acronym: 'Acronym',
    audioFileNumber: 'Audio file number',
    add: 'Add',
    remark: 'Remark',
    original: 'Original',
    speed: 'Speed'
  },
  filters: {
    tag: 'Tag',
    date: 'Date',
    sort: 'Sort'
  },
  messages: {
    loadFailed: 'Load failed',
    verifySuccess: 'Verification successful',
    previewNotSupport: 'This file type does not support preview'
  },
  login: {
    backButton: 'Back',
    platforms: {
      live: 'Live Streaming Center',
      cloud: 'Cloud Storage Center',
      all: 'Comprehensive Center'
    },
    fields: {
      username: 'Username',
      password: 'Password',
      placeholder: {
        username: 'Please enter username',
        password: 'Please enter password'
      }
    },
    button: 'Login',
    noAccount: 'No account yet?',
    register: 'Register',
    success: 'Login successful',
    error: 'Login failed, please check your account information'
  },
  register: {
    title: 'Company Registration',
    subtitle: 'Create company account to start using AI Video Platform',
    back: 'Back',
    steps: {
      company: 'Company Info',
      admin: 'Admin Account',
      done: 'Complete'
    },
    company: {
      name: 'Company Name',
      namePlaceholder: 'Enter full company name',
      code: 'Company Code',
      codePlaceholder: 'Abbreviation, e.g. ACME',
      email: 'Company Email',
      emailPlaceholder: 'company@example.com',
      getCode: 'Get Code',
      codeRetry: '{n}s',
      verifyCode: 'Verification Code',
      verifyCodePlaceholder: '6-digit code',
      codeSent: 'Verification code sent (simulated)',
      codeRequired: 'Please enter company email first',
      codeInvalid: 'Please enter 6-digit verification code',
      contact: 'Contact Person',
      contactPlaceholder: 'Name',
      phone: 'Contact Phone',
      phonePlaceholder: 'Phone number',
      next: 'Next'
    },
    admin: {
      desc: 'Create admin account for "{name}"',
      username: 'Username',
      usernamePlaceholder: 'Admin username',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      confirmPassword: 'Confirm Password',
      confirmPlaceholder: 'Re-enter password',
      adminName: 'Admin Name',
      adminNamePlaceholder: 'Full name',
      prev: 'Previous',
      submit: 'Submit Registration',
      passwordMismatch: 'Passwords do not match'
    },
    complete: {
      title: 'Registration Successful!',
      desc: 'Company account created, admin account activated',
      goLogin: 'Go to Login'
    },
    error: 'Registration failed',
    success: 'Registration successful'
  },
  liveGuide: {
    quickStart: 'Quick Start',
    quickStartDesc: 'Follow these steps to quickly start using the live streaming service',
    steps: {
      domainConfig: 'Configure Domains',
      domainConfigDesc: 'Add push and playback domains, configure CNAME resolution',
      startStreaming: 'Start Streaming',
      startStreamingDesc: 'Get stream URL, push stream using OBS or other tools',
      manageLive: 'Manage Live Streaming',
      manageLiveDesc: 'Monitor live streaming status, manage live streams',
      contentManage: 'Content Management',
      contentManageDesc: 'Recording, clipping, and cloud storage management'
    },
    modules: {
      liveDomain: 'Live Domain Management',
      liveDomainDesc: 'Manage push and playback domains, configure CNAME resolution',
      liveDomainFeatures: ['Add push and playback domains', 'Configure CNAME resolution records', 'View domain status and configuration', 'Enable, disable, or delete domains'],
      liveStream: 'Live Stream Management',
      liveStreamDesc: 'Real-time monitoring and management of all live streams',
      liveStreamFeatures: ['View status and duration of all live streams', 'Get push and playback URLs', 'Disable, resume, or disconnect live streams', 'View live stream history'],
      socialDistribution: 'Social Media Distribution',
      socialDistributionDesc: 'Synchronize distribution to multiple social media platforms',
      socialDistributionFeatures: ['Simultaneously stream to Douyin, Kuaishou, Bilibili, and more', 'Configure stream URLs and keys for each platform', 'Real-time monitoring of streaming status on each platform', 'Start, stop, or edit distribution tasks'],
      highlightClips: 'Live Clipping',
      highlightClipsDesc: 'Save exciting moments from live streams',
      highlightClipsFeatures: ['Generate clip files in real-time during live streaming', 'Mark and save exciting moments', 'View, download, or delete clip files', 'Preview clip content online'],
      liveRecording: 'Live Recording',
      liveRecordingDesc: 'Automatically record live streaming content',
      liveRecordingFeatures: ['Configure recording rules and storage location', 'Automatically record complete live stream content', 'View recording file list and details', 'Download, play, or delete recording files']
    },
    enterManage: 'Enter Management'
  },
  welcome: {
    brandTitle: 'AI Live',
    brandSubtitle: 'AI Video Platform',
    navLinks: {
      features: 'Features',
      platforms: 'Product Platforms',
      stats: 'Statistics'
    },
    heroBadge: 'New version launched',
    heroTitle: 'Professional',
    heroTitleGradient: 'Cloud Data Platform',
    heroDescription: 'Provides one-stop solutions for live streaming management, cloud storage, social media distribution, and more. Makes your content creation and management more efficient and convenient.',
    heroButtons: {
      start: 'Get Started',
      demo: 'Watch Demo'
    },
    platforms: {
      title: 'Choose Your Platform',
      subtitle: 'Select the appropriate product platform based on your needs, or choose the comprehensive center to use all features',
      liveCenter: {
        title: 'Live Streaming Center',
        description: 'Focused on live stream management, domain configuration, and live content production',
        features: ['Live room management', 'Domain configuration', 'Live recording and clipping'],
        button: 'Enter Live Streaming Center'
      },
      cloudCenter: {
        title: 'Cloud Storage Center',
        description: 'Focused on file storage, management, and sharing cloud storage solutions',
        features: ['File upload and download', 'Folder management', 'File sharing'],
        button: 'Enter Cloud Storage Center'
      },
      allCenter: {
        title: 'Comprehensive Center',
        description: 'Use all features, including live streaming, cloud storage, social media distribution, and all modules',
        features: ['All live streaming features', 'All cloud storage features', 'Social media distribution'],
        button: 'Enter Comprehensive Center'
      }
    },
    features: {
      title: 'Powerful Features',
      subtitle: 'We provide comprehensive solutions to meet your various needs',
      domainManagement: {
        title: 'Domain Management',
        description: 'Flexible push and playback domain configuration, supporting CNAME resolution and status monitoring'
      },
      liveStreamManagement: {
        title: 'Live Stream Management',
        description: 'Real-time monitoring of all live stream statuses, supporting stream address generation and stream control'
      },
      socialDistribution: {
        title: 'Social Media Distribution',
        description: 'One-click synchronization of live streams to multiple mainstream social media platforms such as Douyin, Kuaishou, and Bilibili'
      },
      liveClips: {
        title: 'Live Clipping',
        description: 'Real-time generation of live highlights, supporting marking and exporting clip content'
      },
      liveRecording: {
        title: 'Live Recording',
        description: 'Automatic recording of the entire live stream, supporting recording rule configuration and file management'
      },
      cloudStorage: {
        title: 'Cloud Storage',
        description: 'Secure and reliable cloud storage service, supporting file management, sharing, and collaboration'
      }
    },
    stats: {
      users: 'Active Users',
      sessions: 'Live Sessions',
      storage: 'Storage Data',
      availability: 'Service Availability'
    },
    cta: {
      title: 'Ready to Get Started?',
      description: 'Login now to experience professional cloud data platform services and make your content management more efficient',
      loginButton: 'Login Now',
      contactButton: 'Contact Us'
    },
    footer: {
      brandText: 'A professional cloud data platform that provides one-stop solutions for live streaming management, cloud storage, and more',
      productTitle: 'Product',
      productLinks: ['Live Streaming Center', 'Cloud Storage Center', 'Social Media Distribution', 'API Documentation'],
      companyTitle: 'Company',
      companyLinks: ['About Us', 'News', 'Join Us', 'Contact'],
      supportTitle: 'Support',
      supportLinks: ['Help Center', 'Tutorials', 'Service Status', 'Submit Ticket'],
      copyright: '© 2024 AI Live AI Video Platform. All rights reserved.'
    }
  },
  systemManagement: {
    systemArchitecture: 'System Architecture Features',
    systemArchitectureDesc: 'Understand the core design philosophy and technical characteristics of the system',
    metadataDriven: 'Metadata Driven',
    metadataDrivenDesc: 'Achieve dynamic forms, fields, permissions, and other functions through metadata configuration, expanding business without modifying code',
    permissionManagement: 'Permission Management',
    permissionManagementDesc: 'Three-layer permission system based on user-permission group-permission, achieving fine-grained access control',
    dataDictionary: 'Data Dictionary',
    dataDictionaryDesc: 'Unified management of configuration data such as enumeration values and drop-down options in the system to ensure data consistency',
    multiTenant: 'Multi-tenant Support',
    multiTenantDesc: 'Supports data isolation and management for multiple companies and subsystems, meeting enterprise-level application requirements',
    systemConfigFlow: 'System Configuration Flow',
    systemConfigFlowDesc: 'Complete system initialization configuration in the following steps',
    configureMetadata: 'Configure Metadata',
    configureMetadataDesc: 'First configure basic metadata such as company, subsystem, and table structure',
    setPermissions: 'Set Permissions',
    setPermissionsDesc: 'Create user accounts, configure permission groups and detailed permissions',
    configureDictionary: 'Configure Dictionary',
    configureDictionaryDesc: 'Maintain data dictionaries, sequence rules, and other business configurations',
    businessUse: 'Business Use',
    businessUseDesc: 'Carry out specific business operations based on configured metadata',
    moduleDescriptions: {
      SYS_COMPANY: 'Manage basic company information, organizational structure, etc.',
      SYS_SUBSYSTEM: 'Manage system module division and functional grouping',
      SYS_TABLE_CATEGORY: 'Manage the classification and organizational structure of data tables',
      SYS_TABLE: 'Configure the structure and attributes of data tables in the system',
      SYS_COLUMN: 'Define the types and validation rules of table fields',
      SYS_DICT: 'Manage dictionary data such as enumeration values and drop-down options',
      SYS_SEQ: 'Configure the generation rules for business numbers and serial numbers',
      SYS_USER: 'Manage system user accounts and basic information',
      SYS_GROUPS: 'Configure permission groups and role definitions',
      SYS_USER_GROUPS: 'Assign users to permission groups',
      SYS_GROUP_PREM: 'Configure detailed permissions for permission groups'
    }
  },
  liveDomain: {
    pageTitle: 'Live Domain Management',
    pageNotice: {
      pushDomain: 'About push domain: The push domain provided by the system is for testing only. There are many limitations. We recommend that you add your own domain as soon as possible.',
      playDomain: 'About playback domain: To play live streams under your own domain, you need to first add a playback domain and complete the CNAME configuration.',
      domainOwner: 'You have added a domain that includes the streamer push domain.'
    },
    searchPlaceholder: 'Enter keyword to search domains',
    addDomain: 'Add Domain',
    domainTable: {
      domain: 'Domain',
      cname: 'CNAME',
      type: 'Type',
      region: 'Region',
      status: 'Status',
      createTime: 'Created Time',
      operations: 'Operations',
      pushDomain: 'Push Domain',
      playDomain: 'Play Domain',
      globalAcceleration: 'Global Acceleration',
      enabled: 'Enabled',
      disabled: 'Disabled',
      manage: 'Manage',
      forbid: 'Disable',
      enable: 'Enable',
      delete: 'Delete'
    },
    addDialog: {
      basicConfig: 'Basic Config',
      cnameConfig: 'CNAME Config',
      domainType: 'Type',
      domainTypeTip: 'Push domains are used to push live streams, and play domains are used to play live streams',
      accelerationRegion: 'Acceleration Region',
      region: {
        global: 'Global',
        cn: 'Mainland China',
        overseas: 'Overseas & Hong Kong, Macao, Taiwan'
      },
      tags: 'Tags (Optional)',
      title: 'Tags (Optional)'
    },
    addStepTitle: {
      step1: 'Add Domain',
      step2: 'CNAME Config'
    },
    configSteps: {
      loginToDomainProvider: 'Log in to your domain name service provider (such as Aliyun, Tencent Cloud, DNSPod, etc.)',
      findDnsSettings: 'Find the domain name resolution settings page',
      addRecord: 'Add the following CNAME record'
    },
    configLinks: {
      howToConfig: 'How to configure CNAME?',
      checkCname: 'Check CNAME status'
    },
    confirm: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      delete: 'Delete',
      enable: 'Enable',
      forbid: 'Disable',
      tip: 'Tip',
      warning: 'Warning'
    },
    cname: {
      status: {
        label: 'CNAME Config Status:',
        configured: 'Configured',
        unconfigured: 'Unconfigured',
        failed: 'Failed'
      },
      configSteps: 'Configuration Steps:',
      statusCheckTip: 'CNAME configuration usually takes 5-10 minutes to take effect, and may take up to 24 hours at most. After configuration, you can click the button below to check the configuration status.',
      configSuccess: 'Domain {name} has been added successfully! Please follow the steps below to complete the CNAME configuration.',
      record: {
        domain: 'Domain',
        host: 'Host Record',
        type: 'Record Type',
        value: 'Record Value'
      }
    },
    messages: {
      addSuccess: 'Domain added successfully',
      enableSuccess: 'Domain enabled successfully',
      forbidSuccess: 'Domain disabled successfully',
      deleteSuccess: 'Domain deleted successfully',
      copySuccess: 'Copied to clipboard',
      copyFailed: 'Copy failed',
      cnameCheckSuccess: 'CNAME configuration verified successfully!',
      cnameCheckFailed: 'Domain not configured correctly, please check if the DNS record is correctly configured',
      domainNotExists: 'Domain information does not exist'
    }
  },
  liveRoomDetail: {
    return: 'Return',
    pullStreamTask: 'Social Distribution',
    highlightClips: 'Live Clipping',
    recordings: 'Live Recordings',
    edit: 'Edit',
    share: 'Share',
    delete: 'Delete',
    basicInfo: 'Basic Information',
    roomId: 'Live Room ID',
    roomName: 'Live Room Name',
    broadcastFormat: 'Broadcast Format',
    broadcastFormatOptions: {
      live: 'Live',
      vod: 'VOD/Recorded',
      pseudo: 'Pseudo Live'
    },
    startTime: 'Start Time',
    status: 'Status',
    statusOptions: {
      draft: 'Not Started',
      scheduled: 'Scheduled',
      live: 'Live',
      ended: 'Ended',
      archived: 'Archived'
    },
    coverImage: 'Live Room Cover',
    settings: {
      pushInfo: 'Push Information',
      pullInfo: 'Pull Information',
      copy: 'Copy',
      copyAll: 'Copy All Addresses'
    },
    urlLabels: {
      rtmpPush: 'RTMP Address: ',
      webrtcPush: 'WebRTC Address: ',
      srtPush: 'SRT Address: ',
      obsServer: 'OBS Server: ',
      obsStreamKey: 'OBS Stream Key: ',
      rtmpPull: 'RTMP Address: ',
      flvPull: 'HTTP-FLV Address: ',
      hlsPull: 'HLS Address: '
    },
    messages: {
      copySuccess: 'Copied to clipboard',
      copyFailed: 'Copy failed',
      deleteConfirm: {
        title: 'Confirm Delete',
        content: 'Are you sure you want to delete the live room "{name}"?'
      },
      deleteSuccess: 'Delete successful',
      deleteFailed: 'Delete failed',
      fetchFailed: 'Failed to fetch live room information'
    },
    shareFeature: 'Share feature in development'
  },
  liveRoomForm: {
    return: 'Back',
    submit: 'Create Now',
    edit: 'Update',
    compliance: 'Please comply with relevant national regulations. It is prohibited to publish live content containing illegal, non-compliant, vulgar, violent, pornographic, or false promotional content. AI Live will monitor live content and may take actions such as removing or banning live content if violations are found.',
    broadcastFormat: 'Broadcast Format',
    broadcastFormatOptions: {
      live: 'Live',
      vod: 'VOD/Recorded',
      pseudo: 'Pseudo Live'
    },
    broadcastFormatTips: {
      live: 'Real-time live format, transmitted according to actual画面, cannot fast forward or rewind'
    },
    roomName: 'Live Room Name',
    roomNamePlaceholder: 'Please enter live room name, up to 100 characters',
    roomNameMaxLength: 'Live room name cannot exceed 100 characters',
    startTime: 'Start Time',
    coverImage: 'Live Cover',
    coverImageTips: 'Recommended image size: 1000*562, supports JPG and PNG formats',
    upload: 'Select Image',
    delete: 'Delete',
    replace: 'Replace',
    submitSuccess: 'Create successful',
    editSuccess: 'Update successful',
    submitError: 'Create failed',
    editError: 'Update failed',
    deleteCoverSuccess: 'Cover deleted',
    uploadSuccess: 'Upload successful',
    uploadError: 'Upload failed',
    validation: {
      required: 'Please select',
      roomName: 'Please enter live room name',
      startTime: 'Please select start time'
    }
  },
  liveRoomList: {
    createLiveRoom: 'Create Live Room',
    refresh: 'Refresh',
    batchDelete: 'Batch Delete',
    allFilters: 'All Filters',
    filterBy: 'Live Room',
    liveName: 'Live Room Name',
    liveId: 'Live Room ID',
    streamName: 'Stream Name',
    searchPlaceholder: 'Enter live room name',
    search: 'Search',
    id: 'ID',
    liveRoom: 'Live Room',
    broadcastFormat: 'Broadcast Format',
    liveStatus: 'Live Status',
    startTime: 'Start',
    operations: 'Operations',
    manage: 'Manage',
    preview: 'Preview',
    socialDistribution: 'Social Distribution',
    highlightClips: 'Highlight Clips',
    liveRecordings: 'Live Recordings',
    more: 'More',
    edit: 'Edit',
    delete: 'Delete',
    filters: {
      roomType: 'Room Type',
      broadcastFormat: 'Broadcast Format',
      liveStatus: 'Live Status',
      viewingMethod: 'Viewing Method'
    },
    viewingMethods: {
      public: 'Public',
      password: 'Password',
      pay: 'Paid'
    },
    roomTypes: {
      video: 'Video Live',
      image: 'Image Live',
      vr: 'VR Live',
      audio: 'Audio Live',
      graphic: 'Graphic Live'
    },
    broadcastFormats: {
      live: 'Live',
      vod: 'VOD/Recorded',
      pseudo: 'Pseudo Live'
    },
    statuses: {
      draft: 'Not Started',
      scheduled: 'Scheduled',
      live: 'Live',
      ended: 'Ended',
      archived: 'Archived'
    },
    batchDeleteConfirm: {
      title: 'Confirm Batch Delete',
      content: 'Are you sure you want to move the selected {count} live rooms to the recycle bin?',
      success: 'Successfully deleted {count} live rooms'
    },
    recycleConfirm: {
      title: 'Confirm Recycle',
      content: 'Are you sure you want to move the live room "{name}" to the recycle bin?',
      success: 'Moved to recycle bin',
      failed: 'Recycle failed'
    },
    messages: {
      featureDevelopment: 'Feature in development',
      share: 'Share feature in development',
      recommend: 'Recommend feature in development',
      tag: 'Tag feature in development',
      dataAnalysis: 'Data analysis feature in development',
      operationRecommend: 'Operation recommend feature in development',
      screenInteraction: 'Screen interaction feature in development',
      downloadPlayback: 'Download playback feature in development',
      setChannel: 'Set channel feature in development',
      adminMonitor: 'Admin monitor feature in development',
      copySuccess: 'Copy successful',
      copyFailed: 'Copy failed',
      liveStarted: 'Live has started',
      operationFailed: 'Operation failed',
      refreshPassword: {
        title: 'Refresh Password',
        content: 'Are you sure you want to refresh the viewing password for this live room?',
        success: 'Password has been refreshed to: {password}',
        failed: 'Failed to refresh password'
      },
      preview: {
        noPlayDomain: 'No play domain found, please add a play domain first',
        failed: 'Preview failed'
      },
      fetchData: 'Failed to fetch data',
      recycle: 'Recycle bin feature in development'
    }
  }
}
