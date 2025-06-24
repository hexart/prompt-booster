// packages/api/src/strategies/response.ts
/**
 * 响应解析策略实现
 * 实现不同LLM服务的响应解析
 */
import { ResponseParser, ChatResponse } from '../types';
import { ResponseParseType } from '../config';
import { isLoggingEnabled } from '../utils';

/**
 * OpenAI兼容响应解析器
 * 适用于OpenAI及兼容其格式的API
 */
export class OpenAIResponseParser implements ResponseParser {
  /**
   * 解析OpenAI流式响应块
   * @param chunk 响应数据块
   * @returns 解析出的文本内容
   */
  parseStreamChunk(chunk: any): string | null {
    // 从OpenAI流格式中提取内容
    if (chunk && chunk.choices && chunk.choices.length > 0) {
      const delta = chunk.choices[0].delta;
      if (delta && delta.content) {
        return delta.content;
      }
    }

    // 如果数据是字符串，直接返回
    if (typeof chunk === 'string') {
      return chunk;
    }

    return null;
  }

  /**
   * 解析OpenAI完整响应
   * @param response 完整响应数据
   * @returns 标准化的聊天响应
   */
  parseFullResponse(response: any): ChatResponse {
    if (response && response.choices && response.choices.length > 0) {
      const choice = response.choices[0];

      return {
        content: choice.message?.content || '',
        usage: response.usage || {},
        model: response.model,
        meta: {
          finishReason: choice.finish_reason,
          id: response.id
        }
      };
    }

    // 如果找不到标准格式，尝试直接提取内容
    if (typeof response === 'string') {
      return { content: response };
    }

    // 最后回退到空响应
    return { content: '' };
  }
}

/**
 * 自定义响应解析器
 * 支持自定义解析逻辑
 */
export class CustomResponseParser implements ResponseParser {
  /**
   * @param parseStreamFn 自定义流解析函数
   * @param parseFullFn 自定义完整响应解析函数
   */
  constructor(
    private parseStreamFn: (chunk: any) => string | null,
    private parseFullFn?: (response: any) => ChatResponse
  ) { }

  /**
   * 使用自定义逻辑解析流块
   * @param chunk 响应数据块
   * @returns 解析出的文本内容
   */
  parseStreamChunk(chunk: any): string | null {
    return this.parseStreamFn(chunk);
  }

  /**
   * 使用自定义逻辑解析完整响应
   * @param response 完整响应数据
   * @returns 标准化的聊天响应
   */
  parseFullResponse(response: any): ChatResponse {
    if (this.parseFullFn) {
      return this.parseFullFn(response);
    }

    // 默认返回空响应
    return { content: '' };
  }
}

/**
 * 创建响应解析器
 * 工厂函数，根据类型创建合适的解析器
 * 
 * @param type 解析类型
 * @param options 额外选项
 * @returns 响应解析器实例
 */
export function createResponseParser(
  type: string,
  options?: any
): ResponseParser {
  switch (type) {
    case ResponseParseType.OPENAI_COMPATIBLE:
      return new OpenAIResponseParser();

    case ResponseParseType.GEMINI:
      return new GeminiResponseParser();

    case ResponseParseType.OLLAMA:
      return new OllamaResponseParser();

    case ResponseParseType.CUSTOM:
      if (options?.parseStreamFn && typeof options.parseStreamFn === 'function') {
        return new CustomResponseParser(
          options.parseStreamFn,
          options.parseFullFn
        );
      }
      // 如果没有提供自定义函数，回退到OpenAI格式
      return new OpenAIResponseParser();

    default:
      // 默认使用OpenAI格式
      return new OpenAIResponseParser();
  }
}

/**
 * Gemini响应解析器
 * 适用于Google的Gemini API
 */
export class GeminiResponseParser implements ResponseParser {
  /**
   * 解析Gemini流式响应块
   * @param chunk 响应数据块
   * @returns 解析出的文本内容
   */
  parseStreamChunk(chunk: any): string | null {
    if (chunk &&
      chunk.candidates &&
      chunk.candidates.length > 0 &&
      chunk.candidates[0].content &&
      chunk.candidates[0].content.parts &&
      chunk.candidates[0].content.parts.length > 0) {
      return chunk.candidates[0].content.parts[0].text || null;
    }

    // 如果数据是字符串，直接返回
    if (typeof chunk === 'string') {
      return chunk;
    }

    return null;
  }

  /**
   * 解析Gemini完整响应
   * @param response 完整响应数据
   * @returns 标准化的聊天响应
   */
  parseFullResponse(response: any): ChatResponse {
    if (response &&
      response.candidates &&
      response.candidates.length > 0 &&
      response.candidates[0].content &&
      response.candidates[0].content.parts &&
      response.candidates[0].content.parts.length > 0) {

      const text = response.candidates[0].content.parts[0].text || '';

      return {
        content: text,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens: (response.usageMetadata?.promptTokenCount || 0) +
            (response.usageMetadata?.candidatesTokenCount || 0)
        },
        model: response.modelId,
        meta: {
          finishReason: response.candidates[0].finishReason,
          safetyRatings: response.candidates[0].safetyRatings
        }
      };
    }

