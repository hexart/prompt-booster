# @prompt-booster/api

[中文](README-zh.md)

## Overview

`@prompt-booster/api` is a flexible TypeScript client library for interacting with various Large Language Model (LLM) services. It provides a unified interface to access multiple AI providers, including OpenAI, Google Gemini, DeepSeek, Tencent Hunyuan, SiliconFlow, and Ollama.

### Core Features

  - 🔄 **Unified Interface**: Use the same API for all LLM services.
  - 📡 **Streaming Responses**: Supports real-time streaming of text generation.
  - 🔌 **Extensible Design**: Based on the Strategy Pattern, making it easy to add new providers.
  - 🛡️ **Comprehensive Error Handling**: A layered system of error types.
  - 🎯 **TypeScript Support**: Complete type definitions.
  - 🔧 **Flexible Configuration**: Supports custom endpoints and authentication methods.
  - 🌐 **CORS Support**: Built-in proxy support for browser environments.

## Installation

```bash
# Using pnpm (recommended)
pnpm add @prompt-booster/api

# Using npm
npm install @prompt-booster/api

# Using yarn
yarn add @prompt-booster/api
```

## Quick Start

### Basic Usage

```typescript
import { createClient } from '@prompt-booster/api';

// Create an OpenAI client
const client = createClient({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo'
});

// Send a chat request
const response = await client.chat({
  userMessage: 'Hello, please introduce yourself.',
  systemMessage: 'You are a friendly AI assistant.'
});

console.log(response.data.content);
```

### Streaming Response

```typescript
// Create a stream handler
const streamHandler = {
  onData: (chunk) => {
    process.stdout.write(chunk);
  },
  onError: (error) => {
    console.error('Stream error:', error);
  },
  onComplete: () => {
    console.log('\nStream complete');
  }
};

// Send a streaming request
await client.streamChat({
  userMessage: 'Write a short story about artificial intelligence.',
  options: {
    temperature: 0.8,
    maxTokens: 1000
  }
}, streamHandler);
```

## CORS Support

The API package includes built-in CORS proxy support for connecting to local or CORS-restricted API services in browser environments.

```typescript
// Enable CORS proxy for local services
const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:11434',
  cors: { enabled: true }
});

// Add custom headers without using proxy
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

For detailed configuration options and examples, see the [CORS Configuration Guide](./docs/CORS.md).

## Architecture Design

### Strategy Pattern

The API package is designed using the Strategy Pattern, which separates authentication, request formatting, and response parsing into independent strategies:

```
┌─────────────┐
│  LLMClient  │
├─────────────┤
│ - Auth Strategy   │ ──> Bearer / Query Param / Custom
│ - Request Strategy │ ──> OpenAI / Gemini / Ollama / Custom
│ - Response Strategy│ ──> OpenAI / Gemini / Ollama / Custom
└─────────────┘
```

### Core Components

1.  **LLMClient**: The unified client interface.
2.  **AuthStrategy**: Handles different authentication methods.
3.  **RequestFormatter**: Formats the request data.
4.  **ResponseParser**: Parses the response data.
5.  **Error Handling**: A layered system of error types.

## Supported Providers

### Built-in Providers

| Provider | Provider ID | Default Model | Authentication Method |
| :--- | :--- | :--- | :--- |
| OpenAI | `openai` | gpt-3.5-turbo | Bearer Token |
| Google Gemini | `gemini` | gemini-1.5-flash | Query Parameter |
| DeepSeek | `deepseek` | deepseek-chat | Bearer Token |
| Tencent Hunyuan | `hunyuan` | hunyuan-turbos-latest | Bearer Token |
| SiliconFlow | `siliconflow` | Qwen/Qwen2-7B-Instruct | Bearer Token |
| Ollama | `ollama` | qwen2 | No authentication required |

### Custom Interface

You can add custom interfaces that are compatible with the OpenAI API specification:

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

## Detailed Configuration

### Client Configuration Options

```typescript
interface ClientConfig {
  provider: string;           // Provider identifier
  apiKey: string;            // API key
  baseUrl?: string;          // API base URL
  model?: string;            // Default model
  timeout?: number;          // Request timeout (in milliseconds)
  endpoints?: {              // Custom endpoints
    chat?: string;
    models?: string;
  };
  auth?: {                   // Authentication configuration
    type: 'bearer' | 'query_param' | 'custom';
    paramName?: string;      // Query parameter name (for query_param)
    applyAuthFn?: Function;  // Custom authentication function
  };
  request?: {                // Request formatting configuration
    type: 'openai_compatible' | 'gemini' | 'ollama' | 'custom';
    formatFn?: Function;     // Custom formatting function
  };
  response?: {               // Response parsing configuration
    type: 'openai_compatible' | 'gemini' | 'ollama' | 'custom';
    parseStreamFn?: Function;  // Custom stream parsing function
    parseFullFn?: Function;    // Custom full response parsing function
  };
  cors?: {                   // CORS configuration (see CORS guide for details)
    enabled?: boolean;
    proxyUrl?: string;
    headers?: Record<string, string>;
    withCredentials?: boolean;
  };
}
```

### Chat Request Options

```typescript
interface ChatRequest {
  userMessage: string;        // User message
  systemMessage?: string;     // System message
  history?: ChatMessage[];    // Conversation history
  options?: {
    temperature?: number;     // Temperature parameter (0-1)
    maxTokens?: number;      // Maximum number of tokens to generate
    [key: string]: any;      // Other custom options
  };
}
```

## URL Construction Mechanism

### URL Handling Rules

The API package intelligently handles the combination of `baseUrl` and `endpoint`:

1.  **Absolute Path Endpoint** (starts with `/`): Directly appended to the `baseUrl`.

    ```typescript
    baseUrl: 'https://api.example.com/v1'
    endpoint: '/chat/completions'
    Result: 'https://api.example.com/v1/chat/completions'
    ```

2.  **Relative Path Endpoint**: Uses standard URL resolution.

    ```typescript
    baseUrl: 'https://api.example.com/v1'
    endpoint: 'chat/completions'
    Result: 'https://api.example.com/v1/chat/completions'
    ```

3.  **Special Placeholders**: Supports dynamic replacement.

    ```typescript
    endpoint: '/v1beta/models/{model}:generateContent'
    model: 'gemini-pro'
    Result: '/v1beta/models/gemini-pro:generateContent'
    ```

### Special Handling for Gemini API

The Gemini API uses a query parameter for authentication, which the API package handles automatically:

  - Automatically appends `?key=YOUR_API_KEY` to the URL.
  - Automatically converts the endpoint for streaming requests: `:generateContent` → `:streamGenerateContent`.
  - Does not include the `stream` field in the request body.

## Error Handling

### Error Types

```typescript
// Base error class
class LLMClientError extends Error

