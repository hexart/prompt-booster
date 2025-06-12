// packages/api/src/types/core.ts
/**
 * 核心类型定义
 * 定义了统一客户端接口和基础类型
 */

/**
 * LLM客户端接口
 * 统一的LLM客户端接口，用于与各种AI模型服务通信
 */
export interface LLMClient {
    /**
     * 发送聊天请求
     * @param request 聊天请求参数
     * @returns 聊天响应
     */
    chat(request: ChatRequest): Promise<ClientResponse<ChatResponse>>;

    /**
     * 发送流式聊天请求
     * @param request 聊天请求参数
     * @param streamHandler 流处理器
     * @returns 请求Promise
     */
    streamChat(request: ChatRequest, streamHandler: StreamHandler): Promise<void>;

    /**
     * 测试连接是否可用
     * @returns 连接测试结果
     */
    testConnection(): Promise<ClientResponse<{ success: boolean; message?: string }>>;

    /**
     * 获取可用模型列表
     * @returns 可用模型列表
     */
    getModels(): Promise<Array<{ id: string; name?: string }>>;
}

/**
 * 聊天请求接口
 * 标准化的聊天请求格式
 */
export interface ChatRequest {
    /** 用户消息 */
    userMessage: string;
    /** 系统消息/指令 */
    systemMessage?: string;
    /** 聊天历史 */
    history?: ChatMessage[];
    /** 请求选项 */
    options?: {
        /** 温度参数(0-1) */
        temperature?: number;
        /** 最大生成令牌数 */
        maxTokens?: number;
        /** 其他选项 */
        [key: string]: any;
    };
}

/**
 * 聊天消息接口
 * 表示单条聊天消息
 */
export interface ChatMessage {
    /** 消息角色 */
    role: 'system' | 'user' | 'assistant';
    /** 消息内容 */
    content: string;
}

/**
 * 聊天响应接口
 * 表示模型返回的响应
 */
export interface ChatResponse {
    /** 响应内容 */
    content: string;
    /** 令牌使用情况 */
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    /** 使用的模型 */
    model?: string;
    /** 元数据 */
    meta?: Record<string, any>;
}

/**
 * 客户端配置接口
 * 统一的客户端配置项
 */
export interface ClientConfig {
    /** 提供商 */
    provider: string;
    /** API密钥 */
    apiKey: string;
    /** 基础URL */
    baseUrl?: string;
    /** 模型名称 */
    model?: string;
    /** 超时设置(毫秒) */
    timeout?: number;
    /** 端点配置 */
    endpoints?: {
        chat?: string;
        models?: string;
    };
    /** 认证配置 */
    auth?: {
        type: string;
        [key: string]: any;
    };
    /** 请求格式化 */
    request?: {
        type: string;
        [key: string]: any;
    };
    /** 响应解析 */
    response?: {
        type: string;
        [key: string]: any;
    };
}

/**
 * 客户端响应包装
 * 统一处理响应和错误
 */
export interface ClientResponse<T> {
    /** 响应数据 */
    data: T;
    /** 错误信息 */
    error?: string;
}

/**
 * 流处理接口
 * 处理流式响应
 */
export interface StreamHandler {
    /**
     * 处理数据块
     * @param chunk 文本数据块
     */
    onData(chunk: string): void;

    /**
     * 处理错误
     * @param error 错误对象
     */
    onError?(error: Error): void;

    /**
     * 处理完成事件
     */
    onComplete?(): void;

    /**
     * 中断控制器
     */
    abortController?: AbortController;
}