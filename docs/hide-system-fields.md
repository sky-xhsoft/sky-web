# 隐藏系统字段功能说明

## 功能概述

在动态表单中，可以通过配置来控制是否显示系统字段（如 `CREATE_BY`、`CREATE_TIME`、`UPDATE_BY`、`UPDATE_TIME` 等）。

## 使用方法

### 1. 数据库配置

在 `sys_table` 表的 `PROPS` 字段中添加 `hideSystemFields` 配置：

```sql
UPDATE `sys_table`
SET `PROPS` = JSON_SET(
    COALESCE(`PROPS`, '{}'),
    '$.hideSystemFields',
    true
)
WHERE `NAME` = 'your_table_name';
```

### 2. 配置说明

- `hideSystemFields: true` - 隐藏系统字段
- `hideSystemFields: false` 或不配置 - 显示系统字段（默认行为）

### 3. 适用场景

适合隐藏系统字段的场景：

1. **审计日志表单** - 日志内容已包含操作人和时间信息
2. **只读数据展示** - 不需要关注数据维护信息
3. **简化表单** - 减少不必要的字段显示，提升用户体验

### 4. 实现原理

前端代码会读取表配置中的 `props.hideSystemFields` 属性，并传递给 `DynamicForm` 组件的 `showSystemFields` 属性：

```typescript
const showSystemFields = computed(() => {
  if (!tableConfig.value?.props) return true
  return !(tableConfig.value.props as any).hideSystemFields
})
```

## 示例

### 审计日志表配置

```sql
-- 隐藏审计日志表单的系统字段
UPDATE `sys_table`
SET `PROPS` = JSON_SET(
    COALESCE(`PROPS`, '{}'),
    '$.hideSystemFields',
    true
)
WHERE `NAME` = 'audit_log';
```

### 恢复显示系统字段

```sql
-- 恢复显示系统字段
UPDATE `sys_table`
SET `PROPS` = JSON_SET(
    COALESCE(`PROPS`, '{}'),
    '$.hideSystemFields',
    false
)
WHERE `NAME` = 'audit_log';
```

## 注意事项

1. 系统字段仍然会在后端处理，只是前端不显示
2. 修改配置后需要刷新页面才能生效
3. 该配置不影响列表页的字段显示，只影响表单页
