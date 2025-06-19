# @prompt-booster/api

[中文文档](README-zh.md)

A flexible and extensible client library for interacting with various Large Language Model (LLM) services through a unified interface.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Architecture](#architecture)
4. [Key Features](#key-features)
5. [Supported LLM Providers](#supported-llm-providers)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Advanced Configuration](#advanced-configuration)
9. [Error Handling](#error-handling)
10. [Streaming Responses](#streaming-responses)
11. [Utility Functions](#utility-functions)

## Overview

`@prompt-booster/api` is a unified client library that interacts with various AI model providers through a consistent interface. It abstracts the differences between different LLM service APIs, providing a clean and consistent way to interact with models from OpenAI, Google Gemini, DeepSeek, Tencent Hunyuan, SiliconFlow, and Ollama.

The package implements the Strategy Pattern, making it easy to adapt to different provider APIs while maintaining a consistent interface for your applications. This abstraction allows your application to switch between providers with minimal code changes.

## Installation

```bash
# Using npm
npm install @prompt-booster/api

# Using pnpm
pnpm add @prompt-booster/api

# Using yarn
yarn add @prompt-booster/api
```

## Architecture

The package follows a modular architecture based on the Strategy Pattern:

```markdown
api/
├── client/        # Core LLM client implementation
├── config/        # Configuration constants and models
├── strategies/    # Strategy implementations for different providers
│   ├── auth.ts    # Authentication strategies
│   ├── request.ts # Request formatting strategies
│   └── response.ts# Response parsing strategies
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
│   ├── apiLogging.ts # API logging control utilities
│   └── stream.ts     # Stream processing utilities
└── factory.ts     # Client factory functions
```

This architecture allows for easy extension and customization, enabling you to:

- Add support for new LLM providers
- Customize request/response handling
- Implement custom authentication strategies
- Control logging output at the API layer

## Key Features

- **Unified Interface**: Interact with multiple LLM providers through a single API
- **Provider Support**: Pre-configured support for OpenAI, Gemini, DeepSeek, Tencent Hunyuan, SiliconFlow, and Ollama
- **Streaming Responses**: Support for streaming responses with easy-to-use handlers
- **Authentication**: Multiple authentication strategies (Bearer tokens, query parameters, custom)
- **Error Handling**: Standardized error handling and reporting
- **Retry Logic**: Built-in retry mechanisms for transient failures
- **Logging Control**: Controllable API layer logging output
- **Type Safety**: Comprehensive TypeScript type definitions

## Supported LLM Providers

The package includes built-in support for the following providers:

- **OpenAI** - Compatible with GPT model APIs
- **Google Gemini** - Support for Gemini Pro and Ultra models
- **DeepSeek** - Support for DeepSeek Chat and Coder models
- **Tencent Hunyuan** - Tencent's Hunyuan models
- **SiliconFlow** - Support for SiliconFlow models like Qwen/QwQ
- **Ollama** - For local model hosting using Ollama

Each provider is configured with sensible defaults, but all aspects can be customized.

### Supported Models

The package includes built-in token limit support for the following models:

- **OpenAI Models**:
  - gpt-4 (8192 tokens)
  - gpt-4-turbo (128000 tokens)
  - gpt-3.5-turbo (4096 tokens)
  - gpt-3.5-turbo-16k (16384 tokens)

- **Google Models**:
  - gemini-pro (8192 tokens)
  - gemini-ultra (32768 tokens)

- **DeepSeek Models**:
  - deepseek-chat (8192 tokens)
  - deepseek-coder (16384 tokens)

- **Ollama Models**:
  - qwq (32768 tokens)
  - qwen3 (32768 tokens)
  - qwen3:32b (32768 tokens)
  - qwq:latest (32768 tokens)

## Usage Examples

### Basic Usage

Create a client and send a chat request:

```typescript
import { createClient } from '@prompt-booster/api';

const client = createClient({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo'
});

async function getResponse() {
  const response = await client.chat({
    userMessage: 'Explain the concept of Strategy Pattern in software design',
    systemMessage: 'You are a helpful programming assistant'
  });
  
  console.log(response.data.content);
}

getResponse();
```

### Streaming Responses

Handle streaming responses from the model:

```typescript
import { createClient, createStreamHandler } from '@prompt-booster/api';

const client = createClient({
  provider: 'gemini',
  apiKey: 'your-api-key',
  model: 'gemini-pro'
});

async function streamResponse() {
  const handler = createStreamHandler(
    // Handle each chunk of the response
    (chunk) => {
      process.stdout.write(chunk);
    },
    // Handle errors
    (error) => {
      console.error('Streaming error:', error);
    },
    // Handle completion
    () => {
      console.log('\nStreaming completed');
    }
  );
  
  await client.streamChat({
    userMessage: 'Write a short poem about programming',
    systemMessage: 'You are a creative writing assistant'
  }, handler);
}

streamResponse();
```

### Using Simplified Client Factory

Use the simplified factory for common providers:

```typescript
import { createLLMClient } from '@prompt-booster/api';

// Create client with minimal configuration
const client = createLLMClient(
  'openai',
  'your-api-key',
  { model: 'gpt-4-turbo' }
);

// Use the client normally
async function askQuestion() {
  const response = await client.chat({
    userMessage: 'What are the main features of TypeScript?'
  });
  
  console.log(response.data.content);
}

askQuestion();
```

## API Reference

### Main Factory Functions

#### `createClient(config: ClientConfig): LLMClient`

Creates a new LLM client instance with detailed configuration.

```typescript
const client = createClient({
  provider: 'openai',      // Provider name
  apiKey: 'your-api-key',  // API key/token
  baseUrl: 'https://api.openai.com', // Optional: base URL override
  model: 'gpt-4-turbo',    // Model name
  timeout: 60000,          // Optional: timeout in milliseconds
  endpoints: {             // Optional: custom endpoints
    chat: '/chat/completions',
    models: '/models'
  },
  auth: {                  // Optional: authentication configuration
    type: 'bearer'         // 'bearer', 'query_param', or 'custom'
  },
  request: {               // Optional: request formatting configuration
    type: 'openai_compatible'
  },
  response: {              // Optional: response parsing configuration
    type: 'openai_compatible'
  }
});
```

#### `createLLMClient(provider: string, apiKey: string, options?: object): LLMClient`

Simplified client creation with provider defaults.

```typescript
const client = createLLMClient(
  'gemini',          // Provider name
  'your-api-key',    // API key
  {
    model: 'gemini-pro',  // Optional: model override
    baseUrl: 'https://custom-url.com'  // Optional: URL override
  }
);
```

### Core Interfaces

#### `LLMClient`

The main client interface for interacting with LLM services.

```typescript
interface LLMClient {
  // Send chat request (non-streaming)
  chat(request: ChatRequest): Promise<ClientResponse<ChatResponse>>;
  
  // Send streaming chat request
  streamChat(request: ChatRequest, streamHandler: StreamHandler): Promise<void>;
  
  // Get available models from the provider
  getModels(): Promise<Array<{ id: string; name?: string }>>;
}
```

#### `ChatRequest`

Structure for chat requests.

```typescript
interface ChatRequest {
  userMessage: string;             // User message
  systemMessage?: string;          // Optional system message/instructions
  history?: ChatMessage[];         // Optional chat history
  options?: {                      // Optional parameters
    temperature?: number;          // Creativity (0-1)
    maxTokens?: number;            // Maximum response length
    [key: string]: any;            // Other provider-specific options
  };
}
```

#### `ChatResponse`

Structure for chat responses.

```typescript
interface ChatResponse {
  content: string;                 // Response text
  usage?: {                        // Optional token usage data
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  model?: string;                  // Model used
  meta?: Record<string, any>;      // Additional metadata
}
```

#### `StreamHandler`

Interface for handling streaming responses.

```typescript
interface StreamHandler {
  onData(chunk: string): void;      // Handle data chunks
  onError?(error: Error): void;     // Handle errors (optional)
  onComplete?(): void;              // Handle completion (optional)
  abortController?: AbortController; // For cancellation (optional)
}
```

## Advanced Configuration

### Custom Authentication

Implement custom authentication:

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
      // Custom authentication logic
      config.headers = config.headers || {};
      config.headers['X-Custom-Auth'] = `Token ${apiKey}`;
      return config;
    }
  }
});
```

### Custom Request Formatting

Implement custom request formatting:

```typescript
import { createClient, RequestFormatType } from '@prompt-booster/api';

const client = createClient({
  // Basic configuration...
  request: {
    type: RequestFormatType.CUSTOM,
    formatFn: (request) => {
      // Custom request formatting logic
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

### Custom Response Parsing

Implement custom response parsing:

```typescript
import { createClient, ResponseParseType } from '@prompt-booster/api';

const client = createClient({
  // Basic configuration...
  response: {
    type: ResponseParseType.CUSTOM,
    parseStreamFn: (chunk) => {
      // Parse streaming data chunks
      if (typeof chunk === 'string') return chunk;
      if (chunk.output) return chunk.output;
      return null;
    },
    parseFullFn: (response) => {
      // Parse full response
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

## Error Handling

The package includes a standardized error system:

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
      userMessage: 'Hello, world!'
    });
    
    console.log(response.data.content);
  } catch (error) {
    if (error instanceof LLMClientError) {
      console.error('LLM Client Error:', error.message);
    } else if (error instanceof ConnectionError) {
      console.error('Connection Error:', error.message);
    } else if (error instanceof AuthenticationError) {
      console.error('Authentication Error:', error.message);
    } else {
      console.error('Unknown Error:', error);
    }
  }
}
```

## Streaming Responses

The package provides powerful tools for handling streaming responses:

```typescript
import { 
  createClient, 
  createStreamHandler, 
  StreamFormat 
} from '@prompt-booster/api';

async function advancedStreaming() {
  const client = createClient({
    // Basic configuration...
  });
  
  // Create abort controller
  const abortController = new AbortController();
  
  // Set timeout to cancel stream after 10 seconds
  setTimeout(() => {
    abortController.abort();
  }, 10000);
  
  const handler = createStreamHandler(
    (chunk) => {
      console.log('Chunk:', chunk);
    },
    (error) => {
      console.error('Error:', error);
    },
    () => {
      console.log('Streaming completed');
    }
  );
  
  // Attach abort controller
  handler.abortController = abortController;
  
  try {
    await client.streamChat({
      userMessage: 'Tell me a very long story'
    }, handler);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream was aborted');
    } else {
      console.error('Stream error:', error);
    }
  }
}
```

## Utility Functions

The package includes several useful utility functions:

### API Logging Control

```typescript
import { 
  enableApiClientLogs,
  disableApiClientLogs,
  isLoggingEnabled
} from '@prompt-booster/api';

// Check current logging status
console.log('Logging enabled:', isLoggingEnabled());

// Enable API client debug logs
enableApiClientLogs();

// Perform API operations, will show detailed logs
const client = createClient({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo'
});

await client.chat({
  userMessage: 'Hello'
});

// Disable logs for production
disableApiClientLogs();

// Perform operations again, no debug logs will be shown
await client.chat({
  userMessage: 'Hello again'
});
```

### Model Token Limits

```typescript
import { getMaxTokensForModel } from '@prompt-booster/api';

// Get token limit for a specific model
const gpt4Limit = getMaxTokensForModel('gpt-4-turbo');
console.log(`GPT-4 Turbo token limit: ${gpt4Limit}`);

// Use default fallback value
const unknownModelLimit = getMaxTokensForModel('unknown-model', 4096);
console.log(`Unknown model token limit: ${unknownModelLimit}`);
```

## Logging Control Details

The API package provides fine-grained logging control functionality, allowing you to flexibly control log output in development and production environments:

### Logging Control Functions

- **`enableApiClientLogs()`** - Enable detailed debug logs for API clients
- **`disableApiClientLogs()`** - Disable debug logs for API clients
- **`isLoggingEnabled()`** - Check current logging enabled status

### Use Cases

**Development Environment**: Enable logs for debugging and monitoring API calls
```typescript
enableApiClientLogs();
// Perform development and testing operations
```

**Production Environment**: Disable logs to reduce console output and improve performance
```typescript
disableApiClientLogs();
// Perform production operations
```

**Conditional Logging**: Dynamically control based on environment variables or configuration
```typescript
if (process.env.NODE_ENV === 'development') {
  enableApiClientLogs();
} else {
  disableApiClientLogs();
}
```

### Notes

- Logging control is global and affects all API client instances
- Logging state persists throughout the application lifecycle unless explicitly changed
- Log output includes request details, response status, and error information
- It's recommended to disable logging in production to avoid sensitive information leakage

## License

This project is dual-licensed under the MIT License and Apache License 2.0. See the license files in the project root for details.