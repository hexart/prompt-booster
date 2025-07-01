# CORS Configuration Guide

[中文](CORS-zh.md)

## Overview

The `@prompt-booster/api` package provides built-in CORS (Cross-Origin Resource Sharing) support to help you connect to LLM interfaces that are restricted by browser same-origin policy. This is particularly useful for connecting to locally deployed model services (like Ollama) or certain custom API endpoints.

## When Do You Need CORS Configuration?

When you encounter the following error in a browser environment, it indicates that CORS configuration is needed:

```
Access to fetch at 'http://localhost:11434/api/chat' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on 
the requested resource.
```

Common scenarios requiring CORS:
- Connecting to locally running LLM services (e.g., `http://localhost:11434`)
- Connecting to custom APIs without configured CORS headers
- Cross-origin requests in development environments

## Basic Usage

### 1. Simple CORS Enable

The simplest way is to enable CORS when creating a client:

```typescript
import { createClient } from '@prompt-booster/api';

const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  cors: {
    enabled: true  // Enable CORS proxy
  }
});
```

This will use the default CORS proxy server to forward requests.

### 2. Specify Proxy Server

If the default proxy is unavailable or you have your own proxy server:

```typescript
const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:8080',
  model: 'custom-model',
  cors: {
    enabled: true,
    proxyUrl: 'https://cors-anywhere.herokuapp.com'  // Specify proxy server
  }
});
```

### 3. Add Custom Request Headers

You can use CORS configuration to add custom request headers, even without enabling CORS proxy:

```typescript
// Use both CORS proxy and custom headers
const clientWithProxy = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com',
  model: 'custom-model',
  cors: {
    enabled: true,  // Use CORS proxy
    headers: {
      'X-Custom-Header': 'value',
      'X-API-Version': '2.0'
    }
  }
});

// Add custom headers only, without CORS proxy
const clientHeadersOnly = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com',
  model: 'custom-model',
  cors: {
    enabled: false,  // Don't use CORS proxy
    headers: {       // These headers will still be added
      'X-Custom-Header': 'value',
      'X-API-Version': '2.0'
    }
  }
});
```

### 4. Include Credentials (Cookies)

If the API requires authentication cookies:

```typescript
const client = createClient({
  provider: 'custom',
  apiKey: 'your-api-key',
  baseUrl: 'https://internal-api.company.com',
  model: 'internal-model',
  cors: {
    enabled: true,
    withCredentials: true,  // Send cookies
    headers: {
      'X-CSRF-Token': 'your-csrf-token'
    }
  }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Whether to enable CORS proxy |
| `proxyUrl` | `string` | See below | Proxy server URL |
| `headers` | `Record<string, string>` | `{}` | Additional request headers |
| `withCredentials` | `boolean` | `false` | Whether to send cookies |

### Default Proxy Servers

If `proxyUrl` is not specified, the following proxies will be tried in order:

1. `https://cors-anywhere.herokuapp.com`
2. `https://api.allorigins.win/raw?url=`
3. `https://cors-proxy.htmldriven.com/?url=`

## Practical Examples

### Connect to Local Ollama

```typescript
import { createClient } from '@prompt-booster/api';

// Ollama typically runs on localhost:11434
const ollamaClient = createClient({
  provider: 'ollama',
  apiKey: '',  // Ollama doesn't require an API key
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  cors: {
    enabled: true  // Browser environment requires CORS
  }
});

// Using the client
try {
  const response = await ollamaClient.chat({
    userMessage: 'Hello, how are you?'
  });
  console.log(response.data.content);
} catch (error) {
  console.error('Error:', error);
}
```

### Connect to Custom API

```typescript
// Connect to a custom OpenAI-compatible API
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

### Error Handling

```typescript
async function connectWithCORS(config) {
  try {
    const client = createClient(config);
    await client.testConnection();
    console.log('Connection successful!');
    return client;
  } catch (error) {
    if (error.message.includes('CORS') || error.message.includes('blocked')) {
      console.log('CORS error detected, trying with proxy...');
      
      // Retry with CORS proxy enabled
      const configWithCors = {
        ...config,
        cors: { enabled: true }
      };
      
      const clientWithProxy = createClient(configWithCors);
      await clientWithProxy.testConnection();
      console.log('Connection successful with proxy!');
      return clientWithProxy;
    }
    throw error;
  }
}
```

## Important Notes

### Security Considerations

1. **Production Environment**: Not recommended to use public CORS proxy services in production
2. **Sensitive Data**: Avoid sending API keys or other sensitive information through public proxies
3. **Self-hosted Proxy**: For production environments, deploy your own CORS proxy server

### Performance Considerations

- Using CORS proxy will increase request latency
- Public proxies may have rate limits
- Some proxies may not support streaming responses

### Alternative Solutions

If CORS configuration doesn't meet your needs, consider these alternatives:

1. **Server-side Proxy**: Create proxy endpoints on your backend server
2. **Configure API Server**: Properly configure CORS headers on the API server
3. **Use Desktop App**: Prompt Booster's desktop version is not restricted by CORS

## Troubleshooting

### Common Issues

**Q: Still getting errors after enabling CORS**
- Check if the proxy server is available
- Try using a different proxy server
- Confirm the API address is correct

**Q: Streaming responses not working**
- Some CORS proxies don't support Server-Sent Events
- Try using a proxy that supports streaming

**Q: Request timeout**
- Proxy server may be responding slowly
- Increase timeout: `timeout: 60000`

### Debugging Tips

Enable debug logs to see detailed information:

```typescript
import { enableApiClientLogs } from '@prompt-booster/api';

// Enable logs in development environment
if (process.env.NODE_ENV === 'development') {
  enableApiClientLogs();
}
```

Logs will show:
- Whether CORS proxy is used
- Actual request URL
- Detailed request and response information

## Example: Complete Configuration

```typescript
import { createClient } from '@prompt-booster/api';

// Complete CORS configuration example
const client = createClient({
  // Basic configuration
  provider: 'custom',
  apiKey: process.env.API_KEY,
  baseUrl: process.env.API_BASE_URL,
  model: process.env.MODEL_NAME,
  timeout: 30000,
  
  // Endpoint configuration
  endpoints: {
    chat: '/v1/chat/completions',
    models: '/v1/models'
  },
  
  // CORS configuration
  cors: {
    enabled: process.env.ENABLE_CORS === 'true',
    proxyUrl: process.env.CORS_PROXY_URL,
    headers: {
      'X-API-Version': '2.0',
      'X-Client-Id': 'prompt-booster'
    },
    withCredentials: false
  },
  
  // Other configurations
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

## Related Links

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CORS Anywhere](https://github.com/Rob--W/cors-anywhere)
- [Deploy Your Own CORS Proxy](https://github.com/Rob--W/cors-anywhere#demo-server)

---

For other questions, please check the project's [GitHub Issues](https://github.com/hexart/prompt-booster/issues) or submit a new issue.