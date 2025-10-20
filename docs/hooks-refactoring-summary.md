# Hooks 重组完成总结

## 概述

本次重组将项目中的 React Hooks 进行了全面的架构优化，实现了更清晰的职责分离和更统一的使用方式。

## 完成的工作

### 1. 钩子文件重组

#### 从 core 模块移出的钩子
- ❌ `apps/web/src/core/prompt/hooks/usePrompt.ts`  
  ✅ `apps/web/src/hooks/usePromptManager.ts`（重命名）

- ❌ `apps/web/src/core/prompt/hooks/useTemplates.ts`  
  ✅ `apps/web/src/hooks/usePromptTemplates.ts`（重命名）

- ❌ `apps/web/src/core/prompt/hooks/index.ts`（已删除）

#### 拆分的钩子文件
- ❌ `apps/web/src/hooks/model-hooks.ts`（已删除）  
  拆分为：
  - ✅ `apps/web/src/hooks/useModelConnection.ts`
  - ✅ `apps/web/src/hooks/useModelEditor.ts`（原 useModelEdit）
  - ✅ `apps/web/src/hooks/useModelData.ts`
  - ✅ `apps/web/src/hooks/useModelForm.ts`

#### 保留的 UI 工具钩子
- ✅ `apps/web/src/components/ui/hooks/useAutoscroll.ts`（保留原位）
- ✅ `apps/web/src/components/ui/hooks/useModal.ts`（保留原位）

### 2. 统一导出

创建了 `apps/web/src/hooks/index.ts`，统一导出所有钩子：

```typescript
// 提示词相关钩子
export { usePromptManager } from './usePromptManager';
export { usePromptTemplates } from './usePromptTemplates';

// 模型相关钩子
export { useModelConnection } from './useModelConnection';
export { useModelEditor } from './useModelEditor';
export { useModelData } from './useModelData';
export { useModelForm } from './useModelForm';

// UI 工具钩子（重新导出）
export { useAutoScroll } from '~/components/ui/hooks/useAutoscroll';
export { useModal } from '~/components/ui/hooks/useModal';
```

### 3. 更新所有引用

更新了以下文件的导入路径：

1. `IterationDialog.tsx` - 使用 `usePromptTemplates`
2. `PromptBooster.tsx` - 使用 `usePromptTemplates` 和 `usePromptManager`
3. `PromptHistory.tsx` - 使用 `usePromptManager`
4. `RefreshDetector.tsx` - 使用 `usePromptManager`
5. `TestResult.tsx` - 使用 `usePromptManager` 和 `useModelData`
6. `ModelSettings.tsx` - 使用 `useModelConnection`、`useModelData`、`useModelEditor`、`useModal`
7. `ModelModal.tsx` - 使用 `useModelForm`

### 4. 文档更新

#### 新增文档
- ✅ `docs/hooks-architecture.md` - 完整的 Hooks 架构说明文档

#### 更新文档
- ✅ `docs/architecture-design.md` - 更新了架构说明，添加了 Hooks 目录结构
- ✅ `apps/web/src/components/ui/docs/Dialog-guide.md` - 更新了导入路径示例
- ✅ `apps/web/src/components/ui/docs/useModal-guide.md` - 更新了导入路径说明

### 5. 构建测试

✅ 运行 `pnpm build` 测试通过，所有包构建成功  
✅ 运行 `pnpm dev` 测试通过，开发服务器正常启动

## 架构改进

### 之前的问题
1. Hooks 散落在不同目录，缺乏统一管理
2. core 模块包含 React Hooks，违反了纯业务逻辑的定位
3. 多个钩子混在一个文件中，职责不清晰
4. 导入路径不统一，难以维护

### 现在的优势
1. **清晰的职责分离**
   - `apps/web/src/core/` - 纯业务逻辑，不包含 React Hooks
   - `apps/web/src/hooks/` - 应用层钩子，依赖业务逻辑和 React Context
   - `apps/web/src/components/ui/hooks/` - 纯 UI 工具钩子

2. **统一的导入方式**
   ```typescript
   // 所有钩子都可以从统一入口导入
   import { usePromptManager, useModal, useModelData } from '~/hooks';
   ```

3. **单一职责原则**
   - 每个钩子文件只负责一个明确的功能
   - 更易于理解、测试和维护

4. **更好的命名**
   - `usePrompt` → `usePromptManager`（更明确）
   - `useTemplates` → `usePromptTemplates`（更具体）
   - `useModelEdit` → `useModelEditor`（统一风格）

## 钩子分类

### 业务钩子（apps/web/src/hooks/）
1. **usePromptManager** - 提示词管理（组、版本、增强、迭代）
2. **usePromptTemplates** - 模板管理和本地化
3. **useModelConnection** - 模型连接测试
4. **useModelEditor** - 模型配置保存
5. **useModelData** - 模型数据和状态管理
6. **useModelForm** - 模型表单状态

### UI 工具钩子（apps/web/src/components/ui/hooks/）
1. **useAutoScroll** - 自动滚动逻辑
2. **useModal** - 模态框状态管理

## 迁移指南

如果有旧代码需要迁移，请参考以下对照：

| 旧导入路径 | 新导入路径 | 备注 |
|-----------|-----------|------|
| `~/core/prompt/hooks/usePrompt` | `~/hooks` 导出 `usePromptManager` | 重命名 |
| `~/core/prompt/hooks/useTemplates` | `~/hooks` 导出 `usePromptTemplates` | 重命名 |
| `../hooks/model-hooks` 中的 `useModelEdit` | `~/hooks` 导出 `useModelEditor` | 重命名 |
| `../hooks/model-hooks` 中的其他 hooks | `~/hooks` 导出 | 拆分 |
| `~/components/ui/hooks/useModal` | `~/hooks` 导出 `useModal` | 可统一导入 |

## 后续建议

1. ✅ 所有新的业务钩子应放在 `apps/web/src/hooks/` 目录
2. ✅ 所有新的 UI 工具钩子应放在 `apps/web/src/components/ui/hooks/` 目录
3. ✅ 使用统一的 `~/hooks` 导入路径
4. ⚠️ 为重要的业务钩子编写单元测试
5. ⚠️ 保持文档与代码同步

## 验证清单

- [x] 所有钩子文件已移动/创建
- [x] 旧文件已删除
- [x] 所有引用已更新
- [x] 统一导出文件已创建
- [x] 构建测试通过
- [x] 开发服务器正常运行
- [x] 架构文档已更新
- [x] 组件使用文档已更新
- [x] Hooks 架构文档已创建

## 相关文档

- [Hooks 架构说明](./hooks-architecture.md) - 详细的架构和使用指南
- [架构设计文档](./architecture-design.md) - 项目整体架构
- [Dialog 组件使用指南](../apps/web/src/components/ui/docs/Dialog-guide.md)
- [useModal Hook 使用指南](../apps/web/src/components/ui/docs/useModal-guide.md)

---

**重组完成时间**: 2025-10-20  
**影响范围**: 所有使用 Hooks 的组件  
**破坏性变更**: 是（需要更新导入路径）  
**向后兼容**: 否（旧的导入路径已不可用）
