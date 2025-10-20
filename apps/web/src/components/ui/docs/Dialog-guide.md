# Dialog 组件使用指南

`Dialog` 是一个功能丰富的 React 弹窗组件，用于在应用中显示模态对话框。它提供了丰富的自定义选项和内置的动画效果，适用于各种场景，如表单、确认框、信息展示等。

## 特性

- 响应式设计，适应各种屏幕尺寸
- 优雅的进入/退出动画
- 可自定义标题、内容和页脚
- 支持深色模式
- 自动管理页面滚动锁定
- 支持通过 Context API 访问对话框容器

## 安装

该组件位于 `apps/web/src/components/ui` 目录中：

```bash
# 项目内部直接使用，无需单独安装
import { Dialog } from '~/components/ui';
```

## 基本用法

### 导入

```typescript
import { Dialog } from '~/components/ui';
```

### 最简单的示例

```tsx
import React, { useState } from 'react';
import { Dialog } from '~/components/ui';

const SimpleDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开对话框</button>
      
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="简单对话框"
      >
        <p>这是对话框的内容。</p>
      </Dialog>
    </>
  );
};
```

### 带有页脚的对话框

```tsx
import React, { useState } from 'react';
import { Dialog } from '~/components/ui';

const DialogWithFooter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开对话框</button>
      
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="带页脚的对话框"
        footer={
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              取消
            </button>
            <button
              onClick={() => {
                alert('确认操作');
                setIsOpen(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              确认
            </button>
          </div>
        }
      >
        <p>这是对话框的内容，下方有操作按钮。</p>
      </Dialog>
    </>
  );
};
```

## Props API

`Dialog` 组件接受以下属性：

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `isOpen` | `boolean` | 必填 | 控制对话框是否显示 |
| `onClose` | `() => void` | 必填 | 关闭对话框的回调函数 |
| `title` | `React.ReactNode` | `undefined` | 对话框标题 |
| `children` | `React.ReactNode` | 必填 | 对话框内容 |
| `footer` | `React.ReactNode` | `undefined` | 对话框页脚 |
| `className` | `string` | `''` | 应用于对话框内容区域的额外 CSS 类 |
| `maxWidth` | `string` | `'max-w-[500px]'` | 对话框的最大宽度 (Tailwind 类) |
| `showCloseButton` | `boolean` | `true` | 是否显示关闭按钮 |

## 高级用法

### 自定义宽度

```tsx
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  title="宽对话框"
  maxWidth="max-w-4xl" // 使用 Tailwind 宽度类
>
  <div>
    这是一个较宽的对话框，适合显示表格或复杂内容。
  </div>
</Dialog>
```

### 使用 Dialog Context

`Dialog` 组件提供了一个 Context，允许子组件访问对话框的容器引用：

```tsx
import React, { useContext } from 'react';
import { Dialog, DialogContext } from '~/components/ui';

const DialogWithScrollToElement: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开对话框</button>
      
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="滚动示例"
      >
        <DialogContent />
      </Dialog>
    </>
  );
};

// 子组件可以访问对话框容器
const DialogContent: React.FC = () => {
  const { containerRef } = useContext(DialogContext);
  
  // 生成很长的内容，然后提供滚动到特定元素的功能
  return (
    <div>
      {/* 长内容... */}
      <div id="target-element">目标元素</div>
      {/* 更多内容... */}
      
      <button
        onClick={() => {
          const targetElem = document.getElementById('target-element');
          if (containerRef.current && targetElem) {
            targetElem.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        滚动到目标元素
      </button>
    </div>
  );
};
```

### 表单对话框

```tsx
import React, { useState } from 'react';
import { Dialog } from '~/components/ui';

interface FormData {
  name: string;
  email: string;
}

const FormDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' });
  
  const handleSubmit = () => {
    // 处理表单提交
    console.log('提交表单数据:', formData);
    setIsOpen(false);
  };
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开表单</button>
      
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="用户信息"
        footer={
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              提交
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">姓名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};
```

## 与 useModal Hook 配合使用

`Dialog` 组件设计为与 `useModal` 钩子无缝配合：

