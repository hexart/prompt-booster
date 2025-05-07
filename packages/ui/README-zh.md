# Prompt Booster UI 组件库

[English](README.md)

## 概述

Prompt Booster UI 库提供了一套专为提示工程和优化应用而设计的完整 React 组件集。该库提供从基本 UI 元素到专业提示编辑组件的各种组件，并完全支持浅色和深色主题。

## 安装

```bash
# 使用 npm
npm install @prompt-booster/ui

# 使用 yarn
yarn add @prompt-booster/ui

# 使用 pnpm
pnpm add @prompt-booster/ui
```

## 依赖项

该库有以下对等依赖：

```json
"peerDependencies": {
  "lucide-react": "^0.488.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-hotkeys-hook": "^5.0.1",
  "@tailwindcss/vite": "^4.1.4",
  "tailwindcss": "^4.1.4",
  "tailwindcss-animate": "^1.0.7"
}
```

确保这些依赖项已在您的项目中安装。

## 核心组件

### 显示组件

#### `AutoScrollContent`

具有自动滚动功能的内容显示组件，特别适用于流式内容。

```jsx
import { AutoScrollContent } from '@prompt-booster/ui';

<AutoScrollContent
  content="这是一些示例内容。"
  streaming={true}
  enableMarkdown={true}
  allowHtml={false}
  showCopyButton={true}
  placeholder="没有内容可显示"
/>
```

属性：

- `content`：要显示的文本内容
- `streaming`：内容是否正在流式传输
- `enableMarkdown`：是否渲染 Markdown
- `allowHtml`：Markdown 中是否允许 HTML
- `showCopyButton`：是否显示复制按钮
- `placeholder`：内容为空时显示的文本

#### `Markdown`

带有语法高亮和专门处理"思考"块的 Markdown 渲染器。

```jsx
import { Markdown } from '@prompt-booster/ui';

<Markdown
  content="# 你好世界\n这是一个**Markdown**示例。"
  allowHtml={false}
  streaming={false}
/>
```

属性：

- `content`：要渲染的 Markdown 内容
- `allowHtml`：Markdown 中是否允许 HTML
- `streaming`：内容是否正在流式传输
- `className`：额外的 CSS 类
- `style`：内联样式

### 输入组件

#### `AutoScrollTextarea`

具有自动滚动功能的文本区域组件，适合内容持续添加的输入字段。

```jsx
import { AutoScrollTextarea } from '@prompt-booster/ui';

<AutoScrollTextarea
  value={inputValue}
  onChange={handleChange}
  streaming={false}
  placeholder="输入您的提示..."
  showCopyButton={true}
  centerPlaceholder={true}
/>
```

属性：

- `value`：文本区域内容
- `onChange`：变更处理函数
- `streaming`：内容是否正在流式传输
- `showCopyButton`：是否显示复制按钮
- `centerPlaceholder`：是否居中显示占位符
- `placeholder`：占位符文本

#### `EnhancedTextarea`

具有字符计数和复制功能的功能丰富的文本区域组件。

```jsx
import { EnhancedTextarea } from '@prompt-booster/ui';

<EnhancedTextarea
  value={text}
  onChange={handleChange}
  placeholder="输入文本..."
  rows={5}
  showCharCount={true}
  maxLength={1000}
  label="描述"
/>
```

属性：

- `value`：文本区域内容
- `onChange`：变更处理函数
- `placeholder`：占位符文本
- `rows`：可见行数
- `showCharCount`：是否显示字符计数
- `maxLength`：最大允许字符数
- `label`：文本区域的标签文本

#### `EnhancedDropdown`

带有搜索和键盘导航功能的下拉组件。

```jsx
import { EnhancedDropdown } from '@prompt-booster/ui';

const options = [
  { value: 'option1', label: '选项 1' },
  { value: 'option2', label: '选项 2' }
];

<EnhancedDropdown
  options={options}
  value={selectedValue}
  onChange={handleChange}
  placeholder="选择一个选项"
/>
```

属性：

- `options`：包含 value 和 label 的选项对象数组
- `value`：当前选中的值
- `onChange`：变更处理函数
- `placeholder`：占位符文本
- `disabled`：下拉列表是否禁用

#### `ModelSelector`

专门用于选择 AI 模型的带有搜索功能的下拉组件。

