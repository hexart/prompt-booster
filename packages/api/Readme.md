# @prompt-booster/api 使用指南

## 简介

`@prompt-booster/api` 是一个轻量级、灵活的客户端库，用于与各种大语言模型(LLM)服务进行通信。本库采用策略模式设计，支持多种LLM提供商（如OpenAI、Gemini、DeepSeek、Ollama等），并提供统一的接口。

## 核心特性

- 统一接口：所有LLM服务使用相同的API接口
- 多提供商支持：内置支持多种LLM服务提供商
- 流式响应：支持流式输出，实时接收AI生成内容
- 灵活配置：可自定义认证、请求格式和响应解析
- 错误处理：统一的错误处理机制
- 类型安全：完整的TypeScript类型支持

## 安装

```bash
npm install @prompt-booster/api
```

## 基本用法

### 创建客户端

使用`createClient`函数创建一个标准化的LLM客户端：

```typescript
import { createClient } from '@prompt-booster/api';

const client = createClient({
  provider: 'openai', // 提供商类型：'openai'、'gemini'、'deepseek'、'ollama'、'custom'
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com', // 可选，默认根据提供商设置
  model: 'gpt-3.5-turbo', // 模型名称
  endpoints: { // 可选，自定义端点
    chat: '/v1/chat/completions',
    models: '/v1/models'
  }
});
```

### 发送聊天请求

```typescript
// 常规聊天请求
const response = await client.chat({
  userMessage: '你好，请介绍一下自己',
  systemMessage: '你是一个有用的助手', // 可选
  options: { // 可选
    temperature: 0.7,
    maxTokens: 500
  }
});

console.log(response.data.content); // 输出AI的回复
```

### 流式聊天请求

```typescript
import { createStreamHandler } from '@prompt-booster/api';

// 创建流处理器
const streamHandler = createStreamHandler(
  // 处理每个数据块
  (chunk: string) => {
    console.log('收到数据:', chunk);
    // 更新UI或处理数据
  },
  // 处理错误(可选)
  (error: Error) => {
    console.error('流处理错误:', error);
    // 处理错误
  },
  // 完成回调(可选)
  () => {
    console.log('流处理完成');
    // 完成后的操作
  }
);

// 发送流式请求
await client.streamChat({
  userMessage: '你好，请介绍一下自己',
  systemMessage: '你是一个有用的助手', // 可选
  options: { // 可选
    temperature: 0.7
  }
}, streamHandler);
```

### 测试连接

```typescript
import { testConnection } from '@prompt-booster/api';

// 测试API连接
const result = await testConnection(client, 3); // 第二个参数是重试次数

if (result.data.success) {
  console.log('连接成功:', result.data.message);
} else {
  console.error('连接失败:', result.data.message);
}
```

## 高级用法

### 使用简化的创建方法

```typescript
import { createLLMClient } from '@prompt-booster/api';

// 使用更简洁的配置创建客户端
const client = createLLMClient(
  'openai',
  'your-api-key',
  {
    model: 'gpt-4',
    baseUrl: 'https://api.openai.com' // 可选
  }
);
```

### React组件中的用法

```typescript
import React, { useState } from 'react';
import { createClient, createStreamHandler } from '@prompt-booster/api';

const ChatComponent = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = async () => {
    setIsLoading(true);
    setResponse('');
    
    const client = createClient({
      provider: 'openai',
      apiKey: process.env.REACT_APP_OPENAI_KEY,
      model: 'gpt-3.5-turbo'
    });
    
    try {
      await client.streamChat({
        userMessage: input
      }, createStreamHandler(
        (chunk) => setResponse(prev => prev + chunk),
        (error) => {
          console.error('错误:', error);
          setIsLoading(false);
        },
        () => setIsLoading(false)
      ));
    } catch (error) {
      console.error('请求错误:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage} disabled={isLoading}>发送</button>
      <div>{response || (isLoading ? '加载中...' : '')}</div>
    </div>
  );
};
```

### 自定义提供商

```typescript
import { createClient } from '@prompt-booster/api';

// 创建自定义LLM服务客户端
const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'http://your-custom-llm-service.com',
  model: 'your-model-name',
  endpoints: {
    chat: '/api/chat',
    models: '/api/models'
  },
  auth: {
    type: 'bearer', // 'bearer', 'query_param', 'custom'
    // 自定义认证参数
  },
  request: {
    type: 'openai_compatible', // 'openai_compatible', 'gemini', 'custom'
    // 自定义请求格式参数
  },
  response: {
    type: 'openai_compatible', // 'openai_compatible', 'gemini', 'custom'
    // 自定义响应解析参数
  }
});
```

## 错误处理

```typescript
try {
  const response = await client.chat({
    userMessage: '你好'
  });
  
  if (response.error) {
    console.error('API错误:', response.error);
    // 处理API错误
  } else {
    console.log('响应:', response.data.content);
  }
} catch (error) {
  console.error('请求失败:', error);
  // 处理网络或其他错误
}
```

## 最佳实践

1. **重用客户端**: 创建一次客户端实例，在多个请求中重用它。

2. **合理设置超时**: 对于流式请求，设置适当的超时时间，避免等待时间过长。

3. **设置适当的温度**: 温度参数(temperature)控制响应的随机性，较低的值(如0.2)更确定性，较高的值(如0.8)更创造性。

4. **错误处理**: 始终包含错误处理逻辑，特别是在生产环境中。

5. **内容安全**: 始终验证和清理用户输入，避免注入攻击。

6. **响应处理**: 对流式响应进行适当的处理，考虑连接中断的情况。

## 性能优化

1. **使用流式响应**: 对于长回复，使用流式响应提供更好的用户体验。

2. **控制令牌数量**: 使用`maxTokens`限制生成的令牌数，节省成本并加快响应时间。

3. **缓存结果**: 对于频繁使用的提示，考虑缓存结果。

4. **请求批处理**: 如果适用，考虑批量发送请求，而不是多个单独的请求。

## 故障排除

### 连接问题

如果遇到连接问题，请检查:

- API密钥是否正确
- 基础URL是否正确
- 网络连接是否可用
- 防火墙或代理设置

### 响应解析错误

如果遇到响应解析错误，请检查:

- 提供商类型是否正确
- 响应解析器是否与提供商匹配
- 自定义解析逻辑是否正确