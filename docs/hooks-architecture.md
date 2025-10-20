# Hooks 架构说明

本文档说明 Prompt Booster 项目中 React Hooks 的组织架构和使用规范。

## 架构原则

项目遵循清晰的分层架构，将 Hooks 按功能和依赖关系分为两类：

1. **UI 工具 Hooks**：纯粹的 UI 交互逻辑，不依赖业务上下文
2. **业务 Hooks**：依赖业务逻辑、i18n、状态管理等上下文的 Hooks

## 目录结构

```
apps/web/src/
├── hooks/                          # 业务和应用层 Hooks
│   ├── usePromptManager.ts         # 提示词管理
│   ├── usePromptTemplates.ts       # 提示词模板
│   ├── useModelConnection.ts       # 模型连接测试
│   ├── useModelEditor.ts           # 模型编辑
│   ├── useModelData.ts             # 模型数据管理
│   ├── useModelForm.ts             # 模型表单状态
│   └── index.ts                    # 统一导出（包含 UI 工具 Hooks 的重新导出）
│
├── components/ui/hooks/            # UI 工具 Hooks（保留在 UI 层）
│   ├── useAutoscroll.ts            # 自动滚动逻辑
│   ├── useModal.ts                 # 模态框状态管理
│   └── index.ts                    # UI Hooks 导出
│
└── core/                           # 纯业务逻辑（不包含 React Hooks）
    ├── model/
    ├── prompt/
    ├── storage/
    └── utils/
```

## Hooks 分类说明

### 1. 提示词相关 Hooks

位置：`apps/web/src/hooks/`

#### usePromptManager

提示词管理的核心 Hook，提供：
- 提示词组管理
- 版本控制
- 增强和迭代操作
- 历史记录加载

```typescript
import { usePromptManager } from '~/hooks';

const {
  activeGroup,
  activeVersion,
  isProcessing,
  enhancePrompt,
  iteratePrompt,
  // ... 更多方法
} = usePromptManager();
```

#### usePromptTemplates

提示词模板管理 Hook，提供：
- 模板加载和本地化
- 模板选项获取
- 按类型筛选模板

```typescript
import { usePromptTemplates } from '~/hooks';

const {
  displayTemplates,
  isTemplatesLoading,
  getOptimizeTemplateOptions,
  getActualTemplateId,
} = usePromptTemplates();
```

### 2. 模型相关 Hooks

位置：`apps/web/src/hooks/`

#### useModelConnection

模型连接测试 Hook，提供：
- 连接测试功能
- 测试状态管理
- 错误处理和国际化提示

```typescript
import { useModelConnection } from '~/hooks';

const { testConnection, isTestingConnection } = useModelConnection();
```

#### useModelEditor

模型配置编辑 Hook，提供：
- 保存模型配置
- 新增/更新自定义接口
- 错误处理和提示

```typescript
import { useModelEditor } from '~/hooks';

const { saveModel } = useModelEditor();
```

#### useModelData

模型数据管理 Hook，提供：
- 模型列表获取（包含 RTL 格式化）
- 启用/禁用模型
- 删除自定义接口
- 活动模型管理

```typescript
import { useModelData } from '~/hooks';

const {
  allModels,
  getEnabledModels,
  toggleModelStatus,
  deleteModel,
  activeModel,
  setActiveModel,
} = useModelData();
```

#### useModelForm

模型表单状态管理 Hook，提供：
- 表单数据状态
- API Key 显示/隐藏
- 输入变化处理
- 表单初始化

```typescript
import { useModelForm } from '~/hooks';

const {
  formData,
  isMaskedApiKey,
  handleInputChange,
  showApiKey,
  hideApiKey,
} = useModelForm(initialData);
```

### 3. UI 工具 Hooks

位置：`apps/web/src/components/ui/hooks/`（也可通过 `~/hooks` 统一导入）

#### useAutoScroll

自动滚动管理 Hook，提供：
- 自动滚动到底部
- 检测用户手动滚动
- 显示滚动按钮控制

