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