```tsx
import React from 'react';
import { Dialog } from '~/components/ui';
import { useModal } from '~/hooks';

interface UserData {
  id: string;
  name: string;
  email: string;
}

const UserManager: React.FC = () => {
  const userModal = useModal<UserData>();
  
  const handleEditUser = (user: UserData) => {
    userModal.openModal(user);
  };
  
  return (
    <div>
      <button onClick={() => handleEditUser({ id: '1', name: 'John', email: 'john@example.com' })}>
        编辑用户
      </button>
      
      {(userModal.isOpen || userModal.isClosing) && userModal.data && (
        <Dialog
          isOpen={userModal.isOpen}
          onClose={userModal.closeModal}
          title={`编辑用户: ${userModal.data.name}`}
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={userModal.closeModal}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 处理保存逻辑
                  userModal.closeModal();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          }
        >
          <div>
            <label className="block text-sm font-medium mb-1">姓名</label>
            <input 
              value={userModal.data.name} 
              onChange={(e) => userModal.setData({...userModal.data, name: e.target.value})}
              className="w-full p-2 border rounded"
            />
            {/* 更多表单字段 */}
          </div>
        </Dialog>
      )}
    </div>
  );
};
```

## 动画说明

`Dialog` 组件内部使用了 CSS 过渡动画：

1. 背景遮罩使用 `transition-opacity duration-300` 实现淡入淡出
2. 对话框内容使用 `transition-all duration-300` 实现移动和淡入淡出效果
3. 打开时，内容从下方移入（-20px → 0）
4. 关闭时，内容向下方移出（0 → 20px）

如果需要自定义动画效果，可以修改 `Dialog` 组件中的相关样式类。

## 可访问性考虑

`Dialog` 组件遵循基本的可访问性实践：

- 当对话框打开时，禁用背景内容的滚动
- 关闭按钮提供了明确的视觉提示
- 标题区域提供了明确的上下文

## 自定义样式

可以通过 `className` 属性自定义对话框的样式：

```tsx
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  className="bg-yellow-50 dark:bg-yellow-900" // 自定义背景色
  title="自定义样式"
>
  <div>使用自定义样式的对话框内容</div>
</Dialog>
```

## 深色模式支持

`Dialog` 组件通过 Tailwind 的 `dark:` 变体提供了完整的深色模式支持：

- 深色背景：`dark:bg-gray-800`
- 深色边框：`dark:border-gray-700`
- 深色文本：`dark:text-white`、`dark:text-gray-300` 等

确保您的应用程序正确配置了 Tailwind 的深色模式检测。

## 最佳实践

1. **简洁标题**：保持对话框标题简短明了
2. **合理宽度**：选择适合内容的最大宽度
3. **清晰操作**：在页脚中提供明确的操作按钮，通常包括"取消"和主要操作
4. **键盘支持**：确保可以通过键盘操作（如 ESC 键关闭对话框）
5. **嵌套对话框**：避免多层嵌套对话框，这会导致用户体验混乱

## 常见问题

### 对话框内容溢出？

确保内容区域设置了适当的溢出样式：

```tsx
<Dialog isOpen={isOpen} onClose={onClose} title="长内容">
  <div className="overflow-y-auto max-h-[60vh]">
    {/* 可能很长的内容 */}
  </div>
</Dialog>
```

### 对话框太窄/太宽？

使用 `maxWidth` 属性调整：

```tsx
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  maxWidth="max-w-6xl" // 更大的宽度
  title="宽对话框"
>
  {/* 宽内容，如表格 */}
</Dialog>
```

### 需要全屏对话框？

```tsx
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  maxWidth="max-w-full" // 最大宽度
  className="h-screen m-0 rounded-none" // 移除圆角和外边距
  title="全屏对话框"
>
  <div className="h-[calc(100vh-200px)]"> {/* 减去标题和页脚的高度 */}
    {/* 全屏内容 */}
  </div>
</Dialog>
```

### 动画不流畅？

如果动画看起来不流畅，可能是由于渲染性能问题，尝试优化内容渲染：

1. 减少对话框内的复杂组件
2. 使用 `React.memo` 包装复杂子组件
3. 延迟加载对话框内的复杂内容