// packages/api/src/errors.ts
/**
 * 错误类定义
 * 定义 API 客户端可能遇到的所有错误类型
 */

// ============================================================================
// 错误类定义
// ============================================================================

/**
 * LLM 客户端错误基类
 * 所有客户端错误的基类
 * 
 * @description
 * 提供统一的错误接口，包含错误代码和上下文信息。
 * 所有特定的错误类型都继承自这个基类。
 * 
 * @example
 * try {
 *   await client.chat({ userMessage: 'Hello' });
 * } catch (error) {
 *   if (error instanceof LLMClientError) {
 *     console.log(error.code);
 *     console.log(error.context);
 *   }
 * }
 */
export class LLMClientError extends Error {
  /**
   * 创建一个 LLM 客户端错误
   * 
   * @param message - 错误消息
   * @param code - 错误代码（可选）
   * @param context - 错误上下文信息（可选）
   */
  constructor(
    message: string,
    public readonly code?: string,
    public readonly context?: {
      provider?: string;
      model?: string;
      baseUrl?: string;
      endpoint?: string;
    }
  ) {
    super(message);
    this.name = 'LLMClientError';
  }
}

/**
 * 连接错误
 * 表示网络连接相关错误
 * 
 * @description
 * 当无法连接到 API 服务器时抛出，可能的原因包括：
 * - 网络不可达
 * - DNS 解析失败
 * - 连接超时
 * - 服务器无响应
 * 
 * @example
 * throw new ConnectionError('Failed to connect to API server');
 */
export class ConnectionError extends LLMClientError {
  /**
   * 创建一个连接错误
   * 
   * @param message - 错误消息
   * @param cause - 错误原因（可选）
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'ConnectionError';
  }
}

/**
 * 认证错误
 * 表示 API 认证相关错误
 * 
 * @description
 * 当 API 认证失败时抛出，可能的原因包括：
 * - API 密钥无效
 * - API 密钥已过期
 * - 没有访问权限
 * - 认证头格式不正确
 * 
 * @example
 * throw new AuthenticationError('Invalid API key');
 */
export class AuthenticationError extends LLMClientError {
  /**
   * 创建一个认证错误
   * 
   * @param message - 错误消息
   * @param cause - 错误原因（可选）
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'AuthenticationError';
  }
}

/**
 * 配额超限错误
 * 表示 API 配额或限制相关错误
 * 
 * @description
 * 当超过 API 使用限制时抛出，可能的原因包括：
 * - 配额用尽
 * - 请求速率过快
 * - 账户余额不足
 * - 超过并发限制
 * 
 * @example
 * throw new QuotaExceededError('API quota exceeded');
 */
export class QuotaExceededError extends LLMClientError {
  /**
   * 创建一个配额超限错误
   * 
   * @param message - 错误消息
   * @param cause - 错误原因（可选）
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'QuotaExceededError';
  }
}

/**
 * 请求格式错误
 * 表示请求格式化相关错误
 * 
 * @description
 * 当请求参数不正确时抛出，可能的原因包括：
 * - 缺少必需参数
 * - 参数类型不正确
 * - 参数值超出范围
 * - 请求体格式不正确
 * 
 * @example
 * throw new RequestFormatError('Invalid temperature value');
 */
export class RequestFormatError extends LLMClientError {
  /**
   * 创建一个请求格式错误
   * 
   * @param message - 错误消息
   * @param cause - 错误原因（可选）
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'RequestFormatError';
  }
}

/**
 * 响应解析错误
 * 表示响应解析相关错误
 * 
 * @description
 * 当无法解析 API 响应时抛出，可能的原因包括：
 * - 响应格式不符合预期
 * - JSON 解析失败
 * - 缺少必需字段
 * - 数据类型不匹配
 * 
 * @example
 * throw new ResponseParseError('Failed to parse response data');
 */
export class ResponseParseError extends LLMClientError {
  /**
   * 创建一个响应解析错误
   * 
   * @param message - 错误消息
   * @param cause - 错误原因（可选）
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'ResponseParseError';
  }
}

// ============================================================================
// 错误处理工具
// ============================================================================

/**
 * 格式化错误信息
 * 
 * @description
 * 将各种错误转换为统一的 LLMClientError 类型。
 * 根据 HTTP 状态码和错误消息内容自动判断错误类型。
 * 
 * @param error - 原始错误对象
 * @returns 格式化后的 LLMClientError
 * 
 * @example
 * try {
 *   await fetch(url);
 * } catch (err) {
 *   throw formatError(err);
 * }
 */
export function formatError(error: any): LLMClientError {
  // 1. 如果已经是 LLMClientError，直接返回
  if (error instanceof LLMClientError) {
    return error;
  }

  // 2. 处理网络/连接错误（没有响应）
  if (!error.response) {
    return new ConnectionError(
      error.message || 'Network connection failed',
      error
    );
  }

  // 3. 处理 HTTP 响应错误
  const { status, data } = error.response;

  // 提取原始错误消息
  let originalMessage = '';
  if (data?.error?.message) {
    originalMessage = data.error.message;
  } else if (data?.message) {
    originalMessage = data.message;
  } else if (typeof data === 'string') {
    originalMessage = data;
  } else {
    originalMessage = `HTTP ${status}`;
  }

  // 检查是否是配额超限错误
  const isQuotaError = status === 429 || 
    originalMessage.toLowerCase().includes('credit') ||
    originalMessage.toLowerCase().includes('quota') ||
    originalMessage.toLowerCase().includes('rate limit') ||
    originalMessage.toLowerCase().includes('too many requests') ||
    originalMessage.toLowerCase().includes('exceeded') ||
    (data?.error?.code === 429) ||
    (data?.error?.status === 'RESOURCE_EXHAUSTED');

  // 检查是否是 API key 相关的错误
  const isApiKeyError = originalMessage.toLowerCase().includes('api key') ||
    originalMessage.toLowerCase().includes('api_key') ||
    originalMessage.toLowerCase().includes('unauthorized') ||
    originalMessage.toLowerCase().includes('authentication') ||
    (data?.error?.details?.[0]?.reason === 'API_KEY_INVALID');

  // 根据状态码和错误内容分类错误
  switch (status) {
    case 400:
    case 422:
      return new RequestFormatError(originalMessage, error);

    case 401:
    case 403:
      return new AuthenticationError(originalMessage, error);

    case 404:
      return new ConnectionError(originalMessage, error);
    
    case 429:
      return new QuotaExceededError(originalMessage, error);

    case 500:
    case 502:
    case 503:
    case 504:
      return new ConnectionError(originalMessage, error);

    default:
      // 其他错误根据内容判断
      if (isQuotaError) {
        return new QuotaExceededError(originalMessage, error);
      }
      if (isApiKeyError) {
        return new AuthenticationError(originalMessage, error);
      }
      return new LLMClientError(originalMessage, error);
  }
}
