// packages/api/src/config.ts
/**
 * 配置文件
 * 定义 API 包所需的所有常量和提供商配置
 */

// ============================================================================
// 枚举定义
// ============================================================================

/**
 * LLM 提供商枚举
 * 支持的 LLM 服务提供商列表
 */
export enum LLMProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  HUNYUAN = 'hunyuan',
  SILICONFLOW = 'siliconflow',
  OLLAMA = 'ollama'
}

/**
 * 认证类型枚举
 * 支持的认证方式
 */
export enum AuthType {
  BEARER = 'bearer',
  QUERY_PARAM = 'query_param',
  X_API_KEY = 'x-api-key',
  CUSTOM = 'custom'
}

/**
 * 请求格式类型枚举
 * 支持的请求格式
 */
export enum RequestFormatType {
  OPENAI_COMPATIBLE = 'openai_compatible',
  GEMINI = 'gemini',
  OLLAMA = 'ollama',
  CUSTOM = 'custom'
}

/**
 * 响应解析类型枚举
 * 支持的响应解析方式
 */
export enum ResponseParseType {
  OPENAI_COMPATIBLE = 'openai_compatible',
  GEMINI = 'gemini',
  OLLAMA = 'ollama',
  CUSTOM = 'custom'
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * 默认超时设置（毫秒）
 */
export const DEFAULT_TIMEOUT = 120000;

/**
 * 默认温度参数
 */
export const DEFAULT_TEMPERATURE = 0.7;

/**
 * 重试配置
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_MULTIPLIER: 1.5
};

/**
 * 内容类型常量
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  SSE: 'text/event-stream',
  TEXT: 'text/plain'
};

/**
 * CORS 相关常量
 */
export const CORS_CONFIG = {
  /** 默认 CORS 代理服务器列表 */
  DEFAULT_PROXIES: [
    'https://cors-anywhere.herokuapp.com',
    'https://api.allorigins.win/raw?url=',
    'https://cors-proxy.htmldriven.com/?url='
  ],
  /** 需要 CORS 代理的域名模式 */
  CORS_REQUIRED_PATTERNS: [
    /^http:\/\/localhost(?::\d+)?/,  // 本地服务
    /^http:\/\/127\.0\.0\.1(?::\d+)?/,  // 本地 IP
  ]
};

// ============================================================================
// 提供商配置
// ============================================================================

/**
 * 提供商配置接口
 */
export interface ProviderConfig {
  providerName: string;
  baseUrl: string;
  endpoints: {
    chat: string;
    models: string;
  };
  defaultModel: string;
  timeout: number;
  auth: {
    type: string;
    [key: string]: any;
  };
  request: {
    type: string;
    [key: string]: any;
  };
  response: {
    type: string;
    [key: string]: any;
  };
}

/**
 * 提供商配置映射
 * 为每个支持的提供商提供默认配置
 * 
 * @description
 * 包含所有内置提供商的默认配置，包括：
 * - API 基础 URL
 * - 默认模型
 * - 认证方式
 * - 请求/响应格式
 */
export const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  [LLMProvider.OPENAI]: {
    providerName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    endpoints: {
      chat: '/chat/completions',
      models: '/models'
    },
    defaultModel: 'gpt-4o-mini',
    timeout: 60000,
    auth: {
      type: AuthType.BEARER
    },
    request: {
      type: RequestFormatType.OPENAI_COMPATIBLE
    },
    response: {
      type: ResponseParseType.OPENAI_COMPATIBLE
    }
  },
  [LLMProvider.CLAUDE]: {
    providerName: 'Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    endpoints: {
      chat: '/chat/completions',
      models: '/models'
    },
    defaultModel: 'claude-sonnet-4-20250514',
    timeout: 60000,
    auth: {
      type: AuthType.X_API_KEY
    },
    request: {
      type: RequestFormatType.OPENAI_COMPATIBLE
    },
    response: {
      type: ResponseParseType.OPENAI_COMPATIBLE
    }
  },
  [LLMProvider.GEMINI]: {
    providerName: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    endpoints: {
      chat: '/models/{model}:generateContent',
      models: '/models'
    },
    defaultModel: 'gemini-2.0-flash',
    timeout: 60000,
    auth: {
      type: AuthType.QUERY_PARAM,
      paramName: 'key'
    },
    request: {
      type: RequestFormatType.GEMINI
    },
    response: {
      type: ResponseParseType.GEMINI
    }
  },
  [LLMProvider.DEEPSEEK]: {
    providerName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    endpoints: {
      chat: '/chat/completions',
      models: '/models'
    },
    defaultModel: 'deepseek-chat',
    timeout: 60000,
    auth: {
      type: AuthType.BEARER
    },
    request: {
      type: RequestFormatType.OPENAI_COMPATIBLE
    },
    response: {
      type: ResponseParseType.OPENAI_COMPATIBLE
    }
  },
  [LLMProvider.HUNYUAN]: {
    providerName: 'Hunyuan',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    endpoints: {
      chat: '/chat/completions',
      models: '/models'
    },
    defaultModel: 'hunyuan-turbos-latest',
    timeout: 60000,
    auth: {
      type: AuthType.BEARER
    },
    request: {
      type: RequestFormatType.OPENAI_COMPATIBLE,
      additionalParams: {
        enable_enhancement: true
      }
    },
    response: {
      type: ResponseParseType.OPENAI_COMPATIBLE
    }
  },
  [LLMProvider.SILICONFLOW]: {
    providerName: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    endpoints: {
      chat: '/chat/completions',
      models: '/models'
    },
    defaultModel: 'Qwen/QwQ-32B',
    timeout: 60000,
    auth: {
      type: AuthType.BEARER
    },
    request: {
      type: RequestFormatType.OPENAI_COMPATIBLE,
      additionalParams: {
        enable_enhancement: true
      }
    },
    response: {
      type: ResponseParseType.OPENAI_COMPATIBLE
    }
  },
  [LLMProvider.OLLAMA]: {
    providerName: 'Ollama',
    baseUrl: 'http://localhost:11434',
    endpoints: {
      chat: '/api/chat',
      models: '/api/tags'
    },
    defaultModel: 'qwen3:32b',
    timeout: 180000,
    auth: {
      type: AuthType.CUSTOM
    },
    request: {
      type: RequestFormatType.OLLAMA
    },
    response: {
      type: ResponseParseType.OLLAMA
    }
  }
};