```jsx
import { ModelSelector } from '@prompt-booster/ui';

<ModelSelector
  value={selectedModel}
  onChange={setSelectedModel}
  fetchModels={fetchModelsFunction}
  placeholder="选择一个模型"
/>
```

属性：

- `value`：当前选中的模型 ID
- `onChange`：变更处理函数
- `fetchModels`：返回解析为模型选项的 Promise 的函数
- `placeholder`：占位符文本
- `onFetch`：模型获取完成时的回调

### 对话框和模态组件

#### `Dialog`

具有动画和 portal 渲染的可自定义对话框/模态组件。

```jsx
import { Dialog } from '@prompt-booster/ui';

<Dialog
  isOpen={isDialogOpen}
  onClose={closeDialog}
  title="对话框标题"
  footer={<div>对话框页脚</div>}
  maxWidth="max-w-2xl"
>
  <div>对话框内容放在这里</div>
</Dialog>
```

属性：

- `isOpen`：对话框是否可见
- `onClose`：对话框应关闭时调用的函数
- `title`：对话框标题
- `children`：对话框内容
- `footer`：可选的页脚内容
- `maxWidth`：最大宽度（Tailwind 类）
- `showCloseButton`：是否显示关闭按钮

#### `DraggableNotice`

用于显示重要消息的可拖动通知组件。

```jsx
import { DraggableNotice } from '@prompt-booster/ui';

const items = [
  { text: "需要 API 密钥", isNeeded: true },
  { text: "选择一个模型", isNeeded: true }
];

<DraggableNotice
  items={items}
  title="必要步骤"
  onClose={handleClose}
/>
```

属性：

- `items`：包含 text 和 isNeeded 标志的通知项数组
- `title`：通知标题
- `onClose`：通知关闭时调用的函数
- `initialPosition`：具有 x 和 y 坐标的初始位置对象
- `className`：额外的 CSS 类

### 主题组件

#### `ThemeProvider`

主题上下文的提供者组件。

```jsx
import { ThemeProvider } from '@prompt-booster/ui';

<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>
```

属性：

- `defaultTheme`：默认主题（'light'、'dark' 或 'system'）
- `storageKey`：在 localStorage 中存储主题偏好的键
- `children`：应用程序组件

#### `ThemeSwitcher`

用于在浅色、深色和系统主题之间切换的组件。

```jsx
import { ThemeSwitcher } from '@prompt-booster/ui';

<ThemeSwitcher
  iconSize={20}
  enableHotkeys={true}
/>
```

属性：

- `iconSize`：主题图标的大小
- `enableHotkeys`：是否启用键盘快捷键

#### `Toaster`

基于 sonner 的通知组件。

```jsx
import { Toaster, toast } from '@prompt-booster/ui';

<Toaster />

// 在代码中稍后使用
toast.success("操作成功完成");
```

#### `Tooltip`

可自定义的工具提示组件。

```jsx
import { Tooltip } from '@prompt-booster/ui';

<Tooltip text="复制到剪贴板" position="top">
  <button>复制</button>
</Tooltip>
```

属性：

- `text`：工具提示文本
- `content`：React 节点内容（text 的替代方案）
- `position`：工具提示位置（'top'、'bottom'、'left'、'right'）
- `theme`：主题覆盖
- `duration`：动画持续时间
- `children`：要附加工具提示的元素

### 实用组件

#### `ListCard`

专为显示带有操作的列表项而设计的卡片组件。

```jsx
import { ListCard } from '@prompt-booster/ui';

<ListCard
  title="项目标题"
  description="项目描述"
  infoItems={[
    { key: "创建时间", value: "今天" },
    { key: "状态", value: "活跃" }
  ]}
  actions={<button>编辑</button>}
  onClick={handleClick}
/>
```

属性：

- `title`：卡片标题
- `description`：卡片描述
- `infoItems`：具有 key 和 value 的信息项数组
- `actions`：右侧显示的操作
- `onClick`：点击处理函数
- `renderTitle`：自定义标题渲染器
- `renderDescription`：自定义描述渲染器
- `renderInfoItem`：自定义信息项渲染器

#### `LoadingIcon`

可自定义的加载旋转器。

```jsx
import { LoadingIcon } from '@prompt-booster/ui';

<LoadingIcon size="md" color="currentColor" />
```

属性：

- `size`：旋转器的大小（'sm'、'md'、'lg'）
- `color`：旋转器的颜色

## 钩子

### `useAutoScroll`

用于管理自动滚动行为的钩子。

