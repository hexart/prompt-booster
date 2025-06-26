// packages/api/src/client/client.ts
/**
 * 统一LLM客户端实现
 * 基于策略模式实现的统一LLM客户端
 */
import axios, { AxiosInstance } from 'axios';
import {
  LLMClient,
  ChatRequest,
  ChatResponse,
  ClientResponse,
  ClientConfig,
  AuthStrategy,
  RequestFormatter,
  ResponseParser,
  StreamHandler
} from '../types';
import {
  DEFAULT_TIMEOUT,
  CONTENT_TYPES
} from '../config';
import {
  createAuthStrategy,
  createRequestFormatter,
  createResponseParser
} from '../strategies';
import {
  ConnectionError,
  RequestFormatError,
  ResponseParseError,
  formatError
} from './errors';
import { isLoggingEnabled } from '../utils';
import { StreamFormat, splitStreamBuffer } from '../utils';

/**
 * 统一LLM客户端
 * 支持多种LLM服务的统一客户端实现
 */
export class LLMClientImpl implements LLMClient {
  /** HTTP客户端 */
  private client: AxiosInstance;
  /** 认证策略 */
  private authStrategy: AuthStrategy;
  /** 请求格式化器 */
  private requestFormatter: RequestFormatter;
  /** 响应解析器 */
  private responseParser: ResponseParser;
  /** API基础URL */
  private baseUrl: string;
  /** API密钥 */
  private apiKey: string;
  /** 模型名称 */
  private model: string;
  /** 超时设置(毫秒) */
  private timeout: number;
  /** 端点配置 */
  private endpoints: {
    chat: string;
    models: string;
  };

  /**
   * 构造函数
   * @param config 客户端配置
   */
  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl || '';
    this.apiKey = config.apiKey;
    this.model = config.model || '';
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.endpoints = {
      chat: config.endpoints?.chat || '/chat/completions',
      models: config.endpoints?.models || '/models'
    };

    // 创建HTTP客户端
    this.client = this.createAxiosInstance();

    // 创建策略
    this.authStrategy = createAuthStrategy(
      config.auth?.type || 'bearer',
      this.apiKey,
      config.auth
    );

    this.requestFormatter = createRequestFormatter(
      config.request?.type || 'openai_compatible',
      this.model,
      config.request
    );

