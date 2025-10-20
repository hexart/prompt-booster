# useModal Hook 使用指南

`useModal` 是一个自定义 React 钩子（Hook），用于管理弹窗（Modal/Dialog）的状态。它提供了一个简洁且统一的方式来处理弹窗的打开、关闭以及相关数据的管理。

## 特性

- 统一管理弹窗开关状态
- 支持弹窗关闭动画
- 类型安全的数据管理
- 自动清理弹窗数据

## 安装

该钩子位于 `apps/web/src/hooks` 目录中，可以直接使用：

```bash
import { useModal } from '~/hooks';
```

## 基本用法

### 导入

```typescript
import { useModal } from '~/hooks';
```

### 基础示例

```typescript
import React from 'react';
import { useModal } from '~/hooks';
import { Dialog } from '~/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
}

const UserManager: React.FC = () => {
  // 创建一个带有类型的 modal 状态管理器
  const userModal = useModal<User>();
  
  // 打开弹窗并传入数据
  const handleEditUser = (user: User) => {
    userModal.openModal(user);
  };
  
  return (
    <div>
      <button onClick={() => handleEditUser({ id: '1', name: 'John', email: 'john@example.com' })}>
        编辑用户
      </button>
      
      {/* 渲染弹窗 - 注意检查 isOpen 或 isClosing 以及 data 是否存在 */}
      {(userModal.isOpen || userModal.isClosing) && userModal.data && (
        <Dialog
          isOpen={userModal.isOpen}
          onClose={userModal.closeModal}
          title="编辑用户"
        >
          <div>
            <input 
              value={userModal.data.name} 
              onChange={(e) => userModal.setData({...userModal.data, name: e.target.value})}
            />
            {/* 更多表单元素 */}
          </div>
        </Dialog>
      )}
    </div>
  );
};
```

## API 参考

### 返回值

`useModal<T>()` 返回一个包含以下属性和方法的对象：

| 属性/方法 | 类型 | 描述 |
|-----------|------|------|
| `isOpen` | `boolean` | 弹窗是否处于打开状态 |
| `isClosing` | `boolean` | 弹窗是否正在关闭（动画过程中） |
| `data` | `T \| null` | 与弹窗相关的数据 |
| `openModal` | `(data: T) => void` | 打开弹窗并设置相关数据 |
| `closeModal` | `() => void` | 关闭弹窗（会先触发动画，然后清理数据） |
| `setData` | `(data: T \| null) => void` | 直接更新弹窗数据 |

## 高级用法

### 管理多个弹窗

可以创建多个 `useModal` 实例来管理不同的弹窗：

```typescript
const editModal = useModal<EditData>();
const deleteModal = useModal<DeleteData>();
const previewModal = useModal<PreviewData>();
```

### 嵌套弹窗

支持嵌套弹窗的场景，每个弹窗都有自己独立的状态：

```typescript
const mainModal = useModal<MainData>();
const subModal = useModal<SubData>();

// 在主弹窗中打开子弹窗
const openSubModalFromMain = () => {
  subModal.openModal({ /* 子弹窗数据 */ });
};
```

### 动态更新弹窗数据

```typescript
// 更新部分数据
const updateModalData = (newName: string) => {
  if (userModal.data) {
    userModal.setData({
      ...userModal.data,
      name: newName
    });
  }
};
```

## 动画说明

`useModal` 钩子内部管理了一个 `isClosing` 状态，用于处理弹窗关闭动画：

1. 调用 `closeModal()` 时，`isOpen` 立即设置为 `false`，`isClosing` 设置为 `true`
2. 在 350ms 后（对应 CSS 动画时长），`data` 被清空，`isClosing` 设置为 `false`

这允许你在组件中实现平滑的关闭动画：

```typescript
{(modal.isOpen || modal.isClosing) && modal.data && (
  <Dialog
    isOpen={modal.isOpen} // 这控制了实际的动画状态
    onClose={modal.closeModal}
    // ...其他属性
  >
    {/* 弹窗内容 */}
  </Dialog>
)}
```

## 最佳实践

1. **类型安全**：始终为 `useModal<T>()` 提供适当的类型参数
2. **条件渲染**：使用 `(isOpen || isClosing) && data` 确保仅在有数据时渲染弹窗
3. **数据初始化**：使用 `openModal` 传入完整的初始数据
4. **组件化**：为常用弹窗创建专门的组件，然后在其中使用 `useModal`

## 与 Dialog 组件配合使用

`useModal` 钩子设计为与 `Dialog` 组件无缝配合：

```typescript
import { useModal } from '~/hooks';
import { Dialog } from '~/components/ui';

const modal = useModal<{ title: string; content: string }>();

// 在组件中
return (
  <>
    <button onClick={() => modal.openModal({ title: '通知', content: '这是一条重要消息' })}>
      显示通知
    </button>
    
    {(modal.isOpen || modal.isClosing) && modal.data && (
      <Dialog
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        title={modal.data.title}
      >
        <div>{modal.data.content}</div>
      </Dialog>
    )}
  </>
);
```

这种模式让弹窗管理变得简单而强大，特别适合需要频繁展示不同弹窗的复杂应用。

## 常见问题

### 弹窗未显示？

- 检查 `isOpen || isClosing` 条件是否正确
- 确认 `data` 不为 `null`
- 确保正确调用了 `openModal` 方法

### 弹窗数据未更新？

- 使用 `setData` 而不是直接修改 `data`
- 确保在更新时保留了未修改的字段（使用扩展运算符 `...`）

### 弹窗关闭太快或太慢？

内部的超时设置为 350ms，与 Dialog 组件的动画持续时间匹配。如需调整，请修改 `useModal` 的实现。