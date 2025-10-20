# @prompt-booster/api

[English](README.md)

## 概述

`@prompt-booster/api` 是一个灵活的 TypeScript 客户端库，用于与各种大型语言模型（LLM）服务进行交互。它提供了统一的接口来访问多个 AI 提供商，包括 OpenAI、Google Gemini、Claude、DeepSeek、腾讯混元、SiliconFlow 和 Ollama。

### 核心特性

- 🔄 **统一接口**：所有 LLM 服务使用相同的 API
- 📡 **流式响应**：支持实时流式文本生成
- 🔌 **可扩展设计**：基于策略模式，易于添加新的提供商
- 🛡️ **完整的错误处理**：分层的错误类型系统
- 🎯 **TypeScript 支持**：完整的类型定义和 JSDoc 注释
- 🔧 **灵活配置**：支持自定义端点和认证方式
- 🌐 **CORS 支持**：内置代理支持，适用于浏览器环境
- 📦 **插件系统**：支持动态注册自定义提供商

## 安装

```bash
# 使用 pnpm（推荐）
pnpm add @prompt-booster/api

# 使用 npm
npm install @prompt-booster/api

# 使用 yarn
yarn add @prompt-booster/api
```

## 快速开始

### 基本使用

```typescript
import { createClient } from '@prompt-booster/api';

// 创建 OpenAI 客户端
const client = createClient({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo'
});

// 发送聊天请求
const response = await client.chat({
  userMessage: '你好，请介绍一下你自己。',
  systemMessage: '你是一个友好的AI助手。'
});

console.log(response.data.content);
```

### 流式响应

```typescript
// 创建流处理器
const streamHandler = {
  onData: (chunk) => {
    process.stdout.write(chunk);
  },
  onError: (error) => {
    console.error('流错误:', error);
  },
  onComplete: () => {
    console.log('\n流完成');
  }
};

// 发送流式请求
await client.streamChat({
  userMessage: '写一个关于人工智能的短故事',
  options: {
    temperature: 0.8,
    maxTokens: 1000
  }
}, streamHandler);
```

## CORS 支持

API 包内置了 CORS 代理支持，方便在浏览器环境中连接本地或受 CORS 限制的 API 服务。

```typescript
// 为本地服务启用 CORS 代理
const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:11434',
  cors: { enabled: true }
});

// 添加自定义请求头而不使用代理
const clientWithHeaders = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com',
  cors: {
    enabled: false,
    headers: {
      'X-API-Version': '2.0',
      'X-Client-Id': 'my-app'
    }
  }
});
```

详细配置选项和示例请参见 [CORS 配置指南](./docs/CORS-zh.md)。

## 🔌 扩展性功能（新增）

### 提供商注册机制

支持动态注册自定义 LLM 提供商，无需修改包代码：

```typescript
import { ProviderRegistry, createClient } from '@prompt-booster/api';

// 注册自定义提供商
ProviderRegistry.register('my-custom-llm', {
  providerName: 'My Custom LLM',
  baseUrl: 'https://api.my-llm.com/v1',
  endpoints: {
    chat: '/chat/completions',
    models: '/models'
  },
  defaultModel: 'my-model-v1',
  timeout: 60000,
  auth: { type: 'bearer' },
  request: { type: 'openai_compatible' },
  response: { type: 'openai_compatible' }
});

// 直接使用
  const client = createClient({
  provider: 'my-custom-llm',
  apiKey: 'your-api-key'
});

// 覆盖内置提供商配置
ProviderRegistry.override('openai', {
  ...ProviderRegistry.get('openai'),
  baseUrl: 'https://my-proxy.com/openai/v1'
});

// 列出所有提供商
const providers = ProviderRegistry.list();
console.log(providers); // ['openai', 'gemini', 'my-custom-llm', ...]
```

### 配置验证

提供运行时配置验证，提前发现配置错误：

```typescript
import { validateClientConfig, validateChatRequest, createClient } from '@prompt-booster/api';

// 验证客户端配置
try {
  validateClientConfig(config);
  const client = createClient(config);
} catch (error) {
  console.error('配置无效:', error.message);
}

// 验证聊天请求
try {
  validateChatRequest(request);
  await client.chat(request);
} catch (error) {
  console.error('请求无效:', error.message);
}
```

### 自定义策略

所有策略类已导出，支持高级自定义：

