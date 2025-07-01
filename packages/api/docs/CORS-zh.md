# CORS 配置使用指南

[English](CORS.md)

## 概述

`@prompt-booster/api` 包提供了内置的 CORS（跨域资源共享）支持，帮助您连接受浏览器同源策略限制的 LLM 接口。这对于连接本地部署的模型服务（如 Ollama）或某些自定义 API 端点特别有用。

## 什么时候需要 CORS 配置？

当您在浏览器环境中遇到以下错误时，说明需要配置 CORS：

```
Access to fetch at 'http://localhost:11434/api/chat' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on 
the requested resource.
```

常见需要 CORS 的场景：
- 连接本地运行的 LLM 服务（如 `http://localhost:11434`）
- 连接未配置 CORS 头的自定义 API
- 开发环境中的跨域请求

## 基本使用

### 1. 简单启用 CORS

最简单的方式是在创建客户端时启用 CORS：

```typescript
import { createClient } from '@prompt-booster/api';

const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  cors: {
    enabled: true  // 启用 CORS 代理
  }
});
```

这将使用默认的 CORS 代理服务器来转发请求。

### 2. 指定代理服务器

如果默认代理不可用或您有自己的代理服务器：

```typescript
const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:8080',
  model: 'custom-model',
  cors: {
    enabled: true,
    proxyUrl: 'https://cors-anywhere.herokuapp.com'  // 指定代理服务器
  }
});
```

### 3. 添加自定义请求头

您可以使用 CORS 配置来添加自定义请求头，即使不启用 CORS 代理：

```typescript
// 同时使用 CORS 代理和自定义头
const clientWithProxy = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com',
  model: 'custom-model',
  cors: {
    enabled: true,  // 使用 CORS 代理
    headers: {
      'X-Custom-Header': 'value',
      'X-API-Version': '2.0'
    }
  }
});

// 仅添加自定义头，不使用 CORS 代理
const clientHeadersOnly = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com',
  model: 'custom-model',
  cors: {
    enabled: false,  // 不使用 CORS 代理
    headers: {       // 仍然会添加这些请求头
      'X-Custom-Header': 'value',
      'X-API-Version': '2.0'
    }
  }
});
```

### 4. 包含凭证（Cookies）

如果 API 需要身份验证 cookies：

```typescript
const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://internal-api.company.com',
  model: 'internal-model',
  cors: {
    enabled: true,
    withCredentials: true,  // 发送 cookies
    headers: {
      'X-CSRF-Token': 'your-csrf-token'
    }
  }
});
```

## 配置选项详解

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `false` | 是否启用 CORS 代理 |
| `proxyUrl` | `string` | 见下方 | 代理服务器 URL |
| `headers` | `Record<string, string>` | `{}` | 额外的请求头 |
| `withCredentials` | `boolean` | `false` | 是否发送 cookies |

### 默认代理服务器

如果未指定 `proxyUrl`，将按顺序尝试以下代理：

1. `https://cors-anywhere.herokuapp.com`
2. `https://api.allorigins.win/raw?url=`
3. `https://cors-proxy.htmldriven.com/?url=`

## 实际示例

### 连接本地 Ollama

```typescript
import { createClient } from '@prompt-booster/api';

// Ollama 通常运行在 localhost:11434
const ollamaClient = createClient({
  provider: 'ollama',
  apiKey: '',  // Ollama 不需要 API key
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  cors: {
    enabled: true  // 浏览器环境需要启用 CORS
  }
});

// 使用客户端
try {
  const response = await ollamaClient.chat({
    userMessage: 'Hello, how are you?'
  });
  console.log(response.data.content);
} catch (error) {
  console.error('Error:', error);
}
```

### 连接自定义 API

