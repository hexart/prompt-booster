# @prompt-booster/api

[English](README.md)

一个灵活且可扩展的客户端库，通过统一接口与各种大型语言模型(LLM)服务交互。

## 目录

1. [概述](#概述)
2. [安装](#安装)
3. [架构](#架构)
4. [主要特性](#主要特性)
5. [支持的LLM提供商](#支持的llm提供商)
6. [使用示例](#使用示例)
7. [API参考](#api参考)
8. [高级配置](#高级配置)
9. [错误处理](#错误处理)
10. [流式响应](#流式响应)
11. [工具函数](#工具函数)

## 概述

`@prompt-booster/api` 是一个统一的客户端库，通过一致的接口与各种AI模型提供商交互。它抽象了不同LLM服务API之间的差异，提供了一种简洁、一致的方式与来自OpenAI、Google Gemini、DeepSeek、腾讯混元、SiliconFlow和Ollama的模型进行交互。

该包实现了策略模式，使其易于适应不同的提供商API，同时为您的应用程序维护一致的接口。这种抽象允许您的应用程序以最小的代码更改在提供商之间切换。

## 安装

```bash
# 使用npm
npm install @prompt-booster/api

# 使用pnpm
pnpm add @prompt-booster/api

# 使用yarn
yarn add @prompt-booster/api
```

## 架构

该包遵循基于策略模式的模块化架构：

```markdown
api/
├── client/        # 核心LLM客户端实现
├── config/        # 配置常量和模型
├── strategies/    # 不同提供商的策略实现
│   ├── auth.ts    # 认证策略
│   ├── request.ts # 请求格式化策略
│   └── response.ts# 响应解析策略
├── types/         # TypeScript类型定义
├── utils/         # 工具函数
│   ├── apiLogging.ts # API日志控制工具
│   └── stream.ts     # 流处理工具
└── factory.ts     # 客户端工厂函数
```

该架构允许轻松扩展和自定义，使您能够：

- 添加对新LLM提供商的支持
- 自定义请求/响应处理
- 实现自定义认证策略
- 控制API层的日志输出

## 主要特性

- **统一接口**：通过单一API与多个LLM提供商交互
- **提供商支持**：预配置支持OpenAI、Gemini、DeepSeek、腾讯混元、SiliconFlow和Ollama
- **流式响应**：支持带有易用处理器的流式响应
- **认证**：多种认证策略（Bearer令牌、查询参数、自定义）
- **错误处理**：标准化的错误处理和报告
- **重试逻辑**：内置的临时故障重试机制
- **日志控制**：可控制的API层日志输出
- **类型安全**：全面的TypeScript类型定义

## 支持的LLM提供商

该包内置支持以下提供商：

- **OpenAI** - 与GPT模型API兼容
- **Google Gemini** - 支持Gemini Pro和Ultra模型
- **DeepSeek** - 支持DeepSeek Chat和Coder模型
- **腾讯混元(Hunyuan)** - 腾讯的混元模型
- **SiliconFlow** - 支持SiliconFlow的模型，如Qwen/QwQ
- **Ollama** - 用于使用Ollama进行本地模型托管

每个提供商都配置了合理的默认值，但所有方面都可以自定义。

### 支持的模型

该包内置了对以下模型的令牌限制支持：

- **OpenAI模型**：
  - gpt-4 (8192 tokens)
  - gpt-4-turbo (128000 tokens)
  - gpt-3.5-turbo (4096 tokens)
  - gpt-3.5-turbo-16k (16384 tokens)

- **Google模型**：
  - gemini-pro (8192 tokens)
  - gemini-ultra (32768 tokens)

- **DeepSeek模型**：
  - deepseek-chat (8192 tokens)
  - deepseek-coder (16384 tokens)

- **Ollama模型**：
  - qwq (32768 tokens)
  - qwen3 (32768 tokens)
  - qwen3:32b (32768 tokens)
  - qwq:latest (32768 tokens)

## 使用示例

### 基本用法

创建客户端并发送聊天请求：

```typescript
import { createClient } from '@prompt-booster/api';

const client = createClient({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo'
});

async function getResponse() {
  const response = await client.chat({
    userMessage: '解释软件设计中的策略模式概念',
    systemMessage: '你是一个有帮助的编程助手'
  });
  
  console.log(response.data.content);
}

getResponse();
```

### 流式响应

处理来自模型的流式响应：

```typescript
import { createClient, createStreamHandler } from '@prompt-booster/api';

const client = createClient({
  provider: 'gemini',
  apiKey: 'your-api-key',
  model: 'gemini-pro'
});

async function streamResponse() {
  const handler = createStreamHandler(
    // 处理响应的每个数据块
    (chunk) => {
      process.stdout.write(chunk);
    },
    // 处理错误
    (error) => {
      console.error('流错误:', error);
    },
    // 处理完成
    () => {
      console.log('\n流完成');
    }
  );
  
  await client.streamChat({
    userMessage: '写一首关于编程的短诗',
    systemMessage: '你是一个创意写作助手'
  }, handler);
}

streamResponse();
```

### 使用简化的客户端工厂

为常见提供商使用简化的工厂：

```typescript
import { createLLMClient } from '@prompt-booster/api';

// 使用最小配置创建客户端
const client = createLLMClient(
  'openai',
  'your-api-key',
  { model: 'gpt-4-turbo' }
);

// 正常使用客户端
async function askQuestion() {
  const response = await client.chat({
    userMessage: 'TypeScript的主要特性是什么？'
  });
  
  console.log(response.data.content);
}

askQuestion();
```

## API参考

### 主要工厂函数

#### `createClient(config: ClientConfig): LLMClient`

创建一个具有详细配置的新LLM客户端实例。

```typescript
const client = createClient({
  provider: 'openai',      // 提供商名称
  apiKey: 'your-api-key',  // API密钥/令牌
  baseUrl: 'https://api.openai.com', // 可选：基础URL覆盖
  model: 'gpt-4-turbo',    // 模型名称
  timeout: 60000,          // 可选：超时时间(毫秒)
  endpoints: {             // 可选：自定义端点
    chat: '/v1/chat/completions',
    models: '/v1/models'
  },
  auth: {                  // 可选：认证配置
    type: 'bearer'         // 'bearer', 'query_param', 或 'custom'
  },
  request: {               // 可选：请求格式化配置
    type: 'openai_compatible'
  },
  response: {              // 可选：响应解析配置
    type: 'openai_compatible'
  }
});
```

#### `createLLMClient(provider: string, apiKey: string, options?: object): LLMClient`

使用提供商默认值的简化客户端创建。

```typescript
const client = createLLMClient(
  'gemini',          // 提供商名称
  'your-api-key',    // API密钥
  {
    model: 'gemini-pro',  // 可选：模型覆盖
    baseUrl: 'https://custom-url.com'  // 可选：URL覆盖
  }
);
```

### 核心接口

#### `LLMClient`

与LLM服务交互的主要客户端接口。

```typescript
interface LLMClient {
  // 发送聊天请求(非流式)
  chat(request: ChatRequest): Promise<ClientResponse<ChatResponse>>;
  
  // 发送流式聊天请求
  streamChat(request: ChatRequest, streamHandler: StreamHandler): Promise<void>;
  
  // 从提供商获取可用模型
  getModels(): Promise<Array<{ id: string; name?: string }>>;
}
```

#### `ChatRequest`

聊天请求的结构。

```typescript
interface ChatRequest {
  userMessage: string;             // 用户消息
  systemMessage?: string;          // 可选的系统消息/指令
  history?: ChatMessage[];         // 可选的聊天历史
  options?: {                      // 可选参数
    temperature?: number;          // 创造性(0-1)
    maxTokens?: number;            // 最大响应长度
    [key: string]: any;            // 其他提供商特定选项
  };
}
```

#### `ChatResponse`

聊天响应的结构。

```typescript
interface ChatResponse {
  content: string;                 // 响应文本
  usage?: {                        // 可选的令牌使用数据
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  model?: string;                  // 使用的模型
  meta?: Record<string, any>;      // 额外的元数据
}
```

#### `StreamHandler`

处理流式响应的接口。

```typescript
interface StreamHandler {
  onData(chunk: string): void;      // 处理数据块
  onError?(error: Error): void;     // 处理错误(可选)
  onComplete?(): void;              // 处理完成(可选)
  abortController?: AbortController; // 用于取消(可选)
}
```

## 高级配置

### 自定义认证

实现自定义认证：

```typescript
import { createClient, AuthType } from '@prompt-booster/api';

const client = createClient({
  provider: 'custom-provider',
  apiKey: 'your-api-key',
  baseUrl: 'https://custom-api.com',
  model: 'custom-model',
  auth: {
    type: AuthType.CUSTOM,
    applyAuthFn: (config) => {
      // 自定义认证逻辑
      config.headers = config.headers || {};
      config.headers['X-Custom-Auth'] = `Token ${apiKey}`;
      return config;
    }
  }
});
```

### 自定义请求格式化

实现自定义请求格式化：

```typescript
import { createClient, RequestFormatType } from '@prompt-booster/api';

const client = createClient({
  // 基本配置...
  request: {
    type: RequestFormatType.CUSTOM,
    formatFn: (request) => {
      // 自定义请求格式逻辑
      return {
        query: request.userMessage,
        instructions: request.systemMessage,
        params: {
          temp: request.options?.temperature || 0.7
        }
      };
    }
  }
});
```

### 自定义响应解析

实现自定义响应解析：

```typescript
import { createClient, ResponseParseType } from '@prompt-booster/api';

const client = createClient({
  // 基本配置...
  response: {
    type: ResponseParseType.CUSTOM,
    parseStreamFn: (chunk) => {
      // 解析流数据块
      if (typeof chunk === 'string') return chunk;
      if (chunk.output) return chunk.output;
      return null;
    },
    parseFullFn: (response) => {
      // 解析完整响应
      return {
        content: response.generated_text || '',
        usage: {
          totalTokens: response.usage?.total || 0
        }
      };
    }
  }
});
```

## 错误处理

该包包含一个标准化的错误系统：

```typescript
import { createClient, LLMClientError, ConnectionError, AuthenticationError } from '@prompt-booster/api';

async function handleErrors() {
  const client = createClient({
    provider: 'openai',
    apiKey: 'your-api-key',
    model: 'gpt-4-turbo'
  });
  
  try {
    const response = await client.chat({
      userMessage: '你好，世界！'
    });
    
    console.log(response.data.content);
  } catch (error) {
    if (error instanceof LLMClientError) {
      console.error('LLM客户端错误:', error.message);
    } else if (error instanceof ConnectionError) {
      console.error('连接错误:', error.message);
    } else if (error instanceof AuthenticationError) {
      console.error('认证错误:', error.message);
    } else {
      console.error('未知错误:', error);
    }
  }
}
```

## 流式响应

该包提供了强大的工具用于处理流式响应：

```typescript
import { 
  createClient, 
  createStreamHandler, 
  StreamFormat 
} from '@prompt-booster/api';

async function advancedStreaming() {
  const client = createClient({
    // 基本配置...
  });
  
  // 创建中断控制器
  const abortController = new AbortController();
  
  // 设置10秒后取消流的超时
  setTimeout(() => {
    abortController.abort();
  }, 10000);
  
  const handler = createStreamHandler(
    (chunk) => {
      console.log('数据块:', chunk);
    },
    (error) => {
      console.error('错误:', error);
    },
    () => {
      console.log('流完成');
    }
  );
  
  // 附加中断控制器
  handler.abortController = abortController;
  
  try {
    await client.streamChat({
      userMessage: '讲一个很长的故事'
    }, handler);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('流被中断');
    } else {
      console.error('流错误:', error);
    }
  }
}
```

## 工具函数

该包包含几个有用的工具函数：


### API日志控制

```typescript
import { 
  enableApiClientLogs,
  disableApiClientLogs,
  isLoggingEnabled
} from '@prompt-booster/api';

// 检查当前日志状态
console.log('日志已启用:', isLoggingEnabled());

// 启用API客户端调试日志
enableApiClientLogs();

// 执行API操作，将显示详细日志
const client = createClient({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo'
});

await client.chat({
  userMessage: '你好'
});

// 为生产环境禁用日志
disableApiClientLogs();

// 再次执行操作，不会显示调试日志
await client.chat({
  userMessage: '再次你好'
});
```

### 模型令牌限制

```typescript
import { getMaxTokensForModel } from '@prompt-booster/api';

// 获取特定模型的令牌限制
const gpt4Limit = getMaxTokensForModel('gpt-4-turbo');
console.log(`GPT-4 Turbo令牌限制: ${gpt4Limit}`);

// 使用默认回退值
const unknownModelLimit = getMaxTokensForModel('unknown-model', 4096);
console.log(`未知模型令牌限制: ${unknownModelLimit}`);
```

## 日志控制说明

API包提供了细粒度的日志控制功能，允许您在开发和生产环境中灵活控制日志输出：

### 日志控制函数

- **`enableApiClientLogs()`** - 启用API客户端的详细调试日志
- **`disableApiClientLogs()`** - 禁用API客户端的调试日志
- **`isLoggingEnabled()`** - 检查当前日志启用状态

### 使用场景

**开发环境**: 启用日志以便调试和监控API调用
```typescript
enableApiClientLogs();
// 执行开发和测试操作
```

**生产环境**: 禁用日志以减少控制台输出和提高性能
```typescript
disableApiClientLogs();
// 执行生产操作
```

**条件日志**: 根据环境变量或配置动态控制
```typescript
if (process.env.NODE_ENV === 'development') {
  enableApiClientLogs();
} else {
  disableApiClientLogs();
}
```

### 注意事项

- 日志控制是全局的，影响所有API客户端实例
- 日志状态在应用程序生命周期内保持，除非显式更改
- 日志输出包括请求详情、响应状态和错误信息
- 建议在生产环境中禁用日志以避免敏感信息泄露

## 许可证

本项目采用MIT许可证和Apache许可证2.0的双重许可。详情请参阅项目根目录的许可证文件。