```typescript
import { 
  CustomAuthStrategy,
  CustomRequestFormatter,
  CustomResponseParser,
  createClient 
} from '@prompt-booster/api';

// 自定义认证策略
const client = createClient({
  provider: 'custom',
  apiKey: 'xxx',
  auth: {
    type: 'custom',
    applyAuthFn: (config) => {
      config.headers['X-Custom-Auth'] = `MyScheme ${apiKey}`;
      return config;
    }
  },
  // 自定义请求格式
  request: {
    type: 'custom',
    formatFn: (request) => ({
      prompt: request.userMessage,
      system: request.systemMessage,
      // 自定义格式...
    })
  },
  // 自定义响应解析
  response: {
    type: 'custom',
    parseStreamFn: (chunk) => chunk.text,
    parseFullFn: (response) => ({
      content: response.result,
      usage: response.tokens
    })
  }
});
```

## 架构设计

### 文件结构

```
packages/api/src/
├── index.ts          # 统一导出入口
├── types.ts          # 所有类型定义
├── config.ts         # 配置常量和提供商配置
├── errors.ts         # 错误类定义
├── factory.ts        # 客户端工厂函数
├── registry.ts       # 提供商注册中心
├── validators.ts     # 配置验证工具
├── client/
│   └── client.ts     # 客户端实现
├── strategies/       # 策略模式实现
│   ├── auth.ts       # 认证策略
│   ├── request.ts    # 请求格式化
│   └── response.ts   # 响应解析
└── utils/            # 工具函数
    ├── cors.ts       # CORS 处理
    ├── stream.ts     # 流数据处理
    └── apiLogging.ts # 日志控制
```

### 设计原则

1. **单一职责**：每个文件只负责一个功能领域
2. **策略模式**：认证、请求、响应使用可插拔策略
3. **类型安全**：完整的 TypeScript 类型定义
4. **可扩展性**：通过 ProviderRegistry 动态注册提供商
5. **开发友好**：详细的 JSDoc 注释和使用示例

### 策略模式

API 包采用策略模式设计，将认证、请求格式化和响应解析分离为独立的策略：

```
┌─────────────┐
│  LLMClient  │
├─────────────┤
│ - 认证策略   │ ──> Bearer / Query Param / Custom
│ - 请求策略   │ ──> OpenAI / Gemini / Ollama / Custom
│ - 响应策略   │ ──> OpenAI / Gemini / Ollama / Custom
└─────────────┘
```

### 核心组件

1. **LLMClient**：统一的客户端接口
2. **AuthStrategy**：处理不同的认证方式
3. **RequestFormatter**：格式化请求数据
4. **ResponseParser**：解析响应数据
5. **错误处理**：分层的错误类型系统

##  API 导出

### 核心导出

```typescript
// 客户端
import { createClient, LLMClient } from '@prompt-booster/api';

// 类型
import type {
  ClientConfig,
  ChatRequest,
  ChatResponse,
  StreamHandler
} from '@prompt-booster/api';

// 配置
import {
  LLMProvider,
  PROVIDER_CONFIG,
  DEFAULT_TIMEOUT
} from '@prompt-booster/api';

// 错误处理
import {
  LLMClientError,
  AuthenticationError,
  ConnectionError,
  formatError
} from '@prompt-booster/api';
```

### 策略导出（自定义使用）

```typescript
// 认证策略
import {
  BearerAuthStrategy,
  QueryParamAuthStrategy,
  CustomAuthStrategy
} from '@prompt-booster/api';

// 请求格式化
import {
  OpenAIRequestFormatter,
  GeminiRequestFormatter,
  CustomRequestFormatter
} from '@prompt-booster/api';

// 响应解析
import {
  OpenAIResponseParser,
  GeminiResponseParser,
  CustomResponseParser
} from '@prompt-booster/api';
```

### 工具导出

```typescript
// 流处理
import { StreamFormat, splitStreamBuffer } from '@prompt-booster/api';

// CORS 工具
import { needsCorsProxy, buildProxyUrl } from '@prompt-booster/api';

// 日志控制
import { enableLogging, disableLogging } from '@prompt-booster/api';

// 提供商注册
import { ProviderRegistry } from '@prompt-booster/api';

// 配置验证
import { validateClientConfig, validateChatRequest } from '@prompt-booster/api';
```

## 支持的提供商

### 内置提供商

| 提供商 | Provider ID | 默认模型 | 认证方式 |
|--------|------------|----------|----------|
| OpenAI | `openai` | gpt-3.5-turbo | Bearer Token |
| Google Gemini | `gemini` | gemini-2.0-flash | Query Parameter |
| DeepSeek | `deepseek` | deepseek-chat | Bearer Token |
| 腾讯混元 | `hunyuan` | hunyuan-turbos-latest | Bearer Token |
| SiliconFlow | `siliconflow` | Qwen/QwQ-32B | Bearer Token |
| Ollama | `ollama` | qwen3:32b | 无需认证 |

### 自定义接口

支持添加兼容 OpenAI API 规范的自定义接口：

```typescript
const customClient = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com/v1',
  model: 'custom-model',
  endpoints: {
    chat: '/chat/completions',
    models: '/models'
  }
});
```

## 详细配置

