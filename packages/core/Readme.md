# Prompt Optimizer Core 文档

本文档详细说明了Prompt Optimizer应用中Core包的结构、功能和使用方法。Core包提供了应用的核心业务逻辑、状态管理和数据模型，是整个应用的基础。

## 目录

1. [概述](#概述)
2. [核心模型和接口](#核心模型和接口)
3. [状态管理](#状态管理)
4. [工具函数](#工具函数)
5. [使用示例](#使用示例)

## 概述

Core包是Prompt Optimizer应用的核心，负责定义数据模型、管理应用状态以及提供通用工具函数。主要功能包括：

- 提示词状态管理
- 模型配置管理
- 历史记录管理
- 模板管理
- 通用工具函数

Core包采用了模块化的设计，将数据模型、状态管理和工具函数分开，便于维护和扩展。状态管理使用Zustand实现，提供了响应式的状态更新和持久化存储。

## 核心模型和接口

### 历史记录模型 (`/models/history.ts`)

定义了历史记录相关的数据结构。

**主要接口：**

- `HistoryItem`: 历史记录项
  ```typescript
  interface HistoryItem {
    id: string;
    timestamp: number;
    originalPrompt: string;
    optimizedPrompt: string;
    reasoning?: string;
    modelId?: string;
    tags?: string[];
    favorite?: boolean;
  }
  ```

### 模板模型 (`/models/template.ts`)

定义了提示词模板的数据结构。

**主要接口：**

- `Template`: 提示词模板
  ```typescript
  interface Template {
    id: string;
    name: string;
    content: string;
    category: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
  }
  ```

### 配置模型 (`/models/config.ts`)

定义了模型配置相关的数据结构。

**主要接口：**

- `StandardModelType`: 标准模型类型
  ```typescript
  type StandardModelType = 'openai' | 'gemini' | 'deepseek' | 'hunyuan';
  ```

- `ModelConfig`: 模型配置
  ```typescript
  interface ModelConfig {
    apiKey: string;
    baseUrl?: string;
    model: string;
    endpoint?: string;
  }
  ```

- `CustomInterface`: 自定义接口配置
  ```typescript
  interface CustomInterface {
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    endpoint?: string;
  }
  ```

## 状态管理

### 提示词状态 (`/store/prompt-store.ts`)

管理提示词相关的状态，包括原始提示词、优化后提示词、历史记录和模板。

**主要功能：**

- `usePromptStore`: 提示词状态管理Hook
  - 状态：
    - `originalPrompt`: 原始提示词
    - `optimizedPrompt`: 优化后提示词
    - `optimizationReasoning`: 优化理由
    - `isOptimizing`: 是否正在优化
    - `optimizationError`: 优化错误信息
    - `history`: 历史记录
    - `optimizeTemplates`: 优化模板
    - `activeTemplateId`: 当前活动模板ID
  - 方法：
    - `setOriginalPrompt(prompt)`: 设置原始提示词
    - `setOptimizedPrompt(prompt)`: 设置优化后提示词
    - `optimizePrompt()`: 优化提示词
    - `clearError()`: 清除错误
    - `loadFromHistory(item)`: 从历史加载
    - `deleteHistoryItem(id)`: 删除历史项
    - `clearHistory()`: 清空历史记录
    - `setActiveTemplate(id)`: 设置活动模板
    - `addTemplate(name, content)`: 添加模板
    - `updateTemplate(id, updates)`: 更新模板
    - `deleteTemplate(id)`: 删除模板
    - `getActiveTemplate()`: 获取当前活动模板

### 模型状态 (`/store/model-store.ts`)

管理模型配置相关的状态，包括API配置和自定义接口。

**主要功能：**

- `useModelStore`: 模型状态管理Hook
  - 状态：
    - `activeModel`: 当前活动模型
    - `configs`: 模型配置
    - `customInterfaces`: 自定义接口列表
  - 方法：
    - `setActiveModel(model)`: 设置当前活动模型
    - `updateConfig(model, config)`: 更新模型配置
    - `addCustomInterface(interface)`: 添加自定义接口
    - `updateCustomInterface(id, updates)`: 更新自定义接口
    - `deleteCustomInterface(id)`: 删除自定义接口
    - `isCustomInterface(model)`: 判断是否为自定义接口
    - `getCustomInterface(id)`: 获取自定义接口

## 工具函数

### ID生成器 (`/utils/id-generator.ts`)

提供生成唯一ID的工具函数。

**主要函数：**

- `generateId()`: 生成基本唯一ID
- `generateNumericId()`: 生成数字ID
- `generatePrefixedId(prefix)`: 生成带前缀的ID

### 提示词工具 (`/utils/prompt-utils.ts`)

提供提示词处理相关的工具函数。

**主要函数：**

- `removeThinkTags(text)`: 移除文本中的`<think>`标签及内容
- `cleanOptimizedPrompt(optimizedPrompt)`: 清理优化后提示词

## 使用示例

### 基本状态管理

```typescript
import { usePromptStore } from '@prompt-booster/core';

// 在React组件中使用
function PromptEditor() {
  const { 
    originalPrompt, 
    setOriginalPrompt, 
    optimizedPrompt, 
    isOptimizing, 
    optimizePrompt 
  } = usePromptStore();

  const handleOptimize = async () => {
    if (!originalPrompt.trim()) return;
    try {
      await optimizePrompt();
    } catch (error) {
      console.error('优化过程中出错:', error);
    }
  };

  return (
    <div>
      <textarea 
        value={originalPrompt}
        onChange={(e) => setOriginalPrompt(e.target.value)}
        placeholder="请输入提示词..."
      />
      <button 
        onClick={handleOptimize}
        disabled={isOptimizing || !originalPrompt.trim()}
      >
        {isOptimizing ? '优化中...' : '优化提示词'}
      </button>
      {optimizedPrompt && (
        <div>
          <h3>优化结果：</h3>
          <p>{optimizedPrompt}</p>
        </div>
      )}
    </div>
  );
}
```

### 使用模型配置

```typescript
import { useModelStore } from '@prompt-booster/core';

// 在React组件中使用
function ModelSettings() {
  const { 
    activeModel, 
    configs, 
    setActiveModel, 
    updateConfig 
  } = useModelStore();

  const handleApiKeyChange = (apiKey) => {
    updateConfig(activeModel, {
      ...configs[activeModel],
      apiKey
    });
  };

  return (
    <div>
      <select 
        value={activeModel}
        onChange={(e) => setActiveModel(e.target.value)}
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Google Gemini</option>
        <option value="deepseek">DeepSeek</option>
        <option value="hunyuan">腾讯混元</option>
      </select>
      
      <input 
        type="password"
        value={configs[activeModel]?.apiKey || ''}
        onChange={(e) => handleApiKeyChange(e.target.value)}
        placeholder="输入API密钥"
      />
    </div>
  );
}
```

### 历史记录管理

```typescript
import { usePromptStore, HistoryItem } from '@prompt-booster/core';

// 在React组件中使用
function PromptHistory() {
  const { history, loadFromHistory, deleteHistoryItem } = usePromptStore();

  return (
    <div>
      <h2>历史记录</h2>
      {history.length === 0 ? (
        <p>暂无历史记录</p>
      ) : (
        <ul>
          {history.map((item: HistoryItem) => (
            <li key={item.id}>
              <div>
                <strong>原始提示词: </strong> 
                {item.originalPrompt.substring(0, 50)}...
              </div>
              <div>
                <button onClick={() => loadFromHistory(item)}>
                  加载
                </button>
                <button onClick={() => deleteHistoryItem(item.id)}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 使用工具函数

```typescript
import { cleanOptimizedPrompt, generateId } from '@prompt-booster/core';

// 清理优化后提示词
const cleanedPrompt = cleanOptimizedPrompt(optimizedPrompt);

// 生成唯一ID
const uniqueId = generateId();
```

## 注意事项

1. Core包依赖于Zustand进行状态管理，确保安装了相关依赖。
2. 使用usePromptStore和useModelStore时，应在React组件或自定义Hook中调用。
3. Core包的状态默认会持久化到localStorage，可以通过配置选项修改持久化行为。
4. 在实际项目中，API调用逻辑应该放在API包中，Core包只负责状态管理和数据模型。
