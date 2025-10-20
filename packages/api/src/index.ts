//packages/api/src/index.ts
/**
 * @prompt-booster/api
 * 统一的 LLM API 客户端库
 * 
 * @description
 * 提供统一的接口访问多个 LLM 服务提供商，包括：
 * - OpenAI
 * - Google Gemini
 * - Claude
 * - DeepSeek
 * - 腾讯混元
 * - SiliconFlow
 * - Ollama
 * 
 * @example
 * // 基本使用
 * import { createClient } from '@prompt-booster/api';
 * 
 * const client = createClient({
 *   provider: 'openai',
 *   apiKey: 'your-api-key',
 *   model: 'gpt-4'
 * });
 * 
 * const response = await client.chat({
 *   userMessage: 'Hello!'
 * });
 * 
 * @example
 * // 注册自定义提供商
 * import { ProviderRegistry, createClient } from '@prompt-booster/api';
 * 
 * ProviderRegistry.register('my-llm', {
 *   baseUrl: 'https://api.my-llm.com',
 *   defaultModel: 'my-model',
 *   // ...
 * });
 * 
 * const client = createClient({
 *   provider: 'my-llm',
 *   apiKey: 'xxx'
 * });
 */

// ============================================================================
// 核心导出
// ============================================================================

// 导出客户端
 export { LLMClientImpl } from './client/client';

// 导出工厂函数
 export { createClient } from './factory';

// 导出类型
export type {
  LLMClient,
  ClientConfig,
  ChatRequest,
  ChatMessage,
  ChatResponse,
  ClientResponse,
  StreamHandler,
  AuthStrategy,
  RequestFormatter,
  ResponseParser
} from './types';

// 导出配置
export {
  LLMProvider,
  AuthType,
  RequestFormatType,
  ResponseParseType,
  DEFAULT_TIMEOUT,
  DEFAULT_TEMPERATURE,
  RETRY_CONFIG,
  CONTENT_TYPES,
  CORS_CONFIG,
  PROVIDER_CONFIG
} from './config';
export type { ProviderConfig } from './config';

// ============================================================================
// 错误处理
// ============================================================================

export {
  LLMClientError,
  ConnectionError,
  AuthenticationError,
  QuotaExceededError,
  RequestFormatError,
  ResponseParseError,
  formatError
} from './errors';

// ============================================================================
// 策略导出（支持自定义）
// ============================================================================

// 认证策略
export {
  BearerAuthStrategy,
  QueryParamAuthStrategy,
  CustomAuthStrategy,
  createAuthStrategy
} from './strategies/auth';

// 请求格式化器
export {
  OpenAIRequestFormatter,
  GeminiRequestFormatter,
  OllamaRequestFormatter,
  CustomRequestFormatter,
  createRequestFormatter
} from './strategies/request';

// 响应解析器
export {
  OpenAIResponseParser,
  GeminiResponseParser,
  OllamaResponseParser,
  CustomResponseParser,
  createResponseParser
} from './strategies/response';

// ============================================================================
// 工具函数
// ============================================================================

export {
  StreamFormat,
  splitStreamBuffer
} from './utils/stream';

// 日志控制（仅导出公开 API）
export {
  enableLogging,
  disableLogging
} from './utils/apiLogging';

export {
  needsCorsProxy,
  buildProxyUrl,
  buildCorsHeaders
} from './utils/cors';

// ============================================================================
// 提供商注册
// ============================================================================

export { ProviderRegistry } from './registry';

// ============================================================================
// 配置验证
// ============================================================================

export {
  validateClientConfig,
  validateChatRequest,
  isValidChatRequest
} from './validators';