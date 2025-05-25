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
  ResponseParseError
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
      chat: config.endpoints?.chat || '/v1/chat/completions',
      models: config.endpoints?.models || '/v1/models'
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
      // 格式化请求
      const payload = this.requestFormatter.formatRequest(request);

      // 使用 URL 对象规范化 endpoint 路径
      const url = new URL(this.endpoints.chat, this.baseUrl);
      const normalizedEndpoint = url.pathname + url.search;

      this.logDebug(`[DEBUG] Sending chat request to ${this.endpoints.chat}`);

      // 发送请求
      const response = await this.client.post(normalizedEndpoint, payload);
      this.logDebug('[DEBUG] Chat request completed successfully');

      // 解析响应
      const parsedResponse = this.responseParser.parseFullResponse?.(response.data);
      if (!parsedResponse) {
        throw new ResponseParseError('Failed to parse response');
      }

      return { data: parsedResponse };
    } catch (error: any) {
      this.logDebug(`Error in chat request: ${error.message}`);
      return {
        data: { content: '' },
        error: this.formatError(error)
      };
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
      // 格式化请求
      const payload = {
        ...this.requestFormatter.formatRequest(request),
        stream: true
      };

      this.logDebug(`Starting streaming request to ${this.endpoints.chat}`);

      // 获取中断控制器
      const controller = streamHandler.abortController || new AbortController();

      try {
        fetchAttempted = true;
        // 使用fetch API进行流式请求
        const headers: Record<string, string> = {
          'Content-Type': CONTENT_TYPES.JSON,
          'Accept': `${CONTENT_TYPES.JSON}, ${CONTENT_TYPES.SSE}, ${CONTENT_TYPES.TEXT}, */*`
        };

        // 手动添加认证
        if (this.apiKey) {
          // 简单地添加Bearer令牌认证，不检查具体策略类型
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const url = new URL(this.endpoints.chat, this.baseUrl); // 规范化URL去除重复的/v1路径
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new ConnectionError(`HTTP error! Status: ${response.status}`);
        }

        if (!response.body) {
          throw new ConnectionError("Response body is null");
        }

        // 检测响应格式
        const contentType = response.headers.get('Content-Type') || '';
        this.logDebug(`Response content type: ${contentType}`);

        // 确定流格式
        let streamFormat: StreamFormat = StreamFormat.AUTO;
        if (contentType.includes(CONTENT_TYPES.SSE)) {
          streamFormat = StreamFormat.SSE;
        } else if (contentType.includes(CONTENT_TYPES.JSON)) {
          streamFormat = StreamFormat.JSON;
        } else if (contentType.includes(CONTENT_TYPES.TEXT)) {
          streamFormat = StreamFormat.TEXT;
        }

        // 处理流式响应
        await this.handleStreamResponse(response.body, streamFormat, streamHandler);
      } catch (fetchError) {
        // 记录详细的fetch错误信息
        this.logDebug(`Fetch streaming failed: ${fetchError}`);
        console.error("Fetch详细错误:", fetchError);

        // 错误传递给调用者
        throw fetchError;
      }
    } catch (error: any) {
      // 安全地记录错误消息
      const errorMsg = error && typeof error === 'object' && 'message' in error ?
        error.message : 'Unknown stream error';

      this.logDebug(`Stream error: ${errorMsg}`);

      if (fetchAttempted) {
        // 如果已经尝试过fetch，则直接报告错误
        if (streamHandler.onError) {
          const errorObj = error instanceof Error ?
            error :
            new Error(typeof error === 'string' ? error : errorMsg);
          streamHandler.onError(errorObj);
        }
      } else {
        // 如果fetch尚未尝试，则尝试非流式后备方案
        try {
          await this.handleRegularResponse(
            this.requestFormatter.formatRequest(request),
            streamHandler
          );
        } catch (fallbackError) {
          if (streamHandler.onError) {
            streamHandler.onError(fallbackError instanceof Error ?
              fallbackError :
              new Error('Fallback request failed'));
          }
        }
      }
    }
  }

  /**
   * 测试连接
   * @returns 连接测试结果
   */
  async testConnection(): Promise<ClientResponse<{ success: boolean; message?: string }>> {
    try {
      this.logDebug(`测试连接 ${this.endpoints.models}`);
      await this.client.get(this.endpoints.models);

      return {
        data: {
          success: true,
          message: '测试连接成功'
        }
      };
    } catch (error: any) {
      this.logDebug(`测试连接失败：${error.message}`);

      return {
        data: {
          success: false,
          message: '测试连接失败'
        },
        error: this.formatError(error)
      };
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
   * 获取模型列表
   * 兼容OpenAI格式的模型列表接口
   * 
   * @returns 模型列表
   */
  async getModels(): Promise<Array<{ id: string, name?: string }>> {
    try {
      // 构建请求URL
      const endpoint = this.endpoints.models;
      const url = new URL(endpoint, this.baseUrl);  //自动规范化路径里的重复/v1字段

      // 使用适当的认证策略
      const headers = {
        'Content-Type': 'application/json'
      };

      // 添加认证头 - 使用现有认证策略而不是直接访问config
      if (this.client.defaults.baseURL?.includes('generativelanguage.googleapis.com')) {
        // Gemini使用查询参数
        url.searchParams.append('key', this.apiKey);
      } else {
        // 大多数API使用Bearer认证
        Object.assign(headers, {
          'Authorization': `Bearer ${this.apiKey}`
        });
      }

      // 发送请求
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

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
    } catch (error) {
      this.logDebug('获取模型列表失败:' + (error instanceof Error ? error.message : String(error)));
      return [];
    }
  }

  /**
   * 格式化错误信息
   * @param error 错误对象
   * @returns 格式化后的错误信息
   */
  private formatError(error: any): string {
    if (error.response && error.response.data) {
      // API返回的错误响应
      const data = error.response.data;

      if (data.error && data.error.message) {
        return data.error.message;
      }

      if (data.message) {
        return data.message;
      }
    }

    // 网络错误
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return `连接错误: 无法连接到 ${this.baseUrl}`;
    }

    // 超时错误
    if (error.message && error.message.includes('timeout')) {
      return '请求超时: 服务器响应时间过长';
    }

    // 其他错误
    return error.message || '发生未知错误';
  }

  /**
   * 输出调试日志
   * @param message 日志消息
   */
  private logDebug(message: string): void {
    if (isLoggingEnabled()) {
      console.log(`[DEBUG] LLMClient: ${message}`);
    }
  }
}