```jsx
import { useAutoScroll } from '@prompt-booster/ui';

function MyComponent() {
  const {
    elementRef,
    scrollToBottom,
    shouldShowButton,
    onContentChange
  } = useAutoScroll({
    streaming: true,
    threshold: 10
  });
  
  return (
    <div ref={elementRef}>
      {/* 内容 */}
      {shouldShowButton && (
        <button onClick={scrollToBottom}>滚动到底部</button>
      )}
    </div>
  );
}
```

选项：

- `enabled`：是否启用自动滚动
- `streaming`：内容是否正在流式传输
- `threshold`：检测是否从底部滚动的像素阈值
- `debug`：是否输出调试信息

### `useModal`

用于管理模态/对话框状态的钩子。

```jsx
import { useModal, Dialog } from '@prompt-booster/ui';

function UserEditor() {
  const userModal = useModal();
  
  const openUserModal = (userData) => {
    userModal.openModal(userData);
  };
  
  return (
    <>
      <button onClick={() => openUserModal({ id: 1, name: '约翰' })}>
        编辑用户
      </button>
      
      {(userModal.isOpen || userModal.isClosing) && userModal.data && (
        <Dialog
          isOpen={userModal.isOpen}
          onClose={userModal.closeModal}
          title="编辑用户"
        >
          <input
            value={userModal.data.name}
            onChange={(e) => userModal.setData({
              ...userModal.data,
              name: e.target.value
            })}
          />
        </Dialog>
      )}
    </>
  );
}
```

返回：

- `isOpen`：模态是否打开
- `isClosing`：模态是否处于关闭动画中
- `data`：模态数据
- `openModal`：用于打开带有数据的模态的函数
- `closeModal`：用于关闭模态的函数
- `setData`：用于更新模态数据的函数

### `useScrollFade`

用于创建淡入/淡出滚动条的钩子。

```jsx
import { useScrollFade } from '@prompt-booster/ui';

function ScrollableContent() {
  const containerRef = useRef(null);
  const { applyToAll } = useScrollFade(containerRef, {
    timeout: 2000,
    showOnHover: true
  });
  
  // 应用于组件中的所有可滚动元素
  useEffect(() => {
    const cleanup = applyToAll();
    return cleanup;
  }, [applyToAll]);
  
  return (
    <div ref={containerRef} className="overflow-auto">
      {/* 可滚动内容 */}
    </div>
  );
}
```

选项：

- `timeout`：滚动条淡出前的毫秒时间
- `showOnHover`：是否在悬停时显示滚动条
- `listenToScroll`：是否监听滚动事件
- `selector`：可滚动元素的 CSS 选择器

## 主题系统

UI 库包含一个全面的主题系统，支持浅色、深色和系统偏好模式。

### 主题上下文

`ThemeContext` 提供主题状态和函数：

```jsx
import { useTheme } from '@prompt-booster/ui';

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>当前主题：{theme}</p>
      <p>解析后的主题：{resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>深色模式</button>
      <button onClick={() => setTheme('light')}>浅色模式</button>
      <button onClick={() => setTheme('system')}>系统偏好</button>
    </div>
  );
}
```

`resolvedTheme` 将是 'light' 或 'dark'，而 `theme` 可以是 'light'、'dark' 或 'system'。

### CSS 类

组件使用一致的 CSS 类命名进行主题设置：

- 浅色主题活跃：`theme-light-active`
- 浅色主题非活跃：`theme-light-inactive`
- 深色主题活跃：`theme-dark-active`
- 深色主题非活跃：`theme-dark-inactive`

## 高级用法

### 使用 useModal 模式的对话框

对于更复杂的对话框管理，结合使用 `Dialog` 组件和 `useModal` 钩子：