```typescript
import { useAutoScroll } from '~/hooks';
// 或
import { useAutoScroll } from '~/components/ui/hooks';

const {
  elementRef,
  scrollToBottom,
  shouldShowButton,
  userScrolled,
} = useAutoScroll({
  threshold: 5,
  streaming: true,
});
```

#### useModal

模态框状态管理 Hook，提供：
- 打开/关闭状态
- 关闭动画支持
- 类型安全的数据管理

```typescript
import { useModal } from '~/hooks';
// 或
import { useModal } from '~/components/ui/hooks';

const {
  isOpen,
  isClosing,
  data,
  openModal,
  closeModal,
  setData,
} = useModal<UserData>();
```

## 使用规范

### 1. 统一导入

推荐从 `~/hooks` 统一导入所有 Hooks：

```typescript
import {
  usePromptManager,
  usePromptTemplates,
  useModelConnection,
  useModelEditor,
  useModelData,
  useModelForm,
  useAutoScroll,
  useModal,
} from '~/hooks';
```

### 2. 类型安全

所有 Hooks 都提供完整的 TypeScript 类型支持，使用时充分利用类型推断：

```typescript
// 为泛型 Hook 提供类型参数
const modal = useModal<UserData>();

// 利用返回值类型
const { enhancePrompt }: UsePromptManagerResult = usePromptManager();
```

### 3. 依赖 i18n 的 Hooks

以下 Hooks 依赖 i18n，需要在 i18n 初始化后使用：
- `usePromptTemplates`
- `useModelConnection`
- `useModelEditor`
- `useModelData`

### 4. 性能优化

所有 Hooks 内部已经使用了适当的优化措施（`useCallback`、`useMemo` 等），直接使用即可。

## 迁移说明

### 从旧版本迁移

如果你的代码中使用了旧的导入路径，请按以下方式更新：

```typescript
// ❌ 旧的导入方式
import { usePrompt } from '~/core/prompt/hooks/usePrompt';
import { useTemplates } from '~/core/prompt/hooks/useTemplates';
import { useModelConnection, useModelData, useModelEdit } from '../hooks/model-hooks';

// ✅ 新的导入方式
import {
  usePromptManager,      // 原 usePrompt
  usePromptTemplates,    // 原 useTemplates
  useModelConnection,
  useModelData,
  useModelEditor,        // 原 useModelEdit
} from '~/hooks';
```

### Hook 重命名对照表

| 旧名称 | 新名称 | 说明 |
|--------|--------|------|
| `usePrompt` | `usePromptManager` | 更清晰地表达管理职责 |
| `useTemplates` | `usePromptTemplates` | 明确是提示词模板 |
| `useModelEdit` | `useModelEditor` | 统一命名风格 |

## 最佳实践

1. **单一职责**：每个 Hook 只负责一个明确的功能领域
2. **避免重复**：通过统一导出避免在多个地方重复导入
3. **类型优先**：充分利用 TypeScript 类型系统
4. **文档同步**：修改 Hook 时同步更新相关文档
5. **测试覆盖**：为业务 Hooks 编写单元测试

## 扩展指南

### 添加新的 Hook

1. 确定 Hook 的分类（UI 工具 or 业务）
2. 在对应目录创建文件
3. 在 `index.ts` 中添加导出
4. 更新本文档

### Hook 开发规范

```typescript
// apps/web/src/hooks/useExample.ts

/**
 * Example Hook 说明
 * 功能描述...
 */
export function useExample() {
  // 1. 状态定义
  const [state, setState] = useState();
  
  // 2. 副作用
  useEffect(() => {
    // ...
  }, []);
  
  // 3. 回调函数（使用 useCallback）
  const handler = useCallback(() => {
    // ...
  }, []);
  
  // 4. 计算值（使用 useMemo）
  const computed = useMemo(() => {
    // ...
  }, []);
  
  // 5. 返回清晰的接口
  return {
    state,
    handler,
    computed,
  };
}
```

## 相关文档

- [Dialog 组件使用指南](../apps/web/src/components/ui/docs/Dialog-guide.md)
- [useModal Hook 使用指南](../apps/web/src/components/ui/docs/useModal-guide.md)
- [架构设计文档](./architecture-design.md)
