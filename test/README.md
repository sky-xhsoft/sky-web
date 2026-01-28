# Sky-Web 测试目录

> **版本**: v1.0
> **最后更新**: 2026-01-28
> **维护者**: Sky Team

---

## 📁 目录结构

```
test/
├── setup.ts              # Vitest 测试全局配置
├── unit/                 # 单元测试（暂无）
└── manual/               # 手动测试脚本
    ├── test-cloud-module.js        # 云盘模块测试脚本
    ├── test-cloud-module.mjs       # 云盘模块测试脚本（ES Module）
    ├── test-company-form.js        # 公司表单测试脚本
    └── test_folder_display.html    # 文件夹显示测试页面
```

---

## 🧪 测试类型

### 1. 单元测试 (Unit Tests)

**目录**: `test/unit/`

**框架**: Vitest + Vue Test Utils

**运行命令**:
```bash
# 运行所有单元测试
npm run test

# 运行测试 UI 界面
npm run test:ui

# 运行测试并生成覆盖率报告
npm run test -- --coverage
```

**配置文件**:
- `vitest.config.ts` - Vitest 配置
- `test/setup.ts` - 测试全局设置和 mock

**说明**:
- 目前单元测试主要集中在云盘模块
- 使用 Vitest 作为测试框架
- 使用 Vue Test Utils 进行组件测试
- 使用 happy-dom 作为测试环境

### 2. 手动测试脚本 (Manual Tests)

**目录**: `test/manual/`

**说明**:
- 包含用于手动测试的脚本和页面
- 主要用于开发阶段的功能验证
- 不会在自动化测试中运行

**文件说明**:

1. **test-cloud-module.js** / **test-cloud-module.mjs**
   - 云盘模块功能测试脚本
   - 用于测试云盘的上传、下载、分享等功能

2. **test-company-form.js**
   - 公司表单测试脚本
   - 用于测试公司信息表单的各项功能

3. **test_folder_display.html**
   - 文件夹显示测试页面
   - 用于测试文件夹树形结构的显示

---

## 📝 编写测试

### 单元测试示例

```typescript
// test/unit/components/MyComponent.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Hello World'
      }
    })
    expect(wrapper.text()).toContain('Hello World')
  })
})
```

### 测试命名规范

- 测试文件命名: `*.spec.ts` 或 `*.test.ts`
- 测试文件位置: 与被测试文件相同的目录结构
- 测试描述: 使用清晰的描述性语言

---

## 🔧 测试配置

### Vitest 配置

配置文件: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### 全局 Mock

在 `test/setup.ts` 中配置了以下全局 mock:

- Arco Design 组件 stub
- Arco Design Message API
- Arco Design Modal API

---

## 📊 测试覆盖率

运行测试覆盖率:

```bash
npm run test -- --coverage
```

覆盖率报告将生成在 `coverage/` 目录中。

---

## 🎯 测试最佳实践

1. **测试独立性**: 每个测试应该独立运行，不依赖其他测试
2. **清晰的描述**: 使用清晰的 describe 和 it 描述
3. **AAA 模式**: Arrange（准备）、Act（执行）、Assert（断言）
4. **Mock 外部依赖**: 使用 mock 隔离外部依赖
5. **测试边界情况**: 不仅测试正常情况，也要测试边界和异常情况

---

## 📚 相关文档

- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils 文档](https://test-utils.vuejs.org/)
- [测试结果文档](../docs/TEST_DOCUMENTATION.md)

---

**文档版本**: v1.0
**最后更新**: 2026-01-28
**维护者**: Sky Team