### 客户端配置选项

```typescript
interface ClientConfig {
  provider: string;           // 提供商标识
  apiKey: string;            // API 密钥
  baseUrl?: string;          // API 基础 URL
  model?: string;            // 默认模型
  timeout?: number;          // 请求超时（毫秒）
  endpoints?: {              // 自定义端点
    chat?: string;
    models?: string;
  };
  auth?: {                   // 认证配置
    type: 'bearer' | 'query_param' | 'custom';
    paramName?: string;      // 查询参数名（用于 query_param）
    applyAuthFn?: Function;  // 自定义认证函数
  };
  request?: {                // 请求格式化配置
    type: 'openai_compatible' | 'gemini' | 'ollama' | 'custom';
    formatFn?: Function;     // 自定义格式化函数
  };
  response?: {               // 响应解析配置
    type: 'openai_compatible' | 'gemini' | 'ollama' | 'custom';
    parseStreamFn?: Function;  // 自定义流解析函数
    parseFullFn?: Function;    // 自定义完整响应解析函数
  };
  cors?: {                   // CORS 配置（详见 CORS 指南）
    enabled?: boolean;       // 是否启用 CORS 代理
    proxyUrl?: string;       // 代理服务器 URL
    headers?: Record<string, string>;  // 自定义请求头
    withCredentials?: boolean;  // 是否包含凭证
  };
}
```

### 聊天请求选项

```typescript
interface ChatRequest {
  userMessage: string;        // 用户消息
  systemMessage?: string;     // 系统消息
  history?: ChatMessage[];    // 历史对话
  options?: {
    temperature?: number;     // 温度参数 (0-1)
    maxTokens?: number;      // 最大生成令牌数
    [key: string]: any;      // 其他自定义选项
  };
}
```

## URL 构建机制

### URL 处理规则

API 包智能处理 baseUrl 和 endpoint 的组合：

1. **绝对路径端点**（以 `/` 开头）：直接拼接到 baseUrl
   ```typescript
   baseUrl: 'https://api.example.com/v1'
   endpoint: '/chat/completions'
   结果: 'https://api.example.com/v1/chat/completions'
   ```

2. **相对路径端点**：使用标准 URL 解析
   ```typescript
   baseUrl: 'https://api.example.com/v1'
   endpoint: 'chat/completions'
   结果: 'https://api.example.com/v1/chat/completions'
   ```

3. **特殊占位符**：支持动态替换
   ```typescript
   endpoint: '/v1beta/models/{model}:generateContent'
   model: 'gemini-pro'
   结果: '/v1beta/models/gemini-pro:generateContent'
   ```

### Gemini API 特殊处理

Gemini API 使用查询参数认证，API 包会自动处理：

- 自动在 URL 添加 `?key=YOUR_API_KEY`
- 流式请求自动转换端点：`:generateContent` → `:streamGenerateContent`
- 不在请求体中包含 `stream` 字段

## 错误处理

### 错误类型

```typescript
// 基础错误类
class LLMClientError extends Error

// 连接错误（网络问题、超时等）
class ConnectionError extends LLMClientError

// 认证错误（无效的 API 密钥等）
class AuthenticationError extends LLMClientError

// 请求格式错误（参数验证失败等）
class RequestFormatError extends LLMClientError

// 响应解析错误（无法解析响应数据）
class ResponseParseError extends LLMClientError
```

### 错误处理示例

```typescript
try {
  const response = await client.chat({
    userMessage: 'Hello'
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('认证失败，请检查 API 密钥');
  } else if (error instanceof ConnectionError) {
    console.error('连接失败，请检查网络');
  } else if (error instanceof RequestFormatError) {
    console.error('请求格式错误');
  } else {
    console.error('未知错误:', error);
  }
}
```

## Core 包集成指南

### 在 Core 包中使用

1. **创建客户端实例**

```typescript
// 在 Core 包的 llmService.ts 中
import { createClient, LLMClient } from '@prompt-booster/api';

export class LLMService {
  private clients: Map<string, LLMClient> = new Map();

  createClient(modelId: string, config: ModelConfig): LLMClient {
    const client = createClient({
      provider: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      timeout: config.timeout
    });
    
    this.clients.set(modelId, client);
    return client;
  }
}
```

2. **处理流式响应**

```typescript
// 在 Core 包中处理流式响应
async streamChat(request: ChatRequest): Promise<void> {
  const client = this.getClient(modelId);
  
  const streamHandler = {
    onData: (chunk: string) => {
      // 更新版本内容
      this.updateVersionContent(chunk);
    },
    onError: (error: Error) => {
      // 错误处理
      console.error('Stream error:', error);
    },
    onComplete: () => {
      // 完成处理
      this.finalizeVersion();
    }
  };
  
  await client.streamChat(request, streamHandler);
}
```

