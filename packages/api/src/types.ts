// packages/api/src/types.ts
/**
 * 类型定义文件
 * 包含所有 API 包使用的类型和接口定义
 */

import { InternalAxiosRequestConfig } from 'axios';

// ============================================================================
// 核心类型定义
// ============================================================================

/**
 * LLM 客户端接口
 * 统一的 LLM 客户端接口，用于与各种 AI 模型服务通信
 * 
 * @description
 * 提供统一的方法来访问不同的 LLM 服务提供商。
 * 所有提供商都实现相同的接口，确保一致的使用体验。
 * 
 * @example
 * const client = createClient({ provider: 'openai', apiKey: 'xxx' });
 * const response = await client.chat({ userMessage: 'Hello' });
 */
export interface LLMClient {
  /**
   * 发送聊天请求
   * 
   * @param request - 聊天请求参数
   * @returns 聊天响应
   * 
   * @throws {AuthenticationError} 当 API 密钥无效时
   * @throws {ConnectionError} 当网络连接失败时
   * @throws {RequestFormatError} 当请求格式不正确时
   * @throws {ResponseParseError} 当响应解析失败时
   */
  chat(request: ChatRequest): Promise<ClientResponse<ChatResponse>>;

  /**
   * 发送流式聊天请求
   * 
   * @param request - 聊天请求参数
   * @param streamHandler - 流处理器，用于接收数据块
   * @returns 请求 Promise
   * 
   * @example
   * await client.streamChat(
   *   { userMessage: 'Tell me a story' },
   *   {
   *     onData: (chunk) => console.log(chunk),
   *     onComplete: () => console.log('Done'),
   *     onError: (err) => console.error(err)
   *   }
   * );
   */
  streamChat(request: ChatRequest, streamHandler: StreamHandler): Promise<void>;

  /**
   * 测试连接是否可用
   * 
   * @returns 连接测试结果
   * 
   * @description
   * 通过发送一个最小化的请求来测试 API 的完整可用性，包括认证和配额。
   * 
   * @example
   * const result = await client.testConnection();
   * if (result.data.success) {
   *   console.log('连接成功');
   * }
   */
  testConnection(): Promise<ClientResponse<{ success: boolean; message?: string }>>;

  /**
   * 获取可用模型列表
   * 
   * @returns 可用模型列表
   * 
   * @example
   * const models = await client.getModels();
   * models.forEach(model => console.log(model.id));
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
    /** 温度参数 (0-1)，控制输出的随机性 */
    temperature?: number;
    /** 最大生成令牌数 */
    maxTokens?: number;
    /** 其他自定义选项 */
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
 * 
 * @example
 * // 使用内置提供商
 * const config: ClientConfig = {
 *   provider: 'openai',
 *   apiKey: 'sk-xxx',
 *   model: 'gpt-4'
 * };
 * 
 * @example
 * // 使用自定义提供商
 * const config: ClientConfig = {
 *   provider: 'custom',
 *   apiKey: 'xxx',
 *   baseUrl: 'https://api.example.com/v1',
 *   endpoints: {
 *     chat: '/chat/completions'
 *   }
 * };
 */
export interface ClientConfig {
  /** 提供商标识符 */
  provider: string;
  /** API 密钥 */
  apiKey: string;
  /** API 基础 URL（可选，使用提供商默认值） */
  baseUrl?: string;
  /** 模型名称（可选，使用提供商默认模型） */
  model?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 端点配置 */
  endpoints?: {
    /** 聊天端点路径 */
    chat?: string;
    /** 模型列表端点路径 */
    models?: string;
  };
  /** 认证配置 */
  auth?: {
    /** 认证类型 */
    type: string;
    /** 其他认证参数 */
    [key: string]: any;
  };
  /** 请求格式化配置 */
  request?: {
    /** 请求格式类型 */
    type: string;
    /** 其他请求参数 */
    [key: string]: any;
  };
  /** 响应解析配置 */
  response?: {
    /** 响应格式类型 */
    type: string;
    /** 其他响应参数 */
    [key: string]: any;
  };
  /** CORS 配置 */
  cors?: {
    /** 是否启用 CORS 代理 */
    enabled?: boolean;
    /** 代理服务器 URL */
    proxyUrl?: string;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    /** 是否包含凭证 */
    withCredentials?: boolean;
  };
}

/**
 * 客户端响应包装
 * 统一处理响应和错误
 */
export interface ClientResponse<T> {
  /** 响应数据 */
  data: T;
  /** 错误信息（可选） */
  error?: string;
}

/**
 * 流处理接口
 * 处理流式响应
 */
export interface StreamHandler {
  /**
   * 处理数据块
   * @param chunk - 文本数据块
   */
  onData(chunk: string): void;

  /**
   * 处理错误
   * @param error - 错误对象
   */
  onError?(error: Error): void;

  /**
   * 处理完成事件
   */
  onComplete?(): void;

  /**
   * 中断控制器
   * 用于取消正在进行的流式请求
   */
  abortController?: AbortController;
}

// ============================================================================
// 策略接口定义
// ============================================================================

/**
 * 认证策略接口
 * 处理不同的 API 认证方式
 * 
 * @description
 * 不同的 LLM 服务使用不同的认证方式：
 * - Bearer Token（OpenAI、DeepSeek 等）
 * - Query Parameter（Gemini）
 * - Custom Header（Claude）
 * 
 * @example
 * class MyAuthStrategy implements AuthStrategy {
 *   applyAuth(config) {
 *     config.headers['X-My-Auth'] = 'token';
 *     return config;
 *   }
 * }
 */
export interface AuthStrategy {
  /**
   * 应用认证信息到请求配置
   * 
   * @param config - Axios 请求配置
   * @returns 更新后的请求配置
   */
  applyAuth(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig;
}

/**
 * 请求格式化接口
 * 将统一的请求格式转换为特定 API 格式
 * 
 * @description
 * 不同的 LLM 服务接受不同的请求格式：
 * - OpenAI 格式（messages 数组）
 * - Gemini 格式（contents 数组）
 * - Ollama 格式（prompt 字符串或 messages 数组）
 */
export interface RequestFormatter {
  /**
   * 格式化聊天请求
   * 
   * @param request - 标准聊天请求
   * @returns 格式化后的请求体
   */
  formatRequest(request: ChatRequest): any;
}

/**
 * 响应解析接口
 * 解析不同 API 的响应格式
 */
export interface ResponseParser {
  /**
   * 解析流式响应块
   * 
   * @param chunk - 响应数据块
   * @returns 解析出的文本内容，如果无法解析则返回 null
   */
  parseStreamChunk(chunk: any): string | null;

  /**
   * 解析完整响应
   * 
   * @param response - 完整响应数据
   * @returns 标准化的聊天响应
   */
  parseFullResponse?(response: any): ChatResponse;
}
