- # @prompt-booster/api

  A flexible and extensible client library for interacting with various LLM (Large Language Model) services through a unified interface.

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
  10. [Streaming](#streaming)
  11. [Utilities](#utilities)

  ## Overview

  `@prompt-booster/api` is a unified client library for interacting with various AI model providers through a consistent interface. It abstracts away the differences between various LLM service APIs, providing a clean, consistent way to interact with models from OpenAI, Google Gemini, DeepSeek, Hunyuan, Siliconflow, and Ollama.

  The package implements a strategy pattern that makes it easy to adapt to different provider APIs while maintaining a consistent interface for your application. This abstraction allows your application to switch between providers with minimal code changes.

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

  The package follows a modular architecture based on the strategy pattern:

  ```markdown
  api/
  ├── client/        # Core LLM client implementation
  ├── config/        # Configuration constants and models
  ├── strategies/    # Strategy implementations for different providers
  ├── types/         # TypeScript type definitions
  ├── utils/         # Utility functions
  └── factory.ts     # Client factory functions
  ```

  The architecture allows for easy extension and customization, enabling you to:

  - Add support for new LLM providers
  - Customize request/response handling
  - Implement custom authentication strategies

  ## Key Features

  - **Unified Interface**: Interact with multiple LLM providers through a single API
  - **Provider Support**: Pre-configured for OpenAI, Gemini, DeepSeek, Hunyuan, Siliconflow, and Ollama
  - **Streaming**: Support for streaming responses with easy-to-use handlers
  - **Authentication**: Multiple authentication strategies (Bearer, Query Params, Custom)
  - **Error Handling**: Standardized error handling and reporting
  - **Retry Logic**: Built-in retry mechanisms for transient failures
  - **Type Safety**: Comprehensive TypeScript definitions

  ## Supported LLM Providers

  The package includes built-in support for the following providers:

  - **OpenAI** - API-compatible with GPT models
  - **Google Gemini** - Support for Gemini Pro and Ultra models
  - **DeepSeek** - Support for DeepSeek Chat and Coder models
  - **Hunyuan** - Tencent's Hunyuan models
  - **Siliconflow** - For SiliconFlow models like Qwen/QwQ
  - **Ollama** - For local model hosting with Ollama

  Each provider is configured with reasonable defaults, but all aspects can be customized.

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
      userMessage: 'Explain the concept of strategy pattern in software design',
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
        console.error('Stream error:', error);
      },
      // Handle completion
      () => {
        console.log('\nStream completed');
      }
    );
    
    await client.streamChat({
      userMessage: 'Write a short poem about programming',
      systemMessage: 'You are a creative writing assistant'
    }, handler);
  }
  
  streamResponse();
  ```

  ### Using a Simplified Client Factory

  Use the simplified factory for common providers:

  ```typescript
  import { createLLMClient } from '@prompt-booster/api';
  
  // Create a client with minimal configuration
  const client = createLLMClient(
    'openai',
    'your-api-key',
    { model: 'gpt-4-turbo' }
  );
  
  // Use the client as normal
  async function askQuestion() {
    const response = await client.chat({
      userMessage: 'What are the main features of TypeScript?'
    });
    
    console.log(response.data.content);
  }
  
  askQuestion();
  ```

  ### Testing Connections

  Test if a connection to an LLM provider is working:

  ```typescript
  import { createClient, testConnection } from '@prompt-booster/api';
  
  async function testLLMConnection() {
    const client = createClient({
      provider: 'openai',
      apiKey: 'your-api-key',
      model: 'gpt-4-turbo'
    });
    
    const result = await testConnection(client);
    
    if (result.data.success) {
      console.log('Connection successful');
    } else {
      console.error('Connection failed:', result.error || result.data.message);
    }
  }
  
  testLLMConnection();
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
    timeout: 60000,          // Optional: timeout in ms
    endpoints: {             // Optional: custom endpoints
      chat: '/v1/chat/completions',
      models: '/v1/models'
    },
    auth: {                  // Optional: auth config
      type: 'bearer'         // 'bearer', 'query_param', or 'custom'
    },
    request: {               // Optional: request formatter config
      type: 'openai_compatible'
    },
    response: {              // Optional: response parser config
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
    // Send a chat request (non-streaming)
    chat(request: ChatRequest): Promise<ClientResponse<ChatResponse>>;
    
    // Send a streaming chat request
    streamChat(request: ChatRequest, streamHandler: StreamHandler): Promise<void>;
    
    // Test the API connection
    testConnection(): Promise<ClientResponse<{ success: boolean; message?: string }>>;
    
    // Get available models from the provider
    getModels(): Promise<Array<{ id: string; name?: string }>>;
  }
  ```

  #### `ChatRequest`

  Structure for chat requests.

  ```typescript
  interface ChatRequest {
    userMessage: string;             // User's message
    systemMessage?: string;          // Optional system message/instruction
    history?: ChatMessage[];         // Optional chat history
    options?: {                      // Optional parameters
      temperature?: number;          // Creativity (0-1)
      maxTokens?: number;            // Max response length
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
    onData(chunk: string): void;      // Process data chunks
    onError?(error: Error): void;     // Handle errors (optional)
    onComplete?(): void;              // Handle completion (optional)
    abortController?: AbortController; // For cancelling (optional)
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
        // Custom auth logic
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
    // Basic config...
    request: {
      type: RequestFormatType.CUSTOM,
      formatFn: (request) => {
        // Custom request format logic
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
    // Basic config...
    response: {
      type: ResponseParseType.CUSTOM,
      parseStreamFn: (chunk) => {
        // Parse stream chunks
        if (typeof chunk === 'string') return chunk;
        if (chunk.output) return chunk.output;
        return null;
      },
      parseFullFn: (response) => {
        // Parse complete responses
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
  import { createClient, LLMClientError } from '@prompt-booster/api';
  
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
        console.error('LLM client error:', error.message);
      } else if (error instanceof ConnectionError) {
        console.error('Connection error:', error.message);
      } else if (error instanceof AuthenticationError) {
        console.error('Auth error:', error.message);
      } else {
        console.error('Unknown error:', error);
      }
    }
  }
  ```

  ## Streaming

  The package provides robust utilities for working with streaming responses:

  ```typescript
  import { 
    createClient, 
    createStreamHandler, 
    StreamFormat 
  } from '@prompt-booster/api';
  
  async function advancedStreaming() {
    const client = createClient({
      // Basic config...
    });
    
    // Create an abort controller
    const abortController = new AbortController();
    
    // Set a timeout to cancel the stream after 10 seconds
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
        console.log('Stream completed');
      }
    );
    
    // Attach the abort controller
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

  ## Utilities

  The package includes several useful utility functions:

  ### Connection Testing

  ```typescript
  import { createClient, testConnection } from '@prompt-booster/api';
  
  async function testWithRetry() {
    const client = createClient({
      // Basic config...
    });
    
    // Test with 5 retries
    const result = await testConnection(client, 5);
    console.log('Connection result:', result.data.success);
  }
  ```

  ### Retry Logic

  ```typescript
  import { withRetry } from '@prompt-booster/api';
  
  async function functionWithRetry() {
    // Execute with retry logic
    const result = await withRetry(
      async () => {
        // Function that might fail
        const response = await fetch('https://api.example.com/data');
        if (!response.ok) throw new Error('API error');
        return await response.json();
      },
      3,        // max retries
      1000,     // initial delay in ms
      1.5       // delay multiplier
    );
    
    return result;
  }
  ```

  ### Logging Control

  ```typescript
  import { 
    enableApiClientLogs,
    disableApiClientLogs
  } from '@prompt-booster/api';
  
  // Enable debug logs
  enableApiClientLogs();
  
  // Perform operations...
  
  // Disable logs for production
  disableApiClientLogs();
  ```

  ### Model Token Limits

  ```typescript
  import { getMaxTokensForModel } from '@prompt-booster/api';
  
  // Get token limit for a specific model
  const gpt4Limit = getMaxTokensForModel('gpt-4-turbo');
  console.log(`GPT-4 Turbo token limit: ${gpt4Limit}`);
  
  // With default fallback
  const unknownModelLimit = getMaxTokensForModel('unknown-model', 4096);
  console.log(`Unknown model token limit: ${unknownModelLimit}`);
  ```