3. **测试连接**

```typescript
// 测试 API 连接
async testConnection(config: ModelConfig): Promise<boolean> {
  try {
    const client = createClient(config);
    const result = await client.testConnection();
    return result.data.success;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
```

### 调试技巧

1. **启用日志**

```typescript
import { enableLogging, disableLogging } from '@prompt-booster/api';

// 在开发环境启用日志
if (process.env.NODE_ENV === 'development') {
  enableLogging();
}

// 生产环境禁用日志
if (process.env.NODE_ENV === 'production') {
  disableLogging();
}
```

2. **检查请求详情**

```typescript
// 日志会显示：
// [DEBUG] LLMClient: Sending chat request to /v1/chat/completions
// [DEBUG] LLMClient: Response content type: text/event-stream
```

3. **常见问题排查**

- **403 错误**：检查 API 密钥和 baseUrl 是否正确
- **CORS 错误**：确认 baseUrl 格式正确（包含协议），或尝试启用 CORS 代理
- **流式响应中断**：检查 AbortController 是否被意外触发

## 扩展开发

### 注册新提供商（推荐）

使用 `ProviderRegistry` 动态注册，无需修改源码：

```typescript
import { ProviderRegistry, createClient } from '@prompt-booster/api';

ProviderRegistry.register('my-llm', {
  providerName: 'My LLM',
  baseUrl: 'https://api.my-llm.com/v1',
  endpoints: {
    chat: '/chat/completions',
    models: '/models'
  },
  defaultModel: 'my-model',
  timeout: 60000,
  auth: { type: 'bearer' },
  request: { type: 'openai_compatible' },
  response: { type: 'openai_compatible' }
});

// 直接使用
const client = createClient({
  provider: 'my-llm',
  apiKey: 'xxx'
});
```

### 自定义策略（高级）

如果需要完全自定义的格式，可以实现策略接口：

```typescript
import { RequestFormatter, ResponseParser, ChatRequest, ChatResponse } from '@prompt-booster/api';

// 自定义请求格式化
class MyProviderRequestFormatter implements RequestFormatter {
  formatRequest(request: ChatRequest): any {
    return {
      prompt: request.userMessage,
      system: request.systemMessage,
      // 自定义格式
    };
  }
}

// 自定义响应解析
class MyProviderResponseParser implements ResponseParser {
  parseStreamChunk(chunk: any): string | null {
    // 解析流式数据
    return chunk.text;
  }
  
  parseFullResponse(response: any): ChatResponse {
    // 解析完整响应
    return {
      content: response.result,
      usage: response.tokens
    };
  }
}
```

## 性能优化建议

1. **连接复用**：在 Core 包中缓存客户端实例
2. **流式优先**：对于长文本生成，优先使用流式接口
3. **合理超时**：根据模型响应时间设置合适的超时值
4. **错误重试**：对于网络错误，实现指数退避重试

## 版本历史

### v2.0.0（重构版本）

**重大改进**：

- 📦 **精简文件结构**
  - 文件数量从 22 个减少到 13 个（减少 40%）
  - 删除所有纯导出的 index.ts 文件
  - 合并 config 和 types 目录为单文件
  - 目录层级更扁平，导入路径更简洁

- 🔌 **新增扩展功能**
  - `ProviderRegistry` - 动态注册自定义提供商
  - `Validators` - 配置和请求验证工具
  - 导出所有策略类，支持高级自定义
  - 导出工具函数（CORS、流处理、日志等）

- 📝 **完善文档**
  - 所有公共 API 都有完整的 JSDoc 注释
  - 添加详细的使用示例和参数说明
  - 更新架构设计文档

- ✅ **API 优化**
  - `setApiLogging(boolean)` → `enableLogging()` / `disableLogging()`
  - 移除内部调试函数导出（`logDebug`、`isLoggingEnabled`）
  - 更专业的命名约定

**向后兼容性**：
- ✅ 完全向后兼容，现有代码无需修改
- ✅ 所有现有导入都正常工作
- ⚠️ 建议更新：`setApiLogging(false)` → `disableLogging()`

**迁移指南**：

如果你使用了旧的日志 API，建议更新为：

```typescript
// v1.x 方式（仍然有效，但不推荐）
import { setApiLogging } from '@prompt-booster/api';
setApiLogging(false);

// v2.0 推荐方式
import { enableLogging, disableLogging } from '@prompt-booster/api';
disableLogging();
```

其他所有 API 保持不变，无需修改。

---

### v1.2.0
- 优化 URL 构建机制
- 修复 Gemini 认证问题

### v1.1.0
- 添加流式响应支持

### v1.0.0
- 初始版本，支持基础功能

## 许可证

MIT License

---

如有问题或建议，请提交 Issue 或 Pull Request。