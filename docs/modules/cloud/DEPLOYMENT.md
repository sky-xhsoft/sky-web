# 云盘模块部署指南

## 📋 部署步骤

### 1. 备份原文件

```bash
# 备份原 Cloud.vue
cp src/pages/Cloud.vue src/pages/Cloud.vue.backup
```

### 2. 替换主文件

```bash
# 使用新的轻量路由入口
mv src/pages/Cloud.new.vue src/pages/Cloud.vue
```

### 3. 验证TypeScript

```bash
# 检查TypeScript编译
npm run type-check
# 或
npx vue-tsc --noEmit
```

### 4. 运行开发服务器

```bash
npm run dev
```

### 5. 测试功能

访问 `http://localhost:5173/cloud`（或你的实际路由路径）

检查以下功能：
- ✅ 页面正常加载
- ✅ 文件夹树显示正常
- ✅ 文件列表显示正常
- ✅ 面包屑导航正常
- ✅ 搜索功能正常
- ✅ 排序功能正常
- ✅ 上传功能正常
- ✅ 下载功能正常
- ✅ 创建/删除/重命名文件夹正常
- ✅ 批量操作正常
- ✅ 分享管理正常

## 🔧 兼容性检查

### API兼容性

新模块使用的API与原模块完全兼容，因为：
1. 使用了兼容层 `src/api/cloud.ts` 重新导出
2. 所有API调用都经过类型检查

### 路由兼容性

新的 `Cloud.vue` 是一个轻量包装器，不影响现有路由配置。

### Store兼容性

新的 Pinia Store 不会与现有代码冲突，因为：
1. Store ID 为 `'cloud'`，独立命名空间
2. 不依赖其他Store

## ⚠️ 潜在问题

### 问题1: 样式冲突

**症状**: 组件样式显示异常

**解决**:
```bash
# 清除缓存
rm -rf node_modules/.vite
npm run dev
```

### 问题2: 类型错误

**症状**: TypeScript报错

**解决**:
1. 确保所有依赖已安装：`npm install`
2. 检查 `tsconfig.json` 中的 `paths` 配置
3. 重启TypeScript服务器（VSCode: `Ctrl+Shift+P` > Restart TS Server）

### 问题3: 上传失败

**症状**: 文件上传后端返回401/403

**解决**:
1. 检查token是否正确传递
2. 检查 `src/utils/request.ts` 中的拦截器
3. 确认后端API正常工作

### 问题4: 文件夹树不显示

**症状**: 左侧文件夹树为空

**解决**:
1. 检查API返回数据格式（应为 `Folder[]`）
2. 检查字段命名（PascalCase: `ID`, `FolderName`, `Children`）
3. 查看浏览器控制台错误

## 🚀 性能优化建议

### 1. 虚拟滚动（1000+文件场景）

如果文件数量超过1000个，建议添加虚拟滚动：

```bash
npm install vue-virtual-scroller
```

然后在 `CloudFileGrid.vue` 和 `CloudFileList.vue` 中集成。

### 2. 懒加载文件夹树

如果文件夹树层级很深，建议使用懒加载：

修改 `CloudView.vue` 中的 `<a-tree>` 组件，添加 `:load-more` 属性。

### 3. 图片懒加载

如果有很多图片文件，建议添加懒加载：

```bash
npm install vue-lazyload
```

### 4. 分页加载

如果单个文件夹文件很多，建议添加分页：

修改 `CloudFileGrid.vue` 和 `CloudFileList.vue`，添加分页组件。

## 📝 回滚步骤

如果遇到严重问题需要回滚：

```bash
# 1. 恢复原文件
cp src/pages/Cloud.vue.backup src/pages/Cloud.vue

# 2. 清除缓存
rm -rf node_modules/.vite

# 3. 重启开发服务器
npm run dev
```

## ✅ 部署检查清单

部署前确认：
- [ ] 所有TypeScript错误已解决
- [ ] 所有单元测试通过（`npm test`）
- [ ] 开发环境测试通过
- [ ] 备份已创建
- [ ] API文档已更新
- [ ] 用户文档已更新

部署后确认：
- [ ] 页面可正常访问
- [ ] 基本功能正常（上传、下载、创建、删除）
- [ ] 搜索和排序正常
- [ ] 批量操作正常
- [ ] 分享功能正常
- [ ] 性能无明显下降
- [ ] 控制台无错误
- [ ] 移动端显示正常

## 📞 支持

如遇到问题，请检查：
1. 浏览器控制台错误
2. 网络请求（Network面板）
3. Vue DevTools中的Store状态

---

**版本**: 1.0.0
**最后更新**: 2026-01-15
