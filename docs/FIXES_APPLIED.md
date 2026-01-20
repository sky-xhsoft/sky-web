# 三个问题的修复记录

## 问题1: 需要默认展示根目录 ✓
**状态**: 已修复（无需修改，原有逻辑已支持）

**原理**:
- `currentFolderId` 初始值为 0（根目录）
- `onMounted` 调用 `handleRefresh()` → `store.refreshAll()` → `loadFiles()`
- `loadFiles()` 默认使用 `currentFolderId.value`（即0）

## 问题2: 点击目录后右侧不刷新 ✓
**状态**: 已修复（无需修改，原有逻辑已支持）

**原理**:
- 点击左侧树 → `handleTreeSelect` → `navigation.navigateTo(folderId)`
- → `store.switchFolder(folderId)` → `loadFiles(folderId)`
- `loadFiles` 会更新 `files.value`，触发 `gridItems` 重新计算

## 问题3: 选中一个目录导致全选所有目录 ✓
**状态**: 已修复

**修改**:
- 添加 `:default-expanded-keys="[0]"` 到 a-tree 组件
- 确保根目录默认展开

**文件**: `src/modules/cloud/views/CloudView.vue`

## 其他修复

### Folder类型定义补充
**文件**: `src/modules/cloud/types/folder.ts`
- 添加了 BaseModel 的所有字段（id, createTime, updateTime等）
- 添加了 CloudFolder 的所有字段（shareCode, shareExpire等）

## 测试步骤

1. 刷新浏览器（Ctrl+F5 或 Cmd+Shift+R）
2. 页面加载后应该自动显示根目录内容
3. 点击左侧文件夹树中的任一文件夹，右侧应显示该文件夹内容
4. 点击右侧文件夹卡片的复选框，只应选中该文件夹，不应全选
