// packages/api/src/client/errors.ts
/**
 * 错误类定义
 * 定义API客户端可能遇到的错误
 */

/**
 * LLM客户端错误基类
 * 所有客户端错误的基类
 */
export class LLMClientError extends Error {
  /**
   * @param message 错误消息
   * @param code 错误代码
   * @param context 错误上下文信息
   * @param provider 大模型提供商名称
   * @param model 模型名称
   * @param baseUrl 基础URL
   * @param endpoint 聊天端点
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
  }
}

/**
 * 连接错误
 * 表示网络连接相关错误
 */
export class ConnectionError extends LLMClientError {
  /**
   * @param message 错误消息
   * @param cause 错误原因
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'ConnectionError';
  }
}

/**
 * 认证错误
 * 表示API认证相关错误
 */
export class AuthenticationError extends LLMClientError {
  /**
   * @param message 错误消息
   * @param cause 错误原因
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'AuthenticationError';
  }
}

/**
 * 配额超限错误
 * 表示API配额或限制相关错误
 */
export class QuotaExceededError extends LLMClientError {
  /**
   * @param message 错误消息
   * @param cause 错误原因
   * @param retryAfter 建议重试时间(秒)
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'QuotaExceededError';
  }
}

/**
 * 请求格式错误
 * 表示请求格式化相关错误
 */
export class RequestFormatError extends LLMClientError {
  /**
   * @param message 错误消息
   * @param cause 错误原因
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'RequestFormatError';
  }
}

/**
 * 响应解析错误
 * 表示响应解析相关错误
 */
export class ResponseParseError extends LLMClientError {
  /**
   * @param message 错误消息
   * @param cause 错误原因
   */
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'ResponseParseError';
  }
}


/**
 * 格式化错误信息
 * @param error 错误对象
 * @returns 格式化后的错误信息
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