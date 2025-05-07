# @prompt-booster/core

[English](README.md)

## 目录

- [@prompt-booster/core](#prompt-boostercore)
  - [目录](#目录)
  - [概述](#概述)
  - [架构](#架构)
  - [核心功能](#核心功能)
    - [模型管理](#模型管理)
      - [示例：配置模型](#示例配置模型)
    - [提示管理](#提示管理)
      - [提示优化](#提示优化)
    - [存储管理](#存储管理)
  - [关键组件](#关键组件)
    - [配置](#配置)
    - [模型服务](#模型服务)
    - [提示服务](#提示服务)
    - [模板服务](#模板服务)
  - [钩子](#钩子)
    - [`useModelStore`](#usemodelstore)
    - [`usePromptGroup`](#usepromptgroup)
    - [`usePromptHistory`](#useprompthistory)
    - [`useMemoryStore`](#usememorystore)
  - [实用工具](#实用工具)
    - [ID生成](#id生成)
    - [提示工具](#提示工具)
  - [使用示例](#使用示例)
    - [基本模型配置](#基本模型配置)
    - [优化提示](#优化提示)
    - [使用提示历史](#使用提示历史)
    - [分析提示质量](#分析提示质量)
    - [自定义API集成](#自定义api集成)

## 概述

`@prompt-booster/core` 包是 Prompt Booster 应用程序的基础，提供：

- **模型配置管理**：支持多种AI模型（OpenAI、Gemini、DeepSeek、Hunyuan、Siliconflow、Ollama）
- **提示管理**：版本化提示组、历史跟踪和优化服务
- **模板系统**：基于模板的提示优化和生成
- **状态管理**：基于Zustand的响应式存储，用于应用程序状态
- **存储工具**：持久性和基于内存的存储选项
- **核心服务**：提示优化和AI模型通信的接口

## 架构

该包组织为几个关键模块：

```markdown
core/
├── config/        # 常量和默认配置
├── model/         # 模型配置和服务
├── prompt/        # 提示管理和优化
├── storage/       # 存储服务
└── utils/         # 实用函数
```

## 核心功能

### 模型管理

模型管理系统提供了一个灵活的框架，用于与不同的AI提供商合作：

- **支持的提供商**：OpenAI、Gemini、DeepSeek、Hunyuan、Siliconflow和Ollama
- **自定义接口**：支持添加和配置自定义API端点
- **模型配置**：API密钥、基础URL、模型选择和超时设置
- **连接测试**：在提交到模型前测试API连接
- **安全密钥管理**：API密钥遮蔽以增强安全性

#### 示例：配置模型

```typescript
import { useModelStore } from '@prompt-booster/core';

function ModelConfig() {
  const { configs, updateConfig } = useModelStore();
  
  const configureOpenAI = () => {
    updateConfig('openai', {
      apiKey: 'your-api-key',
      model: 'gpt-4-turbo',
      enabled: true
    });
  };
}
```

### 提示管理

提示管理为处理AI提示提供了全面的工具：

- **提示组**：将提示组织到具有版本历史的组中
- **版本控制**：通过顺序版本跟踪提示的变化
- **优化**：使用AI驱动的模板增强提示
- **迭代**：基于反馈逐步改进提示
- **历史**：浏览和恢复以前的提示版本
- **分析**：通过AI反馈分析提示质量

#### 提示优化

提示优化系统使用模板生成更好的提示：

```typescript
import { usePromptGroup } from '@prompt-booster/core';

function PromptOptimizer() {
  const { enhancePrompt } = usePromptGroup();
  
  const optimizeMyPrompt = async () => {
    const result = await enhancePrompt({
      originalPrompt: "编写一个关于机器人的故事",
      templateId: "default-optimizer"
    });
    
    console.log(result.optimizedPrompt);
  };
}
```

### 存储管理

该包提供灵活的存储解决方案：

- **本地存储**：持久性浏览器存储
- **会话存储**：临时浏览器会话存储
- **内存存储**：用于临时数据的内存存储
- **Zustand集成**：与Zustand状态管理的无缝集成

## 关键组件

### 配置

位于 `config/` 目录中，配置模块定义了常量和默认设置：

- **常量**：API端点、模型名称、存储键、错误消息
- **默认值**：默认模型配置和优化设置

### 模型服务

模型服务（`model/services/modelService.ts`）提供以下工具：

- **连接测试**：验证API凭据和连接性
- **API密钥安全**：遮蔽敏感API密钥以供显示
- **模型验证**：验证模型配置
- **UI准备**：格式化模型数据以在UI中显示

### 提示服务

提示服务（`prompt/services/promptService.ts`）是提示管理的核心引擎：

- **LLM通信**：用于调用AI模型的通用函数
- **提示组管理**：创建、更新和删除提示组
- **版本控制**：随时间跟踪提示的变化
- **优化**：使用AI增强提示
- **迭代**：基于特定方向改进提示
- **状态管理**：在整个应用程序中维持提示状态

### 模板服务

模板服务（`prompt/services/templateService.ts`）管理提示模板：

- **模板检索**：通过ID或类型获取模板
- **默认模板**：用于常见优化场景的内置模板
- **模板内容**：从模板中提取内容以用于提示优化

## 钩子

该包提供了几个用于状态管理的React钩子：

### `useModelStore`

管理模型配置状态：

```typescript
const {
  activeModel,          // 当前活动模型ID
  configs,              // 模型配置
  customInterfaces,     // 自定义API接口
  setActiveModel,       // 设置活动模型
  updateConfig,         // 更新模型配置
  addCustomInterface,   // 添加新的自定义接口
  getEnabledModels      // 获取所有启用的模型
} = useModelStore();
```

### `usePromptGroup`

管理提示组和版本：

```typescript
const {
  activeGroup,          // 当前活动提示组
  activeVersion,        // 当前活动版本
  enhancePrompt,        // 使用AI增强提示
  iteratePrompt,        // 迭代现有提示
  getAllGroups,         // 获取所有提示组
  getGroupVersions,     // 获取组的版本
  loadFromHistory       // 从历史记录加载提示
} = usePromptGroup();
```

### `usePromptHistory`

管理提示历史导航：

```typescript
const {
  expandedGroupId,      // 当前展开的组
  selectedVersions,     // 按组选择的版本
  toggleExpand,         // 切换组的展开
  loadGroup,            // 加载提示组
  loadVersion           // 加载特定版本
} = usePromptHistory();
```

### `useMemoryStore`

管理内存中的提示数据：

```typescript
const {
  originalPrompt,       // 原始提示文本
  optimizedPrompt,      // 优化后的提示文本
  setOriginalPrompt,    // 设置原始提示
  setOptimizedPrompt,   // 设置优化后的提示
  clearAll              // 清除所有存储的数据
} = useMemoryStore();
```

## 实用工具

### ID生成

用于生成唯一标识符的工具：

```typescript
import { generateId, generatePrefixedId } from '@prompt-booster/core';

const uniqueId = generateId();                  // 例如："lq1aef3kj2"
const prefixedId = generatePrefixedId('user');  // 例如："user-lq1aef3kj2"
```

### 提示工具

处理提示的辅助函数：

```typescript
import { removeThinkTags, analyzePromptQuality } from '@prompt-booster/core';

// 从提示中删除<think>标签
const cleanedPrompt = removeThinkTags(originalPrompt);

// 分析提示质量
const analysis = analyzePromptQuality(myPrompt);
console.log(`质量得分：${analysis.score}/10`);
```

## 使用示例

### 基本模型配置

```typescript
import { useModelStore } from '@prompt-booster/core';

function SetupModels() {
  const { updateConfig, setActiveModel } = useModelStore();
  
  // 配置OpenAI
  updateConfig('openai', {
    apiKey: 'sk-your-openai-key',
    model: 'gpt-4-turbo',
    enabled: true
  });
  
  // 将OpenAI设置为活动模型
  setActiveModel('openai');
}
```

### 优化提示

```typescript
import { usePromptGroup, useMemoryStore } from '@prompt-booster/core';

async function OptimizePrompt() {
  const { enhancePrompt } = usePromptGroup();
  const { setOriginalPrompt, setOptimizedPrompt } = useMemoryStore();
  
  const originalPrompt = "编写一个关于机器人的故事。";
  setOriginalPrompt(originalPrompt);
  
  try {
    const result = await enhancePrompt({
      originalPrompt,
      templateId: 'default-optimizer'
    });
    
    setOptimizedPrompt(result.optimizedPrompt);
    console.log("优化完成！");
  } catch (error) {
    console.error("优化失败:", error);
  }
}
```

### 使用提示历史

```typescript
import { usePromptGroup, usePromptHistory } from '@prompt-booster/core';

function PromptHistoryBrowser() {
  const { getAllGroups, getGroupVersions } = usePromptGroup();
  const { loadGroup, loadVersion } = usePromptHistory();
  
  // 获取所有提示组
  const groups = getAllGroups();
  
  // 加载第一个组
  if (groups.length > 0) {
    // 获取第一个组的所有版本
    const versions = getGroupVersions(groups[0].id);
    
    // 加载最新版本
    loadGroup(groups[0], () => {
      console.log("组加载成功！");
    });
    
    // 或加载特定版本
    if (versions.length > 1) {
      loadVersion(groups[0].id, versions[1].number, () => {
        console.log("版本加载成功！");
      });
    }
  }
}
```

### 分析提示质量

```typescript
import { analyzePromptWithLLM } from '@prompt-booster/core';

async function AnalyzePrompt() {
  const myPrompt = "编写一个关于能感受情感的机器人的故事。";
  
  try {
    const analysis = await analyzePromptWithLLM(myPrompt);
    
    console.log(`质量得分：${analysis.score}/10`);
    console.log("需要改进的方面：");
    
    analysis.criteria
      .filter(c => !c.passed)
      .forEach(criterion => {
        console.log(`- ${criterion.label}：${criterion.feedback}`);
        if (criterion.suggestion) {
          console.log(`  建议：${criterion.suggestion}`);
        }
      });
  } catch (error) {
    console.error("分析失败:", error);
  }
}
```

### 自定义API集成

```typescript
import { useModelStore } from '@prompt-booster/core';

function AddCustomModel() {
  const { addCustomInterface, setActiveModel } = useModelStore();
  
  // 添加自定义模型接口
  const customId = addCustomInterface({
    name: "我的自定义AI",
    providerName: "CustomProvider",
    apiKey: "custom-api-key",
    baseUrl: "https://api.custom-ai-provider.com",
    model: "custom-model-v1",
    timeout: 60000,
    enabled: true
  });
  
  // 设置为活动模型
  setActiveModel(customId);
}
```