```jsx
import { Dialog, useModal } from '@prompt-booster/ui';

// 为模态数据定义类型
interface UserData {
  id: number;
  name: string;
  email: string;
}

function UserManagement() {
  // 创建一个类型化的模态钩子
  const userModal = useModal<UserData>();
  
  const handleEditUser = (user: UserData) => {
    userModal.openModal(user);
  };
  
  const handleSaveUser = () => {
    // 保存用户数据
    console.log('保存用户：', userModal.data);
    userModal.closeModal();
  };
  
  return (
    <div>
      {/* 触发按钮 */}
      <button onClick={() => handleEditUser({ id: 1, name: '约翰', email: 'john@example.com' })}>
        编辑用户
      </button>
      
      {/* 用户编辑对话框 */}
      {(userModal.isOpen || userModal.isClosing) && userModal.data && (
        <Dialog
          isOpen={userModal.isOpen}
          onClose={userModal.closeModal}
          title={`编辑用户：${userModal.data.name}`}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={userModal.closeModal}>取消</button>
              <button onClick={handleSaveUser}>保存</button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label>姓名</label>
              <input
                value={userModal.data.name}
                onChange={(e) => userModal.setData({
                  ...userModal.data,
                  name: e.target.value
                })}
              />
            </div>
            <div>
              <label>电子邮件</label>
              <input
                value={userModal.data.email}
                onChange={(e) => userModal.setData({
                  ...userModal.data,
                  email: e.target.value
                })}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
```

### 自动滚动 Markdown 内容

用于显示带有自动滚动的流式 AI 响应：

```jsx
import { AutoScrollContent } from '@prompt-booster/ui';

function AIResponseDisplay({ response, isStreaming }) {
  return (
    <div className="h-80">
      <AutoScrollContent
        content={response}
        streaming={isStreaming}
        enableMarkdown={true}
        allowHtml={false}
        showCopyButton={true}
        placeholder="AI 响应将在此处显示..."
      />
    </div>
  );
}
```

### 带有动态加载的模型选择

```jsx
import { ModelSelector } from '@prompt-booster/ui';
import { fetchModels } from '@prompt-booster/api';

function ModelSelectionForm() {
  const [selectedModel, setSelectedModel] = useState('');
  
  const loadModels = async () => {
    try {
      // 返回 Promise<ModelOption[]> 的函数
      const models = await fetchModels();
      return models;
    } catch (error) {
      console.error('加载模型时出错：', error);
      return [];
    }
  };
  
  return (
    <div>
      <label>选择 AI 模型</label>
      <ModelSelector
        value={selectedModel}
        onChange={setSelectedModel}
        fetchModels={loadModels}
        placeholder="搜索或选择一个模型"
      />
    </div>
  );
}
```

## 最佳实践

### 主题一致性

确保您的应用程序正确使用主题上下文：

```jsx
import { ThemeProvider } from '@prompt-booster/ui';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* 您的应用程序 */}
    </ThemeProvider>
  );
}
```

### 表单设计

创建表单时，使用一致的输入组件：

```jsx
function ConsistentForm() {
  return (
    <form className="space-y-4">
      <div>
        <label>标题</label>
        <EnhancedTextarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入标题"
          rows={1}
        />
      </div>
      
      <div>
        <label>描述</label>
        <EnhancedTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入描述"
          rows={3}
          showCharCount={true}
          maxLength={500}
        />
      </div>
      
      <div>
        <label>类别</label>
        <EnhancedDropdown
          options={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          placeholder="选择一个类别"
        />
      </div>
    </form>
  );
}
```

### 错误处理

使用 Toaster 组件实现一致的错误处理：

```jsx
import { toast } from '@prompt-booster/ui';

async function submitForm() {
  try {
    // 表单提交逻辑
    await saveData();
    toast.success('表单提交成功');
  } catch (error) {
    toast.error('提交表单时出错：' + error.message);
  }
}
```

## 故障排除

### 常见问题

**组件没有显示正确的主题颜色：**

- 确保您已经用 `ThemeProvider` 包装了应用程序
- 检查您是否使用了提供的 CSS 类或 Tailwind 的深色模式工具

**自动滚动不工作：**

- 验证容器是否有固定高度或最大高度
- 检查在添加内容时 `streaming` 属性是否正确设置

**对话框动画问题：**

- 确保您正确处理了来自 `useModal` 的 `isOpen` 和 `isClosing` 状态
- 验证您的对话框是否基于这些状态有条件地渲染

## 实用函数

### 提示通知

```jsx
import { toast } from '@prompt-booster/ui';

// 成功通知
toast.success('操作成功');

// 错误通知
toast.error('操作失败');

// 信息通知
toast.info('有新的更新可用');

// 警告通知
toast.warning('磁盘空间不足');
```

## 结论

Prompt Booster UI 库提供了一套用于构建提示工程应用程序的全面组件。通过支持主题设置、响应式设计以及专门用于提示编辑和 AI 模型交互的组件，它提供了创建专业提示优化体验所需的一切。

有关特定组件的更详细信息，请参阅各个组件的文档。