```typescript
// 连接一个自定义的 OpenAI 兼容 API
const customClient = createClient({
  provider: 'custom',
  apiKey: process.env.CUSTOM_API_KEY,
  baseUrl: 'http://192.168.1.100:8000/v1',
  model: 'local-gpt',
  endpoints: {
    chat: '/chat/completions',
    models: '/models'
  },
  cors: {
    enabled: true,
    proxyUrl: process.env.CORS_PROXY_URL || 'https://cors-anywhere.herokuapp.com'
  }
});
```

### 错误处理

```typescript
async function connectWithCORS(config) {
  try {
    const client = createClient(config);
    await client.testConnection();
    console.log('连接成功！');
    return client;
  } catch (error) {
    if (error.message.includes('CORS') || error.message.includes('blocked')) {
      console.log('检测到 CORS 错误，尝试使用代理...');
      
      // 启用 CORS 代理重试
      const configWithCors = {
        ...config,
        cors: { enabled: true }
      };
      
      const clientWithProxy = createClient(configWithCors);
      await clientWithProxy.testConnection();
      console.log('使用代理连接成功！');
      return clientWithProxy;
    }
    throw error;
  }
}
```

## 重要提示

### 安全注意事项

1. **生产环境**：不建议在生产环境使用公共 CORS 代理服务
2. **敏感数据**：避免通过公共代理发送 API 密钥或其他敏感信息
3. **自建代理**：对于生产环境，建议部署自己的 CORS 代理服务器

### 性能考虑

- 使用 CORS 代理会增加请求延迟
- 公共代理可能有速率限制
- 某些代理可能不支持流式响应

### 替代方案

如果 CORS 配置无法满足需求，考虑以下替代方案：

1. **服务器端代理**：在您的后端服务器上创建代理端点
2. **配置 API 服务器**：在 API 服务器上正确配置 CORS 头
3. **使用桌面应用**：Prompt Booster 的桌面版本不受 CORS 限制

## 故障排除

### 常见问题

**Q: 启用 CORS 后仍然报错**
- 检查代理服务器是否可用
- 尝试使用其他代理服务器
- 确认 API 地址正确

**Q: 流式响应不工作**
- 某些 CORS 代理不支持 Server-Sent Events
- 尝试使用支持流式响应的代理

**Q: 请求超时**
- 代理服务器可能响应缓慢
- 增加超时时间：`timeout: 60000`

### 调试技巧

启用调试日志查看详细信息：

```typescript
import { enableApiClientLogs } from '@prompt-booster/api';

// 开发环境启用日志
if (process.env.NODE_ENV === 'development') {
  enableApiClientLogs();
}
```

日志会显示：
- 是否使用了 CORS 代理
- 实际请求的 URL
- 请求和响应的详细信息

## 示例：完整配置

```typescript
import { createClient } from '@prompt-booster/api';

// 完整的 CORS 配置示例
const client = createClient({
  // 基础配置
  provider: 'custom',
  apiKey: process.env.API_KEY,
  baseUrl: process.env.API_BASE_URL,
  model: process.env.MODEL_NAME,
  timeout: 30000,
  
  // 端点配置
  endpoints: {
    chat: '/v1/chat/completions',
    models: '/v1/models'
  },
  
  // CORS 配置
  cors: {
    enabled: process.env.ENABLE_CORS === 'true',
    proxyUrl: process.env.CORS_PROXY_URL,
    headers: {
      'X-API-Version': '2.0',
      'X-Client-Id': 'prompt-booster'
    },
    withCredentials: false
  },
  
  // 其他配置
  auth: {
    type: 'bearer'
  },
  request: {
    type: 'openai_compatible'
  },
  response: {
    type: 'openai_compatible'
  }
});
```

## 相关链接

- [MDN CORS 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [CORS Anywhere](https://github.com/Rob--W/cors-anywhere)
- [部署自己的 CORS 代理](https://github.com/Rob--W/cors-anywhere#demo-server)

---

如有其他问题，请查看项目的 [GitHub Issues](https://github.com/hexart/prompt-booster/issues) 或提交新的问题。