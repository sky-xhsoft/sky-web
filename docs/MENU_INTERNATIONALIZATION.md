# 菜单国际化功能实现说明

## 概述

本功能为系统菜单添加了英文名称字段支持，实现了中英文切换时菜单名称的自动切换。

## 后端实现

### 1. 数据库结构变更

**SQL迁移文件:** `sky-server/sqls/migrations/20250425_add_menu_ename_field.sql`

为三张菜单表添加 ENAME 字段：

- **sys_subsystem**（一级菜单）
- **sys_table_category**（二级菜单）
- **sys_table**（三级菜单）

```sql
ALTER TABLE sys_subsystem ADD COLUMN ENAME VARCHAR(255) COMMENT '英文名称' AFTER NAME;
ALTER TABLE sys_table_category ADD COLUMN ENAME VARCHAR(255) COMMENT '英文名称' AFTER NAME;
ALTER TABLE sys_table ADD COLUMN ENAME VARCHAR(255) COMMENT '英文名称' AFTER DISPLAY_NAME;
```

### 2. 实体模型变更

**文件:** `sky-server/internal/model/entity/menu.go`

- `MenuNode`: 新增 `ename` 字段
- `SysSubsystem`: 新增 `ENAME` 字段
- `SysTableCategory`: 新增 `ENAME` 字段

**文件:** `sky-server/internal/model/entity/sys_table.go`

- `SysTable`: 新增 `ENAME` 字段

### 3. 菜单服务变更

**文件:** `sky-server/internal/service/menu/menu_service.go`

在 `buildMenuTree` 函数中，构建菜单节点时将 `ename` 字段传递到前端：

```go
&entity.MenuNode{
    ID:       subsystem.ID,
    Name:     subsystem.Name,
    EName:    subsystem.EName,  // 新增
    ...
}
```

## 前端实现

### 1. API 类型更新

**文件:** `sky-web/src/api/menu.ts`

```typescript
export type MenuTreeNode = {
  id: number
  name: string
  ename?: string       // 英文名称（新增）
  displayName?: string
  ...
}
```

### 2. BasicLayout 菜单渲染

**文件:** `sky-web/src/layouts/BasicLayout.vue`

- 导入 `useI18n` 钩子
- `mapMenu` 函数根据当前语言选择显示名称：
  - 英文: 使用 `ename` 字段
  - 中文: 使用 `displayName` / `name` 字段

```typescript
title: locale.value === 'en-US'
  ? (item.ename || item.displayName || item.name || 'Untitled')
  : (item.title || item.displayName || item.menuName || item.name || '未命名')
```

### 3. SystemManagement 页面国际化

**文件:** `sky-web/src/pages/SystemManagement.vue`

- 系统架构说明国际化
- 功能模块分类显示国际化
- 使用流程说明国际化

## 使用方法

### 1. 数据库迁移

执行 SQL 脚本为数据库表添加 ENAME 字段：

```bash
mysql -u root -p skyserver < sky-server/sqls/migrations/20250425_add_menu_ename_field.sql
```

### 2. 配置菜单英文名称

在数据库中更新各菜单的英文名称：

```sql
-- 子系统（一级菜单）
UPDATE sys_subsystem SET ENAME = 'Live System' WHERE NAME = '直播系统';
UPDATE sys_subsystem SET ENAME = 'Cloud System' WHERE NAME = '云盘系统';
UPDATE sys_subsystem SET ENAME = 'System Management' WHERE NAME = '系统管理';

-- 表类别（二级菜单）
UPDATE sys_table_category SET ENAME = 'User Management' WHERE NAME = '用户管理';

-- 表（三级菜单）
UPDATE sys_table SET ENAME = 'User Management' WHERE NAME = 'SYS_USER';
```

### 3. 语言切换

用户通过个人中心页面的语言切换功能，选择中文或英文后，菜单名称会自动切换为对应语言。

## 注意事项

1. **字段优先级**:
   - 英文模式下优先显示 `ename`，如果为空则回退到 `displayName` / `name`
   - 中文模式下优先显示 `displayName`，如果为空则回退到 `name`

2. **数据库迁移**:
   - 生产环境执行迁移脚本前请先备份数据库
   - 确认现有菜单数据已正确配置英文名称

3. **新菜单添加**:
   - 后续新增菜单时，需同时配置中文 `name` 和英文 `ename` 两个字段