    // 最后回退到空响应
    return { content: '' };
  }
}

/**
 * Ollama响应解析器
 * 适用于Ollama API
 */
export class OllamaResponseParser implements ResponseParser {
  /**
   * 解析Ollama流式响应块
   * @param chunk 响应数据块
   * @returns 解析出的文本内容
   */
  parseStreamChunk(chunk: any): string | null {
    // Ollama 流式响应格式: {"model":"...","response":"...","done":false}
    if (chunk && chunk.response !== undefined) {
      return chunk.response;
    }

    // 处理message格式（用于chat端点）
    if (chunk && chunk.message && chunk.message.content) {
      return chunk.message.content;
    }

    // 处理纯文本响应
    if (typeof chunk === 'string') {
      return chunk;
    }

    return null;
  }

  /**
   * 解析Ollama完整响应
   * @param response 完整响应数据
   * @returns 标准化的聊天响应
   */
  parseFullResponse(response: any): ChatResponse {
    if (isLoggingEnabled()) {
      console.log('[OllamaResponseParser] Parsing response:', response);
      console.log('[OllamaResponseParser] Response type:', typeof response);
    }

    if (response === null || response === undefined) {
      if (isLoggingEnabled()) {
        console.log('[OllamaResponseParser] Response is null/undefined');
      }
      return { content: '' };
    }

    // 优先处理 chat 端点格式
    if (response && response.message && response.message.content) {
      return this.parseChatResponse(response);
    }

    // 处理 generate 端点格式
    if (response && response.response !== undefined && response.done === true) {
      return this.parseGenerateResponse(response);
    }

    // 处理 NDJSON 流式响应（多行JSON）
    if (typeof response === 'string' && response.includes('\n')) {
      return this.parseNDJSONStream(response);
    }

    // 处理可能的 content 字段
    if (response && response.content) {
      // 如果 content 包含流式数据，递归处理
      if (typeof response.content === 'string' && response.content.includes('"done":')) {
        return this.parseFullResponse(response.content);
      }

      return {
        content: response.content,
        model: response.model
      };
    }

    // 检查是否是模型加载响应
    if (response.done_reason === 'load' && response.done === true) {
      if (isLoggingEnabled()) {
        console.log('[OllamaResponseParser] Model loaded successfully');
      }
      // 返回空内容而不是抛出错误
      return {
        content: '',
        model: response.model,
        meta: {
          done: response.done,
          doneReason: response.done_reason,
          createdAt: response.created_at
        }
      };
    }

    // 最后回退到空响应
    return { content: '' };
  }

  /**
   * 解析 chat 端点的响应
   * @param response chat端点响应
   * @returns 标准化的聊天响应
   */
  private parseChatResponse(response: any): ChatResponse {
    return {
      content: response.message.content,
      model: response.model,
      meta: {
        done: response.done,
        totalDuration: response.total_duration,
        loadDuration: response.load_duration,
        promptEvalCount: response.prompt_eval_count,
        evalCount: response.eval_count
      }
    };
  }

  /**
   * 解析 generate 端点的响应
   * @param response generate端点响应
   * @returns 标准化的聊天响应
   */
  private parseGenerateResponse(response: any): ChatResponse {
    return {
      content: response.response,
      model: response.model,
      meta: {
        done: response.done,
        context: response.context,
        totalDuration: response.total_duration,
        loadDuration: response.load_duration,
        promptEvalCount: response.prompt_eval_count,
        evalCount: response.eval_count
      }
    };
  }

  /**
   * 解析 NDJSON 流式响应
   * @param response NDJSON字符串
   * @returns 标准化的聊天响应
   */
  private parseNDJSONStream(response: string): ChatResponse {
    const lines = response.split('\n').filter(line => line.trim());
    let fullContent = '';
    let modelName = '';
    let metadata: any = {};

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        // 收集响应内容
        if (parsed.response !== undefined) {
          fullContent += parsed.response;
        }

        // 收集模型信息
        if (parsed.model) {
          modelName = parsed.model;
        }

        // 如果是最后一个响应，收集元数据
        if (parsed.done === true) {
          metadata = {
            done: parsed.done,
            context: parsed.context,
            totalDuration: parsed.total_duration,
            loadDuration: parsed.load_duration,
            promptEvalCount: parsed.prompt_eval_count,
            evalCount: parsed.eval_count,
            doneReason: parsed.done_reason
          };
        }
      } catch (e) {
        // 忽略解析错误的行
        if (isLoggingEnabled()) {
          console.log('[OllamaResponseParser] Failed to parse line:', line);
        }
      }
    }

    if (isLoggingEnabled()) {
      console.log('[OllamaResponseParser] Full content length:', fullContent.length);
      console.log('[OllamaResponseParser] First 200 chars:', fullContent.substring(0, 200));
    }

    return {
      content: fullContent,
      model: modelName,
      meta: metadata
    };
  }
}