    this.responseParser = createResponseParser(
      config.response?.type || 'openai_compatible',
      config.response
    );

    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config) => this.authStrategy.applyAuth(config),
      (error) => Promise.reject(error)
    );

    this.logDebug(`LLMClient initialized with model: ${this.model}`);
  }

  /**
   * 发送聊天请求
   * @param request 聊天请求
   * @returns 聊天响应
   * @description 此方法目前用于提示分析，非流式一次性返回结果
   */
  async chat(request: ChatRequest): Promise<ClientResponse<ChatResponse>> {
    try {
      // 1. 格式化请求
      let payload;
      try {
        payload = this.requestFormatter.formatRequest(request);
      } catch (formatError) {
        throw new RequestFormatError(
          formatError instanceof Error ? formatError.message : String(formatError),
          formatError
        );
      }

      // 2. 构建请求 URL
      const url = new URL(this.endpoints.chat, this.baseUrl);
      const normalizedEndpoint = url.pathname + url.search;

      this.logDebug(`[DEBUG] Sending chat request to ${normalizedEndpoint}`);

      // 3. 发送请求
      const response = await this.client.post(normalizedEndpoint, payload);
      this.logDebug('[DEBUG] Chat request completed successfully');

      // 4. 解析响应
      let parsedResponse;
      try {
        parsedResponse = this.responseParser.parseFullResponse?.(response.data);
        if (!parsedResponse) {
          throw new Error('Parser returned null or undefined');
        }
      } catch (parseError) {
        throw new ResponseParseError(
          parseError instanceof Error ? parseError.message : 'Parse failed',
          parseError
        );
      }

      return { data: parsedResponse };
    } catch (error: any) {
      this.logDebug('Error in chat request:', error);
      throw formatError(error);
    }
  }

  /**
   * 发送流式聊天请求
   * @param request 聊天请求
   * @param streamHandler 流处理器
   * @returns Promise
   */
  async streamChat(request: ChatRequest, streamHandler: StreamHandler): Promise<void> {
    let fetchAttempted = false;

    try {
      // 1. 格式化请求
      let payload;
      try {
        payload = this.requestFormatter.formatRequest(request);

        // 处理流式请求的特殊情况
        payload = this.prepareStreamPayload(payload);
      } catch (formatError) {
        const error = new RequestFormatError(
          formatError instanceof Error ? formatError.message : String(formatError),
          formatError
        );
        if (streamHandler.onError) {
          streamHandler.onError(error);
        }
        return;
      }

      this.logDebug(`Starting streaming request to ${this.endpoints.chat}`);

      // 2. 获取中断控制器
      const controller = streamHandler.abortController || new AbortController();

      try {
        fetchAttempted = true;

        // 3. 构建请求头
        const headers: Record<string, string> = {
          'Content-Type': CONTENT_TYPES.JSON,
          'Accept': `${CONTENT_TYPES.JSON}, ${CONTENT_TYPES.SSE}, ${CONTENT_TYPES.TEXT}, */*`
        };

        // 4. 构建URL - 使用统一的 buildStreamUrl 方法
        const url = this.buildStreamUrl();

        // 5. 添加认证头（仅对非 Gemini API）
        if (!this.isGeminiApi() && this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        // 5. 发送请求
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        // 6. 检查响应状态
        if (!response.ok) {
          // 尝试解析错误响应
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = await response.text();
          }

          // 构造类似 axios 的错误对象以便 formatError 处理
          const axiosLikeError = {
            response: {
              status: response.status,
              statusText: response.statusText,
              data: errorData
            }
          };

          throw formatError(axiosLikeError);
        }

        if (!response.body) {
          throw new ConnectionError("Response body is null");
        }

        // 7. 检测响应格式
        const contentType = response.headers.get('Content-Type') || '';
        this.logDebug(`Response content type: ${contentType}`);

        let streamFormat: StreamFormat = StreamFormat.AUTO;
        if (contentType.includes(CONTENT_TYPES.SSE)) {
          streamFormat = StreamFormat.SSE;
        } else if (contentType.includes(CONTENT_TYPES.JSON)) {
          streamFormat = StreamFormat.JSON;
        } else if (contentType.includes(CONTENT_TYPES.TEXT)) {
          streamFormat = StreamFormat.TEXT;
        }

        // 8. 处理流式响应
        await this.handleStreamResponse(response.body, streamFormat, streamHandler);

      } catch (fetchError: any) {
        this.logDebug(`Fetch streaming failed:`, fetchError);

        // 处理 fetch 特有的错误
        if (fetchError.name === 'AbortError') {
          const error = new ConnectionError('Request aborted', fetchError);
          if (streamHandler.onError) {
            streamHandler.onError(error);
          }
          return;
        }

        // 使用 formatError 处理其他错误
        const formattedError = formatError(fetchError);
        if (streamHandler.onError) {
          streamHandler.onError(formattedError);
        }
      }

    } catch (error: any) {
      const errorMsg = error && typeof error === 'object' && 'message' in error ?
        error.message : 'Unknown stream error';

      this.logDebug(`Stream error: ${errorMsg}`);

      if (fetchAttempted) {
        return;
      }

      // 尝试非流式后备方案
      try {
        await this.handleRegularResponse(
          this.requestFormatter.formatRequest(request),
          streamHandler
        );
      } catch (fallbackError) {
        const formattedError = formatError(fallbackError);
        if (streamHandler.onError) {
          streamHandler.onError(formattedError);
        }
      }
    }
  }

  /**
   * 测试连接
   * @returns 连接测试结果
   * @description 通过发送最小化的 chat 请求来测试 API 的完整可用性（包括额度）
   */
  async testConnection(): Promise<ClientResponse<{ success: boolean; message?: string }>> {
    try {
      this.logDebug(`测试连接：发送最小化 chat 请求`);

      // 发送最小化的 chat 请求来测试完整的 API 可用性
      const response = await this.chat({
        userMessage: 'Hi',
        options: {
          maxTokens: 1,  // 最小化 token 消耗
          temperature: 0  // 确定性输出
        }
      });
      this.logDebug(response.data.content)

      // 检查响应是否有效
      if (response.data) {
        return {
          data: {
            success: true,
            message: 'Connection test successful'
          }
        };
      }

      // 如果没有数据，抛出解析错误
      throw new ResponseParseError('Empty response from chat endpoint');

    } catch (error: any) {
      this.logDebug(`测试连接失败：`, error);
      // 直接抛出错误，让上层处理
      throw error;  // 注意：这里的错误已经被 chat 方法通过 formatError 处理过了
    }
  }

  /**
   * 获取模型列表
   * 兼容OpenAI格式的模型列表接口
   * 
   * @returns 模型列表
   */
  async getModels(): Promise<Array<{ id: string, name?: string }>> {
    try {
      // 使用统一的 URL 构建方法
      const url = this.buildUrl(this.endpoints.models);

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // 添加认证头（仅对非 Gemini API）
      if (!this.isGeminiApi() && this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // 发送请求
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      // 先读取响应数据
      const data = await response.json();

      // 检查响应状态，如果不成功则抛出错误让 formatError 处理
      if (!response.ok) {
        // 构造类似 axios 的错误对象以便 formatError 处理
        const axiosLikeError = {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: data
          }
        };
        throw axiosLikeError;
      }

      // 处理不同格式的响应
      if (Array.isArray(data)) {
        // 一些API直接返回模型数组
        return data.map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id
        }));
      } else if (data.data && Array.isArray(data.data)) {
        // OpenAI格式: { data: [model1, model2, ...] }
        return data.data.map((model: any) => ({
          id: model.id,
          name: model.name || model.id
        }));
      } else if (data.models && Array.isArray(data.models)) {
        // 一些API使用 models 字段
        return data.models.map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id
        }));
      }

      // 如果没有找到已知格式，尝试推断
      const possibleArrayFields = Object.keys(data).filter(key =>
        Array.isArray(data[key]) && data[key].length > 0 &&
        (data[key][0].id || data[key][0].name)
      );

      if (possibleArrayFields.length > 0) {
        return data[possibleArrayFields[0]].map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id
        }));
      }

      // 如果无法解析，则返回空数组
      this.logDebug('无法解析模型列表格式:' + JSON.stringify(data));
      return [];
    } catch (error: any) {
      // 使用 formatError 统一处理错误
      const formattedError = formatError(error);
      this.logDebug('获取模型列表失败:' + formattedError.message);
      
      // 重新抛出格式化后的错误，让上层处理
      throw formattedError;
    }
  }

  /**
   * 创建Axios实例
   * @returns Axios实例
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout || DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': CONTENT_TYPES.JSON
      }
    });
  }

  /**
   * 准备流式请求的payload
   * @param payload 原始payload
   * @returns 处理后的payload
   */
  private prepareStreamPayload(payload: any): any {
    // Gemini 特殊处理：移除 stream 字段
    if (this.isGeminiApi()) {
      const { stream, ...geminiPayload } = payload;
      return geminiPayload;
    }

    // 其他 API 保持 stream: true
    return {
      ...payload,
      stream: true
    };
  }

  /**
   * 构建请求URL
   * @param endpoint 端点路径
   * @returns 完整URL
   */
  private buildUrl(endpoint: string): string {
    // 替换模型占位符
    endpoint = endpoint.replace('{model}', this.model);

    // 处理路径拼接
    let urlString: string;
    if (endpoint.startsWith('/')) {
      // 确保 baseUrl 不以 / 结尾
      const base = this.baseUrl.replace(/\/$/, '');
      urlString = base + endpoint;
    } else {
      // 对于相对路径，使用标准 URL 构造
      const url = new URL(endpoint, this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/');
      urlString = url.toString();
    }

    // Gemini API 特殊处理：添加 API key 到查询参数
    if (this.isGeminiApi() && this.apiKey) {
      const url = new URL(urlString);
      url.searchParams.set('key', this.apiKey);
      return url.toString();
    }

    return urlString;
  }

  /**
   * 构建流式请求URL
   * @returns 完整URL
   */
  private buildStreamUrl(): string {
    let endpoint = this.endpoints.chat;

    // Gemini API 特殊处理：使用流式端点
    if (this.isGeminiApi() && endpoint.includes(':generateContent')) {
      endpoint = endpoint.replace(':generateContent', ':streamGenerateContent');
    }

    return this.buildUrl(endpoint);
  }

  /**
   * 判断是否为Gemini API
   * @returns 是否为Gemini
   */
  private isGeminiApi(): boolean {
    return this.baseUrl.includes('generativelanguage.googleapis.com');
  }

  /**
   * 处理流式响应
   * @param body 响应体
   * @param format 流格式
   * @param streamHandler 流处理器
   */
  private async handleStreamResponse(
    body: ReadableStream<Uint8Array>,
    format: StreamFormat,
    streamHandler: StreamHandler
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.logDebug("Stream complete");

          // 处理可能的剩余数据
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim());
              const content = this.responseParser.parseStreamChunk(parsed);
              if (content) streamHandler.onData(content);
            } catch (e) {
              // 不是JSON，直接使用文本
              if (buffer.trim().length > 0) {
                streamHandler.onData(buffer.trim());
              }
            }
          }

          if (streamHandler.onComplete) {
            streamHandler.onComplete();
          }
          break;
        }

        // 转换块为文本
        const chunk = decoder.decode(value, { stream: true });

        // 处理数据
        buffer += chunk;

        // 分割并处理数据块
        const { chunks, remaining } = splitStreamBuffer(buffer, format);
        buffer = remaining;

        // 处理每个数据块
        for (const chunkData of chunks) {
          let content: string | null = null;

          // SSE格式
          if (chunkData.startsWith('data:')) {
            const data = chunkData.substring(5).trim();

            if (data === '[DONE]') {
              if (streamHandler.onComplete) {
                streamHandler.onComplete();
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              content = this.responseParser.parseStreamChunk(parsed);
            } catch (e) {
              // 不是JSON，直接使用文本
              content = data;
            }
          }
          // JSON格式
          else if (chunkData.trim().startsWith('{') && chunkData.trim().endsWith('}')) {
            try {
              const parsed = JSON.parse(chunkData);
              content = this.responseParser.parseStreamChunk(parsed);
            } catch (e) {
              // 解析失败，直接使用文本
              content = chunkData;
            }
          }
          // 纯文本格式
          else {
            content = chunkData;
          }

          if (content) {
            streamHandler.onData(content);
          }
        }
      }
    } catch (error) {
      if (streamHandler.onError) {
        streamHandler.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * 处理常规响应(非流式)
   * @param payload 请求负载
   * @param streamHandler 流处理器
   */
  private async handleRegularResponse(
    payload: any,
    streamHandler: StreamHandler
  ): Promise<void> {
    try {
      this.logDebug("Using fallback non-streaming request");
      const nonStreamingPayload = { ...payload, stream: false };

      // 使用 URL 对象规范化 endpoint 路径
      const url = new URL(this.endpoints.chat, this.baseUrl);
      const normalizedEndpoint = url.pathname + url.search;

      this.logDebug(`Sending fallback request to ${normalizedEndpoint}`);

      const response = await this.client.post(normalizedEndpoint, nonStreamingPayload);

      // 处理响应
      if (response.data) {
        const parsedResponse = this.responseParser.parseFullResponse?.(response.data);
        if (parsedResponse && parsedResponse.content) {
          streamHandler.onData(parsedResponse.content);
        } else {
          // 尝试从响应中提取内容
          const content = this.responseParser.parseStreamChunk(response.data);
          if (content) {
            streamHandler.onData(content);
          } else {
            streamHandler.onData(JSON.stringify(response.data));
          }
        }
      }

      // 完成回调
      if (streamHandler.onComplete) {
        streamHandler.onComplete();
      }
    } catch (error) {
      if (streamHandler.onError) {
        streamHandler.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * 输出调试日志
   * @param message 日志消息
   */
  private logDebug(message: string, _data?: any): void {
    if (isLoggingEnabled()) {
      console.log(`[DEBUG] LLMClient: ${message}`);
    }
  }
}