# 菜单名称中文-英文翻译对照表

## 翻译规则

1. **系统类名称**: 使用 "Xxx System" 格式
2. **管理类名称**: 使用 "Xxx Management" 格式
3. **配置类名称**: 使用 "Xxx Config" 格式
4. **保持技术术语**: 如 SYS_, CLOUD_, LIVE_ 等前缀保留原样
5. **专有名词**: 如公司、用户等采用标准翻译

---

## sys_subsystem (一级菜单)

| 中文名称 | 英文名称 (ename) |
|---------|-----------------|
| 直播系统 | Live System |
| 云盘系统 | Cloud System |
| 系统管理 | System Management |
| 综合系统 | Comprehensive System |
| 元数据系统 | Metadata System |
| 权限系统 | Permission System |
| 配置系统 | Config System |
| 日志系统 | Log System |

---

## sys_table_category (二级菜单)

### 元数据配置类

| 中文名称 | 英文名称 (ename) |
|---------|-----------------|
| 表管理 | Table Management |
| 字段管理 | Column Management |
| 字典管理 | Dictionary Management |
| 序号管理 | Sequence Config |
| 表类别管理 | Table Category |
| 子系统管理 | Subsystem Config |
| 动作管理 | Action Management |
| 表命令管理 | Table Command |
| 界面配置 | UI Configuration |
| 元数据配置 | Metadata Config |

### 用户权限类

| 中文名称 | 英文名称 (ename) |
|---------|-----------------|
| 用户管理 | User Management |
| 权限管理 | Permission Management |
| 组管理 | Group Management |
| 目录管理 | Directory Management |
| 公司管理 | Company Management |

### 系统配置类

| 中文名称 | 英文名称 (ename) |
|---------|-----------------|
| 系统配置 | System Config |
| 基础配置 | Basic Config |
| 高级配置 | Advanced Config |
| 基础数据 | Basic Data |
| 业务配置 | Business Config |
| 系统设置 | System Settings |

---

## sys_table (三级菜单)

### SYS_ 系统表

| 表名 (NAME) | 中文显示名 (DISPLAY_NAME) | 英文名称 (ename) |
|------------|--------------------------|-----------------|
| SYS_USER | 用户管理 | User Management |
| SYS_GROUPS | 权限组管理 | Group Management |
| SYS_USER_GROUPS | 用户组关联 | User Group Association |
| SYS_GROUP_PREM | 权限组明细 | Permission Details |
| SYS_TABLE | 表定义管理 | Table Definition |
| SYS_COLUMN | 字段定义管理 | Column Definition |
| SYS_DICT | 字典管理 | Dictionary Management |
| SYS_DICT_ITEM | 字典明细 | Dictionary Item Details |
| SYS_SEQ | 序号配置 | Sequence Config |
| SYS_COMPANY | 公司管理 | Company Management |
| SYS_DIRECTORY | 目录管理 | Directory Management |
| SYS_TABLE_CATEGORY | 表类别管理 | Table Category |
| SYS_SUBSYSTEM | 子系统配置 | Subsystem Config |
| SYS_ACTION | 动作配置 | Action Config |
| SYS_TABLE_CMD | 表命令配置 | Table Command |
| SYS_OBJUICONF | 界面配置 | UI Configuration |
| SYS_LOG | 系统日志 | System Log |
| SYS_OPERATION_LOG | 操作日志 | Operation Log |
| SYS_LOGIN_LOG | 登录日志 | Login Log |

### CLOUD_ 云盘表

| 表名 (NAME) | 英文名称 (ename) |
|------------|-----------------|
| CLOUD_DISK | Cloud Disk |
| CLOUD_FILE | Cloud File |
| CLOUD_FOLDER | Cloud Folder |
| CLOUD_SHARE | Cloud Share |
| CLOUD_PERMISSION | Cloud Permission |
| CLOUD_RECYCLE | Cloud Recycle Bin |

### LIVE_ 直播表

| 表名 (NAME) | 英文名称 (ename) |
|------------|-----------------|
| LIVE_ROOM | Live Room Management |
| LIVE_DOMAIN | Live Domain |
| LIVE_PUSH_DOMAIN | Push Stream Domain |
| LIVE_PLAY_DOMAIN | Play Stream Domain |
| LIVE_STREAM_CONFIG | Live Stream Config |
| LIVE_RECORDING | Live Recording |
| LIVE_PLAYBACK | Live Playback |
| LIVE_PULL_TASK | Pull Stream Task |
| LIVE_TRANSCODE | Live Transcoding |
| LIVE_SCREENSHOT | Live Screenshot |

### 通用中文显示名翻译

| 中文关键词 | 英文翻译 |
|-----------|---------|
| 用户 | User |
| 权限 | Permission |
| 菜单 | Menu |
| 角色 | Role |
| 部门 | Department |
| 岗位 | Position |
| 字典 | Dictionary |
| 日志 | Log |
| 参数 | Parameter |
| 配置 | Config |
| 文件 | File |
| 附件 | Attachment |
| 公告 | Notice Announcement |
| 消息 | Message |

---

## 执行说明

### 1. 执行翻译脚本

```bash
mysql -u root -p skyserver < sky-server/sqls/migrations/20250425_update_menu_ename_translations.sql
```

### 2. 验证翻译结果

执行后可运行以下 SQL 验证：

```sql
-- 检查一级菜单翻译
SELECT '子系统' as 类型, NAME as 中文名称, ENAME as 英文名称 FROM sys_subsystem;

-- 检查二级菜单翻译
SELECT '表类别' as 类型, NAME as 中文名称, ENAME as 英文名称 FROM sys_table_category;

-- 检查三级菜单翻译（前50条）
SELECT '表单' as 类型, NAME as 表名, DISPLAY_NAME as 显示名, ENAME as 英文名称
FROM sys_table WHERE IS_MENU = 'Y' LIMIT 50;
```

### 3. 自定义修改

如果需要修改某些菜单的英文名称：

```sql
-- 修改单个菜单的英文名称
UPDATE sys_subsystem SET ENAME = 'Custom English Name' WHERE NAME = '中文名称';

-- 修改某个表的英文名称
UPDATE sys_table SET ENAME = 'Custom Table Name' WHERE NAME = 'SYS_XXX';
```

### 4. 新增菜单时

后续新增菜单时，记得同时配置中文和英文名称：

```sql
-- 新增子系统示例
INSERT INTO sys_subsystem (NAME, ENAME, ORDERNO, ...)
VALUES ('新功能模块', 'New Feature Module', 10, ...);
```
