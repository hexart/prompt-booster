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
    - [提示词管理](#提示词管理)
      - [提示词优化](#提示词优化)
    - [存储管理](#存储管理)
  - [关键组件](#关键组件)
    - [配置](#配置)
    - [模型服务](#模型服务)
    - [提示词服务](#提示词服务)
      - [PromptService（主协调器）](#promptservice主协调器)
      - [PromptGroupManager（数据管理）](#promptgroupmanager数据管理)
      - [LLMService（LLM 接口）](#llmservicellm-接口)
    - [模板服务](#模板服务)
  - [钩子](#钩子)
    - [`useModelStore`](#usemodelstore)
    - [`usePrompt`](#useprompt)
    - [`useMemoryStore`](#usememorystore)
  - [实用工具](#实用工具)
    - [ID生成](#id生成)
    - [提示词工具](#提示词工具)
  - [使用示例](#使用示例)
    - [基本模型配置](#基本模型配置)
    - [优化提示词](#优化提示词)
    - [使用提示词历史](#使用提示词历史)
    - [分析提示词质量](#分析提示词质量)
    - [自定义API集成](#自定义api集成)
  - [重构亮点](#重构亮点)

## 概述

`@prompt-booster/core` 包是 Prompt Booster 应用程序的基础，提供：

- **统一模型配置管理**：支持多种AI模型（OpenAI、Gemini、DeepSeek、Hunyuan、Siliconflow、Ollama）
- **提示词管理**：版本化提示词组、历史跟踪和优化服务
- **模板系统**：基于模板的提示词优化和生成
- **单一数据源设计**：通过服务层统一管理所有提示词数据
- **存储工具**：灵活的存储选项，支持持久化和内存存储
- **核心服务**：模块化的服务架构，实现关注点分离
- **分层架构**：api 包 → core 包 → web 包，每层职责明确
- **配置集中化**：所有提供商配置统一在 api 包中管理

## 架构

该包采用清晰的模块化架构：

```markdown
core/
├── config/         # 常量和默认配置
├── model/          # 模型配置和服务
│   ├── models/     # 类型定义
│   ├── services/   # 模型服务
│   ├── store/      # 模型状态管理
│   └── unifiedModelConfig.ts  # 从 API 包获取配置
├── prompt/         # 提示词管理和优化
│   ├── hooks/      # React 钩子
│   ├── models/     # 类型定义
│   ├── services/   # 核心服务
│   │   ├── promptService.ts       # 主服务协调器
│   │   ├── promptGroupManager.ts  # 数据管理
│   │   ├── llmService.ts          # LLM调用接口
│   │   └── templateService.ts     # 模板管理
│   ├── templates/  # 提示词模板
│   └── utils/      # 工具函数
├── storage/        # 存储服务
└── utils/          # 通用工具
```

## 核心功能

### 模型管理

模型管理系统通过 `unifiedModelConfig.ts` 提供统一的配置管理：

- **配置来源统一**：从 `@prompt-booster/api` 包获取所有模型的默认配置
- **架构清晰**：api 包负责通信配置，core 包负责业务逻辑，web 包负责UI展示
- **支持的提供商**：OpenAI、Gemini、DeepSeek、Hunyuan、Siliconflow 和 Ollama
- **自定义接口**：支持添加兼容 OpenAI 接口规范的自定义 API
- **智能识别**：自动识别 OpenAI 兼容接口并使用相应的处理逻辑
- **连接测试**：提交前验证 API 连接
- **安全管理**：API 密钥遮蔽以增强安全性

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

### 提示词管理

重构后的提示词管理采用单一数据源设计：

- **服务分层**：
  - `PromptService`：主服务协调器，管理整体流程
  - `PromptGroupManager`：专注于数据的 CRUD 操作
  - `LLMService`：统一的 LLM 调用接口
- **版本控制**：完整的版本历史记录和切换功能
- **实时更新**：流式响应直接更新版本内容，UI 自动响应
- **优化流程**：使用 AI 驱动的模板增强提示词
- **迭代改进**：基于用户反馈逐步优化提示词
- **用户编辑**：支持手动编辑并保存为新版本

#### 提示词优化

提示词优化系统使用模板生成更好的提示词：

```typescript
import { usePrompt } from '@prompt-booster/core';

function PromptOptimizer() {
  const { enhancePrompt, originalPrompt, optimizedPrompt } = usePrompt();
  
  const optimizeMyPrompt = async () => {
    const result = await enhancePrompt({
      originalPrompt: "编写一个关于机器人的故事",
      templateId: "general-optimize",
      language: "zh-CN"
    });
    
    // 优化后的内容会自动更新到 optimizedPrompt
    console.log(optimizedPrompt);
  };
}
```

### 存储管理

简化后的存储架构：

- **提示词数据**：完全由 `PromptService` 管理，通过 localStorage 持久化
- **临时数据**：`MemoryStore` 仅管理测试相关的临时数据
- **存储类型**：
  - 本地存储：持久化浏览器存储
  - 会话存储：临时浏览器会话存储
  - 内存存储：用于临时数据，页面刷新自动清除
- **自动同步**：通过订阅机制，UI 自动获取最新状态

## 关键组件

### 配置

从 API 包获取的统一模型配置管理：

- **配置来源**：所有默认配置来自 `@prompt-booster/api/config/constants` 的 `PROVIDER_CONFIG`
- **类型映射**：通过 `MODEL_TYPE_TO_PROVIDER` 确保业务层和通信层的类型一致性
- **配置转换**：将 API 包的配置转换为业务层需要的格式
- **单一数据源**：避免在多个包中重复维护相同的配置信息

### 模型服务

模型服务（`model/services/modelService.ts`）提供：

- **连接测试**：验证 API 凭据和连接性
- **配置验证**：确保模型配置完整有效
- **API 密钥安全**：遮蔽敏感信息
- **统一处理**：标准化不同提供商的配置

### 提示词服务

重构后的提示词服务采用模块化设计：

#### PromptService（主协调器）
- 管理整体业务流程
- 协调各个子服务
- 处理状态更新和通知
- 实现页面刷新检测

#### PromptGroupManager（数据管理）
- 提示词组的 CRUD 操作
- 版本管理
- 数据导入/导出
- 预创建版本支持实时更新

#### LLMService（LLM 接口）
- 统一的 LLM 调用接口
- 自动识别模型配置
- 支持流式和非流式响应
- 处理自定义接口的 provider 映射

### 模板服务

模板服务（`prompt/services/templateService.ts`）管理提示词模板：

- **模板检索**：通过 ID 或类型获取模板
- **多语言支持**：模板本地化处理
- **默认模板**：内置优化和迭代模板
- **动态加载**：支持从文件系统加载模板

## 钩子

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
  getEnabledModels,     // 获取所有启用的模型
  isCustomInterface,    // 检查是否为自定义接口
  getCustomInterface    // 获取自定义接口配置
} = useModelStore();
```

### `usePrompt`

统一的提示词管理钩子，提供单一数据源：

```typescript
const {
  // 状态
  activeGroup,          // 当前活动提示词组
  activeVersion,        // 当前活动版本
  isProcessing,         // 是否正在处理
  error,                // 错误信息
  
  // 数据
  originalPrompt,       // 原始提示词（直接从服务获取）
  optimizedPrompt,      // 优化后的提示词（直接从服务获取）
  
  // 组操作
  groups,               // 所有提示词组
  deleteGroup,          // 删除组
  
  // 版本操作
  versions,             // 当前组的所有版本
  switchVersion,        // 切换版本
  getGroupVersions,     // 获取指定组的版本
  
  // 增强操作
  enhancePrompt,        // 使用AI增强提示词
  iteratePrompt,        // 迭代现有提示词
  saveUserModification, // 保存用户修改
  
  // 会话管理
  resetSession,         // 重置当前会话
  loadFromHistory       // 从历史记录加载
} = usePrompt();
```

### `useMemoryStore`

管理临时测试数据：

```typescript
const {
  userTestPrompt,       // 用户测试输入
  originalResponse,     // 原始提示词的响应
  optimizedResponse,    // 优化提示词的响应
  isLoadingFromHistory, // 是否正在加载历史
  
  setUserTestPrompt,    // 设置测试输入
  setOriginalResponse,  // 设置原始响应
  setOptimizedResponse, // 设置优化响应
  clearAll              // 清除所有数据
} = useMemoryStore();
```

## 实用工具

### ID生成

用于生成唯一标识符：

```typescript
import { generateId, generatePrefixedId } from '@prompt-booster/core';

const uniqueId = generateId();                  // 例如："lq1aef3kj2"
const prefixedId = generatePrefixedId('user');  // 例如："user-lq1aef3kj2"
```

### 提示词工具

处理提示词的辅助函数：

```typescript
import { 
  removeThinkTags, 
  cleanOptimizedPrompt,
  getLanguageInstruction,
  handleTemplateLocalization 
} from '@prompt-booster/core';

// 从提示词中删除 <think> 标签
const cleanedPrompt = removeThinkTags(originalPrompt);

// 清理优化后的提示词
const cleaned = cleanOptimizedPrompt(optimizedPrompt);

// 获取语言指令
const instruction = getLanguageInstruction('zh-CN');

// 处理模板本地化
const { displayTemplates, getActualTemplateId } = 
  handleTemplateLocalization(templates, 'zh-CN');
```

## 使用示例

### 基本模型配置

```typescript
import { useModelStore } from '@prompt-booster/core';

function SetupModels() {
  const { updateConfig, setActiveModel, addCustomInterface } = useModelStore();
  
  // 配置 OpenAI
  updateConfig('openai', {
    apiKey: 'sk-your-openai-key',
    model: 'gpt-4-turbo',
    enabled: true
  });
  
  // 添加自定义接口（OpenAI 兼容）
  const customId = addCustomInterface({
    name: "本地 Ollama",
    providerName: "ollama",
    apiKey: "not-needed",
    baseUrl: "http://localhost:11434",
    model: "qwen2.5:32b",
    endpoint: "/api/chat",
    enabled: true
  });
  
  // 设置为活动模型
  setActiveModel('openai');
}
```

### 优化提示词

```typescript
import { usePrompt } from '@prompt-booster/core';

function PromptOptimizer() {
  const { 
    enhancePrompt, 
    originalPrompt, 
    optimizedPrompt,
    isProcessing 
  } = usePrompt();
  
  const handleOptimize = async () => {
    try {
      await enhancePrompt({
        originalPrompt: "编写一个关于机器人的故事",
        templateId: 'general-optimize',
        modelId: 'openai',
        language: 'zh-CN'
      });
      
      // 优化完成后，optimizedPrompt 会自动更新
      console.log("优化完成！", optimizedPrompt);
    } catch (error) {
      console.error("优化失败:", error);
    }
  };
  
  return (
    <div>
      <button onClick={handleOptimize} disabled={isProcessing}>
        {isProcessing ? '优化中...' : '开始优化'}
      </button>
    </div>
  );
}
```

### 使用提示词历史

```typescript
import { usePrompt } from '@prompt-booster/core';

function PromptHistoryBrowser() {
  const { 
    groups, 
    loadFromHistory,
    switchVersion,
    getGroupVersions 
  } = usePrompt();
  
  // 显示所有组
  return (
    <div>
      {groups.map(group => {
        const versions = getGroupVersions(group.id);
        
        return (
          <div key={group.id}>
            <h3>{group.originalPrompt.slice(0, 50)}...</h3>
            <button onClick={() => loadFromHistory(group.id)}>
              加载此组
            </button>
            
            {/* 显示版本 */}
            <div>
              {versions.map(version => (
                <button 
                  key={version.id}
                  onClick={() => switchVersion(group.id, version.number)}
                >
                  v{version.number}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### 分析提示词质量

```typescript
import { analyzePromptWithLLM, analyzePromptQuality } from '@prompt-booster/core';

async function AnalyzePrompt() {
  const myPrompt = "编写一个关于能感受情感的机器人的故事。";
  
  try {
    // 使用 LLM 分析（需要配置模型）
    const llmAnalysis = await analyzePromptWithLLM(myPrompt, 'zh-CN');
    
    console.log(`LLM 评分：${llmAnalysis.score}/10`);
    console.log(`鼓励语：${llmAnalysis.encouragement}`);
    
    // 或使用本地分析（无需 API）
    const localAnalysis = analyzePromptQuality(myPrompt, 'zh-CN');
    
    console.log(`本地评分：${localAnalysis.score}/10`);
    
    // 显示改进建议
    localAnalysis.criteria
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
  const { addCustomInterface, setActiveModel, testModelConnection } = useModelStore();
  
  // 添加兼容 OpenAI 的自定义接口
  const customInterface = {
    name: "FastGPT API",
    providerName: "fastgpt",
    apiKey: "fastgpt-api-key",
    baseUrl: "https://api.fastgpt.in/v1",
    model: "gpt-4-vision-preview",
    endpoint: "/chat/completions", // OpenAI 兼容
    timeout: 120000,
    enabled: true
  };
  
  // 测试连接
  const testResult = await testModelConnection(
    customInterface.providerName,
    customInterface.apiKey,
    customInterface.baseUrl,
    customInterface.model,
    customInterface.endpoint
  );
  
  if (testResult.success) {
    const customId = addCustomInterface(customInterface);
    setActiveModel(customId);
    console.log("自定义模型添加成功！");
  } else {
    console.error("连接测试失败:", testResult.message);
  }
}
```

## 重构亮点

1. **单一数据源**：所有提示词数据由 `PromptService` 统一管理，消除了状态同步的复杂性
2. **模块化设计**：服务层清晰分离，每个服务专注于单一职责
3. **统一配置**：通过 `MODEL_REGISTRY` 集中管理所有模型配置，减少重复代码
4. **实时更新**：流式响应直接更新服务层数据，UI 通过订阅自动响应
5. **类型安全**：完整的 TypeScript 类型定义，提供更好的开发体验