// Connection error (network issues, timeout, etc.)
class ConnectionError extends LLMClientError

// Authentication error (invalid API key, etc.)
class AuthenticationError extends LLMClientError

// Request format error (parameter validation failed, etc.)
class RequestFormatError extends LLMClientError

// Response parsing error (failed to parse response data)
class ResponseParseError extends LLMClientError
```

### Error Handling Example

```typescript
try {
  const response = await client.chat({
    userMessage: 'Hello'
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed, please check your API key.');
  } else if (error instanceof ConnectionError) {
    console.error('Connection failed, please check your network.');
  } else if (error instanceof RequestFormatError) {
    console.error('Request format error.');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Core Package Integration Guide

### Usage in Core Package

1.  **Create a Client Instance**

<!-- end list -->

```typescript
// In llmService.ts of the Core package
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

2.  **Handle Streaming Responses**

<!-- end list -->

```typescript
// Handle streaming responses in the Core package
async streamChat(request: ChatRequest): Promise<void> {
  const client = this.getClient(modelId);
  
  const streamHandler = {
    onData: (chunk: string) => {
      // Update version content
      this.updateVersionContent(chunk);
    },
    onError: (error: Error) => {
      // Error handling
      console.error('Stream error:', error);
    },
    onComplete: () => {
      // Finalize process
      this.finalizeVersion();
    }
  };
  
  await client.streamChat(request, streamHandler);
}
```

3.  **Test Connection**

<!-- end list -->

```typescript
// Test API connection
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

### Debugging Tips

1.  **Enable Logging**

<!-- end list -->

```typescript
import { enableApiClientLogs } from '@prompt-booster/api';

// Enable logs in the development environment
if (process.env.NODE_ENV === 'development') {
  enableApiClientLogs();
}
```

2.  **Check Request Details**

<!-- end list -->

```typescript
// Logs will show:
// [DEBUG] LLMClient: Sending chat request to /v1/chat/completions
// [DEBUG] LLMClient: Response content type: text/event-stream
```

3.  **Common Issues Troubleshooting**

<!-- end list -->

  - **403 Error**: Check if the `apiKey` and `baseUrl` are correct.
  - **CORS Error**: Ensure the `baseUrl` format is correct (including the protocol), or try enabling the CORS proxy.
  - **Stream Interruption**: Check if the `AbortController` is being triggered unexpectedly.

## Extending the Library

### Adding a New Provider

1.  **Add Configuration in `constants.ts`**

<!-- end list -->

```typescript
export const PROVIDER_CONFIG = {
  myProvider: {
    providerName: 'My Provider',
    baseUrl: 'https://api.myprovider.com',
    endpoints: {
      chat: '/v1/chat',
      models: '/v1/models'
    },
    defaultModel: 'my-model',
    auth: { type: AuthType.BEARER },
    request: { type: RequestFormatType.OPENAI_COMPATIBLE },
    response: { type: ResponseParseType.OPENAI_COMPATIBLE }
  }
};
```

2.  **Custom Strategies**

<!-- end list -->

```typescript
// Custom request formatter
class MyProviderRequestFormatter implements RequestFormatter {
  formatRequest(request: ChatRequest): any {
    return {
      prompt: request.userMessage,
      system: request.systemMessage,
      // Custom format
    };
  }
}

// Custom response parser
class MyProviderResponseParser implements ResponseParser {
  parseStreamChunk(chunk: any): string | null {
    // Parse streaming data
    return chunk.text;
  }
  
  parseFullResponse(response: any): ChatResponse {
    // Parse full response
    return {
      content: response.result,
      usage: response.tokens
    };
  }
}
```

## Performance Optimization Suggestions

1.  **Connection Re-use**: Cache client instances in the Core package.
2.  **Streaming First**: Prioritize using the streaming interface for long text generation.
3.  **Reasonable Timeout**: Set appropriate timeout values based on model response times.
4.  **Error Retries**: Implement exponential backoff for network-related errors.

## Version History

  - **1.0.0**: Initial release with basic features.
  - **1.1.0**: Added support for streaming responses.
  - **1.2.0**: Optimized URL construction mechanism and fixed Gemini authentication issue.

## License

MIT License

-----

If you have any questions or suggestions, please submit an Issue or Pull Request.